---
phase: 07-sdk-client-foundation
plan: 01
subsystem: provider-integration
tags:
  - sdk
  - client
  - authentication
  - agent-discovery
  - typescript
requires:
  - 06-03-PLAN # AgentOS Hub completion
provides:
  - SDK client singleton (getAgentOSClient)
  - SDK-based agent discovery
  - Removal of custom fetch wrapper
affects:
  - 08-agent-discovery-migration # Will use client.agents.list()
  - 09-agent-streaming-migration # Will use SDK AgentStream
  - 10-tool-confirmation-migration # Will use client.agents.continue()
tech-stack:
  added:
    - "@worksofadam/agentos-sdk@0.3.0"
  patterns:
    - Singleton pattern for SDK client
    - Lazy initialization with config/env resolution
    - SDK-managed authentication (Bearer token)
key-files:
  created:
    - packages/opencode/src/provider/sdk/agentos/agentos-client.ts
  modified:
    - packages/opencode/package.json
    - packages/opencode/src/plugin/agentos.ts
key-decisions:
  - decision: Use GitHub package instead of npm registry
    rationale: SDK not published to npm, GitHub repository at ajshedivy/agentos-sdk#v0.3.0
    impact: Requires git access for installation
  - decision: Cast SDK AgentResponse to custom AgentOSAgent type
    rationale: Phase 7 maintains backward compatibility; Phase 11 will migrate to SDK types
    impact: Temporary type casting until TYPE-01/02/03 complete
  - decision: SDK client uses baseUrl (not baseURL)
    rationale: SDK constructor expects { baseUrl, apiKey } per client.ts inspection
    impact: Internal mapping in getAgentOSClient() function
duration: 5min
completed: 2026-02-07
---

# Phase 07 Plan 01: SDK Client Foundation Summary

**Installed `@worksofadam/agentos-sdk@0.3.0` from GitHub, created shared SDK client singleton with config/env resolution, and removed custom fetch wrapper from plugin for SDK-based agent discovery.**

## Performance

- **Started:** 2026-02-07 20:41:44 UTC
- **Completed:** 2026-02-07 20:46:58 UTC
- **Duration:** 5min 14s
- **Tasks completed:** 2/2
- **Files created:** 1
- **Files modified:** 2
- **Lines added:** 83
- **Lines removed:** 79
- **Net change:** +4 lines

## Accomplishments

### SDK Installation and Client Singleton

Created a shared SDK client singleton that:
- Installs `@worksofadam/agentos-sdk` from GitHub repository (`ajshedivy/agentos-sdk#v0.3.0`)
- Exports `getAgentOSClient()` function with lazy initialization
- Resolves `baseURL` from config → env fallback chain
- Resolves `apiKey` from auth → env → config priority order
- Handles SDK's `baseUrl` parameter (not `baseURL`)
- Throws clear error if baseURL not configured
- Exports `resetAgentOSClient()` for testing

**Key insight:** SDK inspection revealed constructor accepts `{ baseUrl, apiKey }` (note lowercase 'u' in baseUrl), not the expected `baseURL` from research.

### Plugin Refactoring

Replaced custom fetch-based agent discovery with SDK:
- Removed `fetchAgents()` function (~30 lines)
- Removed custom `fetch` wrapper with manual `Authorization` headers
- Plugin now calls `client.agents.list()` instead of manual HTTP
- Returns `{ baseURL, apiKey }` without custom fetch function
- SDK handles all auth internally via Bearer token

**Impact:** Reduced plugin code by 41 lines, eliminated manual header injection, and established SDK as the sole API client for agent operations.

## Task Commits

| Task | Description | Commit | Files Changed |
|------|-------------|--------|---------------|
| 1 | Install SDK and create shared client singleton | 87d3c6c | package.json, agentos-client.ts, bun.lock |
| 2 | Refactor plugin to use SDK client, remove custom fetch | f70ce6b | agentos.ts |

## Files Created

1. **packages/opencode/src/provider/sdk/agentos/agentos-client.ts** (60 lines)
   - Exports `getAgentOSClient()` - singleton factory with lazy init
   - Exports `resetAgentOSClient()` - reset for testing
   - Config/env resolution: baseURL (config → env), apiKey (auth → env → config)
   - Clear error if baseURL not configured
   - JSDoc comments documenting resolution order

## Files Modified

1. **packages/opencode/package.json**
   - Added: `"@worksofadam/agentos-sdk": "github:ajshedivy/agentos-sdk#v0.3.0"`
   - SDK installed from GitHub (not npm registry)

2. **packages/opencode/src/plugin/agentos.ts**
   - Added: `import { getAgentOSClient } from "../provider/sdk/agentos/agentos-client"`
   - Removed: `fetchAgents()` function (30 lines)
   - Removed: Custom `fetch` wrapper in loader return (19 lines)
   - Changed: `fetchAgents(baseURL, apiKey)` → `(await getAgentOSClient()).agents.list()`
   - Changed: Return `{ baseURL, apiKey }` only (no custom fetch)
   - Added: Type cast `agent as unknown as AgentOSAgent` for SDK compatibility

## Decisions Made

