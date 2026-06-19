# SOT_BACKLOG — Azioni da riprendere (CLI-owned)

> Pendings + azioni pianificate da cui ripartire. Domini disgiunti: niente numeri di stato qui (→ `SOT_STATE.md`).
> **Aggiornato**: 2026-06-19 (S2 — fusion sweep).

## 🟢 Aggiornamento S2 (2026-06-19) — Phases 2d→7

- **DONE-LIVE**: Phase 2d (B-01, B-02), Phase 3 (B-03), Phase 4 (B-04), Phase 5 (B-05), Phase 6 (B-06),
  Phase 7 **server-side** (B-07 parziale). B-08 già cablato (verificato), B-09 automatizzato dall'handoff.
- **RESIDUO OPEN**: Phase 7 client SPA + go-live; UI management linked-sources; overlay graphify sigma; `cargo test`.

## ✅ DONE (S2)

| ID | Azione | Commit |
|---|---|---|
| **B-01** | Phase 2d-i — `## Dimensions` parsing → `layer` estendibile | `5fb0bfa` |
| **B-02** | Phase 2d-ii/iii — authoring-default prompt + scaffold | `5fb0bfa` |
| **B-03** | Phase 3 — Arbitration (conflict resolution a/b/c/d) | `2d3ce22` |
| **B-04** | Phase 4 — source_mode: linked (in-place, flag OFF) | `49e1019` |
| **B-05** | Phase 5 — Archive cycle + MkDocs export + Export view | `e80c5af` |
| **B-06** | Phase 6 — graphify dual-layer (live invoke + consume) | `9192a87` |
| **B-08** | Claude CLI provider — **già cablato** end-to-end (`provider:"claude-code"`); è toggle Settings, non codice | (verified) |
| **B-09** | Generare `INDEX_PATHS.md` a ogni handoff — automatizzato | (handoff) |

## P1 — Phase 7 completamento (next)

| ID | Azione | Effort | Entry point |
|---|---|---|---|
| **B-10** | **Phase 7 client SPA** — fetch-based `fs.ts` adapter (runtime selector + http-fs-adapter), `embedding.ts`/`llm-client.ts` web variants, `build:web` script + vite `__WEB_BUILD__` | L | `src/commands/fs.ts`, nuovo `src/lib/runtime.ts`, `package.json`, `vite.config.ts` |
| **B-11** | **Phase 7 server completamento** — chat/LLM-exec proxy (sostituire 501 con reqwest, host-allowlist), vector upsert/delete endpoints (`vectorstore` `_inner`) | M | `api_server.rs:268` (chat seam), `commands/vectorstore.rs` |
| **B-12** | **Phase 7 GO-LIVE (⛔ human-gated, Enzo)** — TLS (Caddy/nginx + Let's Encrypt), reverse proxy `dist/`+`/api/`, `LLM_WIKI_API_BIND`, OCI ingress 443, vault sync channel (git `wiki/` + rsync `raw/`) | L | VM ops (non-repo) |

## P2 — Rifinitura capability shippate

| ID | Azione | Effort | Note |
|---|---|---|---|
| **B-13** | linked-sources: pannello UI unlink/refresh per-source | S | `sources-view.tsx` (Link button + engine già pronti) |
| **B-14** | graphify: overlay del layer nel sigma `graph-view.tsx` | M | `graph-view.tsx:593` (`buildWikiGraph`); consume-layer + Export stats pronti |
| **B-15** | Eseguire `cargo test` (i 2 unit-test Rust in `api_server.rs` non lanciati S2) | S | `~/.cargo/bin/cargo.exe test --manifest-path src-tauri/Cargo.toml` |
| **B-16** | Archive: lifecycle gated-removal (mark `status:archived` + prune); MinerU/binari in web-mode | M | `archive-snapshot.ts`, `ingest-cache.ts` (campi già presenti) |

## P3 — Operativo / robustezza

| ID | Azione | Effort | Note |
|---|---|---|---|
| **B-17** | Allineare `package-lock.json` version a 0.4.25 | S | vedi D-03 |
| **B-18** | Test E2E (Playwright) per i nuovi flussi UI (lint dimensionale, arbitration, export) | M | — |

## Candidati futuri / da valutare

- 2d: la sezione `## Dimensions` potrebbe anche restringere i 6 assi fissi? (attuale: no — confermato S2).
- Ripulire le 12 warning Rust pre-esistenti (`cargo fix`) — vedi D-04bis.
