# Fusion Plan — llm_wiki × wiki-factory × graphify

> **Status**: in progress — route C, **full-scope** (8 capabilities, phases 0-7). **Phase 0 ✅** (toolchain + build baseline on Windows/linux-pc/VM; 1534 tests green) · **Phase 1 ✅** (engine versioning + cache schema; +10 tests) · **Phase 2 (Dimensions) next**.
> **Created**: 2026-06-18
> **Owner**: Enzo Spenuso (Spen-Zosky)
> **Scope**: turn this fork (`Spen-Zosky/llm_wiki_fork`, fork of `nashsu/llm_wiki` v0.4.25) into a unified knowledge-base engine that absorbs the unique capabilities of `wiki-factory` (the personal LLM Wiki Engine, v1.3.0) and integrates `graphify` as a source-layer graph engine.

---

## 1. Context — three tools, one pattern

All three are instantiations of Andrej Karpathy's "LLM Wiki" pattern (`llm-wiki.md`: raw sources → LLM-generated wiki with `[[wikilinks]]` → schema; Obsidian-native).

| Tool | What it is | Stack | Role in fusion |
|---|---|---|---|
| **llm_wiki** (this fork) | Desktop knowledge-base app | Tauri v2 (Rust) + React 19/TS + Vite, LanceDB vector store | **Base** — receives the fused capabilities |
| **wiki-factory** | Personal LLM Wiki Engine + console | Claude Code CLI skill (markdown workflows + Python scripts) + FastAPI/React webapp | **Capability donor** — its specs are the transferable asset |
| **graphify** | Any-corpus → knowledge graph | Python pkg `graphifyy` (third-party, safishamsi) orchestrated by a CLI skill | **Source-layer graph engine** — integrated, not rewritten |

**Decision**: Route C (full fusion) over Route A (personal tool) / Route B (upstream contribution). llm_wiki becomes the unified runtime.

---

## 2. Guiding principle

The fusion is a **re-implementation in TypeScript**, not a code port. wiki-factory's logic is Python + markdown workflows; llm_wiki's logic lives almost entirely in `src/lib/` (TS), with a thin Rust layer. Therefore:

- **The transferable asset is wiki-factory's `references/` specs** (dimensions-taxonomy, conflict-resolution, archival-policy, manifest-schema, capability-map) — already written and validated. We re-implement *against the specs*, in TS.
- **graphify is different**: it is a third-party Python package wrapped by a skill. We **integrate it as an engine** (invoke + consume its `graph.json` / MCP server), we do **not** re-implement it.
- **Additivity over rewrite**: each capability lands as a *new file* in `src/lib/` wherever possible, hooking into existing extension points, to minimize merge conflicts with future `upstream` pulls.

---

## 3. Data-model gap (llm_wiki vs wiki-factory target)

| Aspect | wiki-factory (target) | llm_wiki (current) | Action |
|---|---|---|---|
| **State/manifest** | `manifest.yaml` + SHA-256 per source *and* stats/history | `.llm-wiki/ingest-cache.json` (JSON; SHA-256 of source content only, no per-page hash) | Extend the existing JSON |
| **Frontmatter** | 7 dimensional axes (facet/layer/scope/temporal-status/authority/provenance-confidence/freshness) | untyped `Record<string,string\|string[]>`; axes absent | Additive on `frontmatter.ts` + `wiki-schema.ts` |
| **Engine versioning** | `wiki_engine: 1.3.0` in manifest + migration | **absent** (only app version 0.4.25) | New `.llm-wiki/engine.json` |
| **Conflict resolution** | Formal arbitration (paths a/b/c/d + record) | weak "REVIEW: contradiction" + `mergePageContent` | Hook onto existing points |
| **Archive / MkDocs / linked / dual-graph** | all present | all absent | New modules |
| **Project identity** | in manifest | `.llm-wiki/project.json` `{id, createdAt}` | Reuse for engine.json pattern |

---

## 4. Capabilities to graft → precise injection map

Effort: **S** ≤1d · **M** 2-5d · **L** 1-2 weeks (estimates; low risk = additive + co-located test infra already present).

