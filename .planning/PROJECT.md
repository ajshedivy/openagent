# openagent

## What This Is

A terminal CLI client for Agno AgentOS. Built as a fork of opencode, openagent leverages the existing TUI infrastructure to provide a rich terminal experience for connecting to and interacting with AgentOS agents, teams, workflows, evals, sessions, and metrics — all via the AgentOS API.

## Core Value

Connect to AgentOS agents from the terminal with a great user experience — agent discovery, rich interaction, and multi-agent orchestration.

## Current Milestone: v1.1 AgentOS Hub

**Goal:** Create `/agno` slash command as the central hub for viewing and managing AgentOS artifacts (agents, teams, workflows).

**Target features:**
- Tabbed UI with Agents, Teams, Workflows sections
- Agent list with status indicators and metadata summary
- Agent detail view (identity, config, runtime status)
- Connect/switch active agent from hub
- Teams/Workflows tabs as "coming soon" placeholders

## Current State

**Version:** v1.0 Minimal Divergence (shipped 2026-01-31)

Openagent is now an independent project with its own repository, CLI binary, and branding. The `openagent` command launches a terminal UI with the openagent wordmark. Full attribution to the original opencode project is preserved.

**Codebase:**
- 23 files modified from opencode fork
- 1,615 lines added, 92 removed
- Repository: github.com/ajshedivy/openagent

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

### Active

<!-- v1.1 AgentOS Hub -->

- [ ] `/agno` slash command registered in TUI
- [ ] Tabbed dialog UI (Agents | Teams | Workflows)
- [ ] Agent list view with status, model, tool count
- [ ] Agent detail view (identity, config, health)
- [ ] Connect/switch agent from detail view
- [ ] Teams tab placeholder ("coming soon")
- [ ] Workflows tab placeholder ("coming soon")

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
*Last updated: 2026-02-01 after v1.1 milestone started*
