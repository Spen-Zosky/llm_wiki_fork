# PROMPT KICKOFF — llm_wiki_fork "STAB"
# Sessione S-STAB-0: Recon + Intervista + Piano Master della stabilizzazione forense
# (da incollare in Claude Code CLI, working dir D:\enzospenuso\Documents\GitHub\llm_wiki_fork)

---

## 0. MANDATO E NATURA DELLA SESSIONE

Sei Claude Code CLI su `D:\enzospenuso\Documents\GitHub\llm_wiki_fork`.

Obiettivo del programma: **stabilizzazione monolitica** di llm_wiki_fork (non-live;
Phases 0–7-server shipped; Phase 7 client SPA + go-live PENDING gated;
stack: Tauri v2 Rust + React 19/TS/Vite 8 + LanceDB embedded; shadcn/ui + Tailwind CSS v4;
sigma.js + graphology; Milkdown; Zustand; react-i18next; vitest 4; TypeScript 5.7;
graphify v0.8.14 CLI shell-out; npm).

**"Stabilizzazione"** = chiudere **tutti** i gap, debiti e incompletezze **esistenti dentro
questo repo** prima di aggiungere qualsiasi funzionalità o integrazione nuova.

Scope **strettamente monolitico** — vincolo hard non negoziabile:
nessun oggetto di validità trasversale (`~/.claude/CLAUDE.md` globale, `~/.claude/skills/`,
`~/.claude/memory/`, script shared tra più repo) può subire modifiche o rotture.
Se l'analisi rivela che un'azione richiederebbe toccare oggetti trasversali → produrre
`CROSS_PROJECT_FUTURE.md` con descrizione di cosa sarà necessario fare in fasi successive;
**nessuna modifica cross-repo in questo programma**.

Questa sessione (S-STAB-0) è **READ-ONLY sul codice**: NESSUNA modifica a
src / db / config / deploy / CI. Produce SOLO documenti sotto `docs/kb/improvement/`
+ aggiornamento backlog di progetto. Commit locali doc-only ammessi; push su
`origin main` diretto (no PR) dopo ogni step verde. Ambienti live non si toccano.

Invarianti di progetto (valgono per default; sfidabili SOLO via dossier esplicito):
- **I1** — `npm run typecheck && npm run test:mocks` verdi prima di ogni claim "done"
- **I2** — moduli additivi + test co-locati per ogni capability; mai riscrivere `ingest.ts` core
- **I3** — commit atomico per step, push `origin main`; mai `upstream`
- **I4** — `cargo build --release` diretto, mai interrotto durante il link; `cargo check` per validazione veloce

Ciclo di vita a sessioni che TU definisci qui:
- **S-STAB-0** (questa): recon + intervista + piano master + todo
- **S-STAB-A1..An** (audit): una sessione forense per workstream (§4), produce FINDINGS classificati + metriche baseline
- **S-STAB-C** (consolidamento): sintesi cross-WS + dossier finali (§5) → decide l'utente
- **S-STAB-E1..Em** (esecuzione): una sessione per epic chiusa, gate verdi, mai su main per cambi strutturali

---

## 1. STEP ZERO — GROUNDING OBBLIGATORIO (prima di qualsiasi output)

Reperisci le fonti di verità VIVE al momento del lancio, in quest'ordine:
1. `CLAUDE.md` root del repo + i suoi pointer
2. `.handoff/STATE.md` (priorità e open questions)
3. `docs/kb/SOT_STATE.md` (snapshot granulare: versioni, counts, architettura, milestone log)
4. `docs/kb/SOT_BACKLOG.md` (backlog items non conclusi)
5. `docs/kb/DEBT_REGISTER.md` (debiti aperti)

Poi verifica live con comandi reali (niente assunzioni da memoria):

```bash
# Git state
git status
git log origin/main..HEAD --oneline

# TS gate
npm run typecheck
npm run test:mocks   # expect: 1609 pass, 0 fail

# Conteggio test files
find src -name "*.test.ts" | wc -l

# Rust
~/.cargo/bin/cargo.exe check --manifest-path src-tauri/Cargo.toml
~/.cargo/bin/cargo.exe test --manifest-path src-tauri/Cargo.toml   # D-06: 2 test api_server.rs non ancora lanciati

# Versioni toolchain
node --version && rustc --version && protoc --version

# Dimensione repo
du -sh . --exclude=.git
du -sh node_modules src src-tauri
```

