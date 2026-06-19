/**
 * Archive cycle (capability #5): snapshot the vault's `wiki/` + `raw/` subtrees
 * into a single `.zip` under `.llm-wiki/archives/`, and record the cycle in the
 * ingest cache so the history is durable and inspectable.
 *
 * v1 = snapshot + record. The gated removal of archived sources (marking cache
 * entries `status: "archived"` and pruning) is a follow-up; the cache schema
 * already carries the fields for it.
 */
import { createArchiveSnapshot } from "@/commands/fs"
import { appendArchivalCycle, type ArchivalCycle } from "@/lib/ingest-cache"
import { normalizePath } from "@/lib/path-utils"

const ARCHIVE_INCLUDES = ["wiki", "raw"] as const

export interface ArchiveSnapshotResult {
  cycle: ArchivalCycle
  fileCount: number
}

export async function archiveSnapshot(
  projectPath: string,
  options?: { now?: () => number; sources?: string[] },
): Promise<ArchiveSnapshotResult> {
  const pp = normalizePath(projectPath).replace(/\/+$/, "")
  const createdAt = (options?.now ?? Date.now)()
  const id = `cycle-${createdAt}`
  const snapshotRelPath = `.llm-wiki/archives/${id}.zip`

  const fileCount = await createArchiveSnapshot(pp, `${pp}/${snapshotRelPath}`, [...ARCHIVE_INCLUDES])

  const cycle: ArchivalCycle = {
    id,
    createdAt,
    snapshotPath: snapshotRelPath,
    sources: options?.sources ?? [],
  }
  await appendArchivalCycle(pp, cycle)
  return { cycle, fileCount }
}
