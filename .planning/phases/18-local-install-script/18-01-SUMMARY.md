---
phase: 18-local-install-script
plan: 01
subsystem: build-system
tags: [install, build, deployment, local-install]
dependency-graph:
  requires: [build.ts, package.json]
  provides: [install.sh, local-install-method]
  affects: [deployment-workflow]
tech-stack:
  added: [bash-install-script]
  patterns: [build-from-source, platform-detection, bun-compile]
key-files:
  created:
    - install.sh
  modified:
    - packages/web/package.json
    - bun.lock
decisions:
  - context: "Local install method for v0.1.0"
    choice: "Build from source using existing build.ts --single flag"
    rationale: "Reuses proven build pipeline, avoids duplicating Bun compile logic"
  - context: "Workspace dependency issue blocking build"
    choice: "Fixed packages/web/package.json to reference @worksofadam/openagent"
    rationale: "Old 'opencode' reference prevented dependency resolution"
metrics:
  duration: 144
  tasks: 2
  files: 3
  completed: 2026-02-09
---

# Phase 18 Plan 01: Local Install Script Summary

Build-from-source install script using Bun's compile feature for platform-native binaries

## Objective

Created `install.sh` at repo root that builds openagent from source using Bun's compile feature, producing a platform-native binary and installing it to `~/.openagent/bin/`. This provides a working distribution method for v0.1.0 without requiring npm publishing.

## Tasks Completed

### Task 1: Create install.sh build-from-source script
**Commit:** 454adb7be

Created executable bash script at repo root with:
- Dependency checks (Bun, Git) with actionable error messages
- Platform detection (darwin/linux/windows, arm64/x64, Rosetta handling)
- Monorepo dependency installation via `bun install`
- Build execution via `cd packages/opencode && bun run build --single`
- Binary path detection using same logic as build.ts
- Installation to `~/.openagent/bin/openagent` with proper permissions
- Optional PATH setup with `--no-modify-path` flag
- Multi-shell support (bash, zsh, fish, ash, sh)
- Color-coded output matching existing install script style

**Files created:**
- `install.sh` (253 lines, executable)

**Verification:**
- Valid bash syntax (bash -n check)
- All flags and checks present
- Follows existing install script patterns

### Task 2: Verify install.sh builds and produces working binary
**Commit:** 538c3db29 (workspace fix)

**Issue discovered:** `packages/web/package.json` had stale workspace dependency `"opencode": "workspace:*"` which blocked dependency resolution.

**Fix applied:** Updated to `"@worksofadam/openagent": "workspace:*"` to match actual package name.

**End-to-end verification:**
- Ran `./install.sh --no-modify-path` successfully
- Build completed in ~60 seconds
- Binary installed at `~/.openagent/bin/openagent`
- Version check: `0.1.0` ✓
- Binary type: `Mach-O 64-bit executable arm64` (proper compiled binary, not script)
- Executable permissions: ✓

**Platform tested:** macOS ARM64 (darwin-arm64)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed workspace dependency reference**
- **Found during:** Task 2 - First install.sh execution
- **Issue:** `bun install` failed with "Workspace dependency 'opencode' not found". The `packages/web/package.json` devDependencies referenced `"opencode": "workspace:*"` which doesn't exist (old package name before fork).
- **Fix:** Updated `packages/web/package.json` to reference `"@worksofadam/openagent": "workspace:*"`, regenerated lockfile
- **Files modified:** `packages/web/package.json`, `bun.lock`
- **Commit:** 538c3db29
- **Rationale:** Blocking issue preventing any build execution. Required to complete task.

## Technical Details

### Build Pipeline

The install script leverages the existing `packages/opencode/script/build.ts` with the `--single` flag:

1. **Dependencies:** Runs `bun install` in repo root (installs monorepo workspaces)
2. **Build command:** `cd packages/opencode && bun run build --single`
3. **Build behavior:**
   - Sets `OPENCODE_VERSION=0.1.0` to avoid npm registry lookup
   - Generates models-snapshot.ts from models.dev API
   - Installs platform-specific @opentui/core and @parcel/watcher
   - Runs `Bun.build()` with `compile: {}` option
   - Produces binary at `dist/@worksofadam/openagent-{os}-{arch}/bin/openagent`

### Platform Detection

Uses same logic as build.ts and existing install script:
- **OS:** Maps `uname -s` to darwin/linux/windows
- **Arch:** Maps `uname -m` (aarch64→arm64, x86_64→x64)
- **Rosetta:** Detects ARM64 emulation on macOS Intel

### Installation

- **Binary location:** `~/.openagent/bin/openagent`
- **PATH setup:** Detects shell, adds export to appropriate config file
- **Permissions:** `chmod +x` applied after copy

## Verification Results

All success criteria met:

- [x] `install.sh` exists at repo root and is executable
- [x] Running `install.sh --no-modify-path` completes successfully
- [x] Binary exists at `~/.openagent/bin/openagent`
- [x] `~/.openagent/bin/openagent --version` returns version (0.1.0)
- [x] Script prints clear error when Bun is not available
- [x] `bash -n install.sh` confirms valid syntax
- [x] Built binary is a standalone executable (Mach-O), not a script

## User Impact

**Before:** No way to install openagent from cloned repo (npm publish not ready).

**After:** Users can run `./install.sh` from repo root to get a working `openagent` binary.

**Usage:**
```bash
git clone https://github.com/ajshedivy/openagent.git
cd openagent
./install.sh
# Restart shell or export PATH
openagent
```

## Files Changed

| File | Change | Lines | Description |
|------|--------|-------|-------------|
| install.sh | Created | +253 | Build-from-source install script |
| packages/web/package.json | Modified | ~2 | Fixed workspace dependency reference |
| bun.lock | Regenerated | ~20 | Lockfile with correct workspace resolution |

## Dependencies

**Requires:**
- Bun (any recent version)
- Git (for version detection in build.ts)
- Existing build.ts pipeline
- Monorepo workspace structure

**Provides:**
- Local install capability
- Platform-native binary distribution method
- Foundation for future installers (Homebrew, etc.)

## Known Limitations

1. **Build time:** ~60 seconds (full compilation)
2. **Disk usage:** Builds into `packages/opencode/dist/` (~50MB per platform)
3. **Platform support:** Only builds for current platform (by design)
4. **No version selection:** Always builds from current source

## Future Enhancements

- [ ] Add `--skip-build` flag to install from existing dist/
- [ ] Add `--target` flag for cross-compilation
- [ ] Progress indicators for long build step
- [ ] Pre-flight disk space check

## Self-Check: PASSED

**Created files:**
```bash
[ -f "install.sh" ] && echo "FOUND: install.sh" || echo "MISSING: install.sh"
```
Output: FOUND: install.sh

**Commits exist:**
```bash
git log --oneline --all | grep -q "454adb7be" && echo "FOUND: 454adb7be" || echo "MISSING: 454adb7be"
git log --oneline --all | grep -q "538c3db29" && echo "FOUND: 538c3db29" || echo "MISSING: 538c3db29"
```
Output: FOUND: 454adb7be, FOUND: 538c3db29

**Binary verification:**
```bash
~/.openagent/bin/openagent --version
```
Output: 0.1.0

All claims verified. Phase complete.
