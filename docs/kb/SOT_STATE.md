# SOT_STATE — Snapshot granulare del sistema (handoff-governed)

> **Ruolo**: snapshot granulare ri-derivato e riscritto dalla skill `handoff` a fine sessione.
> Domini disgiunti: qui stanno TUTTI i numeri/architettura, MAI le priorità (quelle in `.handoff/STATE.md`).
> Backlog → `docs/kb/SOT_BACKLOG.md` · debiti → `docs/kb/DEBT_REGISTER.md` · piano → `plans/fusion-wiki-factory.md`.

## 0. Snapshot in una riga

Fork `Spen-Zosky/llm_wiki_fork` di `nashsu/llm_wiki` v0.4.25 (Tauri v2 Rust + React 19/TS/Vite + LanceDB),
engine LLM Wiki unificato (**Route C** fusion, 8 capability, fasi 0-7). Stato: **Phase 0-1-2 + 3 + 4 + 5 + 6 +
7-server shipped**; 1609 test verdi; `cargo build --release` verde. Resta: Phase 7 client SPA + go-live (gated).

## Delta S2 (2026-06-19) — fusion sweep Phases 2d→7

- **Phase 2d** (`5fb0bfa`): `## Dimensions` in `schema.md` → `layer` estendibile per-vault (additivo).
  `wiki-schema.ts` (`sectionLines`, `parseWikiSchemaDimensions`, `loadProjectWikiSchemaDimensions`);
  `dimensions.ts` `validateDimensions(fm, {extraLayers})`; `lint.ts` carica le estensioni; `ingest.ts`
  authoring-default 7 assi nel prompt; Rust `project.rs` scaffold `## Dimensions`. +8 test.
- **Phase 3** (`2d3ce22`): `arbitration.ts` (detectConflict guards + LLM judge iniettato; 4 path a/b/c/d;
  `applyArbitration` → record in `wiki/_arbitrations/`); hook post-merge in `ingest.ts` write-loop +
  `buildConflictJudge`; `ReviewItem.conflict?`; dispatcher `arbitrate:` in `review-view.tsx`. +14 test.
- **Phase 4** (`49e1019`): `source_mode: linked` — `linked-sources.ts` (registry `.llm-wiki/linked-sources.json`,
  register/refresh/unlink in-place, NO copy); `source-identity.ts` `linkedRoots` → `linked/<label>/<rel>`;
  `autoIngestImpl` risolve l'identity linked (dynamic import, no cycle); flag `linkedSourcesEnabled` (OFF).
  Zero Rust. +15 test.
- **Phase 5** (`e80c5af`): `export-mkdocs.ts` (pure TS) + `archive-snapshot.ts` + Rust `archive_snapshot`
  (zip+walkdir) + `ingest-cache` `appendArchivalCycle`; nuova **Export view**. +6 test.
- **Phase 6** (`9192a87`): `graphify-graph.ts` (parse node-link graph.json, provenance EXTRACTED/INFERRED/
  AMBIGUOUS, communities) + Rust `graphify_run` (shell-out CLI via cli_resolver) + card in Export view. +7 test.
- **Phase 7 server** (`c9653e5`): `api_server.rs` write endpoints (POST files/content|mkdir|delete, atomic,
  gate `writeEnabled` default OFF → 403, `is_writable_project_rel`, invariante: rifiuta write se
  `allowUnauthenticated`), bind flag `LLM_WIKI_API_BIND` (default 127.0.0.1), `/health` writeEnabled+bind. +2 test Rust.
- **Counts S2 (ri-derivati npm/git)**: test 1609 pass (112 files); typecheck 0; HEAD origin/main = `c9653e5` (pre-handoff).
  `cargo check` 0 errori; `cargo build --release` verde (binario `llm-wiki.exe` 77MB, 2026-06-19).

## 1. Git / release

| Item | Valore |
|---|---|
| Repo Windows | `D:\enzospenuso\Documents\GitHub\llm_wiki_fork` |
| Repo VM OCI | `/home/ubuntu/llm_wiki_fork` (ARM64) · Repo linux-pc `/home/enzo/llm_wiki_fork` (x86-64) |
| Remotes | `origin` = Spen-Zosky/llm_wiki_fork · `upstream` = nashsu/llm_wiki |
| Branch / HEAD | `main` synced origin — tip `c9653e5` (pre-handoff S2) |
| Fork commits (S2) | `5fb0bfa 2d3ce22 49e1019 e80c5af 9192a87 c9653e5` |

## 2. Stack (versioni verified)

- Tauri CLI ^2.11 · React 19 · Vite 8 · TypeScript 5.7 · vitest 4 · package version 0.4.25
- Vector store LanceDB (richiede `protoc`); zip crate `zip = "2"` + `walkdir = "2"` (usati da archive); editor Milkdown; graph `graphology`+`sigma`
- Build prereqs: Windows (rustup + MSVC + WebView2 + `protoc` via chocolatey); cargo @ `~/.cargo/bin/cargo.exe`
- External tool: `graphifyy` v0.8.14 installato (uv tool); CLI `graphify` in `~/.local/bin` (shell-out, no bundling)