Ogni drift osservato rispetto a quanto dichiarato nelle SoT → annotato in `BASELINE_METRICS.md`.

**NB**: ogni dato citato in questo prompt è snapshot del **2026-06-22** usato come àncora
orientativa — NON è autoritativo; fa fede SEMPRE la lettura live.
Metodo vincolante: evidence > narrative diagnosis; time-box 60-90 min sui rabbit hole;
automazione non eseguita non è validata.

---

## 2. INTERVISTA INIZIALE ALL'UTENTE (gate bloccante)

> **Contesto pre-compilato** (risposte fornite in fase di generazione del kickoff):
> - Obiettivo: stabilizzazione monolitica (chiusura gap/debiti/incompletezze esistenti)
> - Scope: monolitico — nessun oggetto trasversale toccabile; cross-repo → `CROSS_PROJECT_FUTURE.md`
> - Trasformazioni radicali: FUORI SCOPE in questa fase
> - WS-L (ecosistema Claude): DEFERRED — prima voce post-stabilizzazione
> - Prefisso sessioni: S-STAB

Dopo il grounding e PRIMA del piano: UN solo batch di domande numerate (max 10),
con risposta di default proposta. **STOP: non procedere al piano finché l'utente non risponde.**

Temi obbligatori (adatta in base a quanto il recon rivela):

1. **Definizione di "stabilizzato"**: quale soglia misurabile chiude il programma?
   (default: typecheck 0 + test ≥1609 pass + cargo test pass + 0 debiti aperti CRITICAL/HIGH
   + tutti i gap B-10..B-18 chiusi o esplicitamente DEFERRED con motivazione)

2. **Phase 7 client (B-10)**: è in scope della stabilizzazione o gated come il go-live?
   (default: **B-10 in scope** = scrivere il codice SPA + fetch-based adapter;
   il deploy/go-live B-12 resta DEFERRED umano gated)

3. **Linked-sources UI (B-13)** vs **Phase 7 client (B-10)**: priority relativa?
   (default: B-10 prima, B-13 P2 in parallelo se contesto permette)

4. **Graphify sigma overlay (B-14)**: priority?
   (default: P2 — dopo B-10/B-13, prima di E2E test)

5. **E2E test Playwright (B-18)**: includerli nella stabilizzazione o pianificati post?
   (default: P3 — pianificati, non bloccanti per "stabilizzato")

6. **Rust warnings (D-07)**: target 0 warning o riduzione guidata?
   (default: riduzione guidata — fix solo warning safe-to-fix senza refactor aggressivo;
   documentare il resto in FINDINGS)

7. **Archive lifecycle gated-removal (B-16)**: in scope stabilizzazione?
   (default: sì se è chiusura di un gap già aperto; fuori scope se richiede design nuovo)

8. **Budget sessioni**: quante sessioni S-STAB-Ax stimi di poter allocare?
   (default: senza limite dichiarato — il piano propone la granularità minima per sicurezza)

9. **Criteri di successo oltre le metriche**: cosa vuoi poter fare dopo la stabilizzazione
   che ora non puoi fare con fiducia? (es. "integrare X", "fare go-live con rischio basso",
   "consegnare il repo a terzi senza vergogna")

10. **Domande aggiuntive** emerse dal grounding: inserisci qui tutto ciò che il recon
    ha rivelato e che non era nei dati del 2026-06-22.

---

## 3. METODO FORENSE (vale per ogni sessione di audit S-STAB-Ax)

- **Evidence-based**: ogni finding cita comando + output reale (o `path:linea`). Zero narrative.
- **Granularità E2E**: per ogni WS percorri la catena codice → config → test → CI → doc.
- **Classificazione obbligatoria**:
  - `CRITICAL` — rompe funzionalità core o introduce rischio sicurezza
  - `HIGH` — gap significativo, blocca o degrada funzionalità importante
  - `MEDIUM` — debito gestibile, impatta DX o robustezza
  - `LOW` — cosmetico, ottimizzazione opzionale
  - Flag `QUICK-WIN` — risolvibile in ≤1h, zero rischio
  - Flag `DOSSIER` — richiede decisione dell'utente (opzioni + trade-off)
  - Flag `CROSS-REPO` — tocca oggetti trasversali → solo report in `CROSS_PROJECT_FUTURE.md`, nessuna modifica
