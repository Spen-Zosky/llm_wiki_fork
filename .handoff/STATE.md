# llm_wiki_fork — STATE (vista rapida)

**Updated**: 2026-06-19 (S2 — fusion sweep: Phases 2d→7 shipped; final release build green).

> **Vista rapida** (priorità · open questions). Snapshot granulare → `docs/kb/SOT_STATE.md`.
> Backlog → `docs/kb/SOT_BACKLOG.md` · debiti → `docs/kb/DEBT_REGISTER.md`.
> Domini disgiunti — nessun numero qui.

## Last session brief (S2 — Phases 2d, 3, 4, 5, 6, 7-server)

Autonomous sequential sweep of the whole remaining fusion roadmap. Shipped (all on
`origin main`): Phase 2d (per-vault `layer` extension + 7-axis authoring guidance),
Phase 3 (structured arbitration), Phase 4 (`source_mode: linked`, flag-OFF), Phase 5
(MkDocs export + archive cycle + Export view), Phase 6 (graphify dual-layer: live invoke
+ consume), Phase 7 **server-side** (API write endpoints + bind flag, loopback default,
write disabled by default). TS gated each step; `cargo build --release` verified the full
binary links. Phase 7 client SPA + public go-live are the deferred remainder.

## Top priorities (next session)

> ✅ FATTO S2: Phases 2d, 3, 4, 5, 6, 7-server. ✅ FATTO precedenti: 0, 1, 2a-2c.

1. **Phase 7 client + go-live** — fetch-based `fs.ts` adapter + `build:web` + chat/LLM-exec
   proxy + vector upsert endpoints; then the **human-gated GO-LIVE** (TLS, OCI ingress,
   public exposure on the VM). ⛔ go-live = Enzo's manual decision. (L, multi-session)
2. **linked-sources management UI** — unlink/refresh panel (engine + Link button shipped;
   per-source management deferred). (S)
3. **graphify sigma overlay** — render the graphify layer inside `graph-view.tsx` (consume
   layer + Export-view stats shipped). (M) · **run `cargo test`** (S, Rust unit tests added
   in `api_server.rs` not yet executed).

## Open questions (autorità *cosa* = Enzo)

- Phase 7 go-live: bind `0.0.0.0` directly vs reverse-proxy (Caddy/nginx) on the VM keeping
  loopback? · TLS via proxy + Let's Encrypt (recommended) vs in-Rust rustls? · vault sync
  channel (git `wiki/` + rsync `raw/`) needed before central-host serving.

## Verification (next session)

```bash
cd /d/enzospenuso/Documents/GitHub/llm_wiki_fork
npm install && npm run typecheck && npm run test:mocks   # expect: typecheck 0, 1609 tests pass
git log origin/main..HEAD --oneline                       # 0 after push
git log --oneline -8                                      # tip: handoff S2; prior c9653e5
# Rust (optional): ~/.cargo/bin/cargo.exe build --release --manifest-path src-tauri/Cargo.toml  # green ~21min
```
