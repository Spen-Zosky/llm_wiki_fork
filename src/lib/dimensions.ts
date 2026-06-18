/**
 * Dimensional taxonomy (7 axes) for wiki page frontmatter — ported from the
 * wiki-factory LLM Wiki Engine (references/dimensions-taxonomy.md, v1.2).
 *
 * All axes are OPTIONAL on a page (absent = wildcard). This module only
 * validates *present* values and derives `freshness` from `updated:`.
 * It is pure: no fs / lint / ingest dependencies. The lint wiring (step 2b)
 * and ingest stamping (step 2c) consume it.
 */

import type { FrontmatterValue } from "./frontmatter"

export type DimensionAxis =
  | "facet"
  | "layer"
  | "scope"
  | "temporal-status"
  | "authority"
  | "provenance-confidence"
  | "freshness"

/**
 * Valid values per axis. Six axes are fixed (must stay comparable
 * cross-vault). `layer` carries the engine defaults and is the only
 * per-vault-extendable axis — extension wiring is deferred to step 2d
 * (a `## Dimensions` section in `schema.md`).
 */
export const DIMENSION_AXES: Record<DimensionAxis, readonly string[]> = {
  facet: [
    "principle",
    "decision",
    "implementation",
    "analysis",
    "observation",
    "exploration",
    "aggregate",
  ],
  layer: [
    "business",
    "architecture",
    "backend",
    "frontend",
    "data",
    "infra",
    "process",
    "compliance",
    "governance",
    "content",
  ],
  scope: ["core", "commodity", "optional", "platform-wide", "tenant-specific", "contextual"],
  "temporal-status": ["current", "historical", "planned", "superseded"],
  authority: ["canonical", "authoritative", "supportive", "exploratory", "non-authoritative"],
  "provenance-confidence": ["verified", "derived", "interpreted", "unsourced"],
  freshness: ["live", "recent", "aged", "stale-info", "evergreen"],
}

const AXIS_KEYS = Object.keys(DIMENSION_AXES) as DimensionAxis[]

export type DimensionSeverity = "error" | "warning" | "info"

export interface DimensionFinding {
  axis: DimensionAxis | "superseded-by"
  severity: DimensionSeverity
  value?: string
  detail: string
}

/** Freshness values that can be auto-derived (`evergreen` is explicit-only). */
export type DerivedFreshness = "live" | "recent" | "aged" | "stale-info"

/**
 * Validate the dimensional axes present in a page's frontmatter. Returns one
 * finding per problem; an empty array when every present axis is valid (or
 * none is present — axes are optional).
 */
export function validateDimensions(
  frontmatter: Record<string, FrontmatterValue> | null | undefined,
): DimensionFinding[] {
  const findings: DimensionFinding[] = []
  if (!frontmatter) return findings

  for (const axis of AXIS_KEYS) {
    const raw = frontmatter[axis]
    if (raw === undefined) continue // optional → wildcard, nothing to validate

    if (Array.isArray(raw)) {
      findings.push({
        axis,
        severity: "error",
        detail: `"${axis}" must be a single value, got a list.`,
      })
      continue
    }

    if (!DIMENSION_AXES[axis].includes(raw)) {
      findings.push({
        axis,
        severity: "error",
        value: raw,
        detail: `Invalid "${axis}" value "${raw}". Allowed: ${DIMENSION_AXES[axis].join(", ")}.`,
      })
    }
  }

  // `temporal-status: superseded` requires a `superseded-by:` pointer.
  if (frontmatter["temporal-status"] === "superseded") {
    const pointer = frontmatter["superseded-by"]
    const hasPointer =
      typeof pointer === "string"
        ? pointer.trim().length > 0
        : Array.isArray(pointer) && pointer.length > 0
    if (!hasPointer) {
      findings.push({
        axis: "superseded-by",
        severity: "warning",
        detail: `"temporal-status: superseded" requires a "superseded-by: <slug>" field.`,
      })
    }
  }

  return findings
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Derive `freshness` from the `updated:` date:
 *   live <30d · recent 30–180d · aged 180d–2y · stale-info >2y.
 * `evergreen` is never derived (explicit-only). Returns null when `updated`
 * is missing/unparseable or lies in the future.
 */
export function deriveFreshness(
  updatedISO: string | undefined | null,
  todayISO: string,
): DerivedFreshness | null {
  if (!updatedISO) return null
  const updated = Date.parse(updatedISO)
  const today = Date.parse(todayISO)
  if (Number.isNaN(updated) || Number.isNaN(today)) return null

  const ageDays = (today - updated) / DAY_MS
  if (ageDays < 0) return null // future-dated → no derivation
  if (ageDays < 30) return "live"
  if (ageDays < 180) return "recent"
  if (ageDays < 730) return "aged" // ~2 years
  return "stale-info"
}
