/**
 * Engine versioning: per-vault engine + schema version, stored in
 * `{project}/.llm-wiki/engine.json`.
 *
 * Why: enables migration (bumping the vault schema as the fused engine
 * evolves) and lets capabilities gate on schema features. Mirrors the
 * read-or-create pattern of `project-identity.ts`.
 *
 * Storage: `{project}/.llm-wiki/engine.json`
 *   `{ "engineVersion": "1.3.0", "schemaVersion": 1, "createdAt": <ms>, "updatedAt": <ms> }`
 *
 * Legacy vaults (no engine.json, e.g. created by upstream llm_wiki) are
 * intentionally NOT stamped on open — `getEngineMeta` returns null and
 * `needsMigration` reports true, so a future migration can detect and
 * upgrade them rather than silently marking them current.
 */

import { readFile, writeFile } from "@/commands/fs"
import { normalizePath } from "@/lib/path-utils"

/** Engine lineage version (wiki-factory LLM Wiki Engine baseline). */
export const CURRENT_ENGINE_VERSION = "1.3.0"
/** Internal vault schema version. Bump when a migration changes on-disk shape. */
export const CURRENT_SCHEMA_VERSION = 1

export interface EngineMeta {
  engineVersion: string
  schemaVersion: number
  createdAt: number
  updatedAt: number
}

function enginePath(projectPath: string): string {
  return `${normalizePath(projectPath)}/.llm-wiki/engine.json`
}

/**
 * Return the vault's engine metadata, or null if absent/corrupt
 * (legacy vault never stamped by the versioned engine).
 */
export async function getEngineMeta(
  projectPath: string,
): Promise<EngineMeta | null> {
  try {
    const raw = await readFile(enginePath(projectPath))
    const parsed = JSON.parse(raw) as Partial<EngineMeta>
    if (
      typeof parsed?.engineVersion === "string" &&
      typeof parsed?.schemaVersion === "number"
    ) {
      return {
        engineVersion: parsed.engineVersion,
        schemaVersion: parsed.schemaVersion,
        createdAt: parsed.createdAt ?? 0,
        updatedAt: parsed.updatedAt ?? 0,
      }
    }
  } catch {
    // missing or corrupt — treat as legacy
  }
  return null
}

/**
 * Read-or-create `.llm-wiki/engine.json`. Intended for brand-new vaults
 * (call from create, not open). Returns existing metadata if present;
 * otherwise writes the current engine + schema version and returns it.
 * Best-effort on write failure (mirrors `ensureProjectId`).
 */
export async function ensureEngineMeta(
  projectPath: string,
): Promise<EngineMeta> {
  const existing = await getEngineMeta(projectPath)
  if (existing) return existing

  const now = Date.now()
  const meta: EngineMeta = {
    engineVersion: CURRENT_ENGINE_VERSION,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
  }
  try {
    await writeFile(enginePath(projectPath), JSON.stringify(meta, null, 2))
  } catch (err) {
    console.warn("[engine-version] failed to write engine.json:", err)
  }
  return meta
}

/**
 * Whether the vault's schema is older than the current engine schema
 * (a migration is available). Legacy vaults without engine.json report
 * schemaVersion 0 → true.
 */
export async function needsMigration(projectPath: string): Promise<boolean> {
  const meta = await getEngineMeta(projectPath)
  const vaultSchema = meta?.schemaVersion ?? 0
  return vaultSchema < CURRENT_SCHEMA_VERSION
}
