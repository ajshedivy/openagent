---
phase: 10
plan: 01
subsystem: provider/language-model
tags:
  - sdk-migration
  - http-removal
  - continue-workflow
  - cancel-workflow
dependency_graph:
  requires:
    - phase: 09
      plan: 02
      rationale: "SDK streaming infrastructure for AgentStream iteration"
  provides:
    - continueRun() SDK method
    - cancelRun() SDK method
    - Simplified AgentOSConfig (provider + getClient only)
  affects:
    - packages/opencode/src/session/processor.ts (tool confirmation workflow - interface unchanged)
tech_stack:
  added: []
  patterns:
    - "SDK client.agents.continue() for tool confirmation"
    - "SDK client.agents.cancel() for run cancellation"
    - "Unified AgentStream event handling for continue and run workflows"
key_files:
  created: []
  modified:
    - path: packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts
      changes: "Replaced 4 legacy methods (~200 LOC) with 2 SDK methods (~90 LOC)"
      commit: 9b184a7be
    - path: packages/opencode/src/session/llm.ts
      changes: "Simplified continueAgentOS() to single continueRun() call"
      commit: c2f6bd91b
    - path: packages/opencode/src/provider/sdk/agentos/agentos-provider.ts
      changes: "Removed baseURL, apiKey, headers, fetch config fields"
      commit: 23036d7fb
decisions:
  - title: "SDK AgentStream for continue workflow"
    rationale: "Reuse same event handling pattern from doStream() for consistency"
    alternatives: "Custom SSE parsing (removed) - more code, less maintainable"
  - title: "Minimal AgentOSConfig interface"
    rationale: "SDK client singleton owns all connection details - provider just passes getter"
    alternatives: "Keep legacy fields (removed) - unnecessary coupling to HTTP layer"
metrics:
  duration_seconds: 637
  duration_human: "10min 37s"
  completed_date: 2026-02-07
  commits: 3
  loc_removed: 243
  loc_added: 79
  net_change: -164
---

# Phase 10 Plan 01: SDK Continue & Cancel Methods Summary

**One-liner:** Replace custom HTTP+SSE continue/cancel code with SDK client.agents.continue() and client.agents.cancel(), eliminating ~160 lines of fetch/FormData/SSE parsing logic

## What Was Built

Migrated the tool confirmation continue workflow and run cancellation from custom HTTP methods to SDK client methods. Removed the last custom HTTP+SSE code from the language model, achieving a fully SDK-backed agent communication layer.

**Before Phase 10:** Language model had custom fetch, FormData construction, SSE parsing, and header management for continue/cancel workflows (4 methods, ~200 LOC)

**After Phase 10:** Language model uses SDK `client.agents.continue()` and `client.agents.cancel()` with unified AgentStream event handling (2 methods, ~90 LOC)

## Technical Implementation

### SDK Integration
- **continueRun()** method calls `client.agents.continue()` with streaming enabled, returns `AgentStream`
- Iterates SDK `AgentStream` using `for await` loop (same pattern as `doStream()`)
- Accumulates text from `RunContent` events, tool results from `ToolCallCompleted`, usage from `RunCompleted`
- Throws on `RunError` events with SDK error content
- **cancelRun()** method calls `client.agents.cancel()` directly

### Removed Custom Code
- `buildHeaders()` - 20 lines of Authorization/User-Agent header construction
- `createSSEParser()` - 60 lines of TransformStream SSE event parsing
- `makeContinueRequest()` - 70 lines of FormData construction and fetch call
- `processContinueStream()` - 60 lines of stream reading and event accumulation
- Legacy config fields: `baseURL`, `apiKey`, `headers`, `fetch` from `AgentOSConfig`
- Unused imports: `AgentOSEvent`, `withoutTrailingSlash`, `VERSION`

### Updated Callsites
- `llm.ts:continueAgentOS()` - replaced `makeContinueRequest()` + `processContinueStream()` with single `continueRun()` call
- `agentos-provider.ts` - removed `baseURL`, `getHeaders`, `VERSION` - now passes only `provider` and `getClient` to language model

## Integration Points

**Upstream dependencies:**
- Phase 9 SDK streaming infrastructure (AgentStream iteration, typed events, usage extraction)
- SDK client singleton (baseURL/apiKey resolution, auth handling)

**Downstream consumers:**
- `processor.ts:confirmTools()` - unchanged interface, continues to call `continueAgentOS()` which now delegates to `continueRun()`
- Tool confirmation workflow - unchanged, transparent migration

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Phase 11 blockers:** None

**Technical debt:** None - all custom HTTP code removed from language model

**Follow-up work:** None required

## Self-Check: PASSED

**Files created:** None (refactor only)

**Files modified:**
- `packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts` - FOUND
- `packages/opencode/src/session/llm.ts` - FOUND
- `packages/opencode/src/provider/sdk/agentos/agentos-provider.ts` - FOUND

**Commits:**
- 9b184a7be: refactor(10-01): replace continue/cancel methods with SDK calls - FOUND
- c2f6bd91b: refactor(10-01): update continueAgentOS to use SDK continueRun - FOUND
- 23036d7fb: refactor(10-01): remove legacy config fields from provider factory - FOUND

**Verification:**
- No references to `makeContinueRequest`, `processContinueStream`, `buildHeaders`, `createSSEParser` exist - VERIFIED
- `continueRun()` and `cancelRun()` methods exist in language model - VERIFIED
- `AgentOSConfig` contains only `provider` and `getClient` - VERIFIED
- TypeScript compilation passes with no errors - VERIFIED

All claims validated.
