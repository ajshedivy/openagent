---
phase: 09-streaming-language-model-migration
plan: 01
subsystem: api
tags: [agentos-sdk, streaming, ai-sdk, language-model, sse]

# Dependency graph
requires:
  - phase: 08-agent-discovery-migration
    provides: SDK client singleton with lazy init and health check integration
provides:
  - SDK-backed streaming agent communication via client.agents.runStream()
  - SDK-backed non-streaming agent communication via client.agents.run()
  - AsyncIterable<StreamEvent> to ReadableStream<LanguageModelV2StreamPart> transform
  - Typed SDK events (RunStartedEvent, RunContentEvent, etc.) in event handlers
  - Usage metrics extraction from SDK RunCompleted.metrics
affects: [10-continue-workflow-migration, 11-final-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SDK client.agents.runStream() for streaming runs"
    - "SDK client.agents.run() for non-streaming runs"
    - "AsyncIterable to ReadableStream conversion pattern"
    - "Usage metrics from SDK RunCompleted.metrics"

key-files:
  created: []
  modified:
    - packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts

key-decisions:
  - "Access RunPaused requirements via StreamEvent index signature (SDK type doesn't expose it directly)"
  - "Extract usage from RunCompleted.metrics (input_tokens, output_tokens, total_tokens)"
  - "RunError content field (not error field) contains error message"
  - "Retained buildHeaders/createSSEParser/makeContinueRequest for Phase 10 continue workflow"

patterns-established:
  - "SDK event type casting pattern (event as RunStartedEvent, etc.)"
  - "AsyncIterable iteration with for await...of in ReadableStream start()"
  - "Abort signal handling in SDK stream catch block"

# Metrics
duration: 6min 41s
completed: 2026-02-07
---

# Phase 09 Plan 01: Streaming & Language Model Migration Summary

**SDK AgentStream replaces custom fetch+SSE with typed events, metrics extraction, and AsyncIterable-to-ReadableStream transform**

## Performance

- **Duration:** 6 min 41 sec
- **Started:** 2026-02-07T22:14:03Z
- **Completed:** 2026-02-07T22:20:44Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Replaced custom `makeStreamingRequest()` + SSE parser with SDK `client.agents.runStream()` returning typed `AgentStream`
- Replaced custom `makeNonStreamingRequest()` with SDK `client.agents.run()` for synchronous runs
- Added typed SDK event imports (StreamEvent, RunStartedEvent, RunContentEvent, RunCompletedEvent, RunPausedEvent, RunErrorEvent, ToolCallStartedEvent, ToolCallCompletedEvent)
- Converted SDK AsyncIterable<StreamEvent> to ReadableStream<LanguageModelV2StreamPart> in `doStream()`
- Extracted usage metadata from SDK `RunCompleted.metrics` fields (input_tokens, output_tokens, total_tokens)
- Preserved Phase 10 methods: `buildHeaders()`, `createSSEParser()`, `makeContinueRequest()`, `processContinueStream()`

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace doStream() with SDK AgentStream** - `b23e59bb6` (refactor)
   - Add SDK event type imports
   - Replace makeStreamingRequest + SSE parser with client.agents.runStream()
   - Convert SDK AgentStream to ReadableStream
   - Use typed SDK events instead of generic Record casting
   - Extract usage from RunCompleted metrics
   - Access RunPaused requirements via StreamEvent index signature

2. **Task 2: Replace doGenerate() with SDK run() and remove obsolete methods** - `b890de927` (refactor)
   - Replace doGenerate to use client.agents.run()
   - Extract usage metrics from SDK result.metrics
   - Remove makeStreamingRequest() and makeNonStreamingRequest() private methods
   - Retain createSSEParser/makeContinueRequest/buildHeaders for Phase 10

## Files Created/Modified
- `packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts` - Migrated doStream() and doGenerate() to SDK methods, removed 170 lines of custom HTTP/SSE code

## Decisions Made

1. **RunPaused requirements via index signature**: SDK `RunPausedEvent` type doesn't expose `requirements` field directly. Accessed via `(event as StreamEvent).requirements` using the `[key: string]: unknown` index signature since the API returns it at the top level.

2. **RunError content field**: SDK `RunErrorEvent` has error message in `content` field (not `error` field). Cast to string with fallback to "Unknown error".

3. **Usage from metrics**: SDK `RunCompleted.metrics` contains `input_tokens`, `output_tokens`, `total_tokens`. These map to AI SDK `LanguageModelV2Usage` fields directly.

4. **Phase 10 preservation**: Kept `buildHeaders()`, `createSSEParser()`, `makeContinueRequest()`, and `processContinueStream()` methods intact. These are used by `llm.ts` `continueAgentOS()` workflow and will be migrated in Phase 10.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ✅ SDK streaming and non-streaming agent runs fully migrated
- ✅ Typed SDK events used throughout event handlers
- ✅ Usage metrics extracted from SDK responses
- ✅ Phase 10 continue workflow methods preserved and ready for migration
- ⚠️ `getClient` is currently optional in `AgentOSConfig` - Plan 09-02 will make it required
- 🔜 Phase 10: Migrate `continueAgentOS()` to use `client.agents.continue()`
- 🔜 Phase 11: Remove legacy SSE types and finalize cleanup

---
*Phase: 09-streaming-language-model-migration*
*Completed: 2026-02-07*

## Self-Check: PASSED

All files and commits verified to exist.
