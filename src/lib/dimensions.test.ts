import { describe, it, expect } from "vitest"
import { validateDimensions, deriveFreshness, stampFreshness } from "./dimensions"

describe("dimensions — validateDimensions", () => {
  it("returns no findings when no axes are present (all optional)", () => {
    expect(validateDimensions({ type: "concept", title: "X" })).toEqual([])
  })

  it("returns no findings for null/undefined frontmatter", () => {
    expect(validateDimensions(null)).toEqual([])
    expect(validateDimensions(undefined)).toEqual([])
  })

  it("accepts valid values on every axis", () => {
    const fm = {
      facet: "principle",
      layer: "backend",
      scope: "core",
      "temporal-status": "current",
      authority: "authoritative",
      "provenance-confidence": "verified",
      freshness: "live",
    }
    expect(validateDimensions(fm)).toEqual([])
  })

  it("flags an invalid axis value with severity error", () => {
    const findings = validateDimensions({ facet: "nonsense" })
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ axis: "facet", severity: "error", value: "nonsense" })
  })

  it("flags a list where a scalar is expected", () => {
    const findings = validateDimensions({ authority: ["canonical", "supportive"] })
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ axis: "authority", severity: "error" })
  })

  it("requires superseded-by when temporal-status is superseded", () => {
    const findings = validateDimensions({ "temporal-status": "superseded" })
    expect(findings.some((f) => f.axis === "superseded-by" && f.severity === "warning")).toBe(true)
  })

  it("accepts superseded with a superseded-by pointer", () => {
    const findings = validateDimensions({
      "temporal-status": "superseded",
      "superseded-by": "new-page",
    })
    expect(findings).toEqual([])
  })

  it("accepts a layer value supplied via extraLayers (per-vault extension)", () => {
    expect(validateDimensions({ layer: "marketing" }, { extraLayers: ["marketing"] })).toEqual([])
  })

  it("flags a layer value that is neither a default nor an extension", () => {
    const findings = validateDimensions({ layer: "bogus" }, { extraLayers: ["marketing"] })
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ axis: "layer", severity: "error", value: "bogus" })
    expect(findings[0].detail).toContain("marketing") // extension listed in "Allowed:"
  })

  it("does not let extraLayers loosen any of the six fixed axes", () => {
    const findings = validateDimensions({ facet: "marketing" }, { extraLayers: ["marketing"] })
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ axis: "facet", severity: "error" })
  })
})

describe("dimensions — deriveFreshness", () => {
  const today = "2026-06-18"

  it("returns null when updated is missing", () => {
    expect(deriveFreshness(undefined, today)).toBeNull()
    expect(deriveFreshness(null, today)).toBeNull()
  })

  it("returns null for an unparseable date", () => {
    expect(deriveFreshness("not-a-date", today)).toBeNull()
  })

  it("returns null for a future-dated page", () => {
    expect(deriveFreshness("2027-01-01", today)).toBeNull()
  })

  it("derives live (< 30 days)", () => {
    expect(deriveFreshness("2026-06-01", today)).toBe("live")
  })

  it("derives recent (30–180 days)", () => {
    expect(deriveFreshness("2026-04-01", today)).toBe("recent")
  })

  it("derives aged (180 days – 2 years)", () => {
    expect(deriveFreshness("2025-06-01", today)).toBe("aged")
  })

  it("derives stale-info (> 2 years)", () => {
    expect(deriveFreshness("2023-01-01", today)).toBe("stale-info")
  })

  it("never derives evergreen (explicit-only)", () => {
    const derived = ["2026-06-01", "2026-04-01", "2025-06-01", "2023-01-01"].map((d) =>
      deriveFreshness(d, today),
    )
    expect(derived).not.toContain("evergreen")
  })
})

describe("dimensions — stampFreshness", () => {
  const today = "2026-06-18"

  it("appends derived freshness when updated is present and freshness absent", () => {
    const out = stampFreshness("---\ntype: concept\nupdated: 2026-06-01\n---\nbody", today)
    expect(out).toContain("freshness: live")
    expect(out).toContain("body")
  })

  it("does not overwrite an explicit freshness", () => {
    const content = "---\nupdated: 2020-01-01\nfreshness: evergreen\n---\nx"
    expect(stampFreshness(content, today)).toBe(content)
  })

  it("is a no-op when updated is absent", () => {
    const content = "---\ntype: concept\n---\nx"
    expect(stampFreshness(content, today)).toBe(content)
  })

  it("is a no-op when there is no frontmatter", () => {
    const content = "no frontmatter here"
    expect(stampFreshness(content, today)).toBe(content)
  })

  it("is a no-op for a future updated date (derivation null)", () => {
    const content = "---\nupdated: 2027-01-01\n---\nx"
    expect(stampFreshness(content, today)).toBe(content)
  })

  it("stamps stale-info for very old pages", () => {
    const out = stampFreshness("---\nupdated: 2023-01-01\n---\nx", today)
    expect(out).toContain("freshness: stale-info")
  })
})
