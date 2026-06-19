import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/commands/fs", () => ({ createArchiveSnapshot: vi.fn() }))
vi.mock("@/lib/ingest-cache", () => ({ appendArchivalCycle: vi.fn() }))

import { archiveSnapshot } from "./archive-snapshot"
import { createArchiveSnapshot } from "@/commands/fs"
import { appendArchivalCycle } from "@/lib/ingest-cache"

const mockSnapshot = vi.mocked(createArchiveSnapshot)
const mockAppend = vi.mocked(appendArchivalCycle)

const FIXED_NOW = 1_750_000_000_000

beforeEach(() => {
  mockSnapshot.mockReset()
  mockAppend.mockReset()
  mockSnapshot.mockResolvedValue(42)
  mockAppend.mockResolvedValue(undefined)
})

describe("archive-snapshot — archiveSnapshot", () => {
  it("zips wiki+raw into .llm-wiki/archives and records a cycle", async () => {
    const result = await archiveSnapshot("/p", { now: () => FIXED_NOW })

    expect(result.fileCount).toBe(42)
    expect(result.cycle.id).toBe(`cycle-${FIXED_NOW}`)
    expect(result.cycle.snapshotPath).toBe(`.llm-wiki/archives/cycle-${FIXED_NOW}.zip`)

    const [pp, outPath, includes] = mockSnapshot.mock.calls[0]
    expect(pp).toBe("/p")
    expect(outPath).toBe(`/p/.llm-wiki/archives/cycle-${FIXED_NOW}.zip`)
    expect(includes).toEqual(["wiki", "raw"])

    expect(mockAppend).toHaveBeenCalledWith("/p", result.cycle)
  })

  it("carries the provided source list into the cycle", async () => {
    const result = await archiveSnapshot("/p", { now: () => FIXED_NOW, sources: ["a.pdf", "b.pdf"] })
    expect(result.cycle.sources).toEqual(["a.pdf", "b.pdf"])
  })
})
