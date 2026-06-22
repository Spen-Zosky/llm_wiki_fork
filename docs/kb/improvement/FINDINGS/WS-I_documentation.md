# WS-I — Documentazione
> Sessione: S-STAB-A1 · 2026-06-22

## Baseline misurata

| Documento | Ultima modifica | Scope dichiarato |
|---|---|---|
| `README.md` | 2026-06-18 (fork day) | Upstream features + API |
| `README_CN/JA/KO.md` | 2026-06-18 (fork day) | Traduzione upstream |
| `docs/kb/SOT_STATE.md` | 2026-06-19 (S2) | Snapshot granulare ✓ |
| `docs/kb/SOT_BACKLOG.md` | 2026-06-22 (S-STAB-0) | Backlog ✓ |
| `docs/kb/DEBT_REGISTER.md` | 2026-06-19 (S2) | Debiti ✓ |
| `docs/kb/architecture-map.md` | 2026-06-18 | Internals + fusion rationale |
| `docs/kb/dimensions-taxonomy.md` | 2026-06-18 | 7-axis spec |
| `docs/kb/build-notes.md` | 2026-06-18 | Toolchain gotchas |
| `docs/kb/INDEX_PATHS.md` | generato handoff | Path index |
| `plans/fusion-wiki-factory.md` | 2026-06-18 | Piano fusione (stale) |
| `plans/multimodal-images.md` | 2026-06-18 | Spec futura pending |

## Findings

### F-I-01 [MEDIUM] README.md non documenta le feature della fork (Phases 2d-7)
**Evidenza**: `grep "Phase\|arbitrat\|linked.source\|archive\|graphify\|MkDocs\|write.*endpoint\|API_BIND" README.md` → nessuna occorrenza rilevante. Le sezioni "What We Changed & Added" descrivono solo le feature upstream (§1-18), niente sulla fusion Route C.  
La fork ha aggiunto: arbitration (#3), source_mode:linked (#4), archive/MkDocs (#5), graphify integration (#6), Phase 7 server write endpoints + bind flag (#7).  
**Impatto**: chiunque cloni la fork non sa cosa distingue `Spen-Zosky/llm_wiki_fork` da `nashsu/llm_wiki`.  
**Remediation**: aggiungere una sezione `## Fork-specific additions (Spen-Zosky/llm_wiki_fork)` in README.md con le 6 capability aggiunte dalla fusione. NON riscrivere il README — aggiungere in coda.  
**Effort**: ~30 min  
**Gate**: presenza sezione in README.md.

### F-I-02 [MEDIUM] `docs/kb/architecture-map.md` descrive Phases 3-7 come lavoro futuro
**Evidenza**: `grep -n "arbitrat\|archive\|graphify\|Phase 7\|linked.source" docs/kb/architecture-map.md` → righe 29-85 descrivono le capability come "injection points" e "da implementare". Tabella roadmap (riga 73-74) mostra archive/graphify come "new..." (futuro).  
Tutte queste capability sono ora SHIPPED (S2).  
**Impatto**: il documento è un piano, non un reference — confonde se letto come stato corrente.  
**Remediation**: aggiungere un banner in cima: `> **Nota**: questo documento è il piano di fusione (2026-06-18). Le Phases 0-7-server sono completate (S2, 2026-06-19). Vedi SOT_STATE.md per lo stato corrente.`  
**Effort**: ~5 min — QUICK-WIN  
**Gate**: banner presente.

### F-I-03 [LOW] [QUICK-WIN] `docs/kb/build-notes.md` — Node VM listato come v20 (attuale: v22)
**Evidenza**: `docs/kb/build-notes.md:49` — `Node: Windows 24, linux-pc 22, VM 20 (all via nvm...)`. Secondo CLAUDE.md globale: "Node 22 via nvm" su oracle-vm-default.  
**Impatto**: chi segue le istruzioni per setup VM OCI installa Node 20 invece di 22.  
**Remediation**: cambiare `VM 20` in `VM 22` a riga 49.  
**Effort**: ~2 min  
**Gate**: riga corretta nel file.

### F-I-04 [LOW] [QUICK-WIN] `plans/fusion-wiki-factory.md` — status header stale
**Evidenza**: `plans/fusion-wiki-factory.md:2` — `> **Status**: in progress — ... Phase 2d / Phase 3 next`.  
Tutte le fasi 0-7-server sono DONE.  
**Impatto**: confusione su cosa resta da fare nel piano.  
**Remediation**: aggiornare status header a `> **Status**: COMPLETATO — Phases 0-7-server DONE (S2, 2026-06-19). Phase 7 client + go-live PENDING (human-gated). Vedi SOT_STATE.md.`  
**Effort**: ~5 min  
**Gate**: status aggiornato.

### F-I-05 [INFO] `docs/kb/dimensions-taxonomy.md` — spec 7 assi
**Evidenza**: il documento descrive i 7 assi dimensionali. Phase 2d ha introdotto `layer` come 8° asse estendibile per-vault. Il documento non cita `layer`.  
**Impatto**: basso — `layer` è per-vault (fuori dai 6 fissi cross-vault + `type`), design intenzionale.  
**Remediation**: aggiungere una nota che descrive il campo `layer` come asse opzionale per-vault introdotto in Phase 2d. QUICK-WIN se fatto durante un'altra sessione doc.  
**Effort**: ~15 min

### F-I-06 [OK] SOT docs (STATE, BACKLOG, DEBT) — aggiornati e allineati
**Evidenza**: aggiornati a S2 (2026-06-19) e S-STAB-0 (2026-06-22). Domini disgiunti rispettati.  
**Impatto**: nessuno.

### F-I-07 [OK] `docs/kb/INDEX_PATHS.md` — generato dall'handoff
**Evidenza**: presente, generato da `docs/kb/tools/build_index.py` a ogni handoff.  
**Impatto**: nessuno — auto-gestito.
