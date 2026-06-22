# TODO_STAB — Backlog machine-checkable del programma di stabilizzazione

> Formato: `[ ] S-STAB-?? | WS | task | gate di verifica | stato`
> Aggiornato: S-STAB-0 · 2026-06-22

---

## P0 — Setup programma (questa sessione)

- [x] S-STAB-00 | SETUP | Generare kickoff prompt parametrizzato | file presente | DONE
- [x] S-STAB-01 | SETUP | Step Zero grounding live (git, typecheck, test, cargo check) | tutti pass | DONE
- [x] S-STAB-02 | SETUP | Decisioni CLASSE A prese (no delega utente) | documentate in INTERVIEW_LOG | DONE
- [x] S-STAB-03 | SETUP | Creare docs/kb/improvement/ con deliverable S-STAB-0 | file presenti | DONE (questa scrittura)
- [ ] S-STAB-04 | SETUP | Aggiornare SOT_BACKLOG.md con epic S-STAB | backlog aggiornato | PENDING
- [ ] S-STAB-05 | SETUP | Commit doc-only + push origin/main | git log conferma | PENDING

---

## P1 — Phase 7 completamento (S-STAB-E1)

- [ ] S-STAB-E1-01 | B-10 | Runtime selector `src/lib/runtime.ts` (tauri vs web) | typecheck 0 | TODO
- [ ] S-STAB-E1-02 | B-10 | Fetch-based `src/commands/fs.ts` adapter (http-fs-adapter, web variant) | typecheck 0 + test | TODO
- [ ] S-STAB-E1-03 | B-10 | `embedding.ts` / `llm-client.ts` web variants | typecheck 0 + test | TODO
- [ ] S-STAB-E1-04 | B-10 | `build:web` script + vite `__WEB_BUILD__` flag | `npm run build:web` exit 0 | TODO
- [ ] S-STAB-E1-05 | B-11 | Chat/LLM-exec proxy endpoint (reqwest, host-allowlist) sostituisce 501 | cargo test pass | TODO
- [ ] S-STAB-E1-06 | B-11 | Vector upsert/delete endpoints (`vectorstore._inner`) | cargo test pass | TODO
- [ ] S-STAB-E1-07 | B-10 | Smoke test loopback SPA (browser o headless) | funziona su 127.0.0.1 | TODO

---

## P2 — Rifinitura capability (S-STAB-E2)

- [ ] S-STAB-E2-01 | B-13 | linked-sources UI: pannello unlink/refresh per-source in `sources-view.tsx` | typecheck 0 + test | TODO
- [ ] S-STAB-E2-02 | B-14 | graphify sigma overlay in `graph-view.tsx` (consume layer) | render visibile in app | TODO
- [ ] S-STAB-E2-03 | B-16 | Archive lifecycle gated-removal (mark `status:archived` + prune) | typecheck 0 + test | TODO

---

## P3 — Debt & hygiene (S-STAB-E3)

- [ ] S-STAB-E3-01 | D-06/B-15 | Eseguire `cargo test` e documentare risultato | 2 test api_server.rs pass | IN PROGRESS (S-STAB-0)
- [ ] S-STAB-E3-02 | D-07 | `cargo fix --lib` (2 suggerimenti automatici) + classifica remaining 10 warning | 0 suggerimenti automatici pending | TODO
- [ ] S-STAB-E3-03 | B-17 | Allineare `package-lock.json` version a 0.4.25 | lock e package.json coerenti | TODO
- [ ] S-STAB-E3-04 | WS-A | Dead code removal (ts-prune / depcheck findings) | typecheck 0 + test | TODO
- [ ] S-STAB-E3-05 | WS-K | Repo hygiene: file morti, gitignore, assets | nessun file morto in src/ | TODO

---

## P3 — Documentazione & test pianificati (S-STAB-E4)

- [ ] S-STAB-E4-01 | WS-I | README aggiornato per Phases 2d-7 | sezioni complete | TODO
- [ ] S-STAB-E4-02 | WS-I | `docs/kb/build-notes.md`: `LLM_WIKI_API_BIND` + graphify path | documentati | TODO
- [ ] S-STAB-E4-03 | WS-J | `.env.example` completo con tutte le var | file presente e completo | TODO
- [ ] S-STAB-E4-04 | WS-G | CI workflow: verifica caching + durata baseline | gh run list mostra | TODO
- [ ] S-STAB-E4-05 | WS-H | `npm audit --audit-level=high` + `cargo audit` → zero HIGH/CRITICAL | audit exit 0 o fix applicati | TODO
- [ ] S-STAB-E4-06 | B-18 | Piano E2E test Playwright: architettura + scenari (no implementazione) | documento piano | TODO

---

## Sessioni di audit (producono FINDINGS/ e DOSSIERS/)

- [ ] S-STAB-A1 | WS-A + WS-K + WS-I | Audit architettura, hygiene, doc | FINDINGS/WS-A.md etc. | TODO
- [ ] S-STAB-A2 | WS-M + WS-C | Audit Rust/Tauri + LanceDB | FINDINGS/WS-M.md etc. | TODO
- [ ] S-STAB-A3 | WS-F + WS-G + WS-H | Audit test, CI, security | FINDINGS/WS-F.md etc. | TODO
- [ ] S-STAB-A4 | WS-B | Audit ingest & backend TS | FINDINGS/WS-B.md | TODO
- [ ] S-STAB-A5 | WS-D + WS-E | Audit frontend + design | FINDINGS/WS-D.md etc. | TODO
- [ ] S-STAB-A6 | WS-J + WS-N | Audit config/env + graphify | FINDINGS/WS-J.md etc. | TODO
- [ ] S-STAB-C  | CONSOLIDAMENTO | Sintesi cross-WS + dossier finali | DOSSIERS/ completati | TODO

---

## DEFERRED (fuori scope stabilizzazione)

- [ ] S-STAB-DEFER-01 | B-12 | Phase 7 go-live (TLS, OCI ingress, vault sync) | human-gated Enzo | DEFERRED
- [ ] S-STAB-DEFER-02 | WS-L | Ecosistema Claude (CLAUDE.md, skills, memory) | cross-project scope | DEFERRED
- [ ] S-STAB-DEFER-03 | B-18 | E2E test Playwright implementazione | dopo stabilizzazione | DEFERRED → pianificato P3
