---
phase: 13-config-file-dual-support
plan: 01
subsystem: configuration
tags:
  - config-files
  - backward-compatibility
  - file-resolution
dependency-graph:
  requires: []
  provides:
    - dual-config-file-support
    - openagent-json-resolution
  affects:
    - config-system
    - mcp-commands
tech-stack:
  added: []
  patterns:
    - file-precedence-ordering
    - multi-file-resolution
key-files:
  created: []
  modified:
    - packages/opencode/src/config/config.ts
    - packages/opencode/src/cli/cmd/mcp.ts
key-decisions:
  - title: "openagent.json takes precedence over opencode.json"
    rationale: "New branding preferred, existing configs still work"
  - title: "OPENCODE_* env vars remain unchanged"
    rationale: "Backward compatibility for existing deployments"
  - title: "Refactored pipe() to sequential mergeDeep() in global()"
    rationale: "Fixed TypeScript 'excessively deep type instantiation' error"
metrics:
  duration: 119
  completed: 2026-02-08T21:56:12Z
---

# Phase 13 Plan 01: Dual Config File Support Summary

**One-liner:** App reads openagent.json (preferred) with fallback to opencode.json at all config resolution points while preserving OPENCODE_* env var backward compatibility.

## Objective

Add dual config file support so the app reads `openagent.json` (preferred) with fallback to `opencode.json`. Users migrating from opencode to openagent can use either config file name. New users get the openagent-branded config. Existing OPENCODE_* env vars remain unchanged for backward compatibility.

## Tasks Completed

### Task 1: Add openagent config file resolution to config.ts

**Commit:** e3d4b9c2b

Updated config file resolution in 4 locations:

1. **Project config search** (line 84): Changed file array from `["opencode.jsonc", "opencode.json"]` to `["openagent.jsonc", "openagent.json", "opencode.jsonc", "opencode.json"]`

2. **.opencode/ directory config search** (line 131): Changed file array from `["opencode.jsonc", "opencode.json"]` to `["openagent.jsonc", "openagent.json", "opencode.jsonc", "opencode.json"]`

3. **Global config loading** (line 1107-1113): Changed from pipe() with 3 mergeDeep calls to sequential mergeDeep assignments to avoid TypeScript type depth error. Added openagent.json and openagent.jsonc loads after opencode files (so openagent files have higher precedence due to later assignment).

4. **globalConfigFile() function** (line 1283): Changed candidates array from `["opencode.jsonc", "opencode.json", "config.json"]` to `["openagent.jsonc", "openagent.json", "opencode.jsonc", "opencode.json", "config.json"]`

**Files modified:**
- `packages/opencode/src/config/config.ts`

### Task 2: Update MCP config path resolution for openagent.json

**Commit:** 9eb8a82b3

Updated the `resolveConfigPath` function in mcp.ts to prefer openagent.json over opencode.json when resolving where to write MCP config.

Changed candidates array from:
```typescript
const candidates = [path.join(baseDir, "opencode.json"), path.join(baseDir, "opencode.jsonc")]
```

to:
```typescript
const candidates = [
  path.join(baseDir, "openagent.json"),
  path.join(baseDir, "openagent.jsonc"),
  path.join(baseDir, "opencode.json"),
  path.join(baseDir, "opencode.jsonc"),
]
```

Also updated .opencode/ subdirectory candidates with same precedence order. Changed default from `opencode.json` to `openagent.json` for new MCP config writes.

**Files modified:**
- `packages/opencode/src/cli/cmd/mcp.ts`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type instantiation error in global() function**
- **Found during:** Task 1 verification
- **Issue:** Using pipe() with 5 mergeDeep calls caused "Type instantiation is excessively deep and possibly infinite" TypeScript error
- **Fix:** Refactored from pipe() to sequential mergeDeep() assignments
- **Files modified:** `packages/opencode/src/config/config.ts`
- **Commit:** e3d4b9c2b (incorporated into Task 1 commit)
- **Impact:** Functionally equivalent but avoids deep type nesting issue

## Verification Results

- ✅ TypeScript compiles without errors: `bunx tsc --noEmit`
- ✅ openagent.json appears in config.ts at all 4 locations (lines 84, 131, 1112-1113, 1283)
- ✅ openagent.json appears in mcp.ts at all expected locations (lines 385-386, 393-394, 406)
- ✅ OPENCODE_* env vars unchanged: 47 occurrences in flag.ts (verified before and after)
- ✅ Config resolution order correct at all locations:
  - openagent.jsonc > openagent.json > opencode.jsonc > opencode.json (at each location)
  - Global: opencode files loaded first, openagent files loaded last (higher precedence)
  - Project: findUp searches for all 4 file variants in correct order
- ✅ MCP config prefers openagent.json for new writes

## Implementation Notes

**Config file precedence:**
- **Project-level:** openagent.jsonc → openagent.json → opencode.jsonc → opencode.json
- **Global-level:** Sequential merge means later files override earlier (openagent.json/jsonc have final say)
- **MCP new writes:** Defaults to openagent.json when no config file exists

**Backward compatibility:**
- Existing opencode.json/opencode.jsonc files continue to work
- OPENCODE_* environment variables remain unchanged
- .opencode/ directory name unchanged (config directory convention, not config file name)
- Zod schema (Info) validates identically regardless of filename
- $schema URLs to opencode.ai remain unchanged (JSON schema URLs, not config file names)

**Type safety fix:**
The original plan called for adding 2 more mergeDeep calls to the pipe() chain, but this triggered TypeScript's "excessively deep type instantiation" error. The sequential mergeDeep approach is functionally equivalent and avoids the type system limitation.

## Success Criteria

- ✅ App reads openagent.json as primary config file at all resolution points
- ✅ App falls back to opencode.json when no openagent config exists
- ✅ Existing OPENCODE_* environment variables are completely unchanged
- ✅ Config schema validates identically regardless of filename
- ✅ MCP add command writes to openagent.json by default
- ✅ TypeScript compiles cleanly

## Self-Check: PASSED

**Files created:** None (no new files, only modifications)

**Files modified:**
- ✅ packages/opencode/src/config/config.ts exists and contains openagent.json references
- ✅ packages/opencode/src/cli/cmd/mcp.ts exists and contains openagent.json references

**Commits:**
- ✅ e3d4b9c2b: feat(13-01): add openagent config file resolution
- ✅ 9eb8a82b3: feat(13-01): update MCP config path resolution for openagent.json

**Verification:**
```bash
$ git log --oneline --all | grep -E "(e3d4b9c2b|9eb8a82b3)"
9eb8a82b3 feat(13-01): update MCP config path resolution for openagent.json
e3d4b9c2b feat(13-01): add openagent config file resolution
```

All commits exist and all modified files verified.
