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

## Next Milestone: v1.2 Teams & Workflows

**Goal:** Implement full Teams and Workflows functionality in the `/agno` hub.

**Target features:**
- Teams list with member agents
- Team detail view and connect
- Workflows list with steps/stages
- Workflow execution from hub

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

<!-- v1.2 Teams & Workflows -->

- [ ] Teams list displays all teams from AgentOS API
- [ ] Team detail view with member agents
- [ ] Connect to team for multi-agent orchestration
- [ ] Workflows list displays all workflows from AgentOS API
- [ ] Workflow detail view with steps/stages
- [ ] Execute workflow from hub

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

**Tech Debt (from v1.0):**
- 14 files in build infrastructure reference old bin/opencode path
- Platform binary packages (openagent-{platform}-{arch}) not yet created
- Old branches retain 8,464-commit opencode history

**Future scope:**
- Full rebrand (package scope, directories, env vars) — v2.0
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
| Fork opencode rather than build from scratch | Leverage mature TUI infrastructure, session management, tool execution | ✓ Good — v1.0 shipped same-day |
| Rename to "openagent" | Clear identity as AgentOS client, distinct from opencode | ✓ Good — branding established |
| Focus on AgentOS API exclusively | Simplify architecture, align with AgentOS ecosystem | — Pending (v2.0) |
| Squash 8,464 commits into single initial commit | Clean divergence point, full attribution preserved | ✓ Good — clean history |
| Defer full package rebrand to v2.0 | Minimal changes for v1.0, keep compatibility | ✓ Good — fast ship |

---
*Last updated: 2026-02-01 after v1.1 milestone completed*
