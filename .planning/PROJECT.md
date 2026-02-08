# openagent

## What This Is

A terminal CLI client for Agno AgentOS. Built as a fork of opencode, openagent leverages the existing TUI infrastructure to provide a rich terminal experience for connecting to and interacting with AgentOS agents — now powered entirely by the official `@worksofadam/agentos-sdk`.

## Core Value

Connect to AgentOS agents from the terminal with a great user experience — agent discovery, rich interaction, and multi-agent orchestration.

## Current State

**Version:** v2.0 AgentOS SDK Migration (shipped 2026-02-07)

All custom AgentOS API client code has been replaced with the official SDK. The full agent chat workflow is verified end-to-end: discovery -> connect -> stream -> tool confirmation -> continue/cancel. Zero custom fetch/SSE/types code remains.

**Codebase:**
- 38+ files modified across v2.0
- 253,293+ lines TypeScript total
- Repository: github.com/ajshedivy/openagent

## Requirements

### Validated

<!-- v1.0 Minimal Divergence -->

- Git history squashed with opencode attribution — v1.0
- Independent repository at github.com/ajshedivy/openagent — v1.0
- CLI binary renamed to `openagent` — v1.0
- package.json bin field registers `openagent` command — v1.0
- Bin script references openagent binaries and messaging — v1.0
- ASCII art banner displays "openagent" — v1.0
- README explains openagent initiative — v1.0

<!-- v1.1 AgentOS Hub -->

- `/agno` slash command registered in TUI — v1.1
- Tabbed dialog UI (Agents | Teams | Workflows) — v1.1
- Agent list with status indicator and keyboard navigation — v1.1
- Agent detail view (name, model, tools, health) — v1.1
- Quick-connect from list (Enter key) — v1.1
- AgentOS separated from /models dialog — v1.1
- Teams/Workflows placeholders ("Coming soon") — v1.1

<!-- v2.0 AgentOS SDK Migration -->

- `@worksofadam/agentos-sdk` installed as dependency — v2.0
- Agent discovery uses `AgentOSClient.agents.list()` — v2.0
- Agent streaming uses `AgentOSClient.agents.runStream()` with `AgentStream` — v2.0
- `AgentStream` events adapted to AI SDK `LanguageModelV2StreamPart` interface — v2.0
- Tool confirmation continue uses `AgentOSClient.agents.continue()` — v2.0
- Run cancellation uses `AgentOSClient.agents.cancel()` — v2.0
- Custom SSE parser removed (replaced by SDK's `AgentStream`) — v2.0
- Custom Zod schemas/types replaced with SDK-provided types — v2.0
- Full agent chat workflow verified end-to-end — v2.0
- SDK client shared as singleton across plugin and provider layers — v2.0

### Active

(None — next milestone not yet defined)

### Out of Scope

- opencode-specific branding or features — this is a new project
- Mobile or web deployment — terminal CLI focus
- Teams/Workflows hub implementation — deferred (SDK makes this trivial)
- Full package rebrand (scope, directories, env vars) — deferred
- Knowledge base integration — not relevant to core agent chat
- Metrics dashboard — not relevant to core agent chat

## Context

**Origin:** Fork of opencode, an AI-powered terminal CLI tool with rich TUI.

**AgentOS Integration:**
- `packages/opencode/src/plugin/agentos.ts` — Authentication plugin, agent discovery via SDK
- `packages/opencode/src/provider/sdk/agentos/` — Language model, types, provider factory, SDK client singleton
- Tool confirmation UI in `packages/opencode/src/cli/ui/permission.tsx`

**Stack:**
- TypeScript 5.8, Bun 1.3.5 runtime
- SolidJS for reactive UI
- Vercel AI SDK for model abstraction
- `@worksofadam/agentos-sdk` v0.3.0 for AgentOS API
- Hono for HTTP framework

**Tech Debt:**
- 14 files in build infrastructure reference old bin/opencode path
- Platform binary packages (openagent-{platform}-{arch}) not yet created
- Old branches retain 8,464-commit opencode history
- SDK installed from GitHub (not npm registry) — needs publishing
- Non-null assertions for API-guaranteed fields during migration

**Future scope:**
- Teams hub implementation (via `client.teams.*`)
- Workflows hub implementation (via `client.workflows.*`)
- Sessions management (via `client.sessions.*`)
- Metrics dashboard (via `client.metrics.*`)
- Full rebrand (package scope, directories, env vars)

## Constraints

- **API:** Built purely on AgentOS API — no direct model calls
- **Runtime:** Bun 1.3.5 primary runtime
- **UI:** Terminal-first — leverage existing TUI infrastructure

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fork opencode rather than build from scratch | Leverage mature TUI infrastructure, session management, tool execution | Good — v1.0 shipped same-day |
| Rename to "openagent" | Clear identity as AgentOS client, distinct from opencode | Good — branding established |
| Focus on AgentOS API exclusively | Simplify architecture, align with AgentOS ecosystem | Good — clean SDK integration |
| Squash 8,464 commits into single initial commit | Clean divergence point, full attribution preserved | Good — clean history |
| Defer full package rebrand to v2.0 | Minimal changes for v1.0, keep compatibility | Good — fast ship |
| Adopt `@worksofadam/agentos-sdk` for API client | Eliminate ~1000 lines of custom fetch/SSE/types code, typed API from OpenAPI spec | Good — 25/25 requirements shipped |
| Keep AI SDK bridge during SDK migration | Preserve Vercel AI SDK integration, minimize blast radius | Good — AgentStream -> LanguageModelV2StreamPart works cleanly |
| SDK client singleton with lazy init | Single client instance, shared across plugin and provider | Good — clean architecture |
| getClient required in AgentOSConfig | SDK client as sole transport, no HTTP fields in config | Good — minimal config surface |

---
*Last updated: 2026-02-07 after v2.0 milestone*
