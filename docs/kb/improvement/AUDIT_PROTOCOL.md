# AUDIT_PROTOCOL — Protocollo operativo sessioni S-STAB-Ax

> Vale per ogni sessione di audit S-STAB-A1..A6 e per S-STAB-C.
> Leggi questo file come primo atto di ogni sessione di audit.

---

## 0. Entry point obbligatorio (ogni sessione)

```bash
# 1. Leggi le SoT
cat docs/kb/improvement/MASTER_PLAN_STAB.md
cat docs/kb/improvement/TODO_STAB.md
cat docs/kb/improvement/AUDIT_PROTOCOL.md   # questo file

# 2. Verifica gate (30 secondi)
npm run typecheck && echo "TS OK" || echo "TS FAIL"
git log origin/main..HEAD --oneline          # deve essere vuoto (push fatto)
```

---

## 1. Metodo forense

- **Evidence-based**: ogni finding cita `path:linea` o `comando + output`. Zero narrative.
- **E2E**: per ogni WS percorri la catena codice → config → test → CI → doc.
- **Time-box**: max 60 min per rabbit hole; se non converge → annota e continua.
- **Sub-agent split**: exploration read-only in `Agent(subagent_type=Explore)`, sintesi nel main thread.
- **No hallucination**: mai affermare "non esiste" senza grep/glob verificato.

---

## 2. Classificazione findings

```
CRITICAL  — rompe funzionalità core o introduce rischio sicurezza attivo
HIGH      — gap significativo, blocca o degrada funzionalità importante
MEDIUM    — debito gestibile, impatta DX o robustezza
LOW       — cosmetico, ottimizzazione opzionale
```

Flag aggiuntivi (cumulabili):
```
QUICK-WIN   — risolvibile in ≤1h, zero rischio regressione
DOSSIER     — richiede decisione dell'utente (produrre DOSSIERS/D-NN_<slug>.md)
CROSS-REPO  — tocca oggetti trasversali → SOLO nota in CROSS_PROJECT_FUTURE.md, NESSUNA modifica
```

---

## 3. Template FINDINGS

File: `FINDINGS/WS-<X>_<slug>.md`

```markdown
# WS-X — <nome workstream>
> Sessione: S-STAB-Ax · Data: YYYY-MM-DD

## Baseline misurata
| Metrica | Valore | Comando |
|---|---|---|
| ... | ... | ... |

## Findings

### F-01 [SEVERITY] [FLAG] Titolo breve
**Evidenza**: `path:linea` o output comando
**Impatto**: descrizione concreta
**Remediation**: azione specifica
**Effort**: ~Xh
**Gate**: come verificare che è risolto

### F-02 ...
```

---

## 4. Template DOSSIERS

File: `DOSSIERS/D-NN_<slug>.md`

```markdown
# D-NN — Titolo
> Sessione: S-STAB-Ax · Data: YYYY-MM-DD

## Contesto misurato
(dati reali, non assunzioni)

## Opzione A — Conservativa
- Impatto (robustezza/DX/UX):
- Costo (sessioni/ore):
- Rischio:
- Reversibilità:
- Prerequisiti:

## Opzione B — Evolutiva
(stessa struttura)

## Opzione C — Radicale
(stessa struttura)

## Raccomandazione
(motivata da evidenze)

## Cosa decide l'utente
(domanda specifica, non generica)
```

---

## 5. CROSS-REPO guard

Se un finding coinvolge oggetti trasversali:

**Oggetti intoccabili in questo programma**:
- `~/.claude/CLAUDE.md` globale
- `~/.claude/skills/` (inclusa skill `/graphify`)
- `~/.claude/memory/`
- `~/.claude/keybindings.json`
- Script o configurazioni usati da più repo

**Azione**: aggiungi voce a `CROSS_PROJECT_FUTURE.md` — nessuna modifica, nessun dossier.

---

## 6. Chiusura di ogni sessione Ax

1. Salva `FINDINGS/WS-X_<slug>.md` + eventuali `DOSSIERS/D-NN_<slug>.md`
2. Aggiorna le voci corrispondenti in `TODO_STAB.md` (da `TODO` a `AUDIT_DONE`)
3. Aggiorna `CROSS_PROJECT_FUTURE.md` se nuovi candidati emersi
4. Commit `docs(stab): S-STAB-Ax — WS-X findings` + push origin/main
5. Usa skill `handoff` se la sessione è lunga (aggiorna `.handoff/STATE.md`)
