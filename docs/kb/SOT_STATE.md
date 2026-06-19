# SOT_STATE — Snapshot granulare del sistema (handoff-governed)

> **Ruolo**: snapshot granulare ri-derivato e riscritto dalla skill `handoff` a fine sessione.
> Domini disgiunti: qui stanno TUTTI i numeri/architettura, MAI le priorità (quelle in `.handoff/STATE.md`).
> Backlog → `docs/kb/SOT_BACKLOG.md` · debiti → `docs/kb/DEBT_REGISTER.md` · piano → `plans/fusion-wiki-factory.md`.

## 0. Snapshot in una riga

Fork `Spen-Zosky/llm_wiki_fork` di `nashsu/llm_wiki` v0.4.25 (Tauri v2 Rust + React 19/TS/Vite + LanceDB),
in evoluzione verso engine LLM Wiki unificato (**Route C** fusion: assorbe `wiki-factory` + integra `graphify`,
8 capability, fasi 0-7). Stato: **Phase 0-1 + Phase 2 (2a-2c) shipped**, 1560 test verdi; **Phase 2d-i** è il next.

## Delta S1 (2026-06-19) — fusion kickoff + Phases 0-2c

- **Fork + plan**: forkato nashsu/llm_wiki; scritto `plans/fusion-wiki-factory.md` (Route C, 8 capability, Model B). Commit `21fcb83`, `250ca45`.
- **Phase 0** (`dda6218`): toolchain Rust/Tauri su 3 macchine; build baseline verde — Windows x64 (+ bundle `.msi`/`.exe`), linux-pc x86-64, VM OCI ARM64; app run + `api_server :19828` OK su Windows; `test:mocks` 1524 verdi. Lezione: `protoc` richiesto (LanceDB), link = collo di bottiglia → `cargo build` diretto (memoria `ref_tauri_lancedb_build`).
- **Phase 1** (`f91ad3b`): `engine-version.ts` (`.llm-wiki/engine.json` versioning + `needsMigration`, stamped on create only → vault legacy migratabili); `ingest-cache.ts` schema esteso additivo. +10 test → 1534.
- **Phase 2a** (`5fe96ac`): `dimensions.ts` — 7 assi + `validateDimensions` + `deriveFreshness`. +15 → 1549.
- **Phase 2b** (`e7421fd`): `runDimensionalLint` in `lint.ts` (+ `LintResult.type += "dimensional"`) + UI (`lint-view.tsx`, `typeConfig` icona `Ruler`, label en/zh). +5 → 1554.
- **Phase 2c** (`4b8fa46`): `stampFreshness` agganciato al write-loop di `ingest.ts`. +6 → 1560.
- **Counts S1 (ri-derivati npm/git)**: test 1560 pass (107 files); typecheck 0; HEAD origin/main = `6f4381d` (pre-handoff).

## 1. Git / release

| Item | Valore |
|---|---|
| Repo Windows | `D:\enzospenuso\Documents\GitHub\llm_wiki_fork` |
| Repo VM OCI | `/home/ubuntu/llm_wiki_fork` (ARM64) |
| Repo linux-pc | `/home/enzo/llm_wiki_fork` (x86-64) |
| Remotes | `origin` = Spen-Zosky/llm_wiki_fork · `upstream` = nashsu/llm_wiki |
| Branch / HEAD | `main` synced origin — tip `6f4381d` (pre-handoff S1) |
| Upstream base | `95175ae` (v0.4.25 + CI fix) |
| Fork commits (S1) | `21fcb83 250ca45 f91ad3b dda6218 5fe96ac e7421fd 4b8fa46 6f4381d` |

## 2. Stack (versioni verified)

- Tauri CLI `@tauri-apps/cli` ^2.11 · React 19 · Vite 8 · TypeScript 5.7 · vitest 4
- Vector store: LanceDB (Rust `lance-*`, richiede `protoc`) · editor Milkdown · graph `graphology` + `sigma`
- Build prereqs: Windows (rustup + MSVC Build Tools + WebView2), Linux (`libwebkit2gtk-4.1-dev` + deps + `protobuf-compiler`)
- Node attivo: Windows 24, linux-pc 22, VM 20 (tutti ≥ requisito Vite 8)

## 3. Fusion roadmap (8 capability, fasi 0-7)

