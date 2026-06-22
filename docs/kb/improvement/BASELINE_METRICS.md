# BASELINE_METRICS — Misure baseline (S-STAB-0)

> Misurato: 2026-06-22 · Sessione S-STAB-0
> Tutti i dati sono riproducibili con i comandi indicati.
> Aggiornare a ogni sessione Ax se le metriche cambiano.

---

## 1. Toolchain

| Tool | Versione | Comando verifica |
|---|---|---|
| Node.js | v24.3.0 | `node --version` |
| rustc | 1.96.0 (ac68faa20 2026-05-25) | `rustc --version` |
| protoc | 35.1 | `protoc --version` |
| npm | (da node v24.3.0) | `npm --version` |
| cargo | (da rustc 1.96.0) | `~/.cargo/bin/cargo.exe --version` |

---

## 2. Gate di qualità

| Gate | Risultato | Durata | Comando |
|---|---|---|---|
| typecheck | ✅ 0 errori | ~5s | `npm run typecheck` |
| test:mocks | ✅ 1609/1609 pass, 0 fail | 35.20s | `npm run test:mocks` |
| cargo check | ✅ 0 errori, 12 warning | ~85s | `~/.cargo/bin/cargo.exe check --manifest-path src-tauri/Cargo.toml` |
| cargo test | ⏳ in corso al momento del grounding | ~? | `~/.cargo/bin/cargo.exe test --manifest-path src-tauri/Cargo.toml` |

> `cargo test` da aggiornare con risultato effettivo appena disponibile.

---

## 3. Struttura codebase

| Metrica | Valore | Comando |
|---|---|---|
| Test files `.test.ts` | 121 totali, 108 in `src/lib/` | `find src -name "*.test.ts" \| wc -l` |
| Test count | 1609 | output vitest |
| Progetto (no node_modules, no .git, no target) | 47 MB | `du -sh . --exclude=node_modules --exclude=.git --exclude=target` |
| node_modules | 438 MB | `du -sh node_modules` |
| src/ | 3.5 MB | `du -sh src` |
| src-tauri/src/ | 480 KB | `du -sh src-tauri/src` |
| git loose objects | 193 (599 KiB) | `git count-objects -vH` |
| git pack | 6018 oggetti (34.77 MiB) | `git count-objects -vH` |

---

## 4. Git state

| Item | Valore |
|---|---|
| Branch | main |
| Origin/main | up to date |
| HEAD | d1ec692 chore: handoff S2 |
| Divergenza | 0 commit ahead/behind |
| Untracked | docs/kb/improvement/ (questo programma) |

---

## 5. Rust warnings pre-esistenti (D-07)

12 warning in `src-tauri/src/commands/cli_resolver.rs`:
- `cli_resolver.rs:7` — `LOGIN_SHELL_PATH_TIMEOUT` mai usata (dead_code)
- `cli_resolver.rs:8` — `PATH_MARKER` mai usata (dead_code)
- Ulteriori warning (dettaglio completo da `cargo check` full output — WS-M audit)

`cargo fix --lib` suggerisce 2 fix automatici applicabili senza regression risk.

---

## 6. Da completare nelle sessioni Ax

I comandi seguenti producono metriche che richiedono tempo o tool aggiuntivi:

```bash
# Bundle analysis (WS-D)
npm run build -- --report   # o npx vite-bundle-visualizer

# Dipendenze inutilizzate (WS-A)
npx depcheck

# Dead exports (WS-A)
npx ts-prune

# npm audit (WS-H)
npm audit --audit-level=high

# cargo audit (WS-M/WS-H)
~/.cargo/bin/cargo.exe audit --manifest-path src-tauri/Cargo.toml

# git objects size (WS-K)
git count-objects -vH

# Test coverage per modulo (WS-F)
npm run test:mocks -- --coverage
```
