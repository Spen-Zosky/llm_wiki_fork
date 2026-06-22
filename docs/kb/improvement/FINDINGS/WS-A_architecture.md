# WS-A — Architettura & struttura TS
> Sessione: S-STAB-A1 · 2026-06-22

## Baseline misurata

| Metrica | Valore | Comando |
|---|---|---|
| File `.ts` in src/ (no test) | ~120 | `find src -name "*.ts" ! -name "*.test.ts"` |
| Moduli lib più importato | `path-utils` (34×), `llm-client` (7×), `has-usable-llm` (6×) | grep import count |
| Dep inutilizzate (depcheck) | 4 segnalate, 3 false positive, 1 reale | `npx depcheck --json` |
| Import circolari | non rilevati con grep — verifica completa in WS-D | — |

## Findings

### F-A-01 [LOW] [QUICK-WIN] `shadcn` in `dependencies` invece di `devDependencies`
**Evidenza**: `package.json:54` — `"shadcn": "^4.1.2"` è dentro il blocco `dependencies` (l.19-60).  
`shadcn` è il CLI tool per aggiungere/gestire componenti shadcn-ui. Non viene importato dal codice applicativo — è uno strumento di development.  
**Impatto**: il tool viene incluso nel bundle di produzione (inutilmente); confonde l'analisi dep.  
**Remediation**: spostare da `dependencies` a `devDependencies` in `package.json`.  
**Effort**: ~5 min  
**Gate**: `npm install` senza errori, `npm run typecheck` verde.

### F-A-02 [LOW] [QUICK-WIN] `@types/js-yaml` in `dependencies` invece di `devDependencies`
**Evidenza**: `package.json:34` — `"@types/js-yaml": "^4.0.9"` è dentro `dependencies`.  
I pacchetti `@types/*` sono type declarations usate solo da TypeScript a compile-time.  
**Impatto**: incluso nel bundle di produzione inutilmente.  
**Remediation**: spostare in `devDependencies`.  
**Effort**: ~5 min  
**Gate**: `npm install` senza errori, `npm run typecheck` verde.

### F-A-03 [INFO] depcheck false positives — CSS imports non rilevati
**Evidenza**: depcheck segnala come "unused" `@fontsource-variable/geist`, `tailwindcss`, `tw-animate-css`. Tuttavia sono tutte importate via CSS in `src/index.css:1-4`:
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@fontsource-variable/geist";
```
Sono necessarie a build time e dipendono dal vite plugin `@tailwindcss/vite`.  
**Impatto**: nessuno — false positives di depcheck su CSS-only imports.  
**Remediation**: configurare depcheck con `ignorePatterns` per le CSS deps, oppure accettare come nota.  
**Effort**: ~15 min (config opzionale)  
**Gate**: nessun gate obbligatorio.

### F-A-04 [INFO] Moduli con 1 export — design intenzionale, non dead code
**Evidenza**: `api-token.ts`, `detect-language.ts`, `enrich-wikilinks.ts`, ecc. — tutti con 1 export.  
Sono moduli di singola responsabilità (SRP): normale e corretto in questo codebase.  
**Impatto**: nessuno.  
**Remediation**: nessuna.

### F-A-05 [INFO] `path-utils` è il modulo più accoppiato (34 import)
**Evidenza**: `src/lib/path-utils.ts` importato 34 volte nel lib layer.  
È un'utility di normalizzazione path cross-platform — accoppiamento elevato ma giustificato (tutte le operazioni fs passano da lì per garantire Windows/Mac/Linux compatibility).  
**Impatto**: rischio basso — funzione stabile, non evolve frequentemente.  
**Remediation**: nessuna ora. Monitorare se diventa un bottleneck di change-frequency.

## Note per sessioni successive
- Verifica import circolari completa con `madge` o vite `--debug` in WS-D (richiede ambiente con Node).
- Analisi dead code export-level (`ts-prune`) da eseguire in WS-F con coverage run.
