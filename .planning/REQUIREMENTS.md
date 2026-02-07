# Requirements: openagent v2.0 AgentOS SDK Migration

**Defined:** 2026-02-07
**Core Value:** Connect to AgentOS agents from the terminal with a great user experience — now powered by the official SDK

## v1 Requirements

Requirements for v2.0 milestone. Each maps to roadmap phases.

### SDK Client Infrastructure

- [ ] **SDK-01**: `@worksofadam/agentos-sdk` installed as workspace dependency
- [ ] **SDK-02**: Shared `AgentOSClient` singleton created with baseURL and apiKey resolution from config/env
- [ ] **SDK-03**: Custom fetch wrapper in plugin removed (SDK handles auth headers internally)
- [ ] **SDK-04**: SDK health check integrated into provider initialization
- [ ] **SDK-05**: SDK error hierarchy (APIError, AuthenticationError, etc.) used for error handling

### Agent Discovery

- [ ] **DISC-01**: Agent discovery plugin uses `client.agents.list()` instead of custom GET `/agents` fetch
- [ ] **DISC-02**: SDK `AgentResponse` type replaces custom `AgentOSAgent` interface
- [ ] **DISC-03**: Agent-to-Model mapping updated to use SDK response types
- [ ] **DISC-04**: `/agno` hub agent list populated from SDK client

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
| SDK-01 | — | Pending |
| SDK-02 | — | Pending |
| SDK-03 | — | Pending |
| SDK-04 | — | Pending |
| SDK-05 | — | Pending |
| DISC-01 | — | Pending |
| DISC-02 | — | Pending |
| DISC-03 | — | Pending |
| DISC-04 | — | Pending |
| STRM-01 | — | Pending |
| STRM-02 | — | Pending |
| STRM-03 | — | Pending |
| STRM-04 | — | Pending |
| STRM-05 | — | Pending |
| STRM-06 | — | Pending |
| TOOL-01 | — | Pending |
| TOOL-02 | — | Pending |
| TOOL-03 | — | Pending |
| TOOL-04 | — | Pending |
| RUN-01 | — | Pending |
| RUN-02 | — | Pending |
| RUN-03 | — | Pending |
| TYPE-01 | — | Pending |
| TYPE-02 | — | Pending |
| TYPE-03 | — | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 0
- Unmapped: 25 ⚠️

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-07 after initial definition*
