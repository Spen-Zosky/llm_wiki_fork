import { describe, it, expect, beforeEach, vi } from "vitest"
import type { WikiProject } from "@/types/wiki"
import type { LlmConfig } from "@/stores/wiki-store"

const mocks = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  createDirectory: vi.fn(),
  listDirectory: vi.fn(),
  getFileSize: vi.fn(),
  copyFile: vi.fn(),
  deleteFile: vi.fn(),
  enqueueBatch: vi.fn(),
  deleteSourceFiles: vi.fn(),
}))

vi.mock("@/commands/fs", () => ({
  readFile: mocks.readFile,
  writeFile: mocks.writeFile,
  createDirectory: mocks.createDirectory,
  listDirectory: mocks.listDirectory,
  getFileSize: mocks.getFileSize,
  copyFile: mocks.copyFile,
  deleteFile: mocks.deleteFile,
}))
vi.mock("@/lib/ingest-queue", () => ({ enqueueBatch: mocks.enqueueBatch }))
vi.mock("@/lib/has-usable-llm", () => ({ hasUsableLlm: () => true }))
vi.mock("@/lib/source-lifecycle", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./source-lifecycle")>()
  return { ...actual, deleteSourceFiles: mocks.deleteSourceFiles }
})

import {
  registerLinkedFolder,
  registerLinkedFile,
  unlinkSource,
  loadLinkedSources,
  linkedRootsFor,
} from "./linked-sources"

const project = { id: "proj-1", path: "/tmp/project", name: "P" } as unknown as WikiProject
const llm = {} as LlmConfig

function file(path: string) {
  return { name: path.split("/").pop() ?? path, path, is_dir: false }
}

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset())
  mocks.readFile.mockRejectedValue(new Error("no registry")) // empty registry by default
  mocks.writeFile.mockResolvedValue(undefined)
  mocks.createDirectory.mockResolvedValue(undefined)
  mocks.getFileSize.mockResolvedValue(1000)
  mocks.enqueueBatch.mockResolvedValue(["task-1"])
  mocks.deleteSourceFiles.mockResolvedValue({ deletedWikiPaths: ["wiki/concepts/x.md"], rewrittenSourcePages: 0, skippedPages: 0 })
})

describe("linked-sources — registerLinkedFolder", () => {
  it("registers an external folder and enqueues external absolute paths (no copy)", async () => {
    mocks.listDirectory.mockResolvedValue([
      file("/ext/repo/docs/a.md"),
      file("/ext/repo/node_modules/dep.md"), // excluded by excludeDirs
      file("/ext/repo/notes/b.md"),
    ])

    const { entry, enqueued } = await registerLinkedFolder(project, "/ext/repo", llm)

    expect(entry.kind).toBe("folder")
    expect(entry.label).toBe("repo")
    expect(entry.externalPath).toBe("/ext/repo")
    expect(enqueued).toEqual(["task-1"])
    expect(mocks.copyFile).not.toHaveBeenCalled() // in-place: nothing copied

    const [, files] = mocks.enqueueBatch.mock.calls[0]
    const paths = (files as { sourcePath: string }[]).map((f) => f.sourcePath).sort()
    expect(paths).toEqual(["/ext/repo/docs/a.md", "/ext/repo/notes/b.md"]) // node_modules excluded

    // registry persisted
    const calls = mocks.writeFile.mock.calls
    const saved = JSON.parse(calls[calls.length - 1][1] as string)
    expect(saved.entries).toHaveLength(1)
    expect(saved.entries[0].externalPath).toBe("/ext/repo")
  })

  it("rejects a path inside the project", async () => {
    await expect(registerLinkedFolder(project, "/tmp/project/sub", llm)).rejects.toThrow(/inside the current project/)
    expect(mocks.writeFile).not.toHaveBeenCalled()
  })

  it("rejects an already-linked path", async () => {
    mocks.readFile.mockResolvedValue(
      JSON.stringify({ entries: [{ id: "x", mode: "linked", externalPath: "/ext/repo", label: "repo", kind: "folder", registeredAt: 1 }] }),
    )
    await expect(registerLinkedFolder(project, "/ext/repo", llm)).rejects.toThrow(/already linked/)
  })

  it("excludes files over the size limit", async () => {
    mocks.listDirectory.mockResolvedValue([file("/ext/repo/a.md"), file("/ext/repo/big.md")])
    mocks.getFileSize.mockImplementation(async (p: string) => (p.includes("big") ? 200 * 1024 * 1024 : 1000))

    await registerLinkedFolder(project, "/ext/repo", llm)
    const [, files] = mocks.enqueueBatch.mock.calls[0]
    expect((files as { sourcePath: string }[]).map((f) => f.sourcePath)).toEqual(["/ext/repo/a.md"])
  })
})

describe("linked-sources — registerLinkedFile", () => {
  it("enqueues a single external file", async () => {
    const { entry, enqueued } = await registerLinkedFile(project, "/ext/spec.md", llm)
    expect(entry.kind).toBe("file")
    expect(entry.label).toBe("spec.md")
    expect(enqueued).toEqual(["task-1"])
    const [, files] = mocks.enqueueBatch.mock.calls[0]
    expect((files as { sourcePath: string }[])[0].sourcePath).toBe("/ext/spec.md")
  })
})

describe("linked-sources — unlinkSource", () => {
  beforeEach(() => {
    mocks.readFile.mockResolvedValue(
      JSON.stringify({ entries: [{ id: "e1", mode: "linked", externalPath: "/ext/repo", label: "repo", kind: "folder", registeredAt: 1 }] }),
    )
    mocks.listDirectory.mockResolvedValue([file("/ext/repo/a.md")])
  })

  it("removes the registry entry and cleans wiki pages WITHOUT deleting external files", async () => {
    const result = await unlinkSource(project, "e1")

    expect(result.removed).toBe(true)
    expect(result.deletedWikiPaths).toEqual(["wiki/concepts/x.md"])
    expect(mocks.deleteFile).not.toHaveBeenCalled() // external files untouched

    // deleteSourceFiles called with fileAlreadyDeleted + linkedRoots
    const [, paths, options] = mocks.deleteSourceFiles.mock.calls[0]
    expect(paths).toEqual(["/ext/repo/a.md"])
    expect(options.fileAlreadyDeleted).toBe(true)
    expect(options.linkedRoots).toEqual([{ externalPath: "/ext/repo", label: "repo" }])

    // registry no longer contains the entry
    const calls = mocks.writeFile.mock.calls
    const saved = JSON.parse(calls[calls.length - 1][1] as string)
    expect(saved.entries).toHaveLength(0)
  })

  it("is a no-op for an unknown id", async () => {
    const result = await unlinkSource(project, "missing")
    expect(result.removed).toBe(false)
    expect(mocks.deleteSourceFiles).not.toHaveBeenCalled()
  })
})

describe("linked-sources — loadLinkedSources / linkedRootsFor", () => {
  it("returns an empty registry when the file is missing", async () => {
    const data = await loadLinkedSources("/tmp/project")
    expect(data.entries).toEqual([])
  })

  it("maps entries to identity roots", () => {
    const roots = linkedRootsFor({
      entries: [{ id: "e", mode: "linked", externalPath: "/ext/r", label: "r", kind: "folder", registeredAt: 1 }],
    })
    expect(roots).toEqual([{ externalPath: "/ext/r", label: "r" }])
  })
})
