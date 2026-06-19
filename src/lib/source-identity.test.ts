import { describe, expect, it } from "vitest"
import {
  legacySourceSummarySlugFromIdentity,
  sourceIdentityForPath,
  sourceReferenceIdentity,
  sourceSummarySlugCandidatesFromIdentity,
  sourceSummarySlugFromIdentity,
} from "./source-identity"

describe("source identity helpers", () => {
  it("keeps raw/sources relative folder context as the source identity", () => {
    expect(
      sourceIdentityForPath("/tmp/project", "/tmp/project/raw/sources/project-a/config.yaml"),
    ).toBe("project-a/config.yaml")
  })

  it("normalizes source references that include raw/sources prefixes", () => {
    expect(sourceReferenceIdentity("raw/sources/project-a/config.yaml")).toBe(
      "project-a/config.yaml",
    )
    expect(sourceReferenceIdentity("/tmp/project/raw/sources/project-a/config.yaml")).toBe(
      "project-a/config.yaml",
    )
  })

  it("matches raw/sources prefixes case-insensitively while preserving returned case", () => {
    expect(
      sourceIdentityForPath(
        "C:/Users/Me/Wiki",
        "c:/users/me/wiki/raw/sources/Project-A/Config.yaml",
      ),
    ).toBe("Project-A/Config.yaml")
    expect(sourceReferenceIdentity("RAW/SOURCES/Project-A/Config.yaml")).toBe(
      "Project-A/Config.yaml",
    )
  })

  it("keeps legacy basename slugs for root-level sources", () => {
    expect(sourceSummarySlugFromIdentity("config.yaml")).toBe("config")
  })

  it("resolves a linked external file under a linked root to linked/<label>/<rel>", () => {
    const roots = [{ externalPath: "D:/repos/heuresys-advanced", label: "heuresys-advanced" }]
    expect(
      sourceIdentityForPath("/tmp/project", "D:/repos/heuresys-advanced/docs/readme.md", roots),
    ).toBe("linked/heuresys-advanced/docs/readme.md")
  })

  it("resolves a linked single file to linked/<label>", () => {
    const roots = [{ externalPath: "D:/notes/spec.md", label: "spec.md" }]
    expect(sourceIdentityForPath("/tmp/project", "D:/notes/spec.md", roots)).toBe("linked/spec.md")
  })

  it("keeps linked identities collision-free for same-basename files in different roots", () => {
    const roots = [
      { externalPath: "D:/a", label: "a" },
      { externalPath: "D:/b", label: "b" },
    ]
    const idA = sourceIdentityForPath("/tmp/project", "D:/a/config.yaml", roots)
    const idB = sourceIdentityForPath("/tmp/project", "D:/b/config.yaml", roots)
    expect(idA).toBe("linked/a/config.yaml")
    expect(idB).toBe("linked/b/config.yaml")
    expect(idA).not.toBe(idB)
  })

  it("round-trips a linked identity through sourceReferenceIdentity (delete-cascade match)", () => {
    const roots = [{ externalPath: "D:/repos/proj", label: "proj" }]
    const identity = sourceIdentityForPath("/tmp/project", "D:/repos/proj/src/x.ts", roots)
    expect(sourceReferenceIdentity(identity)).toBe(identity)
  })

  it("ignores linkedRoots for paths that are not under any root (backward-compatible)", () => {
    const roots = [{ externalPath: "D:/repos/proj", label: "proj" }]
    expect(
      sourceIdentityForPath("/tmp/project", "/tmp/project/raw/sources/a/b.md", roots),
    ).toBe("a/b.md")
  })

  it("escapes slug segments so delimiter-containing folders do not collide", () => {
    const slug = sourceSummarySlugFromIdentity("a--b/config.yaml")

    expect(slug).toMatch(
      /^4-a-b--6-config--[a-z0-9]+$/,
    )
    expect(sourceSummarySlugFromIdentity("a/b/config.yaml")).toMatch(
      /^1-a--1-b--6-config--[a-z0-9]+$/,
    )
    expect(sourceSummarySlugFromIdentity("4-a--b--6-config.yaml")).not.toBe(
      sourceSummarySlugFromIdentity("a--b/config.yaml"),
    )
    expect(sourceSummarySlugCandidatesFromIdentity("a--b/config.yaml")).toContain(
      slug.replace(/^4-a-b/, "3-a-b"),
    )
  })

  it("caps nested source summary slugs to avoid Windows path length failures", () => {
    const slug = sourceSummarySlugFromIdentity("2024年/污水处理/反硝化除磷技术研究报告.pdf")

    expect(slug.length).toBeLessThanOrEqual(120)
    expect(`wiki/sources/${slug}.md`.length).toBeLessThanOrEqual(136)
    expect(slug).toMatch(/--[a-z0-9]+$/)
    expect(slug).toContain("2024年")
    expect(slug).toContain("污水处理")
    expect(slug).toContain("反硝化除磷技术研究报告")
    expect(slug).not.toContain("%")
  })

  it("keeps stable hashes when truncating long nested source slugs", () => {
    const first = sourceSummarySlugFromIdentity("2024年/污水处理/反硝化除磷技术研究报告.pdf")
    const second = sourceSummarySlugFromIdentity("2024年/污水处理/反硝化除磷技术研究报告修订版.pdf")

    expect(first).not.toBe(second)
    expect(first.length).toBeLessThanOrEqual(120)
    expect(second.length).toBeLessThanOrEqual(120)
  })

  it("keeps legacy percent-encoded nested slug candidates for old source pages", () => {
    const identity = "2024年/污水处理/反硝化除磷技术研究报告.pdf"
    const canonical = sourceSummarySlugFromIdentity(identity)
    const legacy = legacySourceSummarySlugFromIdentity(identity)

    expect(canonical).not.toBe(legacy)
    expect(canonical).not.toContain("%")
    expect(legacy).toContain("%E6")
    expect(sourceSummarySlugCandidatesFromIdentity(identity)).toEqual([canonical, legacy])
  })
})
