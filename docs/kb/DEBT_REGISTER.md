# DEBT_REGISTER — Debiti / incoerenze rilevati (CLI-owned)

> Tutti in scope. Quelli operativi sono linkati al `SOT_BACKLOG.md`. Una riga senza `RISOLTO` = ancora aperto.
> **Aggiornato**: 2026-06-19 (S1).

| ID | Sev | Debito | Evidenza | Remediation | Stato |
|---|---|---|---|---|---|
| **D-01** | 🟢 bassa | **Dimensional lint severity**: i finding di valore-invalido (spec: "validation error") sono mappati a `warning` perché la union severity del lint UI è `warning\|info` | `lint.ts` `runDimensionalLint`; `lint-store`/`lint-view` severity union | Aggiungere un tier `"error"` alla severity + UI (colore/raggruppamento) quando serve | **gestito** (scelta deliberata, tier `error` rimandato) |
| **D-02** | ⚪ info | **Demo vault nested path**: il New Project ha creato `llmwiki-demo/llmwiki-demo` (parent scelto = nome) | `C:\Users\enzospenuso\wiki-space\llmwiki-demo\llmwiki-demo` | Nessuna; cosmetico, vault valido | **non-issue**, monitor |
| **D-03** | 🟢 bassa | **package-lock version drift**: il lock upstream è a `version 0.4.24` mentre `package.json` è 0.4.25; `npm install` lo riscrive | `package-lock.json` diff post `npm install` | Lasciato come upstream (ripristinato) per non divergere; eventuale allineamento intenzionale futuro (B candidato) | **gestito** (restored to upstream) |
| **D-04** | 🟢 bassa | **`--no-bundle` ignorato** da `tauri build` su Windows (ha prodotto comunque `.msi`/NSIS) | output build Windows S1 | Nessuna azione necessaria (bundle è un bonus); verificare se serve build compile-only in futuro | **non-issue**, monitor |

## Sintesi scope

- **Trattati in S1**: D-01, D-02, D-03, D-04 (registrati).
- **Risolti**: nessuno (debiti minori, tutti gestiti/non-issue).
- **In backlog operativo**: D-01 (tier error UI, se servirà), D-03 (allineamento version, candidato).
> Nessun debito scartato. Ogni riga ha owner (CLI) e remediation.