- **Baseline prima di proporre**: tempi build/lint/suite, dimensione repo, bundle per route,
  copertura test per modulo — comandi riproducibili in `BASELINE_METRICS.md`.
- **Sub-agent split**: exploration read-only in sub-agent, sintesi nel main thread.

---

## 4. WORKSTREAM DI AUDIT

*(ogni WS = sessione S-STAB-Ax dedicata; dipendenze indicate)*

---

### WS-A — Architettura & struttura TS *(nessuna dipendenza, lanciabile subito)*

Scope mono-repo `src/`:
- Boundary tra moduli `src/lib/`, coupling e astrazioni a ≤1 consumer
- Import circolari (`madge` o `--check` vite)
- Export non usati, file unreferenced
- Dead code (`ts-prune` o equivalente)
- Dipendenze `package.json` inutilizzate vs mancanti (`depcheck`)
- Sovrapposizioni funzionali tra moduli (es. `source-identity.ts` vs `source-lifecycle.ts`)

---

### WS-B — Ingest & backend TS *(dipende da WS-A per il mapping)*

Scope: `src/lib/ingest.ts`, `src/lib/ingest-cache.ts`, `src/lib/arbitration.ts`,
`src/lib/linked-sources.ts`, `src/lib/archive-snapshot.ts`, `src/lib/export-mkdocs.ts`.

- Error handling nei path hot (queue crash-recovery, autoWatch edge cases)
- SHA256 cache correctness: test coverage su hit/miss/invalidation
- Hook completeness per Phases 2d-3-4-5-6 (tutti i seam chiamati correttamente?)
- I2 invariante: verifica che nessun modulo recente riscriva logica core di `ingest.ts`
- `mergePageContent` congelato: test che lo copre completamente?

---

### WS-C — LanceDB & persistenza *(nessuna dipendenza)*

- Schema embedding store: oggetti morti o deprecati?
- `protoc` path stability su Windows / VM OCI ARM64 / linux-pc x86-64
- Crash posture se LanceDB non inizializzato o protoc mancante
- `cargo audit` per crate Rust (LanceDB + zip + walkdir + altre)
- Backup/restore posture: il vault dati sopravvive a un reinstall?

---

### WS-D — Frontend React *(dipende da WS-A)*

- Bundle analysis: `npm run build` con `--report` o `vite-bundle-visualizer`
- Code splitting per route (sigma/graph, milkdown, pdf-extract)
- Data-fetching pattern: IPC Tauri commands vs API :19828 — coerenza
- Loading / error / empty state coverage per ogni view (8 view da sidebar)
- i18n completezza: chiavi mancanti en vs zh, hardcoded strings in UI

---

### WS-E — Design system / UX-IX *(dipende da WS-D)*

- shadcn/ui component inventory vs uso reale nei file `src/components/`
- Tailwind CSS v4 token: custom token usati vs definiti
- a11y baseline: keyboard nav nelle 3 colonne, focus trap nei dialog, aria-label mancanti
- Heuristiche UX su flussi critici: ingest (progress + errori), search (no results), graph (empty wiki)
- Responsive: è una desktop app — dimensioni minime finestra testabili?

---

### WS-F — Test & QA *(dipende da WS-A per coverage mapping)*

- Durata suite baseline: `npm run test:mocks -- --reporter=verbose` con timer
- Distribuzione per directory: `src/lib/` vs `src/components/` vs `src-tauri/`
- Flakiness: lancia 3x e conta variazioni (test count, fail/skip)
- Gap di copertura per modulo (Phases 2d-3-4-5-6-7: ogni modulo ha test co-locato?)
- D-05 posture: il fetch-based `fs.ts` adapter (B-10) non è testabile senza serving —
  documentare il gap e proporre smoke test loopback + browser test strategy
- Contract testing: i mock in `__mocks__/` riflettono l'interfaccia reale attuale?

---