| # | Capability | Injection point in llm_wiki | Type | Effort | Risk |
|---|---|---|---|---|---|
| 1 | **Dimensions (7 axes) + dimensional lint** | `wiki-schema.ts` (parse a "## Dimensions" section), `frontmatter.ts`, `lint.ts` (+`dimensional` type), hook in `ingest.ts` write-loop (~line 1567, next to `validateWikiPageRouting`) | additive + hook | L | Low |
| 2 | **Structured arbitration** | `page-merge.ts` (`mergePageContent` / `MergeFn`) + `writeFileBlocks` loop (`ingest.ts` ~1539-1610), on top of existing `review-store.ts` / `sweep-reviews.ts` | hook on core | L | Medium |
| 3 | **`source_mode: linked`** (ingest git repos in-place, no copy) | `source-lifecycle.ts` (`importSourceFiles` copyFile ~179, `importSourceFolder` ~225, `isProjectScopedImport` ~90), `source-identity.ts` (external paths), sourceWatch | core | M | **Medium-High** (breaks the `raw/sources/` prefix assumption) |
| 4 | **Engine versioning + migration** | new `.llm-wiki/engine.json` (pattern from `project-identity.ts`); migration routine | additive | M | Low |
| 5 | **Archive cycle (tar.gz snapshot + gated removal)** | new `src/lib/archive-snapshot.ts` + new Rust command (needs `tar`/`flate2` crate — **verify `Cargo.toml`**) registered in `lib.rs::invoke_handler` + new view | additive + Rust + UI | L | Medium |
| 6 | **MkDocs static-site export** | new `src/lib/export-mkdocs.ts` + new view (`activeView` union in `wiki-store.ts:323`, switch in `content-area.tsx:14`, icon in `icon-sidebar.tsx`) | additive + UI | M | Low |
| 7 | **Graph dual-layer (graphify integration)** | invoke `graphifyy` on `raw/sources/` via the existing external-CLI pattern (`cli_resolver.rs` / `claude_cli.rs` / `codex_cli.rs`) **or** consume its MCP server; surface its `graph.json` + audit trail alongside the native wiki-link graph | integration (engine) | M | Low |
| 8 | **Web/served target** (browser access via public IP) | extend `src-tauri/src/api_server.rs` (already serves read + `/search` + `/graph` on :19828) with write/ingest + LLM-exec primitives; add a `fetch`-based variant of `src/commands/fs.ts`; serve the React SPA. Domain logic stays TS (runs in browser). | additive + Rust + frontend | M-L | **High** (FS exposed on public IP) |

### Note on #7 — why graphify is complementary, not redundant

llm_wiki **already has** a sophisticated graph: 4-signal relevance (directLink 3.0 / sourceOverlap 4.0 / Adamic-Adar 1.5 / typeAffinity 1.0 in `graph-relevance.ts`), Louvain communities (`wiki-graph.ts`), insights (`graph-insights.ts`). But it operates on the **compiled wiki pages**. graphify operates on the **raw sources**: AST extraction for code + LLM semantic extraction, every edge tagged EXTRACTED / INFERRED / AMBIGUOUS with a confidence score. They are **two layers**:

- native graph → *how the wiki pages link*
- graphify → *what is in the sources and how it connects, with provenance*

The audit trail (provenance per edge) aligns directly with wiki-factory's "zero hallucination / mandatory citations" doctrine. graphify also brings: code AST graph, BFS/DFS/shortest-path/explain query primitives, multi-export (Neo4j/GraphML/SVG), and a ready MCP server.

### Note on #8 — web/served target (turns the headless VM into a host)

The OCI VM is headless ARM64 — it cannot *run* the Tauri desktop GUI, but it has a **public IP**, so it can **serve** the engine to any browser/device. Two paths:

- **Immediate workaround (no code)**: run the native app inside a virtual display (`Xvfb`) exposed via **noVNC** (VNC-over-WebSocket). Desktop streaming — single-session, heavier; lock down with TLS + password + restricted OCI ingress.
- **Architectural (fusion-aligned)**: serve the React SPA + an HTTP backend exposing the primitives that today go through `invoke()`. Feasible because: (a) **domain logic is already TS in the frontend** (ingest/lint/query run in the WebView → would run identically in a browser); (b) `invoke()` calls are few and centralized (~52, mostly `src/commands/fs.ts` 23, `embedding.ts` 8, cli-transport 7, `file-sync.ts` 6); (c) `api_server.rs` **already** exposes read + `/search` (LanceDB vector) + `/graph` over HTTP with token-auth + `safe_join`. The code even flags the gap (`api_server.rs:270`): *"expose [chat/RAG] after moving the shared chat pipeline behind a backend command."* So the web target ≈ extend `api_server.rs` with write/ingest + LLM-exec primitives + a `fetch`-based `fs.ts` — **not a rewrite**. Result: a real multi-device webapp on the public IP, mirroring the wiki-factory Console model.

