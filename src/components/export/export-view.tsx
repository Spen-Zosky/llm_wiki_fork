import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Archive, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWikiStore } from "@/stores/wiki-store"
import { normalizePath } from "@/lib/path-utils"
import { exportMkDocs } from "@/lib/export-mkdocs"
import { archiveSnapshot } from "@/lib/archive-snapshot"

export function ExportView() {
  const { t } = useTranslation()
  const project = useWikiStore((s) => s.project)
  const [busy, setBusy] = useState<"mkdocs" | "archive" | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
