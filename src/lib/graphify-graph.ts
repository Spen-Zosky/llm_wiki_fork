/**
 * graphify dual-layer (capability #7): consume an external graphify `graph.json`
 * (produced by the `graphify` CLI `update` or the full `/graphify` skill run) and
 * surface it as a SECOND graph layer alongside the native wiki-link graph.
 *
 * graphify operates on the RAW sources (AST for code + LLM semantic extraction);
 * every edge carries a provenance tag (EXTRACTED / INFERRED / AMBIGUOUS) and a
 * confidence score. This module parses the networkx node-link JSON defensively —
 * we don't control graphify's exact schema, so unknown fields are ignored.
 */
import { readFile } from "@/commands/fs"
import { normalizePath } from "@/lib/path-utils"

export type EdgeConfidence = "EXTRACTED" | "INFERRED" | "AMBIGUOUS"

export interface GraphifyNode {
  id: string
  label: string
  fileType?: string
  community?: number
}

export interface GraphifyEdge {
  source: string
  target: string
  relation?: string
  confidence?: EdgeConfidence
  confidenceScore?: number
}

export interface GraphifyGraph {
  nodes: GraphifyNode[]
  edges: GraphifyEdge[]
}

export interface GraphifyStats {
  nodes: number
  edges: number
  communities: number
  provenance: Record<EdgeConfidence, number>
}

/** Parse a graphify node-link `graph.json` into a normalized graph. Tolerant of
 *  missing fields and of `links` vs `edges`, and of source/target as id or node. */
export function parseGraphifyGraph(json: unknown): GraphifyGraph {
  const obj = (json ?? {}) as Record<string, unknown>
  const rawNodes = Array.isArray(obj.nodes) ? obj.nodes : []
  const rawEdges = Array.isArray(obj.links)
    ? obj.links
    : Array.isArray(obj.edges)
      ? obj.edges
      : []

  const nodes: GraphifyNode[] = rawNodes
    .map((entry) => {
      const node = entry as Record<string, unknown>
      const id = node.id != null ? String(node.id) : ""
      return {
        id,
        label: typeof node.label === "string" ? node.label : id,
        fileType: typeof node.file_type === "string" ? node.file_type : undefined,
        community: typeof node.community === "number" ? node.community : undefined,
      }
    })
    .filter((node) => node.id !== "")

  const edges: GraphifyEdge[] = rawEdges
    .map((entry) => {
      const edge = entry as Record<string, unknown>
      const confidence =
        typeof edge.confidence === "string" ? edge.confidence.toUpperCase() : undefined
      return {
        source: endpointId(edge.source),
        target: endpointId(edge.target),
        relation: typeof edge.relation === "string" ? edge.relation : undefined,
        confidence:
          confidence === "EXTRACTED" || confidence === "INFERRED" || confidence === "AMBIGUOUS"
            ? (confidence as EdgeConfidence)
            : undefined,
        confidenceScore: typeof edge.confidence_score === "number" ? edge.confidence_score : undefined,
      }
    })
    .filter((edge) => edge.source !== "" && edge.target !== "")

  return { nodes, edges }
}

export function graphifyStats(graph: GraphifyGraph): GraphifyStats {
  const provenance: Record<EdgeConfidence, number> = { EXTRACTED: 0, INFERRED: 0, AMBIGUOUS: 0 }
  for (const edge of graph.edges) {
    if (edge.confidence) provenance[edge.confidence] += 1
  }
  const communities = new Set<number>()
  for (const node of graph.nodes) {
    if (typeof node.community === "number") communities.add(node.community)
  }
  return {
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    communities: communities.size,
    provenance,
  }
}

/** Load + parse `<project>/graphify-out/graph.json`. Null when absent/unreadable. */
export async function loadGraphifyGraph(projectPath: string): Promise<GraphifyGraph | null> {
  const pp = normalizePath(projectPath).replace(/\/+$/, "")
  try {
    const raw = await readFile(`${pp}/graphify-out/graph.json`)
    return parseGraphifyGraph(JSON.parse(raw))
  } catch {
    return null
  }
}

function endpointId(value: unknown): string {
  if (value && typeof value === "object") {
    const id = (value as Record<string, unknown>).id
    return id != null ? String(id) : ""
  }
  return value != null ? String(value) : ""
}
