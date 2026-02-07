---
phase: 08-agent-discovery-migration
plan: 01
subsystem: type-system
tags: [sdk-migration, types, agent-discovery, refactor]
requires: [07-02]
provides:
  - SDK-backed AgentResponse type for agent discovery
  - SDK-backed ModelResponse type for model metadata
  - Type-safe agent-to-model conversion without casts
affects: [08-02, 09-01]
tech-stack:
  added: []
  patterns:
    - SDK type re-exports via components["schemas"]
    - Non-null assertions for API-guaranteed fields
key-files:
  created: []
  modified:
    - packages/opencode/src/provider/sdk/agentos/agentos-types.ts
    - packages/opencode/src/provider/sdk/agentos/index.ts
    - packages/opencode/src/plugin/agentos.ts
key-decisions:
  - decision: Use SDK components["schemas"] for type access
    rationale: SDK doesn't export AgentResponse directly, but it's available via components
    impact: Requires import of components type from SDK
  - decision: Use non-null assertions for agent.id
    rationale: API always returns id, and caller already uses agent.id!
    impact: Cleaner than guard approach, acceptable during migration
  - decision: Preserve all SSE event types and Zod schemas
    rationale: Phase 9-11 scope, touching them risks regressions
    impact: Clean separation of concerns across phases
metrics:
  duration: 6min 59s
  completed: 2026-02-07
---

# Phase 08 Plan 01: Agent Discovery Type Migration Summary

**One-liner:** Replace custom AgentOSAgent/AgentOSModelInfo with SDK AgentResponse/ModelResponse, eliminating type casts in agent discovery pipeline.

## Performance

**Execution:** 6min 59s
**Tasks completed:** 2/2
**Files modified:** 3
**Commits:** 2 atomic commits

## What Was Accomplished

### Core Type Migration

Replaced hand-written agent and model interfaces with SDK-provided types:

- **AgentOSAgent interface** (39 lines) → **AgentResponse** (SDK re-export)
- **AgentOSModelInfo interface** (5 lines) → **ModelResponse** (SDK re-export)
- Net reduction: 37 lines of duplicate type definitions

### Agent Discovery Pipeline

Updated `plugin/agentos.ts` to use SDK types end-to-end:

- `agentToModel()` accepts `AgentResponse` directly (no cast)
- Removed `as unknown as AgentOSAgent` cast from loader
- Added non-null assertions for `agent.id` (API-guaranteed field)

### Type Safety Improvements

- Import SDK `components` type for schema access
- Update barrel exports to expose `AgentResponse` and `ModelResponse`
- Maintain full type safety throughout agent discovery flow

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 27e8d67 | Replace custom agent types with SDK re-exports |
| 2 | d1b2220 | Use SDK AgentResponse directly in agent discovery |

## Files Created

None. This plan refactored existing files.

## Files Modified

### packages/opencode/src/provider/sdk/agentos/agentos-types.ts
- Removed `AgentOSAgent` interface (lines 19-39)
- Removed `AgentOSModelInfo` interface (lines 10-14)
- Added `import type { components } from "@worksofadam/agentos-sdk"`
- Added `AgentResponse` type alias: `components["schemas"]["AgentResponse"]`
- Added `ModelResponse` type alias: `components["schemas"]["ModelResponse"]`
- Preserved all SSE event types, Zod schemas, and tool confirmation types (Phase 9-11)

### packages/opencode/src/provider/sdk/agentos/index.ts
- Replaced `AgentOSAgent` with `AgentResponse` in exports
- Replaced `AgentOSModelInfo` with `ModelResponse` in exports
- Maintained all other exports unchanged

### packages/opencode/src/plugin/agentos.ts
- Changed import from `AgentOSAgent` to `AgentResponse`
- Updated `agentToModel()` signature to accept `AgentResponse`
- Removed `as unknown as AgentOSAgent` cast in loader loop
- Added non-null assertions for `agent.id` usage (lines 154, 156, 158)
- Removed compatibility comment about casting SDK type

