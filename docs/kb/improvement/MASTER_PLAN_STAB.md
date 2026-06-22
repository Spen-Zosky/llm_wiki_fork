# MASTER_PLAN_STAB — Piano di Stabilizzazione llm_wiki_fork

> **Generato**: S-STAB-0 · 2026-06-22
> **Obiettivo**: chiudere tutti i gap, debiti e incompletezze esistenti dentro questo repo
> prima di aggiungere funzionalità o integrazioni nuove. Scope monolitico.

---

## 1. Visione

llm_wiki_fork deve raggiungere uno stato in cui:
- ogni funzionalità spedita (Phases 0–7-server) è completa, testata e documentata
- nessun debito tecnico aperto è CRITICAL o HIGH
- le gate di qualità (typecheck + test suite + cargo test) passano in CI su tutte e 3 le macchine
- un nuovo ciclo di sviluppo può partire senza rischio di regressioni sulla base esistente

**Non è in scope**: nuove funzionalità, integrazioni con altri sistemi, go-live pubblico (gated umano).

---

## 2. Criteri di successo (misurabili)

| Criterio | Soglia | Verifica |
|---|---|---|
| TypeScript typecheck | 0 errori | `npm run typecheck` |
| Test suite | ≥1609 pass, 0 fail, 0 skip involontari | `npm run test:mocks` |
| Rust unit test | pass (2 test api_server.rs + tutti i test esistenti) | `cargo test` |
| Debiti aperti CRITICAL/HIGH | 0 | DEBT_REGISTER.md |
| Backlog gap B-10..B-18 | chiusi o DEFERRED con motivazione | TODO_STAB.md |
| CROSS_PROJECT_FUTURE.md | compilato con tutti i candidati rilevati | file presente |
| Documentazione | Phases 2d-7 riflesse in README + docs/kb | WS-I audit |

---

## 3. Assi di stabilizzazione

1. **Completezza funzionale** — chiudere Phase 7 client (B-10, B-11) e le rifinitura P2 (B-13, B-14, B-16)
2. **Qualità del codice** — zero errori TS, zero errori Rust, warning ridotti (D-07)
3. **Copertura test** — cargo test (D-06), gap moduli P2d-7 (WS-F), B-18 pianificati
4. **Documentazione** — drift vs codice chiuso (WS-I), build-notes aggiornate (WS-J)
5. **Sicurezza & supply chain** — audit npm/cargo (WS-G/WS-H)
6. **Repo hygiene** — dead code, unused deps, footprint (WS-A, WS-K)

---

## 4. Ciclo di sessioni

```
S-STAB-0  (questa)  — recon + grounding + piano + todo + protocollo  [DONE]
S-STAB-A1           — WS-A (architettura) + WS-K (hygiene) + WS-I (doc)
S-STAB-A2           — WS-M (Rust/Tauri) + WS-C (LanceDB)
S-STAB-A3           — WS-F (test & QA) + WS-G (CI/CD) + WS-H (security)
S-STAB-A4           — WS-B (ingest & backend TS)
S-STAB-A5           — WS-D (frontend) + WS-E (design/UX)
S-STAB-A6           — WS-J (config/env) + WS-N (graphify ecosystem)
S-STAB-C            — sintesi cross-WS + dossier finali + decision gate utente
S-STAB-E1           — esecuzione epic: Phase 7 client (B-10, B-11)  [P1]
S-STAB-E2           — esecuzione epic: rifinitura P2 (B-13, B-14, B-16)
S-STAB-E3           — esecuzione epic: debt + hygiene (D-06, D-07, B-15, B-17)
S-STAB-E4           — esecuzione epic: doc + CI + security (WS-I, WS-G, WS-H)
```

Ogni sessione: leggi `MASTER_PLAN_STAB.md` + `TODO_STAB.md` + `AUDIT_PROTOCOL.md` prima di qualsiasi azione.

---

## 5. Sequenza WS con dipendenze

```
WS-A ──┐
WS-I ──┤
WS-K ──┘ → (input per tutti gli altri)

WS-M ──┐
WS-C ──┘ → WS-H (security audit usa cargo audit)

WS-A ──→ WS-B (mapping moduli)
WS-A ──→ WS-D (frontend dopo architettura)
WS-A ──→ WS-F (coverage mapping)
WS-D ──→ WS-E (design dopo bundle analysis)
WS-G ──→ WS-H (CI prima di security audit)
WS-N (autonomo, con input da WS-I per doc)
WS-J (autonomo)
```

Sessioni A1-A3 priorità: lanciano WS early-no-dep prima, poi WS con dipendenze.

---

## 6. Gate decisionali (CLASSE B — decide Enzo)

- **B-12 go-live**: bind 0.0.0.0 + TLS + OCI ingress — non entra nella stabilizzazione
- Qualsiasi dossier che propone breaking change architetturali (runtime, data layer, design system)
- Qualsiasi finding che richiede toccare oggetti trasversali (`~/.claude/`) → CROSS_PROJECT_FUTURE.md

---

## 7. Invarianti (da rispettare in ogni sessione di esecuzione)

- I1: typecheck 0 + test ≥1609 verdi **prima** di ogni claim "done"
- I2: moduli additivi + test co-locati; mai riscrivere `ingest.ts` core
- I3: commit atomico, push origin/main; mai upstream
- I4: `cargo build --release` diretto, mai interrotto durante il link
