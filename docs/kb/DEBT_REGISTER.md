# DEBT_REGISTER — Debiti / incoerenze rilevati (CLI-owned)

> Tutti in scope. Quelli operativi sono linkati al `SOT_BACKLOG.md`. Una riga senza `RISOLTO` = ancora aperto.
> **Aggiornato**: 2026-06-19 (S2).

| ID | Sev | Debito | Evidenza | Remediation | Stato |
|---|---|---|---|---|---|
| **D-01** | 🟢 bassa | **Dimensional lint severity**: finding valore-invalido mappati a `warning` (union UI = warning\|info, niente tier `error`) | `lint.ts` `runDimensionalLint`; lint-store/view severity union | tier `error` + UI quando serve | **gestito** (scelta deliberata) |
| **D-02** | ⚪ info | **Demo vault nested path**: `llmwiki-demo/llmwiki-demo` | `C:\Users\enzospenuso\wiki-space\llmwiki-demo\llmwiki-demo` | nessuna; cosmetico | **non-issue**, monitor |
| **D-03** | 🟢 bassa | **package-lock version drift**: lock a 0.4.24 vs package 0.4.25 | `package-lock.json` post `npm install` | allineamento intenzionale futuro (B-17) | **gestito** (restored upstream) |
| **D-04** | 🟢 bassa | **`--no-bundle` ignorato** da `tauri build` Windows | output build S1 | nessuna azione | **non-issue**, monitor |
| **D-05** | 🟡 media | **Phase 7 client non verificabile senza serving**: il fetch-based `fs.ts` adapter + SPA web non è testabile finché non si serve realmente; rinviato di proposito (alto regression-risk sul modulo più importato) | piano Phase 7; design agent | implementare dietro flag + smoke loopback + browser test prima del go-live | **aperto** → B-10 |
| **D-06** | 🟢 bassa | **Rust unit-test non eseguiti S2**: i 2 test in `api_server.rs` (writable gates, loopback) sono compilati solo logicamente (`cargo check`/`build` non compilano `#[cfg(test)]`); mai lanciati | sessione S2 | `cargo test` (B-15) | **aperto** → B-15 |
| **D-07** | 🟢 bassa | **12 warning Rust pre-esistenti** (cli_resolver dead-code platform-specific; fs.rs HTML-parser unused vars). Nessuna nuova dal codice S2 | `cargo check` output S2 | `cargo fix --lib` quando opportuno | **monitor** |
| **D-08** | 🟢 bassa | **Phase 7 swap binario bloccato da app in esecuzione**: `cargo build --release` fallisce la copy se un'istanza `llm-wiki.exe` tiene il lock (os error 5). S2: terminata istanza stale PID 15472 (da Phase 0) | build S2 | chiudere l'app prima del rebuild; o build su path separato | **gestito** (procedura nota) |

## Sintesi scope

- **Trattati in S2**: D-05, D-06, D-07, D-08 (nuovi, registrati); D-01..D-04 confermati.
- **Risolti**: nessuno chiuso (D-01/D-03 gestiti, D-02/D-04 non-issue).
- **In backlog operativo**: D-05→B-10, D-06→B-15, D-07→backlog candidati, D-03→B-17.
> Nessun debito scartato. Ogni riga ha owner (CLI) e remediation.
