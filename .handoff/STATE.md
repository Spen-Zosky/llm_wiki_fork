# llm_wiki_fork — STATE (vista rapida)

**Updated**: 2026-06-19 (S1 — fusion kickoff + Phases 0-1-2c shipped; stopped at Phase 2d micro-plan).

> **Vista rapida** (priorità · open questions). Snapshot granulare → `docs/kb/SOT_STATE.md`.
> Backlog → `docs/kb/SOT_BACKLOG.md` · debiti → `docs/kb/DEBT_REGISTER.md`.
> Domini disgiunti — nessun numero qui.

## Last session brief (S1 — fusion kickoff + Phases 0-2c)

Forked `nashsu/llm_wiki`; wrote the fusion plan (`plans/fusion-wiki-factory.md`, Route C,
8 capabilities, Model B deployment). Shipped Phase 0 (build baseline on Windows/linux-pc/VM),
Phase 1 (engine versioning + extensible cache schema), Phase 2 steps 2a-2c (7-axis dimensions
taxonomy + validation, dimensional lint + UI, freshness stamping at ingest). All pushed to
`origin main` (tip `6f4381d`). Stopped at the Phase 2d micro-plan — presented, not yet written.

## Top priorities (next session)

> ✅ FATTO S1: Phases 0, 1, 2a-2c.

1. **B-01 Phase 2d-i** — `## Dimensions` parsing in `schema.md` → per-vault `layer` extensions
   (`wiki-schema.ts` extract `sectionLines` + `parseWikiSchemaDimensions` + loader; `dimensions.ts`
   `validateDimensions(fm, {extraLayers})`; `lint.ts` `runDimensionalLint` passes extraLayers).
   Micro-plan ready → `docs/kb/SOT_STATE.md` §6. (S-M)
2. **B-02 Phase 2d-ii/iii** — authoring-default guidance in the generation prompt (`ingest.ts`);
   optional `## Dimensions` example in new-vault scaffold (Rust `project.rs`). (S)
3. **B-03 Phase 3 — Arbitration (#2)** — structured conflict resolution on `page-merge.ts` +
   write-loop, over the existing review subsystem. (L, multi-session)

## Open questions (autorità *cosa* = Enzo)

- 2d `layer`: extra values **additive** to engine defaults (decided) · should `## Dimensions`
  also be able to restrict the 6 fixed axes? (current: no, fixed cross-vault) · App LLM provider
  (Claude CLI) config still deferred — needed before any live ingest testing.

## Verification (next session)

```bash
cd /d/enzospenuso/Documents/GitHub/llm_wiki_fork
npm install && npm run typecheck && npm run test:mocks   # expect: typecheck 0, 1560 tests pass
git log origin/main..HEAD --oneline                       # 0 after push
git log --oneline -3                                       # tip: handoff commit; prior 6f4381d
```
