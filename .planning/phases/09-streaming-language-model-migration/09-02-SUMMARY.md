---
phase: 09-streaming-language-model-migration
plan: 02
subsystem: provider
tags: [agentos, sdk, typescript, ai-sdk, provider-factory, type-system]

# Dependency graph
requires:
  - phase: 09-01
    provides: SDK-based doStream and doGenerate methods with typed event handling
provides:
  - Required getClient field in AgentOSConfig for SDK client transport
  - Clean provider factory passing SDK client getter to language model
  - Barrel exports including AgentOSPausedState, AgentOSRequirement, AgentOSToolExecution for processor consumers
  - Phase 10-ready type surface with SSE types preserved for continue methods
affects: [10-continue-migration, 11-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Required SDK client getter in language model config (not optional)"
    - "Provider factory creates SDK client getter, passes to language model"
    - "Barrel exports expanded to include processor-consumed types"

key-files:
  created: []
  modified:
    - packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts
    - packages/opencode/src/provider/sdk/agentos/index.ts

key-decisions:
  - "getClient made required in AgentOSConfig - SDK client is sole transport"
  - "Legacy config fields (baseURL, apiKey, headers, fetch) preserved for Phase 10 continue methods with TODO marker"
  - "All SSE types preserved in agentos-types.ts - cleanup deferred to Phase 10/11"
  - "Barrel exports expanded to include AgentOSPausedState, AgentOSRequirement, AgentOSToolExecution for session imports"

patterns-established:
  - "Provider factory wires SDK client getter (getClient: getAgentOSClient) to language model config"
  - "No guard checks needed in doStream/doGenerate since getClient is required"

# Metrics
duration: 2min
completed: 2026-02-07
---

# Phase 09 Plan 02: Streaming & Language Model Migration Summary

**SDK client transport required in AgentOSConfig, provider factory simplified, barrel exports expanded for processor types**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-07T22:02:50Z
- **Completed:** 2026-02-07T22:04:58Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Made getClient required field in AgentOSConfig - SDK client is now the sole API transport
- Removed getClient guard checks from doStream() and doGenerate() (no longer needed)
- Added TODO comment marking legacy config fields (baseURL, apiKey, headers, fetch) for Phase 10 cleanup
- Expanded barrel exports to include AgentOSPausedState, AgentOSRequirement, AgentOSToolExecution for session/llm.ts and session/processor.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Make getClient required in AgentOSConfig and simplify provider factory** - `05ce78f2c` (refactor)
2. **Task 2: Audit SSE types and update barrel exports** - `8d25f498c` (refactor)

**Plan metadata:** (pending - will be committed with STATE.md update)

## Files Created/Modified
- `packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts` - Made getClient required, removed guard checks, added Phase 10 TODO comment
- `packages/opencode/src/provider/sdk/agentos/index.ts` - Added AgentOSPausedState, AgentOSRequirement, AgentOSToolExecution to barrel exports

## Decisions Made
- **SDK client is sole transport:** Changed getClient from optional to required field. Provider factory already passes getAgentOSClient, so no code change needed there - the type system now enforces what was already happening in practice.
- **Preserved legacy config fields:** baseURL, apiKey, headers, fetch remain in AgentOSConfig because makeContinueRequest() and processContinueStream() (Phase 10 scope) still use them directly. Added TODO(Phase 10) comment to mark them for removal.
- **Deferred SSE type cleanup:** All SSE event types in agentos-types.ts are preserved because createSSEParser() and processContinueStream() still use AgentOSEvent union type. Attempting to remove individual event types would break the continue methods. Cleanup deferred to Phase 10 (when continue methods migrate to SDK) or Phase 11 (final type surface cleanup).
- **Expanded barrel exports:** Added AgentOSPausedState, AgentOSRequirement, AgentOSToolExecution to index.ts barrel exports. These types are imported by session/llm.ts and session/processor.ts for tool confirmation workflow.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 9 Plan 02 complete - provider factory cleanup finished
- Phase 9 complete - all streaming/non-streaming methods use SDK
- Ready for Phase 10: Continue methods migration (makeContinueRequest, processContinueStream) to use SDK client.agents.continue()
- Legacy config fields (baseURL, apiKey, headers, fetch) marked with TODO(Phase 10) for removal
- SSE types (AgentOSEvent, createSSEParser) preserved for Phase 10 continue methods

## Self-Check: PASSED

Verified created files exist:
- No new files created

Verified commits exist:
```bash
$ git log --oneline --all | grep -E "05ce78f2c|8d25f498c"
8d25f498c refactor(09-02): expand barrel exports for processor types
05ce78f2c refactor(09-02): make getClient required in AgentOSConfig
```

All verification checks passed:
- TypeScript compiles cleanly (zero errors)
- getClient is required field (no `?`)
- No "not configured" guard checks remain
- Provider factory passes getAgentOSClient
- Barrel exports include AgentOSPausedState, AgentOSRequirement, AgentOSToolExecution

---
*Phase: 09-streaming-language-model-migration*
*Completed: 2026-02-07*
