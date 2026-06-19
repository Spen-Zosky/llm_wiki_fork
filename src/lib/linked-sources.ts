/**
 * `source_mode: linked` — register an EXTERNAL git repo / folder / file and
 * ingest it IN-PLACE, without copying anything into `raw/sources/`.
 *
 * Design: a per-project registry at `.llm-wiki/linked-sources.json` (the same
 * `.llm-wiki/<file>.json` convention as `project.json` / `ingest-cache.json`).
 * No OS symlinks (none exist in the codebase, and they need Windows privileges);
 * a registry of absolute paths is copy-free, reversible, and OS-neutral. The
 * Rust fs commands already read external absolute paths, so this is pure TS.
 *
 * Identity: each linked file ingests under a stable `linked/<label>/<rel>`
 * identity (see `sourceIdentityForPath` + `LinkedSourceRoot`), which round-trips
 * through `sourceReferenceIdentity` so the delete-cascade still matches.
 *
 * The feature is gated behind `SourceWatchConfig.linkedSourcesEnabled` (default
 * OFF). With the flag off the registry is simply never written, so the engine
 * behaves exactly as before.
 */
import { createDirectory, getFileSize, listDirectory, readFile, writeFile } from "@/commands/fs"
import type { WikiProject, FileNode } from "@/types/wiki"
import type { LlmConfig, SourceWatchConfig } from "@/stores/wiki-store"
import { enqueueBatch } from "@/lib/ingest-queue"
import { hasUsableLlm } from "@/lib/has-usable-llm"
import { getFileName, getRelativePath, normalizePath } from "@/lib/path-utils"
import { isPathAllowedBySourceWatch, normalizeSourceWatchConfig } from "@/lib/source-watch-config"
import { deleteSourceFiles, isIngestableSourcePath } from "@/lib/source-lifecycle"
import type { LinkedSourceRoot } from "@/lib/source-identity"

const SCHEMA_VERSION = 1

export interface LinkedSource {
  id: string
  mode: "linked"
  /** Normalized absolute path to the external file or folder. */
  externalPath: string
  /** Stable display label / first identity segment (unique within the vault). */
  label: string
  kind: "folder" | "file"
  registeredAt: number
}

export interface LinkedSourcesData {
  entries: LinkedSource[]
  schemaVersion?: number
}

function registryPath(projectPath: string): string {
  return `${normalizePath(projectPath).replace(/\/+$/, "")}/.llm-wiki/linked-sources.json`
}

export async function loadLinkedSources(projectPath: string): Promise<LinkedSourcesData> {
  try {
    const raw = await readFile(registryPath(projectPath))
    const parsed = JSON.parse(raw) as Partial<LinkedSourcesData>
    if (parsed && Array.isArray(parsed.entries)) {
      return { entries: parsed.entries, schemaVersion: parsed.schemaVersion ?? SCHEMA_VERSION }
    }
  } catch {
    // missing / corrupt registry → empty
  }
  return { entries: [], schemaVersion: SCHEMA_VERSION }
}

export async function saveLinkedSources(
  projectPath: string,
  data: LinkedSourcesData,
): Promise<void> {
  const pp = normalizePath(projectPath).replace(/\/+$/, "")
  await createDirectory(`${pp}/.llm-wiki`)
  await writeFile(
    registryPath(pp),
    JSON.stringify({ entries: data.entries, schemaVersion: SCHEMA_VERSION }, null, 2),
  )
}

/** Map the registry to the lightweight roots `sourceIdentityForPath` consumes. */
export function linkedRootsFor(data: LinkedSourcesData): LinkedSourceRoot[] {
  return data.entries.map((entry) => ({ externalPath: entry.externalPath, label: entry.label }))
}

export async function registerLinkedFolder(
  project: WikiProject,
  externalPath: string,
  llmConfig: LlmConfig,
  sourceWatchConfig?: SourceWatchConfig,
): Promise<{ entry: LinkedSource; enqueued: string[] }> {
  return registerLinked(project, externalPath, "folder", llmConfig, sourceWatchConfig)
}

export async function registerLinkedFile(
  project: WikiProject,
  externalPath: string,
  llmConfig: LlmConfig,
  sourceWatchConfig?: SourceWatchConfig,
): Promise<{ entry: LinkedSource; enqueued: string[] }> {
  return registerLinked(project, externalPath, "file", llmConfig, sourceWatchConfig)
}

async function registerLinked(
  project: WikiProject,
  externalPath: string,
  kind: "folder" | "file",
  llmConfig: LlmConfig,
  sourceWatchConfig?: SourceWatchConfig,
): Promise<{ entry: LinkedSource; enqueued: string[] }> {
  const pp = normalizePath(project.path)
  const ext = normalizePath(externalPath).replace(/\/+$/, "")
  if (isInsideProject(pp, ext)) {
    throw new Error("Cannot link a path inside the current project — use normal import instead.")
  }

  const data = await loadLinkedSources(pp)
  if (data.entries.some((entry) => normalizePath(entry.externalPath).toLowerCase() === ext.toLowerCase())) {
    throw new Error("This path is already linked.")
  }

  const entry: LinkedSource = {
    id: makeLinkedId(),
    mode: "linked",
    externalPath: ext,
    label: uniqueLabel(data.entries, getFileName(ext) || "linked"),
    kind,
    registeredAt: Date.now(),
  }
  data.entries.push(entry)
  await saveLinkedSources(pp, data)

  const enqueued = await enqueueLinked(project, entry, llmConfig, sourceWatchConfig)
  return { entry, enqueued }
}

