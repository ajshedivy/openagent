# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-07)

**Core value:** Connect to AgentOS agents from the terminal with a great user experience
**Current focus:** v2.0 AgentOS SDK Migration

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-02-07 — Milestone v2.0 started

Progress: ░░░░░░░░░░ 0%

## Milestone History

| Milestone | Phases | Status | Shipped |
|-----------|--------|--------|---------|
| v1.0 Minimal Divergence | 1-2 | ✓ Complete | 2026-01-31 |
| v1.1 AgentOS Hub | 3-6 | ✓ Complete | 2026-02-01 |

## Performance Metrics

**v1.0:**
- Phases: 2
- Plans: 3
- Duration: Same-day

**v1.1:**
- Phases: 4 (3-6)
- Plans: 5
- Requirements: 19/19 satisfied
- Duration: Same-day

## Key Files (v2.0 targets)

**To refactor:**
- `packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts` — Custom SSE parser, fetch calls → SDK AgentStream
- `packages/opencode/src/provider/sdk/agentos/agentos-provider.ts` — Provider factory → SDK client
- `packages/opencode/src/provider/sdk/agentos/agentos-types.ts` — Hand-written types → SDK types
- `packages/opencode/src/plugin/agentos.ts` — Custom agent discovery → SDK client.agents.list()
- `packages/opencode/src/session/llm.ts` — continueAgentOS → SDK client.agents.continue()
- `packages/opencode/src/session/processor.ts` — Tool confirmation continue workflow

## Accumulated Context

### v1.1 Decisions

All decisions archived in `.planning/milestones/v1.1-ROADMAP.md`

Key patterns established:
- Tab navigation with underline indicator
- Enter = quick action, Ctrl+key = secondary action
- Provider filtering early in data pipeline

### v2.0 Context

- SDK: `@worksofadam/agentos-sdk@0.3.0` (published 2026-02-07)
- SDK provides: AgentOSClient, AgentStream, typed resources for agents/teams/workflows/sessions/etc.
- Strategy: Keep AI SDK bridge (AgentStream → LanguageModelV2StreamPart)
- Teams/Workflows hub deferred — SDK makes future addition trivial

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-07
Stopped at: Defining v2.0 requirements
Resume file: None

Config (if exists):
```json
{
  "mode": "yolo",
  "depth": "comprehensive",
  "parallelization": true,
  "commit_docs": true,
  "model_profile": "balanced",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  }
}
```

---
*State updated: 2026-02-07 — Milestone v2.0 Started*
