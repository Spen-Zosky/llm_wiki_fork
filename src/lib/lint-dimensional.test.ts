import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock only the fs layer; parseFrontmatter + validateDimensions run for real.
vi.mock("@/commands/fs", () => ({
  readFile: vi.fn(),
  listDirectory: vi.fn(),
}))

import { runDimensionalLint } from "./lint"
import { readFile, listDirectory } from "@/commands/fs"

const mockReadFile = vi.mocked(readFile)
const mockListDirectory = vi.mocked(listDirectory)

beforeEach(() => {
  mockReadFile.mockReset()
  mockListDirectory.mockReset()
})

function md(name: string) {
  return { name, path: `/p/wiki/concepts/${name}`, is_dir: false }
}

describe("lint — runDimensionalLint", () => {
  it("returns [] when the wiki dir can't be listed", async () => {
    mockListDirectory.mockRejectedValue(new Error("no dir"))
    expect(await runDimensionalLint("/p")).toEqual([])
  })

  it("flags an invalid axis value as a dimensional warning", async () => {
    mockListDirectory.mockResolvedValue([md("a.md")])
    mockReadFile.mockResolvedValue("---\ntype: concept\nfacet: nonsense\n---\nbody")

    const results = await runDimensionalLint("/p")
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      type: "dimensional",
      severity: "warning",
      page: "concepts/a.md",
    })
    expect(results[0].detail).toContain("facet")
  })

  it("produces no findings for valid or absent dimensions", async () => {
    mockListDirectory.mockResolvedValue([md("a.md"), md("b.md")])
    mockReadFile.mockImplementation(async (p: string) =>
      p.includes("a.md")
        ? "---\ntype: concept\nauthority: authoritative\n---\nx"
        : "---\ntype: entity\ntitle: B\n---\ny", // no dimensional axes at all
    )
    expect(await runDimensionalLint("/p")).toEqual([])
  })

  it("maps the superseded-by rule to a warning", async () => {
    mockListDirectory.mockResolvedValue([md("a.md")])
    mockReadFile.mockResolvedValue("---\ntype: concept\ntemporal-status: superseded\n---\nx")

    const results = await runDimensionalLint("/p")
    expect(
      results.some((r) => r.severity === "warning" && r.detail.includes("superseded-by")),
    ).toBe(true)
  })

  it("skips index.md and log.md", async () => {
    mockListDirectory.mockResolvedValue([
      { name: "index.md", path: "/p/wiki/index.md", is_dir: false },
      { name: "log.md", path: "/p/wiki/log.md", is_dir: false },
    ])
    mockReadFile.mockResolvedValue("---\nfacet: nonsense\n---\nx")
    expect(await runDimensionalLint("/p")).toEqual([])
  })

  it("honors per-vault layer extensions declared in schema.md", async () => {
    mockListDirectory.mockResolvedValue([md("a.md")])
    mockReadFile.mockImplementation(async (p: string) =>
      p === "/p/schema.md"
        ? "## Dimensions\n\n| Axis | Values |\n| --- | --- |\n| layer | marketing |\n"
        : "---\ntype: concept\nlayer: marketing\n---\nbody",
    )
    expect(await runDimensionalLint("/p")).toEqual([])
  })

  it("still flags a layer value that is neither a default nor a declared extension", async () => {
    mockListDirectory.mockResolvedValue([md("a.md")])
    mockReadFile.mockImplementation(async (p: string) =>
      p === "/p/schema.md"
        ? "## Dimensions\n\n| Axis | Values |\n| --- | --- |\n| layer | marketing |\n"
        : "---\ntype: concept\nlayer: bogus\n---\nbody",
    )
    const results = await runDimensionalLint("/p")
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ type: "dimensional", severity: "warning" })
    expect(results[0].detail).toContain("layer")
  })
})
