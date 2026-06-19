#!/usr/bin/env python3
"""Path-index generator for llm_wiki_fork (process cloned from heuresys-advanced).

Scans git-tracked files of the fork, classifies each by an ordered prefix table,
and writes the twin path index into docs/kb/:
  - index_paths.yaml  (machine-readable)
  - INDEX_PATHS.md    (human-readable: count tables + per-category listing)

No external deps (stdlib only). Repo root is derived from this file's location,
so it works on every clone (Windows / VM / linux-pc) without hardcoded paths.
Run at session close via the `handoff` skill.
"""
import os
import subprocess
import sys
from datetime import datetime, timezone

REPO = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
KB = os.path.join(REPO, "docs", "kb")

# Ordered (prefix, category, status) rules — first match wins.
RULES = [
    (".handoff/", "handoff-state", "live"),
    ("docs/kb/tools/", "tool", "live"),
    ("docs/kb/", "handoff-state", "live"),
    ("plans/", "plan-doc", "live"),
    ("src-tauri/src/", "rust-source", "live"),
    ("src-tauri/", "rust-config", "live"),
    ("src/i18n/", "i18n", "live"),
    ("src/commands/", "react-source", "live"),
    ("src/lib/", "react-source", "live"),
    ("src/components/", "react-source", "live"),
    ("src/stores/", "react-source", "live"),
    ("src/", "react-source", "live"),
    ("mcp-server/", "mcp-source", "live"),
    ("extension/", "extension-source", "live"),
    ("scripts/", "script", "live"),
    (".github/", "ci", "live"),
]

TEST_SUFFIXES = (".test.ts", ".test.tsx")


def classify(rel):
    r = rel.replace("\\", "/")
    if r.endswith(TEST_SUFFIXES):
        return ("test", "live")
    for prefix, cat, status in RULES:
        if r.startswith(prefix):
            return (cat, status)
    if "/" not in r and r.endswith(".md"):
        return ("doc-canonical", "live")
    return ("config", "live")


def git_files():
    out = subprocess.run(
        ["git", "-C", REPO, "ls-files"], capture_output=True, text=True, check=True
    )
    return [line for line in out.stdout.splitlines() if line.strip()]


def main():
    files = git_files()
    entries = []
    cat_counts, status_counts = {}, {}
    for rel in files:
        cat, status = classify(rel)
        entries.append((cat, rel, status))
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
        status_counts[status] = status_counts.get(status, 0) + 1
    entries.sort(key=lambda e: (e[0], e[1]))
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # ── index_paths.yaml ─────────────────────────────────────────────
    yaml = [
        "# index_paths.yaml - indice percorsi dominio llm_wiki_fork (CLI-owned SoT)",
        f"# generato: {ts} da docs/kb/tools/build_index.py",
        "meta:",
        f'  generated_at: "{ts}"',
        f"  total_files: {len(entries)}",
        f"  repo: '{REPO.replace(os.sep, '/')}'",
        "  category_counts:",
    ]
    for c in sorted(cat_counts):
        yaml.append(f"    {c}: {cat_counts[c]}")
    yaml.append("  status_counts:")
    for s in sorted(status_counts):
        yaml.append(f"    {s}: {status_counts[s]}")
    yaml.append("files:")
    for cat, rel, status in entries:
        yaml.append(f"  - rel: '{rel}'")
        yaml.append(f"    category: {cat}")
        yaml.append(f"    status: {status}")
    with open(os.path.join(KB, "index_paths.yaml"), "w", encoding="utf-8") as f:
        f.write("\n".join(yaml) + "\n")

    # ── INDEX_PATHS.md ───────────────────────────────────────────────
    md = [
        "# INDEX_PATHS - Indice percorsi dominio llm_wiki_fork",
        "",
        f"**Generato**: {ts} - **Tool**: `docs/kb/tools/build_index.py` - **Totale file dominio**: **{len(entries)}**",
        "",
        "> Generato da `git ls-files` (rispetta `.gitignore`). Gemello machine-readable: `index_paths.yaml`.",
        "",
        "## Conteggi per categoria",
        "",
        "| Categoria | File |",
        "|---|---|",
    ]
    for c in sorted(cat_counts):
        md.append(f"| {c} | {cat_counts[c]} |")
    md.append(f"| **TOTALE** | **{len(entries)}** |")
    md += ["", "## Conteggi per status", "", "| Status | File |", "|---|---|"]
    for s in sorted(status_counts):
        md.append(f"| {s} | {status_counts[s]} |")
    md += ["", "## File per categoria", ""]
    cur = None
    for cat, rel, status in entries:
        if cat != cur:
            md.append(f"### {cat}")
            cur = cat
        md.append(f"- `{rel}` - *{status}*")
    with open(os.path.join(KB, "INDEX_PATHS.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(md) + "\n")

    print(f"OK: {len(entries)} file indicizzati")
    print("categories:", dict(sorted(cat_counts.items())))
    print("status:", dict(sorted(status_counts.items())))


if __name__ == "__main__":
    sys.exit(main())
