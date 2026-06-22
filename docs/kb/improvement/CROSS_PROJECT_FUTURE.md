# CROSS_PROJECT_FUTURE — Azioni rinviate (scope cross-project)

> Oggetti con validità trasversale su più progetti identificati durante il programma S-STAB.
> **Nessuna di queste voci viene toccata durante la stabilizzazione monolitica.**
> Decide Enzo quando e come affrontarle in fasi successive.
>
> Aggiornato: S-STAB-0 · 2026-06-22

---

## CF-01 — Go-live deployment Model B (Phase 7 B-12)

**Oggetto trasversale coinvolto**: infra VM OCI (`oracle-vm-default 80.225.82.207`), configurazione
Caddy/nginx, OCI ingress rules, vault sync channel (git `wiki/` + rsync `raw/`)

**Perché serve**: Phase 7 server è scritto ma esposto solo su loopback 127.0.0.1.
Il go-live richiede: TLS via reverse proxy + Let's Encrypt, bind a 0.0.0.0,
apertura porta 443 su OCI Security List, strategia vault sync tra macchine client e VM centrale.

**Impatto se rimandato**: l'app rimane desktop-only; il Model B (browser client → VM central host)
non è raggiungibile. Nessuna regressione funzionale sul desktop.

**Prerequisiti in questo repo**: B-10 (Phase 7 client SPA) completato e testato in loopback.

**Stima effort**: ~1 sessione infra + 1 sessione verifica end-to-end

**Azione necessaria**: 
- Scegliere bind diretto vs Caddy/nginx (raccomandato: Caddy reverse proxy)
- Configurare TLS + Let's Encrypt sulla VM OCI
- Aprire OCI ingress rule porta 443
- Definire vault sync channel (git push `wiki/` + rsync `raw/sources/`)
- Test E2E da browser client esterno

---

## CF-02 — Ecosistema Claude (WS-L)

**Oggetto trasversale coinvolto**: `~/.claude/CLAUDE.md` globale, `~/.claude/skills/`,
`~/.claude/memory/`, `~/.claude/keybindings.json`

**Perché serve**: ottimizzazione del CLAUDE.md di progetto, skills dedicate a llm_wiki_fork
(es. skill per query/ingest diretta via MCP), memoria di progetto aggiornata.

**Impatto se rimandato**: nessuna regressione funzionale; solo DX subottimale nelle sessioni CLI.

**Prerequisiti**: stabilizzazione monolitica completata (repo in stato pulito).

**Stima effort**: ~1 sessione con skill `claude-ecosystem-optimizer`

**Azione necessaria**: applicare skill `claude-ecosystem-optimizer` in modalità "design + piano"
dopo la chiusura di S-STAB. Output: CLAUDE.md project aggiornato + WS-L_PLAN.md.

---

## CF-03 — Skill `/graphify` compatibilità Phase 6

**Oggetto trasversale coinvolto**: `~/.claude/skills/graphify/SKILL.md`

**Perché serve**: la skill `/graphify` (semantic, agent-orchestrated) produce `graph.json`
che viene consumato dal consume-layer `graphify-graph.ts` (Phase 6). Se la skill evolve
il formato di `graph.json`, il consume-layer potrebbe non parsarlo correttamente.

**Impatto se rimandato**: basso — il formato attuale è stabile; il rischio è su evoluzioni future.

**Prerequisiti**: nessuno. Può essere fatto in qualsiasi momento.

**Stima effort**: ~2h — aggiungere un version check nel consume-layer + documentare il contratto

**Azione necessaria**:
- Documentare il contratto di formato `graph.json` atteso da `graphify-graph.ts`
- Aggiungere version check nel consume-layer con errore leggibile se incompatibile
- (cross-repo) Allineare la skill `/graphify` a produrre sempre un campo `version` nel JSON

---

## Aggiornamento

Aggiungere nuove voci durante le sessioni S-STAB-Ax ogni volta che un finding ha flag `CROSS-REPO`.
Formato:

```
## CF-NN — Titolo
**Oggetto trasversale coinvolto**: path o nome
**Perché serve**: ...
**Impatto se rimandato**: ...
**Prerequisiti**: ...
**Stima effort**: ...
**Azione necessaria**: ...
```
