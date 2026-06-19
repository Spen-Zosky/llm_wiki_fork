# llm_wiki_fork — Fusion Project (Enzo Spenuso)

Fork of `nashsu/llm_wiki` (v0.4.25) being evolved into a unified **LLM Wiki engine**
("Route C" fusion): it absorbs the unique capabilities of `wiki-factory` and
integrates `graphify`. Remotes: `origin` = `Spen-Zosky/llm_wiki_fork`,
`upstream` = `nashsu/llm_wiki`. Stack: Tauri v2 (Rust) + React 19/TS/Vite + LanceDB.

## Source of Truth (single per domain — do not duplicate)

State-tracking process cloned from `heuresys-advanced` (disjoint domains, single
writer = the `handoff` skill):

- **Rapid view** (priorities + open questions, NO numbers) → `.handoff/STATE.md`
- **Granular snapshot** (versions, counts, architecture, milestone log) → `docs/kb/SOT_STATE.md`
- **Open backlog** (action items) → `docs/kb/SOT_BACKLOG.md`
- **Technical debts** → `docs/kb/DEBT_REGISTER.md`
- **Durable rules / conventions** → this `CLAUDE.md`
- **Path index** (generated) → `docs/kb/INDEX_PATHS.md` (+ `index_paths.yaml`)
- **Full fusion plan** → `plans/fusion-wiki-factory.md`
- **Technical references** → `docs/kb/dimensions-taxonomy.md` (7-axis spec) · `docs/kb/architecture-map.md` (llm_wiki internals + injection points + fusion rationale) · `docs/kb/build-notes.md` (toolchain + build gotchas)

Do NOT create other state/handoff/entry-point files.

## Session start (do this first, every session)

Before asking what to do or starting work, build the action menu from all live
sources so the user picks from a complete list — never from memory:

1. **Read** the action sources: `.handoff/STATE.md` (priorities + open questions),
   `docs/kb/SOT_BACKLOG.md` (items NOT `✅ DONE`/`✅ FATTO`/`⚪ WON'T-DO`),
   `docs/kb/DEBT_REGISTER.md` (debts NOT `RISOLTO`),
   `docs/kb/SOT_STATE.md` roadmap / §"Prossimo".
2. **Aggregate** into ONE priority-tiered menu — P1 high-impact/unblocking · P2
   quality/debt · P3 roadmap/gated. Each row: `# · short title · [source] ·
   gating (⛔ reason if blocked) · effort (~Xh)`. Map markers: DEBT 🔴→P1 /
   🟡→P2 / 🟢→P3; backlog P-tiers; STATE top-priorities.
3. **Exclude** concluded work (DONE/FATTO/RISOLTO/WON'T-DO).
4. **Present** the menu, then: "Scegli #, aggrega (es. 1+4), o nuovo."

(If the user's first message already names a task, do that instead.)

## Working conventions

- **Additive over rewrite** — each capability lands as new files in `src/lib/`
  where possible, hooking into existing extension points; never rewrite the
  `ingest.ts` core. Minimize merge conflicts with `upstream`.
- **Test-first / co-located** — every module has a `<feature>.test.ts` (vitest).
  Gate each step on `npm run typecheck && npm run test:mocks` before claiming done.
- **Commit per step** — small atomic conventional commits, push to `origin main`
  after each green step.
- **Build** — `cargo build --release` run directly and never interrupted (the
  final link is the bottleneck, ~18–67 min); `protoc` required (LanceDB). See
  memory `ref_tauri_lancedb_build`.
- Language: Italian conversation, English code/docs.

## Session close

Use the `handoff` skill: rewrites `.handoff/STATE.md` + `docs/kb/SOT_STATE.md`,
aligns `SOT_BACKLOG.md` / `DEBT_REGISTER.md`, regenerates `INDEX_PATHS.md` via
`docs/kb/tools/build_index.py`, then commits + pushes to `origin main`. No PR, no snapshots.