### WS-G — CI/CD & GitHub *(nessuna dipendenza)*

- Workflow `.github/workflows/`: durata per job (baseline dai log recenti `gh run list`)
- Caching efficace: `node_modules`, `~/.cargo/registry`, `target/`
- Matrix build: macOS ARM + Intel, Windows `.msi`, Linux `.deb`/`.AppImage` — tutti verdi?
- Security alerts: `npm audit --audit-level=high` + `cargo audit`
- Branch protection su `main`: settings attuali
- Secrets hygiene: scan per pattern `password|secret|api.key|sk-|token|BEGIN PRIVATE KEY`
  negli ultimi 20 commit (`git log --all -p | grep -i "..."`)

---

### WS-H — Sicurezza & supply chain *(dipende da WS-G per audit)*

- API :19828 (LLM Wiki API): token enforcement, `allowUnauthenticated` guard completeness
- API :19827 (Chrome extension clipper): surfaces esposte, autenticazione
- Phase 7 write posture: guard `writeEnabled` + `is_writable_project_rel` — coverage test?
- Bind default `127.0.0.1`: verificato nel binario compilato (non solo nel sorgente)?
- npm + cargo supply chain: dipendenze con CVE note
- SBOM: produrlo se non esiste (`npm sbom` / `cargo sbom`)

---

### WS-I — Documentazione *(nessuna dipendenza, lanciabile subito)*

