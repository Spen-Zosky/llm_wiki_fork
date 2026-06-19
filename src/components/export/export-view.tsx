import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Archive, Download, Network } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWikiStore } from "@/stores/wiki-store"
import { normalizePath } from "@/lib/path-utils"
import { exportMkDocs } from "@/lib/export-mkdocs"
import { archiveSnapshot } from "@/lib/archive-snapshot"
import { runGraphify } from "@/commands/fs"
import { loadGraphifyGraph, graphifyStats, type GraphifyStats } from "@/lib/graphify-graph"

export function ExportView() {
  const { t } = useTranslation()
  const project = useWikiStore((s) => s.project)
  const [busy, setBusy] = useState<"mkdocs" | "archive" | "graphify" | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [graphStats, setGraphStats] = useState<GraphifyStats | null>(null)

  async function runMkDocs() {
    if (!project || busy) return
    setBusy("mkdocs")
    setMessage(null)
    setError(null)
    try {
      const result = await exportMkDocs(normalizePath(project.path))
      setMessage(
        t("export.mkdocsDone", {
          defaultValue: "Exported {{count}} pages to mkdocs-export/",
          count: result.pages,
        }),
      )
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(null)
    }
  }

  async function runArchive() {
    if (!project || busy) return
    setBusy("archive")
    setMessage(null)
    setError(null)
    try {
      const result = await archiveSnapshot(normalizePath(project.path))
      setMessage(
        t("export.archiveDone", {
          defaultValue: "Archived {{count}} files → {{path}}",
          count: result.fileCount,
          path: result.cycle.snapshotPath,
        }),
      )
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(null)
    }
  }

  async function runGraphifyBuild() {
    if (!project || busy) return
    setBusy("graphify")
    setMessage(null)
    setError(null)
    try {
      const pp = normalizePath(project.path)
      const result = await runGraphify(pp, "raw/sources")
      if (!result.success) {
        setError(result.stderr.trim() || result.stdout.trim() || "graphify exited with an error")
      } else {
        setMessage(t("export.graphifyDone", { defaultValue: "graphify build complete." }))
      }
      const graph = await loadGraphifyGraph(pp)
      setGraphStats(graph ? graphifyStats(graph) : null)
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(null)
    }
  }

  async function loadGraphifyStats() {
    if (!project) return
    setError(null)
    const graph = await loadGraphifyGraph(normalizePath(project.path))
    setGraphStats(graph ? graphifyStats(graph) : null)
    if (!graph) setMessage(t("export.graphifyNone", { defaultValue: "No graphify-out/graph.json yet." }))
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{t("export.title", { defaultValue: "Export & Archive" })}</h2>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {!project && (
          <p className="text-sm text-muted-foreground">
            {t("export.noProject", { defaultValue: "Open a project to export or archive." })}
          </p>
        )}

        <section className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Download className="h-4 w-4 text-muted-foreground" />
            {t("export.mkdocsTitle", { defaultValue: "Export to MkDocs" })}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("export.mkdocsDescription", {
              defaultValue:
                "Generate a static MkDocs site (material theme) under mkdocs-export/. Wikilinks become relative Markdown links.",
            })}
          </p>
          <Button size="sm" onClick={runMkDocs} disabled={!project || busy !== null}>
            {busy === "mkdocs"
              ? t("export.exporting", { defaultValue: "Exporting…" })
              : t("export.mkdocsButton", { defaultValue: "Export MkDocs" })}
          </Button>
        </section>

        <section className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Archive className="h-4 w-4 text-muted-foreground" />
            {t("export.archiveTitle", { defaultValue: "Archive snapshot" })}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("export.archiveDescription", {
              defaultValue:
                "Zip the current wiki/ and raw/ trees into .llm-wiki/archives/ and record the cycle in the ingest cache.",
            })}
          </p>
          <Button size="sm" variant="outline" onClick={runArchive} disabled={!project || busy !== null}>
            {busy === "archive"
              ? t("export.archiving", { defaultValue: "Archiving…" })
              : t("export.archiveButton", { defaultValue: "Create snapshot" })}
          </Button>
        </section>

        <section className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Network className="h-4 w-4 text-muted-foreground" />
            {t("export.graphifyTitle", { defaultValue: "Source graph (graphify)" })}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("export.graphifyDescription", {
              defaultValue:
                "Run the graphify CLI over raw/sources to build a provenance-tagged source-layer graph (code AST). The full semantic graph is produced by the /graphify skill; either writes graphify-out/graph.json, surfaced below.",
            })}
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={runGraphifyBuild} disabled={!project || busy !== null}>
              {busy === "graphify"
                ? t("export.graphifyRunning", { defaultValue: "Running…" })
                : t("export.graphifyButton", { defaultValue: "Build source graph" })}
            </Button>
            <Button size="sm" variant="outline" onClick={loadGraphifyStats} disabled={!project || busy !== null}>
              {t("export.graphifyLoad", { defaultValue: "Load stats" })}
            </Button>
          </div>
          {graphStats && (
            <div className="rounded-md border border-border/60 bg-background px-3 py-2 text-xs">
              <div>
                {graphStats.nodes} {t("export.graphifyNodes", { defaultValue: "nodes" })} ·{" "}
                {graphStats.edges} {t("export.graphifyEdges", { defaultValue: "edges" })} ·{" "}
                {graphStats.communities} {t("export.graphifyCommunities", { defaultValue: "communities" })}
              </div>
              <div className="mt-1 text-muted-foreground">
                provenance — EXTRACTED {graphStats.provenance.EXTRACTED} · INFERRED{" "}
                {graphStats.provenance.INFERRED} · AMBIGUOUS {graphStats.provenance.AMBIGUOUS}
              </div>
            </div>
          )}
        </section>

        {message && (
          <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
