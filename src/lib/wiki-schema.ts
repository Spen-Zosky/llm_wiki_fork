import { readFile } from "@/commands/fs"
import { parseFrontmatter } from "@/lib/frontmatter"

export interface WikiSchemaRouting {
  typeDirs: Record<string, string>
}

export interface WikiSchemaRoutingIssue {
  message: string
}

/**
 * Per-vault dimensional axis extensions parsed from a `## Dimensions` section in
 * `schema.md`. Only the `layer` axis is consumed today (additive to the engine
 * defaults — the six fixed axes stay comparable cross-vault); other rows are
 * parsed but currently unused.
 */
export interface WikiSchemaDimensions {
  axes: Record<string, string[]>
}

export async function loadProjectWikiSchemaRouting(
  projectPath: string,
): Promise<WikiSchemaRouting | null> {
  const raw = await loadSchemaMarkdown(projectPath)
  if (raw === null) return null

  const routing = parseWikiSchemaRouting(raw)
  return Object.keys(routing.typeDirs).length > 0 ? routing : null
}

/**
 * Load the per-vault `## Dimensions` extensions from `schema.md`. Returns null
 * when schema.md is missing/empty or declares no axis extensions.
 */
export async function loadProjectWikiSchemaDimensions(
  projectPath: string,
): Promise<WikiSchemaDimensions | null> {
  const raw = await loadSchemaMarkdown(projectPath)
  if (raw === null) return null

  const dims = parseWikiSchemaDimensions(raw)
  return Object.keys(dims.axes).length > 0 ? dims : null
}

async function loadSchemaMarkdown(projectPath: string): Promise<string | null> {
  let raw = ""
  try {
    raw = await readFile(`${projectPath.replace(/\/+$/, "")}/schema.md`)
  } catch {
    return null
  }
  return raw.trim() ? raw : null
}

export function parseWikiSchemaRouting(markdown: string): WikiSchemaRouting {
  const typeDirs: Record<string, string> = {}
  for (const line of pageTypesSectionLines(markdown)) {
    if (!line.trim().startsWith("|")) continue
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim())
    if (cells.length < 2) continue

    const [type, dir] = cells
    if (!/^[a-z][a-z0-9_-]*$/i.test(type)) continue
    if (dir !== "wiki" && !dir.startsWith("wiki/")) continue

    typeDirs[type] = stripTrailingSlash(dir)
  }

  return { typeDirs }
}

/**
 * Parse a `## Dimensions` section table (`| axis | v1, v2, ... |`) into a map of
 * per-vault axis value extensions. Axis names must be lowercase (which skips the
 * `Axis`/`---` header and separator rows); values are comma-separated.
 */
export function parseWikiSchemaDimensions(markdown: string): WikiSchemaDimensions {
  const axes: Record<string, string[]> = {}
  for (const line of sectionLines(markdown, /^dimensions$/i)) {
    if (!line.trim().startsWith("|")) continue
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim())
    if (cells.length < 2) continue

    const [axis, values] = cells
    if (!/^[a-z][a-z0-9_-]*$/.test(axis)) continue // skips "Axis" header + "---" separator

    const parsed = values
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
    if (parsed.length === 0) continue

    axes[axis] = parsed
  }

  return { axes }
}

/**
 * Collect the lines under a markdown section whose heading text matches
 * `titleRegex`, stopping at the next heading of equal-or-shallower level.
 */
export function sectionLines(markdown: string, titleRegex: RegExp): string[] {
  const lines = markdown.split("\n")
  const start = lines.findIndex((line) => {
    const match = line.trim().match(/^(#{1,6})\s+(.+?)\s*#*$/)
    return !!match && titleRegex.test(match[2].trim())
  })

  if (start < 0) return []

  const headingLevel = lines[start].trim().match(/^(#{1,6})/)?.[1].length ?? 6
  const out: string[] = []
  for (const line of lines.slice(start + 1)) {
    const heading = line.trim().match(/^(#{1,6})\s+/)
    if (heading && heading[1].length <= headingLevel) break
    out.push(line)
  }
  return out
}

function pageTypesSectionLines(markdown: string): string[] {
  return sectionLines(markdown, /^page\s+types$/i)
}

export function validateWikiPageRouting(
  relativePath: string,
  content: string,
  routing: WikiSchemaRouting,
): WikiSchemaRoutingIssue | null {
  const parsed = parseFrontmatter(content)
  const type = parsed.frontmatter?.type
  if (typeof type !== "string" || !type.trim()) return null

  const normalizedPath = normalizeRelativePath(relativePath)
  const actualDir = dirname(normalizedPath)
  const expectedDir = routing.typeDirs[type]
  if (expectedDir && actualDir !== expectedDir) {
    return {
      message: `Page type "${type}" must be under "${expectedDir}/". Current directory: "${actualDir}".`,
    }
  }

  const typeFromPath = inferTypeFromSchemaPath(normalizedPath, routing)
  if (typeFromPath && typeFromPath !== type) {
    return {
      message: `Pages under "${actualDir}/" must use type "${typeFromPath}", but found "${type}".`,
    }
  }

  return null
}

function inferTypeFromSchemaPath(
  relativePath: string,
  routing: WikiSchemaRouting,
): string | null {
  const actualDir = dirname(relativePath)
  for (const [type, dir] of Object.entries(routing.typeDirs)) {
    if (actualDir === dir) return type
  }
  return null
}

function normalizeRelativePath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/").replace(/^\/+/, "")
}

function dirname(relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath)
  const index = normalized.lastIndexOf("/")
  return index >= 0 ? normalized.slice(0, index) : "."
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "")
}
