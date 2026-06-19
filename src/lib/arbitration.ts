/**
 * Structured arbitration for conflicting wiki content — a TypeScript
 * re-implementation of the wiki-factory `conflict-resolution.md` spec.
 *
 * Architecture: pure logic, the LLM conflict judge injected as a parameter
 * (mirroring `page-merge.ts`'s `MergeFn`), so tests stay deterministic with a
 * `vi.fn()` mock. This module never touches the filesystem or the merge core;
 * the ingest write-loop calls `detectConflict` *after* a merge, and the review
 * UI calls `applyArbitration` when the user picks a resolution path.
 */
import { parseFrontmatter } from "./frontmatter"
import type { ReviewItem, ReviewOption } from "@/stores/review-store"

/** The four arbitration paths from the spec. */
export type ArbitrationPath = "a" | "b" | "c" | "d"

export const PATH_NAMES: Record<ArbitrationPath, string> = {
  a: "time-based supersession",
  b: "domain-expert judgment",
  c: "context-scoped coexistence",
  d: "temporal versioning",
}

export interface ConflictClaim {
  /** Source identity / filename the claim came from. */
  source: string
  /** Verbatim conflicting claim. */
  text: string
}

export interface Conflict {
  /** Stable id (hash of page + sources + normalized claims) → record filename. */
  id: string
  /** Wiki-relative page holding the conflicting claims. */
  pagePath: string
  /** Human title for the review card / record. */
  title: string
  claims: ConflictClaim[]
  sources: string[]
  detectedAt: number
}

export interface ConflictJudgeResult {
  claims: ConflictClaim[]
  summary?: string
}

/** Injected LLM judge — decides if a merged page holds a real contradiction. */
export interface ConflictJudge {
  (
    mergedContent: string,
    sourceFileName: string,
    signal?: AbortSignal,
  ): Promise<ConflictJudgeResult | null>
}

export interface DetectConflictOptions {
  pagePath: string
  sourceFileName: string
  signal?: AbortSignal
  /** Injectable clock for deterministic tests. */
  now?: () => number
}

/** Dimensions that, if they differ, mark a specialization rather than a conflict. */
const SPECIALIZATION_AXES = ["facet", "layer", "scope", "temporal-status"] as const

/** Marker a resolved page carries — used to avoid re-flagging on re-ingest. */
const ARBITRATION_MARKER = "_arbitrations/"

/**
 * Decide whether a just-merged page holds a genuine contradiction. Runs the
 * cheap deterministic guards first (re-ingest marker, specialization, authority)
 * and only then the injected LLM judge. Returns null (no conflict) on any guard
 * miss, when no judge is supplied, or if the judge throws — detection must never
 * block the ingest write.
 */
export async function detectConflict(
  existingContent: string,
  incomingContent: string,
  mergedContent: string,
  opts: DetectConflictOptions,
  judge?: ConflictJudge,
): Promise<Conflict | null> {
  // Re-ingest guard: a page that already references an arbitration record was
  // resolved; don't re-open it without new evidence (spec "Re-opening").
  if (mergedContent.includes(ARBITRATION_MARKER)) return null

  const existing = parseFrontmatter(existingContent).frontmatter
  const incoming = parseFrontmatter(incomingContent).frontmatter

  // Specialization guard: pages differing on any dimension are specializations,
  // not contradictions (spec "Pre-arbitration taxonomy check").
  if (existing && incoming) {
    for (const axis of SPECIALIZATION_AXES) {
      const a = existing[axis]
      const b = incoming[axis]
      if (typeof a === "string" && typeof b === "string" && a !== b) return null
    }
  }

  // Authority filter: a non-authoritative side does not create a real conflict.
  const authorities = [existing?.authority, incoming?.authority].filter(
    (value) => value !== "non-authoritative",
  )
  if (authorities.length < 2) return null

  // No judge (or it fails) → cannot confirm a content contradiction.
  if (!judge) return null
  let result: ConflictJudgeResult | null
  try {
    result = await judge(mergedContent, opts.sourceFileName, opts.signal)
  } catch {
    return null
  }
  if (!result || result.claims.length < 2) return null

  const sources = uniqueSources(result.claims)
  const now = (opts.now ?? Date.now)()
  return {
    id: conflictId(opts.pagePath, sources, result.claims),
    pagePath: opts.pagePath,
    title: result.summary?.trim() || `Contradiction in ${pageSlug(opts.pagePath)}`,
    claims: result.claims,
    sources,
    detectedAt: now,
  }
}

/** The four resolution paths offered on a contradiction review card. */
export const ARBITRATION_OPTIONS: ReviewOption[] = [
  { label: "Newer wins (supersede)", action: "arbitrate:a" },
  { label: "Pick correct (expert)", action: "arbitrate:b" },
  { label: "Keep both, scoped", action: "arbitrate:c" },
  { label: "Keep both, historical", action: "arbitrate:d" },
]

/** Build the review item for a detected conflict (store assigns id/resolved/createdAt). */
export function conflictToReviewItem(
  conflict: Conflict,
): Omit<ReviewItem, "id" | "resolved" | "createdAt"> {
  const claimLines = conflict.claims
    .map((c) => `- From ${c.source}: "${c.text}"`)
    .join("\n")
  return {
    type: "contradiction",
    title: conflict.title,
    description: `Conflicting claims detected:\n${claimLines}\n\nChoose an arbitration path.`,
    affectedPages: [conflict.pagePath],
    options: ARBITRATION_OPTIONS,
    conflict,
  }
}

export interface ApplyArbitrationContext {
  /** Current on-disk content of the page being arbitrated. */
  pageContent: string
  /** Date provider (YYYY-MM-DD) — injectable for tests. */
  today: () => string
}

