# openagent

## What This Is

A terminal CLI client for Agno AgentOS. Built as a fork of opencode, openagent leverages the existing TUI infrastructure to provide a rich terminal experience for connecting to and interacting with AgentOS agents, teams, workflows, evals, sessions, and metrics — all via the AgentOS API.

## Core Value

Connect to AgentOS agents from the terminal with a great user experience — agent discovery, rich interaction, and multi-agent orchestration.

## Current State

**Version:** v1.1 AgentOS Hub (shipped 2026-02-01)

Openagent now features the `/agno` slash command as a central hub for viewing and managing AgentOS agents. The hub provides a tabbed interface (Agents | Teams | Workflows) with full agent list display, status indicators, detail view with metadata, and quick-connect functionality. AgentOS agents are now exclusively accessed via `/agno` while `/models` shows only external providers.

**Codebase:**
- 35+ files modified
- 253,293 lines TypeScript total
- Repository: github.com/ajshedivy/openagent

## Current Milestone: v2.0 AgentOS SDK Migration

**Goal:** Replace all custom AgentOS API client code with `@worksofadam/agentos-sdk` and ensure full working agent support end-to-end.

**Target features:**
- Install and integrate `@worksofadam/agentos-sdk` as the sole AgentOS API client
- Replace custom SSE parsing with SDK's `AgentStream`
- Replace manual fetch/FormData calls with SDK resource methods (`client.agents.*`)
- Replace hand-written Zod schemas/types with SDK-provided types
- Refactor agent discovery plugin to use `client.agents.list()`
- Adapt `AgentStream` events to Vercel AI SDK `LanguageModelV2StreamPart` (keep AI SDK bridge)
- Refactor tool confirmation continue workflow to use `client.agents.continue()`
- Full working agent chat: discovery → connect → stream → tool confirmation → continue/cancel
- Architecture enables trivial future addition of teams/workflows via `client.teams.*` / `client.workflows.*`

## Requirements

### Validated

<!-- Existing capabilities inherited from opencode fork -->

- ✓ Terminal UI infrastructure (SolidJS reactive components, chat interface) — existing
- ✓ Multi-provider AI SDK integration (Vercel AI SDK v5) — existing
- ✓ AgentOS authentication plugin (auto-discovers agents from API) — existing
- ✓ AgentOS language model (SSE streaming, AI SDK v2 interface) — existing
- ✓ Tool confirmation workflow (pause/continue with permission prompts) — existing
- ✓ Session management and persistence — existing
- ✓ File tree navigation and context — existing
- ✓ Permission system for tool execution — existing

<!-- v1.0 Minimal Divergence -->

- ✓ Git history squashed with opencode attribution — v1.0
- ✓ Independent repository at github.com/ajshedivy/openagent — v1.0
- ✓ CLI binary renamed to `openagent` — v1.0
- ✓ package.json bin field registers `openagent` command — v1.0
- ✓ Bin script references openagent binaries and messaging — v1.0
- ✓ ASCII art banner displays "openagent" — v1.0
- ✓ README explains openagent initiative — v1.0

<!-- v1.1 AgentOS Hub -->

- ✓ `/agno` slash command registered in TUI — v1.1
- ✓ Tabbed dialog UI (Agents | Teams | Workflows) — v1.1
- ✓ Agent list with status indicator and keyboard navigation — v1.1
- ✓ Agent detail view (name, model, tools, health) — v1.1
- ✓ Quick-connect from list (Enter key) — v1.1
- ✓ AgentOS separated from /models dialog — v1.1
- ✓ Teams/Workflows placeholders ("Coming soon") — v1.1

### Active

<!-- v2.0 AgentOS SDK Migration -->

- [ ] `@worksofadam/agentos-sdk` installed as dependency
- [ ] Agent discovery uses `AgentOSClient.agents.list()` instead of custom fetch
- [ ] Agent streaming uses `AgentOSClient.agents.runStream()` with `AgentStream`
- [ ] `AgentStream` events adapted to AI SDK `LanguageModelV2StreamPart` interface
- [ ] Tool confirmation continue uses `AgentOSClient.agents.continue()`
- [ ] Run cancellation uses `AgentOSClient.agents.cancel()`
- [ ] Custom SSE parser removed (replaced by SDK's `AgentStream`)
- [ ] Custom Zod schemas/types replaced with SDK-provided types
- [ ] Full agent chat workflow verified: discover → connect → stream → tool confirm → continue
- [ ] SDK client shared as singleton across plugin and provider layers

### Out of Scope

- opencode-specific branding or features — this is a new project
- Non-AgentOS providers (will focus purely on AgentOS API) — future decision
- Mobile or web deployment — terminal CLI focus
- Teams/Workflows hub implementation — deferred to future milestone (SDK makes this trivial)
- Full package rebrand (scope, directories, env vars) — deferred

## Context

**Origin:** Fork of opencode, an AI-powered terminal CLI tool with rich TUI.

**AgentOS Integration (already built):**
- `packages/opencode/src/plugin/agentos.ts` — Authentication plugin, agent discovery
- `packages/opencode/src/provider/sdk/agentos/` — Language model, types, provider factory
- Tool confirmation UI in `packages/opencode/src/cli/ui/permission.tsx`

**Stack:**
- TypeScript 5.8, Bun 1.3.5 runtime
- SolidJS for reactive UI
- Vercel AI SDK for model abstraction
- Hono for HTTP framework

**Tech Debt (from v1.0):**
- 14 files in build infrastructure reference old bin/opencode path
- Platform binary packages (openagent-{platform}-{arch}) not yet created
- Old branches retain 8,464-commit opencode history

**AgentOS SDK (`@worksofadam/agentos-sdk` v0.3.0):**
- `AgentOSClient` with resource classes: agents, teams, workflows, sessions, memories, traces, metrics, knowledge
- `AgentStream` for SSE consumption (async iterable + event handlers)
- Typed responses generated from OpenAPI spec
- Built-in retry, error hierarchy, file upload normalization

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
| Fork opencode rather than build from scratch | Leverage mature TUI infrastructure, session management, tool execution | ✓ Good — v1.0 shipped same-day |
| Rename to "openagent" | Clear identity as AgentOS client, distinct from opencode | ✓ Good — branding established |
| Focus on AgentOS API exclusively | Simplify architecture, align with AgentOS ecosystem | — Pending (v2.0) |
| Squash 8,464 commits into single initial commit | Clean divergence point, full attribution preserved | ✓ Good — clean history |
| Defer full package rebrand to v2.0 | Minimal changes for v1.0, keep compatibility | ✓ Good — fast ship |
| Adopt `@worksofadam/agentos-sdk` for API client | Eliminate ~1000 lines of custom fetch/SSE/types code, get typed API from OpenAPI spec, built-in retry and error handling | — Pending (v2.0) |
| Keep AI SDK bridge during SDK migration | Preserve Vercel AI SDK integration, minimize blast radius, adapt AgentStream → LanguageModelV2StreamPart | — Pending (v2.0) |

---
*Last updated: 2026-02-07 after v2.0 milestone started*
