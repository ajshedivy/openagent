---
phase: 06-model-provider-separation
plan: 01
subsystem: ui
tags: [solidjs, model-selector, provider-filtering]

# Dependency graph
requires:
  - phase: 05-agent-detail-view
    provides: /agno hub with agent list and detail views
provides:
  - AgentOS provider filtered from /models dialog in web app
  - AgentOS provider filtered from /models dialog in TUI
  - Clean separation: /models = external LLMs, /agno = AgentOS agents
affects: [06-model-provider-separation]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Provider filtering pattern using .filter(m => m.provider.id !== 'agentos')"]

key-files:
  created: []
  modified:
    - packages/app/src/components/dialog-select-model.tsx
    - packages/opencode/src/cli/cmd/tui/component/dialog-model.tsx

key-decisions:
  - "Filter AgentOS as first operation in chain for efficiency"
  - "Filter AgentOS from favorites and recents in addition to main provider list"

patterns-established:
  - "Provider exclusion pattern: filter early in data pipeline before expensive operations"

# Metrics
duration: 1.4min
completed: 2026-02-01
---

# Phase 6 Plan 01: Model Provider Separation Summary

**AgentOS provider filtered from /models dialog in both web app and TUI, establishing clean separation where /models shows only external LLMs and /agno remains exclusive interface for AgentOS agents**

## Performance

- **Duration:** 1.4 min
- **Started:** 2026-02-01T19:42:06Z
- **Completed:** 2026-02-01T19:43:28Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Web app /models dialog no longer shows AgentOS provider or its agents
- TUI /models dialog filters AgentOS from all contexts (provider list, favorites, recents)
- Clear mental model established: /models = external model providers, /agno = AgentOS agents

## Task Commits

Each task was committed atomically:

1. **Task 1: Filter AgentOS from web app model selector** - `9f001a73b` (feat)
2. **Task 2: Filter AgentOS from TUI model selector** - `e4af41d73` (feat)

**Plan metadata:** (to be added in final commit)

## Files Created/Modified
- `packages/app/src/components/dialog-select-model.tsx` - Added filter to exclude agentos provider from ModelList component
- `packages/opencode/src/cli/cmd/tui/component/dialog-model.tsx` - Added filters to exclude agentos from providerOptions, favoriteOptions, and recentOptions

## Decisions Made

**1. Filter AgentOS as first operation**
- Rationale: Filtering early in the chain reduces work for subsequent filters and makes intent clear at the entry point
- Implementation: Added `.filter((m) => m.provider.id !== "agentos")` as first filter in web app ModelList

**2. Filter AgentOS from favorites and recents**
- Rationale: Complete separation requires filtering all contexts, not just main provider list
- Implementation: Added checks in both favoriteOptions and recentOptions sections of TUI dialog

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Model/agent separation complete for /models dialog
- Ready for remaining Phase 6 plans (Teams and Workflows placeholders)
- /agno functionality remains unchanged and fully operational

---
*Phase: 06-model-provider-separation*
*Completed: 2026-02-01*
