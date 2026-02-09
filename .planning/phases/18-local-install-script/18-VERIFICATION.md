---
phase: 18-local-install-script
verified: 2026-02-09T07:45:00Z
status: passed
score: 4/4 must-haves verified
---

# Phase 18: Local Install Script Verification Report

**Phase Goal:** Users can clone the repo and run `install.sh` to build openagent with platform-specific Bun-compiled binaries and get a working local `openagent` executable

**Verified:** 2026-02-09T07:45:00Z

**Status:** passed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can run ./install.sh from repo root and get a working openagent binary | ✓ VERIFIED | install.sh exists, is executable, builds binary via `bun run build --single`, installs to ~/.openagent/bin/openagent |
| 2 | Script fails gracefully with clear error if Bun is not installed | ✓ VERIFIED | Lines 51-59: Checks `command -v bun`, prints actionable error with install link, exits 1 |
| 3 | After install, running 'openagent' (or the binary path) shows version and launches correctly | ✓ VERIFIED | Binary at ~/.openagent/bin/openagent runs, outputs version "0.1.0", shows help with all commands |
| 4 | Script builds only for the current platform (not all 11 targets) | ✓ VERIFIED | Line 127: `bun run build --single` uses --single flag to build current platform only |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `install.sh` | Local build-from-source install script | ✓ VERIFIED | Exists at repo root, 253 lines, executable (chmod +x), valid bash syntax, contains "bun build" |
| `~/.openagent/bin/openagent` | Compiled binary | ✓ VERIFIED | Mach-O 64-bit executable arm64, 102MB, runs correctly, version 0.1.0 |
| `packages/opencode/script/build.ts` | Build script with --single flag | ✓ VERIFIED | Exists, contains --single flag handling (line 28), uses Bun.build with compile option (line 151) |

**Artifact Details:**

**install.sh** (Level 1: Exists) ✓
- Path: /Users/adamshedivy/Documents/IBM/sandbox/oss/ai/opencode-agno/install.sh
- Size: 253 lines
- Executable: Yes
- Shebang: `#!/usr/bin/env bash`

**install.sh** (Level 2: Substantive) ✓
- Dependency checks: Bun (line 51), Git (line 61)
- Platform detection: OS and arch mapping (lines 84-107)
- Build execution: `cd packages/opencode && bun run build --single` (line 127)
- Binary installation: Copy to ~/.openagent/bin/ (line 157)
- PATH setup: Multi-shell support with --no-modify-path flag (lines 190-234)
- Error handling: Clear error messages for missing deps, failed builds, missing binary
- Not a stub: Full implementation with all required features

**install.sh** (Level 3: Wired) ✓
- Not imported/required by other files (standalone executable script)
- Wiring verified by successful execution: Binary built and installed at expected location
- Integration points:
  - Calls `packages/opencode/script/build.ts` via `bun run build --single` ✓
  - Outputs binary to `packages/opencode/dist/@worksofadam/openagent-{os}-{arch}/bin/openagent` ✓
  - Copies to `~/.openagent/bin/openagent` ✓

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| install.sh | packages/opencode/script/build.ts | `bun run build --single` | ✓ WIRED | Line 127: `bun run build --single` executes build script with --single flag |
| install.sh | ~/.openagent/bin/openagent | cp of compiled binary | ✓ WIRED | Line 135-147: Locates binary at `packages/opencode/dist/@worksofadam/openagent-$os-$arch/bin/openagent`, line 157: copies to install dir |
| build.ts | Bun.build compile | --single flag filtering | ✓ WIRED | build.ts line 28: `const singleFlag = process.argv.includes("--single")`, line 151: `compile: {}` option |
| Binary | User shell PATH | PATH modification or manual export | ✓ WIRED | Lines 190-234: Adds to shell config (bash, zsh, fish, etc.) unless --no-modify-path flag used |

**Link Details:**

**install.sh → build.ts** ✓ WIRED
- Pattern: `bun run build --single`
- Found: Line 127
- Verification: Build completes successfully, binary produced at expected path
- Response handling: Lines 128-130 check exit code, print error on failure