## 3. Fusion roadmap (8 capability, fasi 0-7)

| Phase | Scope | Stato |
|---|---|---|
| 0 | Toolchain + build baseline (3 macchine) | ✅ DONE |
| 1 | Engine versioning + extensible cache schema | ✅ DONE |
| 2a-2c | Dimensions taxonomy + lint + freshness stamping | ✅ DONE |
| 2d | `## Dimensions` layer estendibile + authoring prompt + scaffold | ✅ DONE (S2) |
| 3 | Arbitration (conflict resolution a/b/c/d) | ✅ DONE (S2) |
| 4 | source_mode: linked (in-place, flag OFF) | ✅ DONE (S2) |
| 5 | Archive cycle + MkDocs export | ✅ DONE (S2) |
| 6 | Graph dual-layer / graphify (live invoke + consume) | ✅ DONE (S2) |
| 7 | Web/served target — Model B | ⏳ server-side DONE (S2); client SPA + go-live PENDING |

## 4. Codice aggiunto dalla fusione (S2)

- `src/lib/arbitration.ts` (+test), `src/lib/linked-sources.ts` (+test), `src/lib/export-mkdocs.ts` (+test),
  `src/lib/archive-snapshot.ts` (+test), `src/lib/graphify-graph.ts` (+test)
- `src/components/export/export-view.tsx` (nuova view: MkDocs + Archive + graphify card)
- Estesi: `wiki-schema.ts`, `dimensions.ts`, `lint.ts`, `ingest.ts`, `source-identity.ts`, `source-lifecycle.ts`,
  `ingest-cache.ts`, `source-watch-config.ts`, `review-store.ts`, `review-view.tsx`, `sources-view.tsx`,
  `settings/sections/source-watch-section.tsx`, `wiki-store.ts`, `commands/fs.ts`, i18n en/zh, layout (content-area, icon-sidebar)
- Rust: `commands/fs.rs` (`archive_snapshot`, `graphify_run`), `commands/project.rs` (`## Dimensions` scaffold),
  `api_server.rs` (write endpoints + bind flag + posture + 2 test), `lib.rs` (handler registration)

## 5. Build & test status

- **Test**: 1560 (baseline S1) → 1568 (2d) → 1582 (3) → 1596 (4) → 1602 (5) → 1609 (6/7). Files 107 → 112. typecheck 0.
- **Rust**: `cargo check` 0 errori (warning pre-esistenti: cli_resolver dead-code platform + fs.rs HTML-parser unused vars; nessuna nuova dal codice S2). `cargo build --release` verde (21min, binario fresco).
- **Non eseguito S2**: `cargo test` (i 2 unit-test Rust nuovi in `api_server.rs` non sono stati lanciati — `build`/`check` non compilano `#[cfg(test)]`).

## 6. Note tecniche chiave

- **graphify**: `graph.json` prodotto da (a) CLI `graphify update <dir>` (code-AST, no-LLM — ciò che invoca `graphify_run`) o (b) skill `/graphify` completa (semantic, agent-orchestrated). Il consume-layer (`graphify-graph.ts`) legge entrambi.
- **Phase 7 invariante security**: write/mutazioni rifiutate se `allowUnauthenticated=true`; default loopback + write OFF; lo swap del binario richiede che nessuna istanza dell'app sia in esecuzione (lock Windows).
- **linked-sources**: identity `linked/<label>/<rel>` round-trippa via `sourceReferenceIdentity` → delete-cascade match; unlink usa `deleteSourceFiles(..., fileAlreadyDeleted:true)` (mai cancella i file esterni).

## 7. Environment / restart

- Build: `protoc` richiesto; `cargo build --release` diretto, link lento (~18-67 min) — mai interrompere. `cargo check` salta il link (validazione veloce). Memoria `ref_tauri_lancedb_build`.
- 3 macchine cloni del repo (Windows/VM/linux-pc); fresh-session entry = `## Session start` in `CLAUDE.md`.

## 8. Key decisions

- **Route C** full fusion, **Model B** deployment (VM central web host; Windows/linux-pc client browser + desktop nativo).
- Additività over rewrite; mai riscrivere `ingest.ts`/`mergePageContent` core — hook points.
- `layer` unico asse estendibile per-vault (decisione 2d); 6 assi fissi cross-vault.
- Arbitration: `mergePageContent` congelato, detection post-merge; contradictions mai auto-risolte (sweep le tiene pending).
- linked-sources: registry (no symlink OS); feature-flag OFF; importer copy-based intatti.
- archive: riuso crate `zip` (no nuovo `tar`/`flate2`); snapshot+record v1 (gated-removal deferito).
- Phase 7: codice server additivo, default-OFF/loopback; **go-live (esposizione IP pubblico) = decisione umana di Enzo**.

## 9. Invarianti

- I1 — `npm run typecheck && npm run test:mocks` verdi prima di ogni claim "done".
- I2 — moduli additivi + test co-locato per ogni capability; mai riscrivere `ingest.ts` core.
- I3 — commit atomico per step, push `origin main`; mai `upstream`.
- I4 — `cargo build --release` diretto, mai interrotto durante il link; `cargo check` per validazione veloce.
