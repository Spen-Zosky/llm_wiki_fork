import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/commands/fs", () => ({ readFile: vi.fn() }))

import { parseGraphifyGraph, graphifyStats, loadGraphifyGraph } from "./graphify-graph"
import { readFile } from "@/commands/fs"

const mockRead = vi.mocked(readFile)

const SAMPLE = {
  directed: false,
  nodes: [
    { id: "a", label: "A", file_type: "code", community: 0 },
    { id: "b", label: "B", file_type: "document", community: 1 },
    { id: "c", label: "C", community: 1 },
  ],
  links: [
    { source: "a", target: "b", relation: "calls", confidence: "EXTRACTED", confidence_score: 1.0 },
    { source: "b", target: "c", relation: "references", confidence: "INFERRED", confidence_score: 0.85 },
    { source: { id: "c" }, target: { id: "a" }, confidence: "ambiguous", confidence_score: 0.2 },
  ],
}

describe("graphify-graph — parseGraphifyGraph", () => {
  it("parses node-link JSON with provenance and node-object endpoints", () => {
    const g = parseGraphifyGraph(SAMPLE)
    expect(g.nodes).toHaveLength(3)
    expect(g.nodes[0]).toEqual({ id: "a", label: "A", fileType: "code", community: 0 })
    expect(g.edges).toHaveLength(3)
    expect(g.edges[0]).toMatchObject({ source: "a", target: "b", relation: "calls", confidence: "EXTRACTED" })
    expect(g.edges[2]).toMatchObject({ source: "c", target: "a", confidence: "AMBIGUOUS" }) // uppercased
  })

  it("accepts `edges` key and drops malformed entries", () => {
    const g = parseGraphifyGraph({
      nodes: [{ id: "x" }, { label: "no-id" }],
      edges: [{ source: "x", target: "" }, { source: "x", target: "y" }],
    })
    expect(g.nodes.map((n) => n.id)).toEqual(["x"]) // node without id dropped
    expect(g.edges).toHaveLength(1) // empty-target edge dropped
    expect(g.nodes[0].label).toBe("x") // label falls back to id
  })

  it("returns empty graph for junk input", () => {
    expect(parseGraphifyGraph(null)).toEqual({ nodes: [], edges: [] })
    expect(parseGraphifyGraph({})).toEqual({ nodes: [], edges: [] })
  })
})

describe("graphify-graph — graphifyStats", () => {
  it("counts nodes, edges, communities, and provenance buckets", () => {
    const stats = graphifyStats(parseGraphifyGraph(SAMPLE))
    expect(stats).toEqual({
      nodes: 3,
      edges: 3,
      communities: 2,
      provenance: { EXTRACTED: 1, INFERRED: 1, AMBIGUOUS: 1 },
    })
  })
})

describe("graphify-graph — loadGraphifyGraph", () => {
  beforeEach(() => mockRead.mockReset())

  it("loads and parses graphify-out/graph.json", async () => {
    mockRead.mockResolvedValue(JSON.stringify(SAMPLE))
    const g = await loadGraphifyGraph("/p")
    expect(mockRead).toHaveBeenCalledWith("/p/graphify-out/graph.json")
    expect(g?.nodes).toHaveLength(3)
  })

  it("returns null when the file is missing or unreadable", async () => {
    mockRead.mockRejectedValueOnce(new Error("not found"))
    await expect(loadGraphifyGraph("/p")).resolves.toBeNull()
  })

  it("returns null on invalid JSON", async () => {
    mockRead.mockResolvedValue("{ not valid json")
    expect(await loadGraphifyGraph("/p")).toBeNull()
  })
})
