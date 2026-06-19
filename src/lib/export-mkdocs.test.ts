import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/commands/fs", () => ({
  listDirectory: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  createDirectory: vi.fn(),
}))

import { wikilinkToMarkdown, buildMkDocsConfig, exportMkDocs, type MkDocsPage } from "./export-mkdocs"
import { listDirectory, readFile, writeFile, createDirectory } from "@/commands/fs"

const mockList = vi.mocked(listDirectory)
const mockRead = vi.mocked(readFile)
const mockWrite = vi.mocked(writeFile)
const mockMkdir = vi.mocked(createDirectory)

describe("export-mkdocs — wikilinkToMarkdown", () => {
  it("rewrites bare and labelled wikilinks to relative markdown links", () => {
    expect(wikilinkToMarkdown("see [[flash-attention]] and [[gpt-4|GPT-4]]")).toBe(
      "see [flash-attention](flash-attention.md) and [GPT-4](gpt-4.md)",
    )
  })

  it("leaves non-wikilink text untouched", () => {
    expect(wikilinkToMarkdown("plain [markdown](x.md) link")).toBe("plain [markdown](x.md) link")
  })
})

describe("export-mkdocs — buildMkDocsConfig", () => {
  it("groups nav by top-level folder and quotes titles", () => {
    const pages: MkDocsPage[] = [
      { path: "concepts/x.md", title: "X: a thing" },
      { path: "entities/y.md", title: "Y" },
    ]
    const yml = buildMkDocsConfig("My Wiki", pages)
    expect(yml).toContain('site_name: "My Wiki"')
    expect(yml).toContain("  name: material")
    expect(yml).toContain("  - Concepts:")
    expect(yml).toContain('      - "X: a thing": concepts/x.md')
    expect(yml).toContain("  - Entities:")
  })
})

describe("export-mkdocs — exportMkDocs", () => {
  beforeEach(() => {
    mockList.mockReset()
    mockRead.mockReset()
    mockWrite.mockReset()
    mockMkdir.mockReset()
    mockWrite.mockResolvedValue(undefined)
    mockMkdir.mockResolvedValue(undefined)
  })

  it("writes transformed pages + mkdocs.yml and returns the page count", async () => {
    mockList.mockResolvedValue([
      { name: "concepts", path: "/p/wiki/concepts", is_dir: true, children: [
        { name: "x.md", path: "/p/wiki/concepts/x.md", is_dir: false },
      ] },
    ] as never)
    mockRead.mockResolvedValue("---\ntitle: X\n---\nbody with [[y]]")

    const result = await exportMkDocs("/p", "Site")

    expect(result.pages).toBe(1)
    expect(result.configPath).toBe("/p/mkdocs-export/mkdocs.yml")

    const pageWrite = mockWrite.mock.calls.find((c) => String(c[0]).endsWith("/docs/concepts/x.md"))
    expect(pageWrite).toBeTruthy()
    expect(pageWrite![1]).toContain("[y](y.md)") // wikilink rewritten

    const ymlWrite = mockWrite.mock.calls.find((c) => String(c[0]).endsWith("mkdocs.yml"))
    expect(ymlWrite![1]).toContain('site_name: "Site"')
  })
})
