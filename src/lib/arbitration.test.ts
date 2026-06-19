import { describe, it, expect, vi } from "vitest"
import {
  detectConflict,
  applyArbitration,
  conflictToReviewItem,
  ARBITRATION_OPTIONS,
  type Conflict,
  type ConflictJudge,
} from "./arbitration"

const FIXED_NOW = 1_750_000_000_000
const FIXED_TODAY = "2026-06-18"

function page(fm: string, body = "body"): string {
  return `---\n${fm}\n---\n${body}`
}

const TWO_CLAIMS = {
  claims: [
    { source: "src-a.pdf", text: "X is 10" },
    { source: "src-b.pdf", text: "X is 20" },
  ],
  summary: "X value conflict",
}

function judgeReturning(result: Awaited<ReturnType<ConflictJudge>>): ConflictJudge {
  return vi.fn(async () => result)
}

const baseOpts = { pagePath: "wiki/concepts/x.md", sourceFileName: "src-b.pdf", now: () => FIXED_NOW }

describe("arbitration — detectConflict guards", () => {
  it("returns null when no judge is supplied (conservative)", async () => {
    expect(await detectConflict(page("type: concept"), page("type: concept"), "merged", baseOpts)).toBeNull()
  })

  it("returns null when a dimensional axis differs (specialization)", async () => {
    const judge = judgeReturning(TWO_CLAIMS)
    const out = await detectConflict(
      page("facet: principle"),
      page("facet: implementation"),
      "merged",
      baseOpts,
      judge,
    )
    expect(out).toBeNull()
    expect(judge).not.toHaveBeenCalled()
  })

  it("returns null when a side is non-authoritative", async () => {
    const judge = judgeReturning(TWO_CLAIMS)
    const out = await detectConflict(
      page("authority: non-authoritative"),
      page("authority: canonical"),
      "merged",
      baseOpts,
      judge,
    )
    expect(out).toBeNull()
    expect(judge).not.toHaveBeenCalled()
  })

  it("returns null when the page already references an arbitration record", async () => {
    const judge = judgeReturning(TWO_CLAIMS)
    const merged = "body\n\n## Changelog\n\n- 2026-01-01: see [[_arbitrations/abc123]]."
    expect(await detectConflict(page("type: concept"), page("type: concept"), merged, baseOpts, judge)).toBeNull()
    expect(judge).not.toHaveBeenCalled()
  })

  it("returns null when the judge finds no contradiction", async () => {
    const judge = judgeReturning(null)
    expect(await detectConflict(page("type: concept"), page("type: concept"), "merged", baseOpts, judge)).toBeNull()
    expect(judge).toHaveBeenCalledOnce()
  })

  it("swallows a judge throw (detection never blocks the write)", async () => {
    const judge: ConflictJudge = vi.fn(async () => {
      throw new Error("llm down")
    })
    expect(await detectConflict(page("type: concept"), page("type: concept"), "merged", baseOpts, judge)).toBeNull()
  })

  it("builds a Conflict with a stable id when the judge confirms two claims", async () => {
    const judge = judgeReturning(TWO_CLAIMS)
    const out = await detectConflict(page("type: concept"), page("type: concept"), "merged", baseOpts, judge)
    expect(out).not.toBeNull()
    expect(out!.pagePath).toBe("wiki/concepts/x.md")
    expect(out!.claims).toHaveLength(2)
    expect(out!.sources).toEqual(["src-a.pdf", "src-b.pdf"])
    expect(out!.title).toBe("X value conflict")
    expect(out!.detectedAt).toBe(FIXED_NOW)
    expect(out!.id).toMatch(/^[0-9a-f]{8}$/)
  })

  it("produces a deterministic id for identical inputs", async () => {
    const judge = judgeReturning(TWO_CLAIMS)
    const a = await detectConflict(page("type: concept"), page("type: concept"), "merged", baseOpts, judge)
    const b = await detectConflict(page("type: concept"), page("type: concept"), "merged", baseOpts, judge)
    expect(a!.id).toBe(b!.id)
  })
})

describe("arbitration — conflictToReviewItem", () => {
  const conflict: Conflict = {
    id: "deadbeef",
    pagePath: "wiki/concepts/x.md",
    title: "X value conflict",
    claims: TWO_CLAIMS.claims,
    sources: ["src-a.pdf", "src-b.pdf"],
    detectedAt: FIXED_NOW,
  }

  it("maps a conflict to a contradiction review item with the 4 paths", () => {
    const item = conflictToReviewItem(conflict)
    expect(item.type).toBe("contradiction")
    expect(item.options).toBe(ARBITRATION_OPTIONS)
    expect(item.options.map((o) => o.action)).toEqual([
      "arbitrate:a",
      "arbitrate:b",
      "arbitrate:c",
      "arbitrate:d",
    ])
    expect(item.affectedPages).toEqual(["wiki/concepts/x.md"])
    expect(item.conflict).toBe(conflict)
    expect(item.description).toContain("X is 10")
    expect(item.description).toContain("X is 20")
  })
})

describe("arbitration — applyArbitration", () => {
  const conflict: Conflict = {
    id: "deadbeef",
    pagePath: "wiki/concepts/x.md",
    title: "X value conflict",
    claims: TWO_CLAIMS.claims,
    sources: ["raw/sources/src-a.pdf", "raw/sources/src-b.pdf"],
    detectedAt: FIXED_NOW,
  }
  const ctx = { pageContent: page("type: concept\nstatus: contradicted", "X body"), today: () => FIXED_TODAY }

  it("path (a): sets status stable, appends changelog + record, no extra section", () => {
    const r = applyArbitration(conflict, "a", ctx)
    expect(r.newPageContent).toContain("status: stable")
    expect(r.newPageContent).not.toContain("status: contradicted")
    expect(r.newPageContent).toContain("## Changelog")
    expect(r.newPageContent).toContain("path (a)")
    expect(r.newPageContent).toContain("[[_arbitrations/deadbeef]]")
    expect(r.newPageContent).not.toContain("## Historical claims")
    expect(r.recordPath).toBe("wiki/_arbitrations/deadbeef.md")
    expect(r.record).toContain("type: meta")
    expect(r.record).toContain("Path chosen: **(a) time-based supersession**")
  })

  it("path (b): record mentions domain-expert judgment", () => {
    const r = applyArbitration(conflict, "b", ctx)
    expect(r.record).toContain("Path chosen: **(b) domain-expert judgment**")
    expect(r.newPageContent).toContain("path (b)")
  })

  it("path (c): adds scoped claim subsections", () => {
    const r = applyArbitration(conflict, "c", ctx)
    expect(r.newPageContent).toContain("## Claim 1 (scope:")
    expect(r.newPageContent).toContain("## Claim 2 (scope:")
    expect(r.newPageContent).toContain("Source: [[src-a]]")
  })

  it("path (d): adds a Historical claims section", () => {
    const r = applyArbitration(conflict, "d", ctx)
    expect(r.newPageContent).toContain("## Historical claims")
    expect(r.newPageContent).toContain("Per [[src-a]]")
  })

  it("record carries the conflict sources and a single page reference", () => {
    const r = applyArbitration(conflict, "a", ctx)
    expect(r.record).toContain('sources: ["raw/sources/src-a.pdf", "raw/sources/src-b.pdf"]')
    expect(r.record).toContain("Page involved: [[x]]")
    expect(r.record).toContain(`created: ${FIXED_TODAY}`)
  })
})
