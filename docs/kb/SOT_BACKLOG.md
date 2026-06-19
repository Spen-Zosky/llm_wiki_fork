# SOT_BACKLOG — Azioni da riprendere (CLI-owned)

> Pendings + azioni pianificate da cui ripartire. Domini disgiunti: niente numeri di stato qui (→ `SOT_STATE.md`).
> **Aggiornato**: 2026-06-19 (S1 — fusion kickoff).

## 🟢 Aggiornamento S1 (2026-06-19) — fusion kickoff + Phases 0-2c

- **DONE-LIVE**: Phase 0 (build 3 macchine), Phase 1 (engine versioning + cache schema), Phase 2a/2b/2c (dimensions + lint + freshness stamping). Tutto su `origin main`.
- **RESIDUO OPEN**: Phase 2d (i/ii/iii), Phase 3-7. Vedi sotto.

## P1 — Sviluppo programmato (next)

| ID | Azione | Effort | Entry point |
|---|---|---|---|
| **B-01** | **Phase 2d-i** — `## Dimensions` parsing in `schema.md` → `layer` estendibile per-vault | S-M | `SOT_STATE.md` §6; `wiki-schema.ts`, `dimensions.ts`, `lint.ts` |
| **B-02** | **Phase 2d-ii/iii** — authoring-default nel prompt di generazione + `## Dimensions` nello scaffold | S | `ingest.ts` (buildGenerationPrompt); Rust `project.rs` |

## P2 — Roadmap fusione (capability successive)

| ID | Azione | Effort | Entry point |
|---|---|---|---|
| **B-03** | **Phase 3 — Arbitration (#2)** — conflict resolution strutturato | L | `page-merge.ts` (`mergePageContent`/`MergeFn`) + write-loop; `review-store` |
| **B-04** | **Phase 4 — source_mode: linked (#3)** — ingest repo git in-place | M | `source-lifecycle.ts`, `source-identity.ts` |
| **B-05** | **Phase 5 — Archive cycle + MkDocs export (#5, #6)** | L | nuovi `archive-snapshot.ts` / `export-mkdocs.ts` + Rust `tar`/`flate2` |
| **B-06** | **Phase 6 — Graph dual-layer / graphify (#7)** | M | integrazione via `cli_resolver.rs` / MCP server graphify |
| **B-07** | **Phase 7 — Web/served target (#8, Model B: VM host)** | L | estendere `api_server.rs` + `fetch`-based `fs.ts` + serve SPA; ⛔ security (auth/TLS/ingress) |

## P3 — Operativo / robustezza

| ID | Azione | Effort | Note |
|---|---|---|---|
| **B-08** | Configurare Claude CLI come provider LLM nell'app | S | runtime config (Settings); serve prima del test ingest live |
| **B-09** | Generare `INDEX_PATHS.md` a ogni handoff | S | `docs/kb/tools/build_index.py` |

## Candidati futuri / da valutare

- 2d: la sezione `## Dimensions` potrebbe anche restringere i 6 assi fissi? (attuale: no, fissi cross-vault).
- Test E2E (Playwright) per i nuovi flussi UI lint dimensionale.
- Allineare il `version` nel `package-lock.json` a 0.4.25 (oggi lasciato come upstream — vedi D-03).
