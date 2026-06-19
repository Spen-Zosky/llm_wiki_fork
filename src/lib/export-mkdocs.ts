/**
 * Export the compiled `wiki/` tree as a static MkDocs site (capability #6).
 * Pure-TS: reads each page, rewrites `[[wikilinks]]` to relative Markdown
 * links, writes `mkdocs-export/docs/<rel>` + a generated `mkdocs.yml`.
 */
import { createDirectory, listDirectory, readFile, writeFile } from "@/commands/fs"
import type { FileNode } from "@/types/wiki"
import { getFileName, getRelativePath, normalizePath } from "@/lib/path-utils"
import { parseFrontmatter } from "@/lib/frontmatter"

export interface MkDocsPage {
  /** Path relative to `docs/`, e.g. `concepts/x.md`. */
  path: string
  title: string
}

export interface ExportMkDocsResult {
  configPath: string
  pages: number
}

/** Rewrite `[[slug]]` / `[[slug|label]]` to relative Markdown links `[label](slug.md)`. */
export function wikilinkToMarkdown(body: string): string {
  return body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target: string, label?: string) => {
    const slug = target.trim()
    const text = (label ?? slug).trim()
    return `[${text}](${slug}.md)`
  })
}

/** Build a `mkdocs.yml` (material theme) with nav grouped by top-level folder. */
export function buildMkDocsConfig(siteName: string, pages: readonly MkDocsPage[]): string {
  const groups = new Map<string, MkDocsPage[]>()
  for (const page of pages) {
    const group = page.path.includes("/") ? page.path.split("/")[0] : "pages"
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(page)
  }

  const navLines: string[] = []
  for (const [group, groupPages] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    navLines.push(`  - ${capitalize(group)}:`)
    for (const page of groupPages.slice().sort((a, b) => a.path.localeCompare(b.path))) {
      navLines.push(`      - ${yamlString(page.title)}: ${page.path}`)
    }
  }

  return [
    `site_name: ${yamlString(siteName)}`,
    "theme:",
    "  name: material",
    "markdown_extensions:",
    "  - admonition",
    "  - toc:",
    "      permalink: true",
    "nav:",
    ...navLines,
    "",
  ].join("\n")
}

export async function exportMkDocs(projectPath: string, siteName?: string): Promise<ExportMkDocsResult> {
  const pp = normalizePath(projectPath).replace(/\/+$/, "")
  const wikiRoot = `${pp}/wiki`
  const docsRoot = `${pp}/mkdocs-export/docs`

  const files = flattenMdFiles(await listDirectory(wikiRoot))
  const pages: MkDocsPage[] = []

  for (const file of files) {
    const rel = getRelativePath(file.path, wikiRoot)
    let content: string
    try {
      content = await readFile(file.path)
    } catch {
      continue
    }
    const { frontmatter, body } = parseFrontmatter(content)
    const title =
      typeof frontmatter?.title === "string" && frontmatter.title.trim()
        ? frontmatter.title.trim()
        : getFileName(rel).replace(/\.md$/i, "")

    const outPath = `${docsRoot}/${rel}`
    const dir = parentDir(outPath)
    if (dir) await createDirectory(dir)
    await writeFile(outPath, wikilinkToMarkdown(body || content))
    pages.push({ path: rel, title })
  }

  const configPath = `${pp}/mkdocs-export/mkdocs.yml`
  await writeFile(configPath, buildMkDocsConfig(siteName?.trim() || getFileName(pp) || "Wiki", pages))
  return { configPath, pages: pages.length }
}

// ── helpers ─────────────────────────────────────────────────────────────────

function flattenMdFiles(nodes: FileNode[]): FileNode[] {
  const out: FileNode[] = []
  for (const node of nodes) {
    if (node.is_dir) out.push(...flattenMdFiles(node.children ?? []))
    else if (node.name.toLowerCase().endsWith(".md")) out.push(node)
  }
  return out
}

function parentDir(path: string): string {
  const i = path.lastIndexOf("/")
  return i > 0 ? path.slice(0, i) : ""
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

function yamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}