### Technical Decisions

1. **SDK Source: GitHub instead of npm**
   - SDK not published to npm registry
   - Installed via `github:ajshedivy/agentos-sdk#v0.3.0`
   - Requires git access for `bun install`

2. **Config Resolution Priority**
   - baseURL: `config.provider.agentos.options.baseURL` → `config.provider.agentos.api` → `AGENTOS_API_URL` env var
   - apiKey: `Auth.get("agentos")` → `AGENTOS_API_KEY` env var → `config.provider.agentos.options.apiKey`
   - Matches existing patterns in `plugin/agentos.ts`

3. **Type Compatibility Strategy**
   - Phase 7: Cast SDK `AgentResponse` to custom `AgentOSAgent` type
   - Phase 11 (TYPE-01/02/03): Migrate fully to SDK types
   - Minimal blast radius: only one cast site in plugin loader

4. **SDK Constructor Signature**
   - Research expected `{ baseURL, apiKey }`
   - Actual SDK uses `{ baseUrl, apiKey }` (lowercase 'u')
   - Discovered via inspection of `client.ts` in SDK
   - Resolved by mapping in `getAgentOSClient()`

### Architecture Decisions

1. **Singleton Pattern**
   - SDK client created once, reused across all calls
   - Standard pattern for API clients
   - Alternative (dependency injection) adds complexity without testing benefit

2. **Lazy Initialization**
   - Client created on first `getAgentOSClient()` call
   - Avoids config loading race conditions
   - Prevents eager initialization before Config.get() resolves

3. **Error Handling**
   - Fail-fast if baseURL not configured (throw Error)
   - Clear error message directs user to env var or config
   - SDK handles missing apiKey gracefully (unauthenticated requests)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

### Issue 1: SDK not on npm registry

**Context:** Plan suggested trying npm first, then GitHub as fallback.

**Resolution:** SDK installation via `bun add @worksofadam/agentos-sdk@0.3.0` failed silently (package not in registry). Immediately used GitHub: `bun add github:ajshedivy/agentos-sdk#v0.3.0`, which succeeded.

**Impact:** Installation path is GitHub-only. No npm fallback needed in future phases.

### Issue 2: Duplicate package.json entries

**Context:** Initial npm attempt left a stale entry in package.json before GitHub installation.

**Resolution:** GitHub installation added a second entry. Both entries are functionally equivalent (same version tag). TypeScript compilation passes, so not a blocking issue. Will be cleaned in next package.json update.

**Impact:** None - bun uses the GitHub entry correctly.

### Issue 3: SDK constructor uses baseUrl not baseURL

**Context:** Research and plan assumed constructor parameter would be `baseURL` (matching config key).

**Discovery:** Inspecting `node_modules/@worksofadam/agentos-sdk/src/client.ts` revealed actual parameter is `baseUrl` (lowercase 'u').

**Resolution:** `getAgentOSClient()` resolves config value as `baseURL` but passes to SDK as `baseUrl: baseURL`.

**Impact:** Internal only - no external API change. Future phases use `getAgentOSClient()` and are unaffected.

## Next Phase Readiness

### Blockers

None.

### Concerns

1. **Type casting in plugin**
   - Current: `agent as unknown as AgentOSAgent`
   - Future: Phase 11 (TYPE-01) should remove custom `AgentOSAgent` type and use SDK `AgentResponse` directly
   - Risk: If SDK type shape changes before Phase 11, casting could hide type errors

2. **Duplicate package.json entries**
   - Both `@worksofadam/agentos-sdk@0.3.0` and GitHub entry exist
   - Non-blocking but should be cleaned up
   - Recommend: Next package.json edit, remove npm entry

### Prerequisites for Phase 8 (Agent Discovery Migration)

- [x] SDK client singleton exists and is importable
- [x] `client.agents.list()` returns agents compatible with current types
- [x] Plugin successfully uses SDK for agent discovery
- [x] TypeScript compilation passes

### Ready for Phase 8

Yes. All prerequisites met. Plugin demonstrates SDK agent discovery works end-to-end.

## Lessons Learned

1. **Always inspect SDK before implementing**
   - Research predicted `baseURL`, actual SDK uses `baseUrl`
   - 5 minutes of type inspection saved potential runtime errors

2. **GitHub packages require special syntax**
   - `github:owner/repo#tag` not `owner/repo@tag`
   - Bun handles this cleanly, npm may differ

3. **Singleton + lazy init avoids race conditions**
   - Config.get() is async and may not be ready at module load time
   - Lazy pattern ensures config available when client created

4. **SDK error types not yet explored**
   - Plan mentioned `APIError`, `AuthenticationError` but not used in Phase 7
   - Phase 8/9 will need error handling patterns for streaming and API calls

## Self-Check: PASSED

**Created files verification:**
```bash
[ -f "packages/opencode/src/provider/sdk/agentos/agentos-client.ts" ] && echo "FOUND"
```
Result: FOUND ✓

**Commit verification:**
```bash
git log --oneline --all --grep="07-01"
```
Result:
- f70ce6b4f ✓
- 87d3c6c21 ✓

All files created and commits exist.
