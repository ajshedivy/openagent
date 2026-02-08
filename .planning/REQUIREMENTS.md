# Requirements: openagent v2.0 AgentOS SDK Migration

**Defined:** 2026-02-07
**Core Value:** Connect to AgentOS agents from the terminal with a great user experience — now powered by the official SDK

## v1 Requirements

Requirements for v2.0 milestone. Each maps to roadmap phases.

### SDK Client Infrastructure

- [x] **SDK-01**: `@worksofadam/agentos-sdk` installed as workspace dependency
- [x] **SDK-02**: Shared `AgentOSClient` singleton created with baseURL and apiKey resolution from config/env
- [x] **SDK-03**: Custom fetch wrapper in plugin removed (SDK handles auth headers internally)
- [x] **SDK-04**: SDK health check integrated into provider initialization
- [x] **SDK-05**: SDK error hierarchy (APIError, AuthenticationError, etc.) used for error handling

### Agent Discovery

- [x] **DISC-01**: Agent discovery plugin uses `client.agents.list()` instead of custom GET `/agents` fetch
- [x] **DISC-02**: SDK `AgentResponse` type replaces custom `AgentOSAgent` interface
- [x] **DISC-03**: Agent-to-Model mapping updated to use SDK response types
- [x] **DISC-04**: `/agno` hub agent list populated from SDK client

### Streaming & Language Model

- [ ] **STRM-01**: `client.agents.runStream()` replaces custom `makeStreamingRequest()` with FormData
- [ ] **STRM-02**: SDK `AgentStream` events mapped to AI SDK `LanguageModelV2StreamPart` interface
- [ ] **STRM-03**: Custom `createSSEParser()` TransformStream removed entirely
- [ ] **STRM-04**: Non-streaming path uses `client.agents.run()` instead of custom `makeNonStreamingRequest()`
- [ ] **STRM-05**: `RunPaused` event from `AgentStream` correctly triggers tool confirmation workflow
- [ ] **STRM-06**: `RunCompleted` event properly signals stream end with usage metadata

### Tool Confirmation & Continue

- [ ] **TOOL-01**: `client.agents.continue()` replaces custom `makeContinueRequest()` with FormData
- [ ] **TOOL-02**: Continue response stream processed via SDK `AgentStream` (replaces `processContinueStream()`)
- [ ] **TOOL-03**: Paused state (runId, sessionId, requirements) handled using SDK types
- [ ] **TOOL-04**: Tool approval/rejection flow works end-to-end through SDK

### Run Lifecycle

- [ ] **RUN-01**: `client.agents.cancel()` wired up for run cancellation
- [ ] **RUN-02**: Provider factory (`createAgentOS`) returns SDK-backed language model
- [ ] **RUN-03**: Full agent chat workflow verified: discover → connect → stream → tool confirm → continue/cancel

### Type Cleanup

- [ ] **TYPE-01**: Custom Zod schemas in `agentos-types.ts` removed (replaced by SDK types)
- [ ] **TYPE-02**: SDK types re-exported where needed by other modules (plugin, processor, UI)
- [ ] **TYPE-03**: No hand-written AgentOS API types remain in codebase

## v2 Requirements

Deferred to future milestones. SDK makes these trivial to add.

### Teams Hub

- **TEAM-01**: Teams tab populated from `client.teams.list()`
- **TEAM-02**: Team detail view with member agents
- **TEAM-03**: Connect to team for streaming via `client.teams.runStream()`

### Workflows Hub

- **WKFL-01**: Workflows tab populated from `client.workflows.list()`
- **WKFL-02**: Workflow detail view with steps/stages
- **WKFL-03**: Execute workflow via `client.workflows.runStream()`

### Sessions

- **SESS-01**: Session management via `client.sessions.*`

## Out of Scope

| Feature | Reason |
|---------|--------|
| Teams/Workflows hub implementation | Deferred — SDK makes future addition trivial |
| Full package rebrand | Separate milestone, not SDK-related |
| Knowledge base integration | Not relevant to core agent chat experience |
| Metrics dashboard | Not relevant to core agent chat experience |
| Custom fetch/SSE fallback | Full replacement, no backwards compatibility needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SDK-01 | Phase 7 | Complete |
| SDK-02 | Phase 7 | Complete |
| SDK-03 | Phase 7 | Complete |
| SDK-04 | Phase 7 | Complete |
| SDK-05 | Phase 7 | Complete |
| DISC-01 | Phase 8 | Complete |
| DISC-02 | Phase 8 | Complete |
| DISC-03 | Phase 8 | Complete |
| DISC-04 | Phase 8 | Complete |
| STRM-01 | Phase 9 | Complete |
| STRM-02 | Phase 9 | Complete |
| STRM-03 | Phase 9 | Complete |
| STRM-04 | Phase 9 | Complete |
| STRM-05 | Phase 9 | Complete |
| STRM-06 | Phase 9 | Complete |
| TOOL-01 | Phase 10 | Complete |
| TOOL-02 | Phase 10 | Complete |
| TOOL-03 | Phase 10 | Complete |
| TOOL-04 | Phase 10 | Complete |
| RUN-01 | Phase 10 | Complete |
| RUN-02 | Phase 9 | Complete |
| RUN-03 | Phase 11 | Complete |
| TYPE-01 | Phase 11 | Complete |
| TYPE-02 | Phase 11 | Complete |
| TYPE-03 | Phase 11 | Complete |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-07 (All 25/25 requirements satisfied - v2.0 complete)*
