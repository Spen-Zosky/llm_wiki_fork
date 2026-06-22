# WS-K — Repo hygiene & footprint
> Sessione: S-STAB-A1 · 2026-06-22

## Baseline misurata

| Metrica | Valore | Comando |
|---|---|---|
| Progetto (no node_modules/git/target) | 47 MB | `du -sh . --exclude=node_modules --exclude=.git --exclude=target` |
| src/ | 3.5 MB | `du -sh src` |
| src-tauri/src/ | 480 KB | `du -sh src-tauri/src` |
| node_modules | 438 MB | `du -sh node_modules` |
| git loose objects | 193 (599 KiB) | `git count-objects -vH` |
| git pack | 6018 oggetti (34.77 MiB) | `git count-objects -vH` |

## Findings

### F-K-01 [OK] dist/ e *.tsbuildinfo non tracciati
**Evidenza**: `git ls-files dist/ "*.tsbuildinfo"` → nessun output. Gitignore funziona correttamente.  
**Impatto**: nessuno.

### F-K-02 [OK] .gitignore corretto
**Evidenza**: `.gitignore` copre `node_modules/`, `dist/`, `src-tauri/target/`, `*.tsbuildinfo`, `src-tauri/gen/`, `.env*`, `.claude/`, `.superpowers/`, `tests/`, `AGENTS.md`, `docs/*` con eccezione `!docs/kb/`.  
LanceDB data files (tipicamente dentro `~/.llm-wiki/` o nella user data dir di Tauri) non vivono nel repo — nessun rischio di commit accidentale.  
**Impatto**: nessuno.

### F-K-03 [LOW] `scripts/debug_ollama_tokens.py` — utility non documentata
**Evidenza**: `scripts/debug_ollama_tokens.py` (142 linee) — tool per debuggare il mismatch `num_ctx` Ollama nel path di generazione. Ben commentato internamente. Non esiste un `scripts/README.md`.  
**Impatto**: basso — il file è utile e auto-documentato, ma non è ovvio per chi clona il repo perché esiste.  
**Remediation**: aggiungere una riga in `docs/kb/build-notes.md` che lo cita, o un `scripts/README.md` minimale (3-4 righe).  
**Effort**: ~10 min  
**Gate**: nessun gate obbligatorio.

### F-K-04 [LOW] README_CN/JA/KO non aggiornati con le feature fork
**Evidenza**: `README_CN.md`, `README_JA.md`, `README_KO.md` sono traduzioni del README upstream (nashsu/llm_wiki). Nessuna menzione delle capability aggiunte dalla fork (Phases 2d-7: arbitration, linked-sources, archive, graphify, Phase 7 server).  
**Impatto**: utenti non anglofoni non vedono le feature della fork.  
**Remediation**: aggiungere una nota in cima a ogni README_*.md che segnala il documento come "based on upstream v0.4.25; fork-specific features documented in README.md only". Oppure aggiornare — ma è sforzo significativo.  
**Effort**: ~30 min per la nota di disclaimer (opzione minima)  
**Gate**: nessun gate obbligatorio per la stabilizzazione — DEFERRABLE.

### F-K-05 [OK] git pack size accettabile
**Evidenza**: 34.77 MiB in pack — ragionevole per un repo con assets (logo.jpg 30MB, screenshot in assets/).  
`logo.jpg` da sola è ~30MB — principale contributore. Non un problema urgente.  
**Impatto**: clone leggermente lento. Nessuna urgenza per LFS.  
**Remediation**: candidato futuro per LFS (logo.jpg, assets/*.jpg). Non in scope stabilizzazione.

### F-K-06 [OK] plans/multimodal-images.md — spec pending correttamente marcata
**Evidenza**: `plans/multimodal-images.md:4` — `Status: Spec, not started.` — feature futura, non in scope stabilizzazione.  
**Impatto**: nessuno — file descrittivo, non interferisce.

### F-K-07 [LOW] `plans/fusion-wiki-factory.md` — status stale
**Evidenza**: `plans/fusion-wiki-factory.md:2` — `> **Status**: in progress — route C... Phase 2d / Phase 3 next`.  
Tutte le fasi 2d-7 sono ora DONE (S2). Il piano descrive lo stato passato.  
**Impatto**: confonde chi legge il piano — sembra che le fasi siano ancora da fare.  
**Remediation**: aggiornare la riga Status in cima al file.  
**Effort**: ~5 min — QUICK-WIN  
**Gate**: nessun gate tecnico.
