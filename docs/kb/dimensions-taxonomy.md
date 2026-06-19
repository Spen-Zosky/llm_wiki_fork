# Dimensions Taxonomy — 7-axis spec (fusion reference)

Ported from wiki-factory `references/dimensions-taxonomy.md` (engine v1.2). This is the
authoritative spec for the dimensional frontmatter the fusion adds. Implementation status:
axes + validation + `freshness` derivation are live (`src/lib/dimensions.ts`, Phases 2a-2c);
`layer` per-vault extension = Phase 2d-i; authoring-defaults + `source_kind` mapping = Phase 2d-ii.

All 7 axes are **optional** on a page (absent = wildcard `*`, no finding). Only **present**
values are validated. `validateDimensions` flags invalid values as `error`; `temporal-status:
superseded` requires `superseded-by: <slug>`.

## The 7 axes

| Axis (frontmatter key) | Valid values | Meaning |
|---|---|---|
| `facet` | principle · decision · implementation · analysis · observation · exploration · aggregate | Nature of the page's statement (design intent / choice / realization / study / data / open question / meta-summary) |
| `layer` | business · architecture · backend · frontend · data · infra · process · compliance · governance · content — **per-vault extendable** | System layer/concern the claim applies to |
| `scope` | core · commodity · optional · platform-wide · tenant-specific · contextual | How broadly the claim applies |
| `temporal-status` | current · historical · planned · superseded | Temporal validity (`superseded` requires `superseded-by: <slug>`) |
| `authority` | canonical · authoritative · supportive · exploratory · non-authoritative | Weight in conflict arbitration (`non-authoritative` = excluded from arbitration) |
| `provenance-confidence` | verified · derived · interpreted · unsourced | Solidity of the claim's provenance chain |
| `freshness` | live · recent · aged · stale-info · evergreen | Temporal decay of the info, independent of `temporal-status` |

**Extendability**: only `layer` is extendable per-vault — extra values declared in a
`## Dimensions` section of the vault's `schema.md` (Phase 2d-i). The other 6 axes are fixed
(must stay comparable cross-vault) → enum hard-coded.

## Auto-derivation: `freshness` from `updated:`

Derived unless explicitly set (`src/lib/dimensions.ts::deriveFreshness`, live since 2a/2c):
- `live`: updated < 30 days · `recent`: 30–180d · `aged`: 180d–2y · `stale-info`: > 2y
- `evergreen`: **explicit-only, never derived**
- Pages without `updated:` → no derivation, no finding

## Authoring-defaults per page-type (Phase 2d-ii — LLM prompt guidance, not hard-coded)

Guidance the generation prompt should give the LLM so it populates dimensions from content:
- `type: source` → `facet` from `source_kind` (mapping below)
- `type: concept` → `facet=principle`, `authority=authoritative`, `temporal-status=current`
- `type: synthesis` → `facet=analysis|aggregate`, `authority=supportive`, `temporal-status=current`
- `type: entity` and meta types → dimensions omitted

## `source_kind` → `facet` / `authority` mapping (heuristic, for bulk/migration)

- `adr` (Accepted) → `facet=decision`, `authority=canonical`
- `framework` → `facet=principle`, `authority=authoritative`
- `deck` / `pitch-deck` → `facet=aggregate`, `authority=non-authoritative`
- `layer` / `scope` / `temporal-status` typically inferred from path/title or set manually.

## Prescribed lint integration (status)

- **provenance-confidence check** (severity warning): synthesis without resolvable `sources:` →
  suggest `unsourced`; `derived|interpreted` + `authority: authoritative` → mismatch warning;
  invalid value → validation error. *(not yet implemented — Phase 2b covers value validation; the
  cross-field rules are future work.)*
- **freshness check** (severity info): auto-derived `stale-info` not marked `evergreen` → finding;
  explicit `freshness: stale-info` → review finding; invalid value → validation error; no `updated:`
  → silent. *(value validation live in 2b; the stale-info surfacing is future.)*
- In this fork the lint UI severity union is `warning|info`; the spec's "validation error" tier maps
  to `warning` (see `DEBT_REGISTER` D-01).

## Where it lives in the fork

- `src/lib/dimensions.ts` — axes, `validateDimensions`, `deriveFreshness`, `stampFreshness`.
- `src/lib/lint.ts::runDimensionalLint` — value validation surfaced in the Lint view.
- `src/lib/ingest.ts` (write-loop) — `stampFreshness` on every ingested page.
- Phase 2d will add `## Dimensions` parsing (`wiki-schema.ts`) + authoring-default prompt (`ingest.ts`).
