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
- [ ] **Phase 8: Agent Discovery Migration** - Replace custom fetch-based agent discovery with SDK
- [ ] **Phase 9: Streaming & Language Model Migration** - Replace custom SSE parser with SDK AgentStream
- [ ] **Phase 10: Tool Confirmation & Run Lifecycle** - Replace custom continue/cancel with SDK methods
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
**Goal**: Users discover and browse AgentOS agents in the `/agno` hub powered entirely by the SDK client
**Depends on**: Phase 7
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04
**Plans**: TBD

Plans:
- [ ] 08-01: Replace agent discovery and type mapping with SDK

### Phase 9: Streaming & Language Model Migration
**Goal**: Agent chat streaming is powered entirely by SDK's AgentStream, with events correctly bridged to AI SDK interface
**Depends on**: Phase 7
**Requirements**: STRM-01, STRM-02, STRM-03, STRM-04, STRM-05, STRM-06, RUN-02
**Plans**: TBD

Plans:
- [ ] 09-01: Replace streaming request with SDK AgentStream
- [ ] 09-02: Map AgentStream events to AI SDK LanguageModelV2StreamPart
- [ ] 09-03: Wire provider factory and clean up non-streaming path

### Phase 10: Tool Confirmation & Run Lifecycle
**Goal**: Tool confirmation pause/continue and run cancellation work end-to-end through the SDK
**Depends on**: Phase 9
**Requirements**: TOOL-01, TOOL-02, TOOL-03, TOOL-04, RUN-01
**Plans**: TBD

Plans:
- [ ] 10-01: Replace continue/cancel with SDK methods
- [ ] 10-02: Verify tool confirmation loop end-to-end

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
| 8. Agent Discovery Migration | v2.0 | 0/1 | Not started | - |
| 9. Streaming & Language Model | v2.0 | 0/3 | Not started | - |
| 10. Tool Confirmation & Run Lifecycle | v2.0 | 0/2 | Not started | - |
| 11. E2E Verification & Type Cleanup | v2.0 | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-07*
*Last updated: 2026-02-07*
