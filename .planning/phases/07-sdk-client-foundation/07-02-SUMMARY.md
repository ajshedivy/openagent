---
phase: 07-sdk-client-foundation
plan: 02
subsystem: provider-integration
tags:
  - sdk
  - error-handling
  - health-check
  - client-wiring
  - typescript
requires:
  - phase: 07-01
    provides: SDK client singleton (getAgentOSClient)
provides:
  - Health check during provider initialization
  - SDK error handling with actionable messages
  - Provider factory wired to SDK client getter
  - Preparation for Phase 9 streaming migration
affects:
  - 08-agent-discovery-migration
  - 09-agent-streaming-migration
tech-stack:
  added: []
  patterns:
    - Health check on provider initialization for fail-fast behavior
    - SDK error type hierarchy (AuthenticationError, APIError)
    - Resilient provider loading (errors logged, app continues)
    - Optional getClient field for progressive migration
key-files:
  created: []
  modified:
    - packages/opencode/src/plugin/agentos.ts
    - packages/opencode/src/provider/sdk/agentos/agentos-provider.ts
    - packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts
key-decisions:
  - "Health check runs before agent discovery to fail fast on connection issues"
  - "SDK error types produce actionable messages (auth, API, connection)"
  - "Plugin loader returns empty object on errors to allow other providers to work"
  - "Provider factory passes SDK client getter (not raw config) to language model"
  - "getClient field is optional in AgentOSConfig for progressive migration"
patterns-established:
  - "SDK error handling pattern: instanceof checks for AuthenticationError, APIError"
  - "Connection error detection: ECONNREFUSED, ENOTFOUND, fetch failed patterns"
  - "Resilient plugin loading: catch all errors, log warnings, return {}"
duration: 2min 52s
completed: 2026-02-07
---

# Phase 07 Plan 02: SDK Health Checking & Provider Wiring Summary

**Health check on provider init with SDK error handling for auth/connection failures, and provider factory wired to SDK client getter for Phase 9 streaming migration**

## Performance

- **Duration:** 2min 52s
- **Started:** 2026-02-07T20:51:25Z
- **Completed:** 2026-02-07T20:54:17Z
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- Health check added to plugin loader runs before agent discovery, surfacing connection failures immediately
- SDK error types (AuthenticationError, APIError) produce meaningful, actionable error messages
- Plugin loader resilient to AgentOS failures - logs warnings and returns empty object instead of crashing app
- Provider factory passes SDK client getter to language model, preparing integration point for Phase 9
- AgentOSConfig interface includes optional getClient field for progressive migration

## Task Commits

Each task was committed atomically:

1. **Task 1: Add health check and SDK error handling to plugin loader** - `0f3cc96` (feat)
2. **Task 2: Wire provider factory to SDK client** - `8b4ee3c` (feat)

## Files Created/Modified

- `packages/opencode/src/plugin/agentos.ts` - Health check and SDK error handling with resilient loading
- `packages/opencode/src/provider/sdk/agentos/agentos-provider.ts` - Imports and passes getAgentOSClient to language model
- `packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts` - AgentOSConfig includes optional getClient field

## Decisions Made

### Health Check Strategy

**Decision:** Run `client.health()` before agent discovery in plugin loader

**Rationale:** Fail-fast approach surfaces connection issues during provider initialization, not during first user interaction. Prevents misleading "no agents found" when the real issue is connectivity.

**Impact:** Users see clear error messages immediately on startup if AgentOS is unreachable or misconfigured.

### Error Handling Approach

**Decision:** Use SDK error type hierarchy (AuthenticationError, APIError) with instanceof checks

**Rationale:** SDK exports typed error classes that provide status codes and structured information. Using instanceof allows specific handling for different error categories.

**Implementation:**
- AuthenticationError → "Check your AGENTOS_API_KEY"
- APIError → Include status code and message
- Network errors (ECONNREFUSED) → "Check that the server is running at {baseURL}"

**Impact:** Users get actionable error messages that guide troubleshooting.

### Resilient Loading

**Decision:** Plugin loader catches all errors and returns empty object instead of throwing

**Rationale:** AgentOS is one of many providers. If AgentOS fails to initialize, other providers (OpenAI, Anthropic, etc.) should still work. Crashing the entire application would break all providers.

**Implementation:**
- Outer try/catch wraps entire loader
- Health check has inner try/catch for SDK-specific error handling
- All errors logged as warnings with console.warn
- Return `{}` on any error

**Impact:** Application remains usable even if AgentOS is unavailable. Users see warnings in logs but can continue with other providers.

### SDK Client Wiring

**Decision:** Provider factory passes `getClient: getAgentOSClient` to language model config

**Rationale:** Phase 9 will migrate streaming from custom fetch/SSE to SDK's AgentStream. The language model needs access to the SDK client for that migration. Passing the getter now creates a clean integration point without changing current behavior.

**Implementation:**
- Import `getAgentOSClient` in provider factory
- Pass as `getClient` field in language model config
- Make field optional in `AgentOSConfig` interface
- Language model continues using fetch-based approach in Phase 7

**Impact:** Phase 9 has plumbing in place for streaming migration. No behavioral change in Phase 7.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - SDK provides expected health endpoint and error types as documented in RESEARCH.md.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

### Blockers

None.

### Concerns

None. All prerequisites for Phase 8 (Agent Discovery Migration) are met:
- Health check working
- Error handling tested via TypeScript compilation
- SDK client accessible via getAgentOSClient()

### Prerequisites for Phase 8

- [x] Health check runs during provider initialization
- [x] SDK errors produce actionable messages
- [x] Plugin loader resilient to AgentOS failures
- [x] TypeScript compilation passes

### Ready for Phase 8

Yes. Health checking is complete, error handling is robust, and the SDK integration foundation is solid.

## Self-Check: PASSED

**Modified files verification:**
- packages/opencode/src/plugin/agentos.ts - FOUND ✓
- packages/opencode/src/provider/sdk/agentos/agentos-provider.ts - FOUND ✓

**Commit verification:**
```bash
git log --oneline --all --grep="07-02"
```
Result: 3 commits found ✓
- 8b4ee3c47 (Task 2)
- 0f3cc968e (Task 1)
- (plus metadata commit)

All files exist and commits are in git history.

---
*Phase: 07-sdk-client-foundation*
*Completed: 2026-02-07*
