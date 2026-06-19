# Build Notes — toolchain + gotchas (per-machine)

Lessons from the Phase 0 build (S1) across Windows + linux-pc + VM OCI. Mirrors Enzo's global
memory `ref_tauri_lancedb_build`, kept in-repo so any clone/contributor has it.

## System prerequisites (beyond Node/npm)

- **Rust** (`rustup`) on every machine.
- **`protoc` (protobuf-compiler) is MANDATORY** — required by `lance-encoding` (a LanceDB dep). Without
  it the build fails with `Could not find protoc`. Linux: `sudo apt-get install -y protobuf-compiler`.
  Windows: `choco install protoc -y` (or set `PROTOC`).
- **Windows**: MSVC Build Tools (VC C++ workload) + WebView2 (already on Win11). Install via
  `winget install Rustlang.Rustup` + `winget install Microsoft.VisualStudio.2022.BuildTools`.
- **Linux (Ubuntu 24.04 / Zorin 17.3 jammy)**: `libwebkit2gtk-4.1-dev build-essential file libxdo-dev
  libssl-dev libayatana-appindicator3-dev librsvg2-dev`. webkit-4.1 IS available on jammy (universe),
  even if `apt-cache policy` shows an empty candidate before `apt-get update`.

## Command gotchas

- **Never** `sudo DEBIAN_FRONTEND=noninteractive apt-get …` on linux-pc — the scoped sudoers rejects
  setting env vars. Use plain `sudo apt-get install -y`.
- `. nvm.sh` returns exit 3 in a non-interactive shell, and the nvm `default` alias may point to an
  uninstalled version → do NOT put `nvm use default` in an `&&` chain and do NOT chain `&&` right after
  `. nvm.sh`; use `;`. The bare `. nvm.sh` already activates the current node.
- On Windows, after `rustup` install, `cargo` is not on the PATH of an already-open shell → prepend
  `%USERPROFILE%\.cargo\bin`.

## Build behavior (the key lesson)

- First build compiles the whole Rust crate tree; **LanceDB (`lance-*`, Arrow) + doc parsers
  (`calamine`, `docx-rs`) + webkit bindings dominate the time**.
- The **final binary LINK is the bottleneck**: ~18 min (linux-pc, Intel), ~22 min (VM ARM), ~67 min
  (Windows full build). It's a long, silent phase.
- **Long SSH/background jobs can be interrupted during the link → spurious exit 127** (the job dies right
  after `… (lib) generated N warnings`, no Rust error). NOT a build defect.
- **FIX**: run **`cargo build --release` directly in `src-tauri/`** and let it finish uninterrupted (the
  lib is cached + `dist` already built by the frontend `vite build`).
- `npm run tauri build -- --no-bundle`: the `--no-bundle` flag may be ignored (Windows produced `.msi` +
  NSIS anyway). For Linux headless the `target/release/` binary is enough.

## Per-machine

| Machine | Repo | Build | Run |
|---|---|---|---|
| Windows x64 | `D:\enzospenuso\Documents\GitHub\llm_wiki_fork` | ✅ + `.msi`/NSIS bundle | ✅ (display) |
| linux-pc x86-64 | `/home/enzo/llm_wiki_fork` | ✅ `target/release/llm-wiki` 61M | ✅ (physical display) |
| VM OCI ARM64 | `/home/ubuntu/llm_wiki_fork` | ✅ 54M | ❌ headless → web-target (#8, Model B host) |

Node: Windows 24, linux-pc 22, VM 20 (all via nvm; all ≥ Vite 8 requirement).