| Phase | Scope | Stato |
|---|---|---|
| 0 | Toolchain + build baseline (3 macchine) | ✅ DONE |
| 1 | Engine versioning (`engine.json`) + extensible cache schema | ✅ DONE |
| 2a | Dimensions taxonomy (7 assi) + validate + deriveFreshness | ✅ DONE |
| 2b | Dimensional lint (logica + UI) | ✅ DONE |
| 2c | Freshness stamping all'ingest | ✅ DONE |
| 2d | `## Dimensions` parsing (layer estendibile) + authoring-default prompt + scaffold | ⏳ NEXT |
| 3 | Arbitration (#2) | ☐ |
| 4 | source_mode: linked (#3) | ☐ |
| 5 | Archive cycle + MkDocs export (#5, #6) | ☐ |
| 6 | Graph dual-layer / graphify (#7) | ☐ |
| 7 | Web/served target — Model B, VM central host (#8) | ☐ |

## 4. Codice aggiunto dalla fusione (S1)

- `src/lib/engine-version.ts` (+`.test.ts`) — `.llm-wiki/engine.json` versioning + `needsMigration`; hook in `createProject` only.
- `src/lib/ingest-cache.ts` — schema additivo (`status`/`engineVersion`/`archivedCycle` + `schemaVersion`/`archivalCycles`).
- `src/lib/dimensions.ts` (+`.test.ts`) — 7 assi + `validateDimensions` + `deriveFreshness` + `stampFreshness`.
- `src/lib/lint.ts` — `runDimensionalLint` + union `type += "dimensional"`. (+`lint-dimensional.test.ts`)
- `src/components/lint/lint-view.tsx` + `src/i18n/{en,zh}.json` — UI lint dimensionale.
- `src/lib/ingest.ts` — `stampFreshness` nel write-loop.
- `src/commands/fs.ts` — `ensureEngineMeta` in `createProject`.

## 5. Build & test status

- **Test**: 1524 (baseline) → 1534 (P1) → 1549 (2a) → 1554 (2b) → 1560 (2c). Files 104 → 107. typecheck 0.
- **Build**: verde su Windows (x64 + bundle), linux-pc (x86-64, 61M ELF), VM OCI (ARM64, 54M ELF). Run OK su Windows.
- Vault demo (legacy, no `engine.json`): `C:\Users\enzospenuso\wiki-space\llmwiki-demo\llmwiki-demo`.

## 6. Phase 2d-i — micro-plan (next step, ready)

- `wiki-schema.ts`: estrarre `sectionLines(markdown, headingRegex)` da `pageTypesSectionLines` (non-breaking); aggiungere `parseWikiSchemaDimensions(markdown)` → `{axes: Record<string,string[]>}` (tabella `| axis | v1, v2 |`); `loadProjectWikiSchemaDimensions(projectPath)`.
- `dimensions.ts`: `validateDimensions(fm, opts?: {extraLayers?: readonly string[]})` — `layer` valido = default + extraLayers.
- `lint.ts`: `runDimensionalLint` carica `loadProjectWikiSchemaDimensions`, passa extraLayers.
- Test per i tre. Verifica: `npm run typecheck && npm run test:mocks`.

## 7. Environment / restart

- Build: `protoc` richiesto (LanceDB); `cargo build --release` diretto, link lento (~18-67 min) — mai interrompere. Memoria `ref_tauri_lancedb_build`.
- 3 macchine cloni del repo (Windows/VM/linux-pc); fresh-session entry = `## Session start` in `CLAUDE.md`.

## 8. Key decisions

- **Route C** (full fusion), 8 capability, **Model B** deployment (VM = central web host con IP pubblico; Windows/linux-pc = client browser + desktop nativo). Dipendenza vault-sync segnalata per #8.
- **Additività** over rewrite; minimizzare divergenza da `upstream`.
- `engine.json` stamped **on create only** (open di vault legacy resta migratabile).
- Dimensional lint: finding `error` (valore invalido) → mappati a lint `warning` (union severity UI = warning|info; tier `error` rimandato → vedi `DEBT_REGISTER` D-01).
- `freshness` stamped meccanicamente all'ingest; authoring-default (facet/authority) rimandati all'LLM via prompt (2d-ii).
- `layer` unico asse estendibile per-vault; valori extra additivi ai default.

## 9. Invarianti

- I1 — `npm run typecheck && npm run test:mocks` verdi prima di ogni claim "done".
- I2 — moduli additivi + test co-locato per ogni capability; mai riscrivere `ingest.ts` core.
- I3 — commit atomico per step, push `origin main`; mai `upstream`.
- I4 — `cargo build --release` diretto, mai interrotto durante il link.
