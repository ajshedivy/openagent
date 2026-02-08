# Roadmap: openagent v2.0 AgentOS SDK Migration

## Milestones

- v1.0 Minimal Divergence - Phases 1-2 (shipped 2026-01-31)
- v1.1 AgentOS Hub - Phases 3-6 (shipped 2026-02-01)
- v2.0 AgentOS SDK Migration - Phases 7-11 (in progress)

## Phases

<details>
<summary>v1.0 Minimal Divergence (Phases 1-2) - SHIPPED 2026-01-31</summary>

See `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>v1.1 AgentOS Hub (Phases 3-6) - SHIPPED 2026-02-01</summary>

See `.planning/milestones/v1.1-ROADMAP.md`

</details>

### v2.0 AgentOS SDK Migration (In Progress)

**Milestone Goal:** Replace all custom AgentOS API client code with `@worksofadam/agentos-sdk` and ensure full working agent support end-to-end.

- [x] **Phase 7: SDK Client Foundation** - Install SDK and establish shared client infrastructure
- [x] **Phase 8: Agent Discovery Migration** - Replace custom fetch-based agent discovery with SDK
- [x] **Phase 9: Streaming & Language Model Migration** - Replace custom SSE parser with SDK AgentStream
- [x] **Phase 10: Tool Confirmation & Run Lifecycle** - Replace custom continue/cancel with SDK methods
- [ ] **Phase 11: End-to-End Verification & Type Cleanup** - Remove custom types, verify full workflow

## Phase Details

### Phase 7: SDK Client Foundation
**Goal**: A shared, configured SDK client is available for all AgentOS operations with proper auth, health checking, and error handling
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: SDK-01, SDK-02, SDK-03, SDK-04, SDK-05
**Plans:** 2 plans

Plans:
- [x] 07-01-PLAN.md -- Install SDK, create shared client singleton, refactor plugin to remove custom fetch
- [x] 07-02-PLAN.md -- Integrate health check and SDK error handling, wire provider factory to SDK client

### Phase 8: Agent Discovery Migration
**Goal**: Agent discovery pipeline uses SDK types end-to-end, replacing custom AgentOSAgent/AgentOSModelInfo with SDK AgentResponse/ModelResponse
**Depends on**: Phase 7
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04
**Plans:** 1 plan

Plans:
- [x] 08-01-PLAN.md -- Replace AgentOSAgent and AgentOSModelInfo with SDK type re-exports, update agentToModel to use SDK types directly

### Phase 9: Streaming & Language Model Migration
**Goal**: Agent chat streaming is powered entirely by SDK's AgentStream, with events correctly bridged to AI SDK interface
**Depends on**: Phase 7
**Requirements**: STRM-01, STRM-02, STRM-03, STRM-04, STRM-05, STRM-06, RUN-02
**Plans:** 2 plans

Plans:
- [x] 09-01-PLAN.md -- Replace streaming/non-streaming requests with SDK AgentStream and run(), adapt event transform, remove custom fetch methods
- [x] 09-02-PLAN.md -- Make getClient required in config, simplify provider factory, audit types and update barrel exports

### Phase 10: Tool Confirmation & Run Lifecycle
**Goal**: Tool confirmation pause/continue and run cancellation work end-to-end through the SDK
**Depends on**: Phase 9
**Requirements**: TOOL-01, TOOL-02, TOOL-03, TOOL-04, RUN-01
**Plans:** 2 plans

Plans:
- [x] 10-01-PLAN.md -- Replace continue/cancel with SDK methods, remove legacy config fields, update provider factory
- [x] 10-02-PLAN.md -- Wire abort signal to cancel, clean up SSE types, verify tool confirmation workflow

### Phase 11: End-to-End Verification & Type Cleanup
**Goal**: Zero custom AgentOS API types remain and the full agent chat workflow is verified from discovery through completion
**Depends on**: Phase 10
**Requirements**: TYPE-01, TYPE-02, TYPE-03, RUN-03
**Plans**: TBD

Plans:
- [ ] 11-01: Remove custom types and establish SDK re-exports
- [ ] 11-02: Full workflow verification and dead code cleanup

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9 -> 10 -> 11

Note: Phase 8 (Discovery) and Phase 9 (Streaming) both depend only on Phase 7 and could execute in parallel, but sequential execution is recommended for controlled migration.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 7. SDK Client Foundation | v2.0 | 2/2 | Complete | 2026-02-07 |
| 8. Agent Discovery Migration | v2.0 | 1/1 | Complete | 2026-02-07 |
| 9. Streaming & Language Model | v2.0 | 2/2 | Complete | 2026-02-07 |
| 10. Tool Confirmation & Run Lifecycle | v2.0 | 2/2 | Complete | 2026-02-07 |
| 11. E2E Verification & Type Cleanup | v2.0 | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-07*
*Last updated: 2026-02-07 (Phase 10 complete)*
