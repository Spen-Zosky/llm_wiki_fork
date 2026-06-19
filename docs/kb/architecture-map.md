# Architecture Map — llm_wiki internals + fusion injection points

Knowledge captured from codebase exploration during the fusion kickoff (S1), so future phases
don't have to re-discover it. Pattern: the **frontend (`src/lib/`, TS) orchestrates all
ingest/lint/graph logic**; the Rust backend (`src-tauri/`) exposes only FS primitives, tokenized
search, the LanceDB vector store, and CLI-process bridges. Everything crosses via `invoke()`.

## Data model (a generated vault)

- Dirs: `raw/sources/`, `raw/assets/`, `wiki/{entities,concepts,sources,queries,comparisons,synthesis}/`,
  `schema.md`, `purpose.md`, `.obsidian/`, `.llm-wiki/`. Scaffolded by Rust `commands/project.rs::create_project_impl`.
- Page types: `src/lib/wiki-page-types.ts` (`GENERATION_WIKI_TYPES`, `WIKI_TYPE_DIRS`, `inferWikiTypeFromPath`).
- Frontmatter: **untyped** `Record<string, string|string[]>` (`src/lib/frontmatter.ts`, `FrontmatterValue`,
  `parseFrontmatter`, `normalize`; `Date` → ISO `slice(0,10)` at line ~197 — the bridge for `freshness`).
- State (in `.llm-wiki/`): `project.json` `{id,createdAt}` (`project-identity.ts`); `ingest-cache.json`
  (`ingest-cache.ts` — SHA-256 of source content, the de-facto manifest); `review.json`, `lint.json`,
  `conversations.json`, `chats/`. Global app state: Tauri plugin-store `app-state.json` (`project-store.ts`).
  **Fusion added** `engine.json` (`engine-version.ts`).

## Ingest pipeline (`src/lib/ingest.ts`, ~3051 lines)

- Entry `autoIngest` → `autoIngestImpl` (~485), under `withProjectLock`. Two-step CoT: analysis
  (`buildAnalysisPrompt`) → generation (`buildGenerationPrompt`, reads `schema.md`+`purpose.md`+index).
- `writeFileBlocks` (~1514) loops per page block (~1539-1610). Transform order: `sanitizeIngestedFileContent`
  → `stampGeneratedFrontmatterDates` (~1557, sets created/updated) → **`stampFreshness` (fusion, ~1558)**
  → `canonicalizeSourcesField` → `rewriteIngestPathFromTitleForTargetLanguage` → `validateWikiPageRouting`
  (~1567, drops page on routing mismatch via `continue`) → language guard → `mergePageContent`.
- **Hook points for future capabilities**: per-block transforms (~1557-1567) for dimensional stamping;
  `page-merge.ts::mergePageContent`/`MergeFn` for arbitration on conflicting content; post-ingest
  `review-store` (weak "REVIEW: contradiction" already exists — Phase 3 builds the structured arbitration here).

## Schema parsing (`src/lib/wiki-schema.ts`, 118 lines)

- `loadProjectWikiSchemaRouting` → `parseWikiSchemaRouting` (table `| type | dir |`) → `WikiSchemaRouting.typeDirs`.
- `pageTypesSectionLines` finds the "Page Types" heading + slices to the next ≤-level heading — **generalize
  to `sectionLines(md, regex)` for the `## Dimensions` section (Phase 2d-i)**.
- `validateWikiPageRouting` — clone as `validateWikiPageDimensions`.

## Lint (`src/lib/lint.ts`, ~441 lines)

- `LintResult` `{type: orphan|broken-link|no-outlinks|semantic|dimensional, severity: warning|info, ...}`.
- `runStructuralLint` (deterministic, ~150) — the pattern to clone (listDirectory → flattenMdFiles → per-page).
- `runSemanticLint` (LLM). **`runDimensionalLint` (fusion)** — deterministic, uses `validateDimensions`.
- No single aggregator: orchestration in `components/lint/lint-view.tsx::handleRunLint` (~85); store
  `stores/lint-store.ts` (`LintItem` derives type/severity from `LintResult`); UI `typeConfig` + render
  fallback `typeConfig[type] ?? typeConfig.semantic` (~386). i18n labels in `src/i18n/{en,zh}.json`.

