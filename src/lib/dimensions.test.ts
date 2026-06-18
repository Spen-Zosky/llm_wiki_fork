import { describe, it, expect } from "vitest"
import { validateDimensions, deriveFreshness } from "./dimensions"

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
