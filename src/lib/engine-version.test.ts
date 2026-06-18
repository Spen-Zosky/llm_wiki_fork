import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock fs so the tests don't touch real disk.
vi.mock("@/commands/fs", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))

import {
  ensureEngineMeta,
  getEngineMeta,
  needsMigration,
  CURRENT_ENGINE_VERSION,
  CURRENT_SCHEMA_VERSION,
} from "./engine-version"
import { readFile, writeFile } from "@/commands/fs"

const mockReadFile = vi.mocked(readFile)
const mockWriteFile = vi.mocked(writeFile)

beforeEach(() => {
  mockReadFile.mockReset()
  mockWriteFile.mockReset()
  mockWriteFile.mockResolvedValue(undefined as unknown as void)
})

describe("engine-version — getEngineMeta", () => {
  it("returns null for a legacy vault with no engine.json", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"))
    expect(await getEngineMeta("/project")).toBeNull()
  })

  it("returns null for a corrupt engine.json", async () => {
    mockReadFile.mockResolvedValue("{ not json")
    expect(await getEngineMeta("/project")).toBeNull()
  })

  it("parses a valid engine.json", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        engineVersion: "1.3.0",
        schemaVersion: 1,
        createdAt: 111,
        updatedAt: 222,
      }),
    )
    expect(await getEngineMeta("/project")).toEqual({
      engineVersion: "1.3.0",
      schemaVersion: 1,
      createdAt: 111,
      updatedAt: 222,
    })
  })
})

describe("engine-version — ensureEngineMeta", () => {
  it("creates engine.json with current versions when absent", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"))
    const meta = await ensureEngineMeta("/project")

    expect(meta.engineVersion).toBe(CURRENT_ENGINE_VERSION)
    expect(meta.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(mockWriteFile).toHaveBeenCalledTimes(1)
    const [path, content] = mockWriteFile.mock.calls[0]
    expect(path).toContain("/.llm-wiki/engine.json")
    expect(JSON.parse(content)).toMatchObject({
      engineVersion: CURRENT_ENGINE_VERSION,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    })
  })

  it("returns existing metadata without rewriting when present", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        engineVersion: "1.3.0",
        schemaVersion: 1,
        createdAt: 5,
        updatedAt: 5,
      }),
    )
    const meta = await ensureEngineMeta("/project")
    expect(meta.createdAt).toBe(5)
    expect(mockWriteFile).not.toHaveBeenCalled()
  })
})

describe("engine-version — needsMigration", () => {
  it("is true for a legacy vault (no engine.json → schema 0)", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"))
    expect(await needsMigration("/project")).toBe(true)
  })

  it("is true when the vault schema is older than current", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({ engineVersion: "1.2.0", schemaVersion: 0, createdAt: 1, updatedAt: 1 }),
    )
    expect(await needsMigration("/project")).toBe(true)
  })

  it("is false when the vault is at the current schema", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        engineVersion: CURRENT_ENGINE_VERSION,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        createdAt: 1,
        updatedAt: 1,
      }),
    )
    expect(await needsMigration("/project")).toBe(false)
  })
})