/** Re-enqueue a linked source (manual refresh — the watcher does not see external roots). */
export async function refreshLinkedSource(
  project: WikiProject,
  id: string,
  llmConfig: LlmConfig,
  sourceWatchConfig?: SourceWatchConfig,
): Promise<string[]> {
  const data = await loadLinkedSources(project.path)
  const entry = data.entries.find((e) => e.id === id)
  if (!entry) return []
  return enqueueLinked(project, entry, llmConfig, sourceWatchConfig)
}

/**
 * Unregister a linked source and clean up the wiki pages derived from it —
 * WITHOUT deleting the external files (`fileAlreadyDeleted: true` skips the
 * source delete; the linked identities still match the pages' `sources:`).
 */
export async function unlinkSource(
  project: WikiProject,
  id: string,
): Promise<{ removed: boolean; deletedWikiPaths: string[] }> {
  const pp = normalizePath(project.path)
  const data = await loadLinkedSources(pp)
  const entry = data.entries.find((e) => e.id === id)
  if (!entry) return { removed: false, deletedWikiPaths: [] }

  data.entries = data.entries.filter((e) => e.id !== id)
  await saveLinkedSources(pp, data)

  const sourcePaths =
    entry.kind === "file"
      ? [entry.externalPath]
      : await enumerateExternalFiles(entry.externalPath)
  if (sourcePaths.length === 0) return { removed: true, deletedWikiPaths: [] }

  const result = await deleteSourceFiles(pp, sourcePaths, {
    fileAlreadyDeleted: true, // NEVER delete the external files
    logReason: "unlink linked source",
    linkedRoots: [{ externalPath: entry.externalPath, label: entry.label }],
  })
  return { removed: true, deletedWikiPaths: result.deletedWikiPaths }
}

// ── helpers ─────────────────────────────────────────────────────────────────

async function enqueueLinked(
  project: WikiProject,
  entry: LinkedSource,
  llmConfig: LlmConfig,
  sourceWatchConfig?: SourceWatchConfig,
): Promise<string[]> {
  if (!hasUsableLlm(llmConfig)) return []
  const cfg = normalizeSourceWatchConfig(sourceWatchConfig)
  const maxBytes = cfg.maxFileSizeMb * 1024 * 1024

  const files: { sourcePath: string; folderContext: string }[] = []
  if (entry.kind === "file") {
    if (isIngestableSourcePath(entry.externalPath)) {
      files.push({ sourcePath: entry.externalPath, folderContext: entry.label })
    }
  } else {
    for (const path of await enumerateExternalFiles(entry.externalPath)) {
      const rel = getRelativePath(path, entry.externalPath)
      // Gate on the watch config + size, mirroring importSourceFolder, using a
      // vault-relative-looking path so excludeDirs/globs apply the same way.
      if (!isPathAllowedBySourceWatch(`${entry.label}/${rel}`, cfg)) continue
      if (!isIngestableSourcePath(path)) continue
      try {
        if ((await getFileSize(path)) > maxBytes) continue
      } catch {
        continue
      }
      const ctxParts = rel.split("/")
      ctxParts.pop()
      files.push({ sourcePath: path, folderContext: [entry.label, ...ctxParts].filter(Boolean).join(" > ") })
    }
  }

  if (files.length === 0) return []
  return enqueueBatch(project.id, files)
}

async function enumerateExternalFiles(externalPath: string): Promise<string[]> {
  try {
    return flattenFiles(await listDirectory(externalPath)).map((f) => normalizePath(f.path))
  } catch {
    return [] // external path gone — nothing to enumerate
  }
}

function flattenFiles(nodes: FileNode[]): FileNode[] {
  const files: FileNode[] = []
  for (const node of nodes) {
    if (node.is_dir) files.push(...flattenFiles(node.children ?? []))
    else files.push(node)
  }
  return files
}

function isInsideProject(projectPath: string, externalPath: string): boolean {
  const p = normalizePath(projectPath).replace(/\/+$/, "").toLowerCase()
  const e = normalizePath(externalPath).replace(/\/+$/, "").toLowerCase()
  return e === p || e.startsWith(`${p}/`) || p.startsWith(`${e}/`)
}

function uniqueLabel(existing: LinkedSource[], base: string): string {
  const taken = new Set(existing.map((entry) => entry.label.toLowerCase()))
  const root = base || "linked"
  if (!taken.has(root.toLowerCase())) return root
  let n = 2
  while (taken.has(`${root}-${n}`.toLowerCase())) n++
  return `${root}-${n}`
}

function makeLinkedId(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  return uuid ? `linked-${uuid}` : `linked-${Date.now().toString(36)}`
}