## Decisions Made

### SDK Type Access Pattern

**Decision:** Use `components["schemas"]["AgentResponse"]` for type access
**Context:** SDK doesn't directly export `AgentResponse` as a named type
**Rationale:** This is the canonical pattern for accessing OpenAPI-generated types
**Alternatives considered:**
- Define custom type from scratch (rejected - duplicates SDK)
- Extract type via utility (rejected - unnecessary complexity)

### Non-null Assertions for agent.id

**Decision:** Use `!` assertions rather than guard clause
**Context:** SDK types `id?: string | null`, but API always returns it
**Rationale:**
- Simpler than guard approach
- Caller already uses `agent.id!` on line 86
- Acceptable during migration (Phase 11 will tighten types)
**Impact:** Three assertions added to `agentToModel()` return object

### Preservation of SSE Types

**Decision:** Leave SSE event types and Zod schemas untouched
**Context:** Lines 40-370 of agentos-types.ts contain streaming types
**Rationale:**
- Phase 9 scope (Agent Streaming Migration)
- Touching them risks regressions in current streaming implementation
- Clean phase separation
**Impact:** Only lines 1-39 modified in this plan

## Deviations from Plan

None. Plan executed exactly as written.

## Technical Notes

### SDK Type Structure

The SDK's `AgentResponse` type includes these fields (all optional):
```typescript
{
  id?: string | null
  name?: string | null
  db_id?: string | null
  description?: string | null
  role?: string | null
  model?: ModelResponse | null  // { name?, model?, provider? }
  // ... 12+ additional fields
}
```

### Field Nullability Handling

| Field | SDK Type | Usage Pattern | Handling |
|-------|----------|---------------|----------|
| `id` | `string \| null \| undefined` | Required in return object | Non-null assertion (`!`) |
| `name` | `string \| null \| undefined` | Fallback to id | `agent.name \|\| agent.id!` |
| `model` | `ModelResponse \| null \| undefined` | Stored in metadata | Pass through (hub handles) |

The hub component (`dialog-agno.tsx` line 366) already handles `ModelResponse` optionality via its own type assertion, so no changes needed there.

## Issues and Blockers

None.

## Next Phase Readiness

**Phase 08 Plan 02:** Ready to proceed
- Agent discovery types migrated ✓
- No blocking issues ✓
- TypeScript compiles cleanly ✓

**Phase 09 (Agent Streaming):** Type foundation ready
- SSE event types preserved ✓
- Agent metadata structure compatible ✓
- Will migrate streaming pipeline to SDK's `agent.continue()` method

**Phase 10 (Session Management):** Type foundation ready
- Session types untouched ✓
- Will migrate session workflow to SDK client

**Phase 11 (Type Cleanup):** Migration target clear
- Non-null assertions documented for future tightening ✓
- Optional field handling patterns established ✓

## Requirements Satisfied

- **DISC-01:** ✓ `client.agents.list()` used (from Phase 7)
- **DISC-02:** ✓ `AgentResponse` replaces `AgentOSAgent`
- **DISC-03:** ✓ `agentToModel()` uses SDK response types
- **DISC-04:** ✓ `/agno hub` populated via SDK pipeline (no UI changes)

All four agent discovery requirements completed.

## Self-Check: PASSED

**Created files verified:** N/A (refactor only)

**Commits verified:**
- 27e8d67: ✓ Found in git log
- d1b2220: ✓ Found in git log

**Type changes verified:**
- `AgentOSAgent` removed: ✓ No references in plugin/
- `AgentOSModelInfo` removed: ✓ No references in src/ (except comments)
- `AgentResponse` exported: ✓ In agentos-types.ts and index.ts
- `ModelResponse` exported: ✓ In agentos-types.ts and index.ts
- No type casts: ✓ No `as unknown as` in plugin/agentos.ts