**build.ts → Bun.build** ✓ WIRED
- Pattern: `compile: {}` with --single flag check
- Found: Line 151 (compile option), line 28 (flag detection)
- Verification: Binary is Mach-O 64-bit executable arm64 (compiled, not interpreted)
- Result: Platform-specific binary at dist/@worksofadam/openagent-darwin-arm64/bin/openagent

**install.sh → Binary Installation** ✓ WIRED
- Pattern: Copy binary to ~/.openagent/bin/
- Found: Lines 135-147 (path detection), line 157 (copy), line 158 (chmod +x)
- Verification: Binary exists at ~/.openagent/bin/openagent, is executable, runs correctly
- Version check: Line 161-166 verifies binary works after installation

### Requirements Coverage

**Note:** ROADMAP.md references "REL-01 (local installability)" but REQUIREMENTS.md defines REL-01 as "Git tag v0.1.0 created at release" (mapped to Phase 17). This appears to be a documentation mismatch. Verification focused on Phase 18's explicit success criteria from ROADMAP.md.

| Requirement | Description | Status | Notes |
|-------------|-------------|--------|-------|
| Success Criterion 1 | install.sh exists at repo root and is executable | ✓ SATISFIED | Verified: file exists, is executable, has valid bash syntax |
| Success Criterion 2 | Running install.sh builds openagent for current platform via bun build --compile | ✓ SATISFIED | Verified: Uses build.ts with --single flag, produces compiled binary |
| Success Criterion 3 | After install, openagent command is available (symlinked or in PATH) | ✓ SATISFIED | Verified: Binary at ~/.openagent/bin/openagent, PATH setup via shell config |
| Success Criterion 4 | Built binary runs correctly and shows version | ✓ SATISFIED | Verified: Binary runs, shows version 0.1.0, help output displays all commands |
| Success Criterion 5 | Script handles missing dependencies with clear errors | ✓ SATISFIED | Verified: Checks Bun and Git, prints actionable error messages |

### Anti-Patterns Found

**None.** No blocking anti-patterns detected.

Scan results:
- TODO/FIXME/PLACEHOLDER comments: None found
- Empty implementations: None found
- Console.log only implementations: None found
- Stub patterns: None found
- Valid bash syntax: Confirmed (bash -n check passed)

### Human Verification Required

None. All verification can be performed programmatically and has been completed.

The following items were verified:
- Binary execution and version output
- Error message clarity (code inspection)
- Platform detection logic (code inspection + actual execution on macOS ARM64)
- PATH setup across multiple shell types (code inspection)
- Build-to-install pipeline integrity (end-to-end execution)

**Additional manual testing performed by implementation:**
Per SUMMARY.md line 73-77:
- Ran `./install.sh --no-modify-path` successfully
- Build completed in ~60 seconds
- Binary installed at ~/.openagent/bin/openagent
- Version check: 0.1.0 ✓
- Binary type: Mach-O 64-bit executable arm64 ✓

### Overall Assessment

**Status: PASSED**

All must-haves verified. Phase goal achieved. Ready to proceed.

**Summary:**
- All 4 observable truths verified
- All 3 required artifacts exist, are substantive, and are properly wired
- All 4 key links verified as WIRED
- All 5 success criteria satisfied
- No blocking anti-patterns found
- No human verification required

**What was delivered:**
1. `install.sh` at repo root: 253-line bash script that builds openagent from source
2. Working build pipeline: Uses existing build.ts with --single flag to produce platform-specific binary
3. Binary installation: Copies compiled binary to ~/.openagent/bin/openagent with proper permissions
4. PATH management: Optionally adds binary to shell config with multi-shell support
5. Error handling: Clear, actionable error messages for missing dependencies
6. Workspace fix: Fixed packages/web/package.json stale workspace reference (blocking issue)

**Verified capabilities:**
- Users can clone repo and run `./install.sh` to get working openagent binary
- Build completes successfully on macOS ARM64 (darwin-arm64)
- Binary is standalone compiled executable (not script)
- Binary runs correctly and shows version
- Script handles missing Bun with clear error message
- Only builds for current platform (--single flag)

**Platform tested:** macOS ARM64 (darwin-arm64)

**Commits verified:**
- 454adb7be: Created install.sh script
- 538c3db29: Fixed workspace dependency reference

---

_Verified: 2026-02-09T07:45:00Z_
_Verifier: Claude (gsd-verifier)_