## Retrieval (3 subsystems, frontend-orchestrated)

- Tokenized: Rust `commands/search.rs` ← `src/lib/search.ts`. Vector: Rust `commands/vectorstore.rs`
  (LanceDB) ← `src/lib/embedding.ts`. Graph: `src/lib/graph-relevance.ts` (4-signal: directLink 3.0 /
  sourceOverlap 4.0 / Adamic-Adar 1.5 / typeAffinity 1.0), Louvain `wiki-graph.ts`, insights `graph-insights.ts`.

## HTTP API server (`src-tauri/src/api_server.rs`) — base for web-target (#8)

- Binds `127.0.0.1:19828`, prefix `/api/v1`, token-auth, `safe_join` anti-traversal, rate-limited.
- Endpoints: `GET /projects`, `/files`, `/files/content`, `/reviews`, `POST /search` (incl. LanceDB vector),
  `GET /graph`, `POST /sources/rescan`. **Missing**: writes/ingest + LLM exec — code TODO at line ~270
  ("expose [chat/RAG] after moving the shared chat pipeline behind a backend command").
- `invoke()` is centralized (~52 calls, mostly `src/commands/fs.ts` 23, `embedding.ts` 8, cli-transport 7,
  `file-sync.ts` 6) → a web-target needs a `fetch`-based `fs.ts` + bind 0.0.0.0 + the missing write endpoints.
- External-CLI bridges already present: `src-tauri/src/commands/{cli_resolver,claude_cli,codex_cli}.rs` — the
  app can use Claude/Codex CLI as the LLM engine (no paid API), and the same pattern fits graphify (#7).

## Capability → injection point (summary; full detail in `plans/fusion-wiki-factory.md` §4)

| # | Capability | Inject at |
|---|---|---|
| 1 | Dimensions + lint (✅ 2a-2c) | `dimensions.ts`, `lint.ts`, `ingest.ts` write-loop, `wiki-schema.ts` (2d) |
| 2 | Arbitration | `page-merge.ts` `MergeFn` + write-loop, over `review-store`/`sweep-reviews.ts` |
| 3 | source_mode: linked | `source-lifecycle.ts` (skip copyFile), `source-identity.ts` (external paths) |
| 4 | Engine versioning (✅ P1) | `engine-version.ts` + `createProject` |
| 5 | Archive cycle / MkDocs | new `src/lib/{archive-snapshot,export-mkdocs}.ts` + Rust `tar`/`flate2` + new view |
| 6 | Graph dual-layer (graphify) | invoke `graphifyy` via `cli_resolver.rs` pattern or its MCP server; consume `graph.json` |
| 7 | Web/served target (#8) | extend `api_server.rs` (writes + LLM) + `fetch`-based `fs.ts` + serve SPA (Model B: VM host) |

## Why the fusion (gap analysis: nashsu vs wiki-factory)

The fork (nashsu/llm_wiki) and Enzo's wiki-factory are independent instantiations of the same
"LLM Wiki" pattern (Karpathy: raw → wiki `[[wikilink]]` → schema). **nashsu has** what wiki-factory
lacked: vector/semantic search (LanceDB) + hybrid retrieval, a rich knowledge graph (4-signal + Louvain
+ insights), a desktop UI, WYSIWYG editor (Milkdown), Chrome clipper, MCP server, multi-conversation chat,
i18n, and **already integrates Claude/Codex CLI as LLM provider**. **wiki-factory has** what nashsu
lacks: formal arbitration, the 7-axis dimensional taxonomy + dimensional lint, archive cycle, `source_mode:
linked`, engine-version migration, MkDocs export, cross-vault registry — all spec'd in its `references/`.
Route C = absorb wiki-factory's capabilities into nashsu's richer base (TS re-implementation against the
specs, not a code port) + integrate graphify for the source-layer graph. See `plans/fusion-wiki-factory.md`.