export interface ApplyArbitrationResult {
  newPageContent: string
  record: string
  /** Wiki-relative path for the immutable arbitration record. */
  recordPath: string
}

/**
 * Apply a resolution path to a page: set `status: stable`, append the path's
 * body section (scoped claims for (c), historical claims for (d)), append a
 * `## Changelog` line, and produce the immutable arbitration record. Pure: the
 * caller performs the actual writes.
 */
export function applyArbitration(
  conflict: Conflict,
  path: ArbitrationPath,
  ctx: ApplyArbitrationContext,
): ApplyArbitrationResult {
  const today = ctx.today()
  let content = setFrontmatterScalar(ctx.pageContent, "status", "stable")

  const section = buildPathSection(conflict, path)
  if (section) content = `${content.replace(/\s+$/, "")}\n\n${section}\n`

  content = appendChangelog(content, buildChangelogLine(conflict, path, today))

  return {
    newPageContent: content,
    record: buildArbitrationRecord(conflict, path, today),
    recordPath: `wiki/_arbitrations/${conflict.id}.md`,
  }
}

// ── helpers ─────────────────────────────────────────────────────────────────

function buildPathSection(conflict: Conflict, path: ArbitrationPath): string {
  if (path === "c") {
    return conflict.claims
      .map(
        (c, i) =>
          `## Claim ${i + 1} (scope: TODO)\n\n${c.text}\n\nSource: [[${sourceSlug(c.source)}]]`,
      )
      .join("\n\n")
  }
  if (path === "d") {
    const lines = conflict.claims
      .map((c) => `**Per [[${sourceSlug(c.source)}]]:**\n${c.text}`)
      .join("\n\n")
    return `## Historical claims\n\n${lines}`
  }
  // Paths (a) and (b): the canonical decision is recorded in the changelog +
  // the immutable record; no extra body section is appended.
  return ""
}

function buildChangelogLine(conflict: Conflict, path: ArbitrationPath, today: string): string {
  return `- ${today}: Resolved contradiction via path (${path}) — ${PATH_NAMES[path]}. See [[${ARBITRATION_MARKER}${conflict.id}]].`
}

function appendChangelog(content: string, line: string): string {
  const headingRe = /(^|\n)(#{1,6})\s+changelog\s*\r?\n/i
  const match = content.match(headingRe)
  if (match && match.index !== undefined) {
    const insertAt = match.index + match[0].length
    return `${content.slice(0, insertAt)}${line}\n${content.slice(insertAt)}`
  }
  return `${content.replace(/\s+$/, "")}\n\n## Changelog\n\n${line}\n`
}

function buildArbitrationRecord(conflict: Conflict, path: ArbitrationPath, today: string): string {
  const claimLines = conflict.claims
    .map((c) => `- **From [[${sourceSlug(c.source)}]]**: "${c.text}"`)
    .join("\n")
  const sourcesYaml = conflict.sources.map((s) => `"${s}"`).join(", ")
  return [
    "---",
    "type: meta",
    `title: "Arbitration: ${conflict.title.replace(/"/g, "'")}"`,
    `created: ${today}`,
    `updated: ${today}`,
    `sources: [${sourcesYaml}]`,
    "tags: [meta/arbitration]",
    "status: stable",
    "---",
    "",
    `# Arbitration: ${conflict.title}`,
    "",
    "## Conflict",
    "",
    `Page involved: [[${pageSlug(conflict.pagePath)}]]`,
    "",
    "Conflicting claims:",
    claimLines,
    "",
    "## Resolution",
    "",
    `Path chosen: **(${path}) ${PATH_NAMES[path]}**`,
    "",
    "## Changelog",
    "",
    `- ${today}: Arbitration completed via path (${path})`,
    "",
  ].join("\n")
}

function uniqueSources(claims: ConflictClaim[]): string[] {
  return Array.from(new Set(claims.map((c) => c.source).filter(Boolean)))
}

function conflictId(pagePath: string, sources: string[], claims: ConflictClaim[]): string {
  const normClaims = claims
    .map((c) => `${c.source}:${c.text.trim().replace(/\s+/g, " ").toLowerCase()}`)
    .sort()
    .join("|")
  const key = `${pagePath}|${[...sources].sort().join(",")}|${normClaims}`
  return fnv1a(key)
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

function basenameNoExt(p: string): string {
  const base = p.replace(/\\/g, "/").split("/").pop() ?? p
  return base.replace(/\.[^.]+$/, "")
}

function pageSlug(pagePath: string): string {
  return basenameNoExt(pagePath)
}

function sourceSlug(source: string): string {
  return basenameNoExt(source)
}

/**
 * Set a scalar frontmatter field (inline `field: value`), replacing it in place
 * or appending it inside the frontmatter block. No-op when there is no
 * frontmatter. Mirrors the scalar-setter pattern in `page-merge.ts`.
 */
function setFrontmatterScalar(content: string, fieldName: string, value: string): string {
  const fmMatch = content.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/)
  if (!fmMatch) return content
  const [, openDelim, fmBody, closeDelim] = fmMatch
  const escapedName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const newLine = `${fieldName}: ${value}`
  const lineRe = new RegExp(`^${escapedName}:\\s*(?!\\[)([^\\n]*)`, "m")
  if (lineRe.test(fmBody)) {
    const rewritten = fmBody.replace(lineRe, newLine)
    return `${openDelim}${rewritten}${closeDelim}${content.slice(fmMatch[0].length)}`
  }
  const rewritten = `${fmBody}\n${newLine}`
  return `${openDelim}${rewritten}${closeDelim}${content.slice(fmMatch[0].length)}`
}