**Security is the gating concern**: filesystem primitives on a public IP require strong auth (token present), vault sandboxing (`safe_join` present), TLS, and a locked-down OCI ingress rule.

**Deployment model (decided 2026-06-18): Model B — VM as central host.** A single served instance runs on the **OCI VM** (public IP, otherwise-wasted headless box); the canonical vaults live there. **Windows and linux-pc** reach it as **browser clients** for remote use, and run the **native Tauri desktop app** for local/offline work. The web target is a single shared instance, not one-per-machine. Implication: keeping the desktop (local) and VM (central) vaults coherent requires a **sync channel** — wiki-factory's SYNC family (git for `wiki/` + rsync for `raw/`) — a dependency to schedule alongside #8 if offline-desktop and central-web must stay in sync. The public-IP hardening (auth/TLS/ingress) applies specifically to the VM host.

---

## 5. Recommended phasing (with dependencies)

- **Phase 0 — Setup** ✅ **DONE 2026-06-18**: Rust/Tauri toolchain on all 3 machines; build baseline green (Windows x64 + bundle, linux-pc x86-64, VM ARM64); app run + `api_server` OK on Windows; `test:mocks` 1524 green. Deferred: Claude CLI provider config (runtime; not needed until ingest). Lesson: `protoc` required by LanceDB; link is the bottleneck — use direct `cargo build` (see memory `ref_tauri_lancedb_build`).
- **Phase 1 — Data foundations** ✅ **DONE 2026-06-18**: `src/lib/engine-version.ts` (engine.json versioning + `needsMigration`) + cache schema extended (`status`/`engineVersion`/`archivalCycles`, non-breaking) + `ensureEngineMeta` hooked in `createProject` only (legacy vaults stay migratable). +10 tests, typecheck green.
- **Phase 2 — Dimensions + dimensional lint** (#1): the distinctive DNA of the engine. Additive, high value, low risk.
- **Phase 3 — Arbitration** (#2): on top of the existing review subsystem.
- **Phase 4 — `source_mode: linked`** (#3): to ingest your own repos (e.g. `heuresys-advanced`).
- **Phase 5 — Archive + MkDocs export** (#5, #6): need Rust and new views.
- **Phase 6 — Graph dual-layer / graphify** (#7): integration; independent, can be pulled earlier if desired.
- **Phase 7 — Web/served target** (#8) — **Model B: VM = central host**: noVNC for an immediate public-IP view (no code); then served-SPA + HTTP-primitives on the VM. Windows/linux-pc are browser clients (+ native desktop for local/offline). Independent; security-gated; needs a vault-sync channel (SYNC) for desktop↔VM coherence.

After Phase 1, phases 2-7 are largely independent.

---

## 6. Set-up decisions to make before starting

1. **Manifest**: extend `ingest-cache.json` (stays JSON, less divergence) **vs** introduce a parallel `manifest.yaml` (wiki-factory style). → leaning **extend the JSON**.
2. **Module isolation**: keep each capability as a **new additive file** in `src/lib/` to minimize future `upstream` merge conflicts. → strongly **yes**.
3. **Rust toolchain**: install early (needed for real build/test). 
4. **graphify coupling**: invoke as a subprocess CLI vs consume via its MCP server. → MCP server is the cleaner contract.
5. **Provider**: configure Claude CLI as default LLM provider (aligns with the workflow, no paid API).

---

## 7. Risks & mitigations

| Risk | Prob × Impact | Mitigation |
|---|---|---|
| Permanent divergence from `upstream` | High × Medium | Additive modules only; never rewrite `ingest.ts` core — use hook points. Periodic `git merge upstream/main`. |
| `source_mode: linked` breaks `raw/sources/` assumptions | Medium × High | Feature-flag the no-copy path; revise `source-identity.ts` for external absolute paths behind the flag; full test pass before enabling. |
| Re-implementation drift from wiki-factory specs | Medium × Medium | Port *against the `references/` specs*, with the co-located test pattern (`<feature>.test.ts`) per capability. |
| graphify license (re: bundling/distribution) | Unknown × Medium | **Verify `graphifyy` license** before bundling. llm_wiki itself is GPLv3 — factor in. |
| Python dependency added to a Tauri/Rust app | Low × Low | App already shells to external CLIs; document the runtime requirement. |
| Build cost on old Mac hardware | Medium × Low | Build on Windows or OCI VM, not the Mac. |
| Web target (#8): FS primitives exposed on public IP | Medium × High | Token auth + `safe_join` sandbox (both already in `api_server.rs`) + TLS + locked-down OCI ingress; never expose write/ingest unauthenticated. |

---

## 8. Decision & next step

**Scope decided (2026-06-18): FULL** — commit to all 8 capabilities across phases 0-7 (multi-week / multi-session).

**Done so far**: Phase 0 (build baseline on 3 machines, 1534 tests green) + Phase 1 (data foundations) ✅.

**Immediate next step**: Phase 2 — Dimensions (7 axes) + dimensional lint (#1): extend `wiki-schema.ts` (parse a "## Dimensions" section), `frontmatter.ts`, `lint.ts` (+`dimensional` type), hook in `ingest.ts` write-loop. Innesta sul formato reale di `schema.md` (verificato nel vault demo: sezioni `## Page Types` / `## Frontmatter` / `## Contradiction Handling`).

---

## 9. References

### llm_wiki (this fork) — key files
- Ingest pipeline: `src/lib/ingest.ts` (entry `autoIngest`/`autoIngestImpl` ~485; write-loop ~1539-1610; schema gate `validateWikiPageRouting` ~1567)
- Page merge: `src/lib/page-merge.ts`
- Schema routing: `src/lib/wiki-schema.ts`; frontmatter: `src/lib/frontmatter.ts`; page types: `src/lib/wiki-page-types.ts`
- Lint: `src/lib/lint.ts`
- State/persist: `src/lib/ingest-cache.ts`, `src/lib/persist.ts`, `src/lib/project-identity.ts`, `src/lib/project-store.ts`
- Source lifecycle: `src/lib/source-lifecycle.ts`, `src/lib/source-identity.ts`, `src/lib/wiki-page-delete.ts`
- Graph: `src/lib/graph-relevance.ts`, `src/lib/wiki-graph.ts`, `src/lib/graph-insights.ts`
- Retrieval: `src/lib/search.ts`, `src/lib/embedding.ts` ↔ Rust `src-tauri/src/commands/{search.rs,vectorstore.rs}`
- External CLI pattern: `src-tauri/src/commands/{cli_resolver.rs,claude_cli.rs,codex_cli.rs}`
- HTTP API server (web-target base): `src-tauri/src/api_server.rs` (read + `/search` w/ LanceDB vector + `/graph` on :19828; token-auth + `safe_join`; `api_server.rs:270` flags chat/RAG as not-yet-exposed)
- View wiring: `src/stores/wiki-store.ts` (`activeView` ~323), `src/components/layout/{content-area.tsx,icon-sidebar.tsx}`
- Command registration: `src-tauri/src/lib.rs::invoke_handler`

### wiki-factory — spec sources (the transferable asset)
- `C:\Users\enzospenuso\wiki-factory\.claude\skills\llm-wiki\references\capability-map.md` (17 capability families, ~92 atomic ops)
- `references/dimensions-taxonomy.md`, `conflict-resolution.md`, `archival-policy.md`, `manifest-schema.md`, `cross-vault-linking.md`, `provenance-tracking.md`, `sync-remote.md`, `export-mkdocs.md`

### graphify
- Skill: `C:\Users\enzospenuso\.claude\skills\graphify\SKILL.md` (pkg `graphifyy`; MCP server tools: `query_graph`, `get_node`, `get_neighbors`, `get_community`, `god_nodes`, `graph_stats`, `shortest_path`)
- Sample output on real data: `C:\Users\enzospenuso\wiki-space\heuresys-advanced-graph\` (index.html + src-mirror)
