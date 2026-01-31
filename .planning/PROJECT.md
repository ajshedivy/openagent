# openagent

## What This Is

A terminal CLI client for Agno AgentOS. Built as a fork of opencode, openagent leverages the existing TUI infrastructure to provide a rich terminal experience for connecting to and interacting with AgentOS agents, teams, workflows, evals, sessions, and metrics — all via the AgentOS API.

## Core Value

Connect to AgentOS agents from the terminal with a great user experience — agent discovery, rich interaction, and multi-agent orchestration.

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

### Active

<!-- Current milestone: Project rename and repo divergence -->

- [ ] Rename project from "opencode" to "openagent"
- [ ] Create new GitHub repository for openagent
- [ ] Push initial commit marking divergence from opencode

### Out of Scope

- opencode-specific branding or features — this is a new project
- Non-AgentOS providers (will focus purely on AgentOS API) — future decision
- Mobile or web deployment — terminal CLI focus

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

**Future scope (not this milestone):**
- Teams integration
- Workflows integration
- Evals integration
- Sessions management
- Metrics dashboard
- AgentOS client SDK development

## Constraints

- **API:** Built purely on AgentOS API — no direct model calls
- **Runtime:** Bun 1.3.5 primary runtime
- **UI:** Terminal-first — leverage existing TUI infrastructure

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fork opencode rather than build from scratch | Leverage mature TUI infrastructure, session management, tool execution | — Pending |
| Rename to "openagent" | Clear identity as AgentOS client, distinct from opencode | — Pending |
| Focus on AgentOS API exclusively | Simplify architecture, align with AgentOS ecosystem | — Pending |

---
*Last updated: 2026-01-31 after initialization*