- Censimento completo: `docs/kb/` + README.md + README_CN/JA/KO + code comments
- Drift vs codice: Phases 2d-3-4-5-6-7 documentate in README? In docs/kb/?
- `INDEX_PATHS.md` aggiornato (generato dall'handoff — verificare data)
- `docs/kb/architecture-map.md` e `dimensions-taxonomy.md`: riflettono le Phases S2?
- `docs/kb/build-notes.md`: flag `LLM_WIKI_API_BIND` + graphify path documentati?
- Obsoleti da archiviare: doc che descrivono stati pre-S2 ormai superati?

---

### WS-J — Configurazioni & env *(nessuna dipendenza)*

- Inventario env var per macchina: Windows / VM OCI ARM64 / linux-pc x86-64
- `.env.example` (esiste? completo?): `LLM_WIKI_API_BIND`, `LLM_WIKI_API_TOKEN`, ecc.
- `package.json` scripts morti/fragili o non documentati
- Build flags: `__WEB_BUILD__` (Phase 7 — definito ma mai attivato?)
- `vite.config.ts`: alias, env, condizioni di build — tutto allineato con Phase 7 design?

---

### WS-K — Repo hygiene & footprint *(nessuna dipendenza)*

- File morti nella root e in `src/` (`.bak`, `.old`, stub vuoti)
- `.gitignore`: LanceDB data files coperti? `node_modules` e `target/` corretti?
- Dimensione `.git`: `git count-objects -vH`; candidati LFS (binari, assets grandi)
- `logo.jpg` e `assets/`: ottimizzabili senza quality loss?
- `extension/`: stato aggiornato rispetto alle API Phase 7?

---

### WS-M — Rust / Tauri-specifico *(dipende da WS-C per cargo audit)*

- **`cargo test`**: lancio completo + risultato per i 2 test in `api_server.rs` (chiude D-06)
- **12 warning pre-esistenti**: classificazione (safe-to-fix vs richiede refactor) + piano riduzione senza breaking change; produce lista in FINDINGS/WS-M
- **Tauri plugin boundary**: comandi registrati in `lib.rs` (handler registration) vs comandi effettivamente chiamati dal frontend → dead handler candidates
- **LanceDB C-FFI**: dipendenza runtime o compile-time only? crash posture documentata
- **`api_server.rs` completeness**: guard `writeEnabled`, `is_writable_project_rel`, bind check — coverage dei casi limite
- **Tauri v2 versione**: `^2.11` attuale — release notes per eventuali fix di sicurezza/stabilità nella v2.x

---

### WS-N — graphify ecosystem *(nessuna dipendenza sul codice; dipende da WS-I per doc)*

- **Path attuale**: `~/.local/bin/graphify` (shell-out in `commands/fs.rs` via `cli_resolver`)
  - Path è hardcoded o risolto dinamicamente?
  - Versione pinned (0.8.14) o "latest"?
  - Fallback se CLI mancante: errore utente leggibile o panic?
- **`graphify-graph.ts` consume layer**: error handling se `graph.json` mancante / malformato / versione schema incompatibile
- **Overlap/gap**: graphify CLI AST-layer (no-LLM, codice) vs skill `/graphify` semantic (agent-orchestrated) — documentare le due modalità e quando usare quale
- **Dossier D-12** (bundling strategy): produce `DOSSIERS/D-12_graphify-bundling.md`
  - Opzione A (conservativa): shell-out status quo + version check + fallback messaggio
  - Opzione B (evolutiva): subprocess managed + version pinning in `package.json` o `Cargo.toml`
  - Opzione C (radicale): bundled binary nella Tauri sidecar
- **CROSS-REPO guard**: la skill `/graphify` vive in `~/.claude/skills/graphify/` — nessuna modifica; solo documentare il gap in `CROSS_PROJECT_FUTURE.md` se rilevante

---

### WS-L — Ecosistema Claude

⚪ **DEFERRED** — escluso dalla stabilizzazione per vincolo di scope cross-project
(toccherebbe `~/.claude/` globale).
Inserire come **prima voce del programma post-stabilizzazione** nella TODO.

---

## 5. DECISION DOSSIERS

Per ogni oggetto: file `DOSSIERS/D-NN_<slug>.md` con struttura fissa:
contesto misurato → opzioni (conservativa / evolutiva / radicale) →
per ognuna impatto (robustezza/DX/UX) + costo (sessioni/ore) + rischio + reversibilità
+ prerequisiti → raccomandazione motivata → "cosa decide l'utente".

**Dossier in scope per questo programma:**

| ID | Titolo | WS sorgente |
|---|---|---|
| D-01 | Tauri v2 posture: upgrade path + warning gestione | WS-M |
| D-02 | LanceDB & vector store: schema + crash posture + upgrade | WS-C |
| D-03 | Phase 7 client architettura: fetch-based `fs.ts` adapter — design senza high regression risk | WS-F, WS-B |
| D-04 | Frontend bundle & code splitting: analisi + split strategy | WS-D |
| D-05 | Design system: shadcn/ui + Tailwind CSS v4 — gap vs coverage | WS-E |
| D-06 | Tooling build: vitest + cargo + vite — ottimizzazioni durata CI | WS-G |
| D-08 | CI/CD: workflow analysis + caching + matrix + deploy readiness | WS-G |
| D-09 | Observability: postura attuale + cosa serve prima del go-live | WS-H |
| D-12 | graphify bundling: shell-out vs subprocess managed vs Tauri sidecar | WS-N |
| D-13 | linked-sources promozione: da feature-flag OFF a stabile — gating, test, risk | WS-B |

**Dossier DEFERRED (fuori scope stabilizzazione monolitica):**

| ID | Motivo DEFERRED | Destinazione |
|---|---|---|
| D-07 | Migration squash — n/a (nessun DB migration stack in questo progetto) | eliminato |
| D-10 | Architettura applicativa — Tauri monolite desktop è la scelta corretta, nessun dossier | eliminato |
| D-11 | Go-live / deploy Model B: TLS, OCI ingress, vault sync → richiede infra VM OCI + cross-project | `CROSS_PROJECT_FUTURE.md` |

---

## 6. CROSS_PROJECT_FUTURE.md (file obbligatorio di questa sessione)

Crea `docs/kb/improvement/CROSS_PROJECT_FUTURE.md` come repository di tutti gli oggetti
identificati durante l'analisi che richiedono azioni cross-project o su oggetti trasversali.

Struttura per ogni voce:

```
## [ID] Titolo
**Oggetto trasversale coinvolto**: path o nome
**Perché serve**: descrizione del bisogno tecnico
**Impatto se rimandato**: rischio o degradazione attesa
**Prerequisiti**: cosa deve accadere prima in questo repo
**Stima effort**: sessioni/ore, roughly
**Azione necessaria**: descrizione concreta di cosa fare in futuro
```

Candidati già noti al 2026-06-22:
- Skill `/graphify` (`~/.claude/skills/graphify/`): eventuali aggiornamenti per compatibilità con consume-layer di Phase 6
- WS-L ecosistema Claude: ottimizzazione CLAUDE.md + skills + memory per llm_wiki_fork
- D-11 go-live: deploy Model B su VM OCI (TLS, reverse proxy, OCI ingress)

Aggiungi ogni nuovo candidato emerso durante i WS di audit.

---

## 7. DELIVERABLE DI QUESTA SESSIONE (S-STAB-0)

Crea `docs/kb/improvement/` con i seguenti file:

| File | Contenuto |
|---|---|
| `MASTER_PLAN_STAB.md` | Visione stabilizzazione, assi, ciclo sessioni, sequenza WS con dipendenze, gate decisionali, criteri di successo post-intervista |
| `TODO_STAB.md` | Machine-checkable: `[ ] S-STAB-?? \| WS \| task \| gate di verifica \| stato` |
| `INTERVIEW_LOG.md` | Domande S-STAB-0, default proposti, risposte verbatim di Enzo |
| `BASELINE_METRICS.md` | Misure con comandi riproducibili (typecheck, test count+durata, cargo check/test, bundle size, dep count, git objects) |
| `AUDIT_PROTOCOL.md` | Template operativo FINDINGS/DOSSIER, classificazione, time-box, flag CROSS-REPO |
| `CROSS_PROJECT_FUTURE.md` | Report oggetti trasversali e azioni rinviate (vedi §6) |
| `FINDINGS/` | Directory stub (verrà popolata nelle sessioni S-STAB-Ax) |
| `DOSSIERS/` | Directory stub (verrà popolata nelle sessioni S-STAB-Ax) |

Dopo aver creato i file:
1. Aggiorna `docs/kb/SOT_BACKLOG.md`: aggiungi epic `S-STAB` con gli item di primo livello
2. Commit doc-only con messaggio `docs(stab): kickoff S-STAB-0 — improvement dir + backlog epic`
3. Push `origin main`
4. Riepilogo finale con evidenze reali (output git, conteggi file creati)

---

## 8. GUARDRAIL FINALI

- **Nessuna modifica** a codice, schema, config, CI, deploy in questa sessione.
- **CROSS-REPO GUARD assoluto**: oggetti intoccabili in questo programma:
  `~/.claude/CLAUDE.md` globale · `~/.claude/skills/` · `~/.claude/memory/` ·
  `~/.claude/keybindings.json` · script usati da più repo.
  Qualsiasi finding che richieda toccarli → `CROSS_PROJECT_FUTURE.md` + DEFERRED.
- Invarianti (§0) sfidabili solo via dossier; conflitti → STOP e chiedi.
- Stime sempre in sessioni/ore con evidenza.
- Context budget esaurito → handoff pulito marcando il residuo nella TODO:
  il programma è multi-sessione by design. Usa la skill `handoff` per chiudere ogni sessione.
- Le sessioni successive (**S-STAB-Ax, S-STAB-C, S-STAB-Ex**) partono SEMPRE rileggendo
  `MASTER_PLAN_STAB.md` + `TODO_STAB.md` + `AUDIT_PROTOCOL.md` come primo atto.

---

## 9. SEQUENZA OPERATIVA S-STAB-0

```
1. Step Zero §1 — grounding live (leggi SoT + comandi verificati)
2. Recon + baseline §3 — time-box 45-60 min; popola BASELINE_METRICS.md
3. Intervista §2 — presenta batch, STOP in attesa risposte Enzo
4. Post-risposta: Piano (MASTER_PLAN_STAB.md) + TODO (TODO_STAB.md) + Protocollo (AUDIT_PROTOCOL.md)
5. CROSS_PROJECT_FUTURE.md — popola con i candidati già noti + quelli emersi dal recon
6. FINDINGS/ e DOSSIERS/ stub
7. Aggiorna SOT_BACKLOG.md con epic S-STAB
8. Commit doc-only + push origin/main + riepilogo evidenze reali
```

---

*Snapshot generato il 2026-06-22 da skill `forensic-100x-kickoff`. I dati embedded sono àncora
orientativa — fa fede SEMPRE la lettura live delle SoT al lancio della sessione S-STAB-0.*
