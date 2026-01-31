# openagent

A terminal-first client for [Agno AgentOS](https://github.com/agno-agi/agno). Connect to agents, teams, workflows, and more — all from your terminal.

## Project Status

**Current:** v1.0 Minimal Divergence (shipped 2026-01-31)
**Next:** v2.0 AgentOS Integration

## Vision

openagent is the terminal interface for AgentOS. While AgentOS provides the agent runtime, orchestration, and APIs, openagent gives developers a rich terminal experience for:

- Discovering and connecting to agents
- Orchestrating multi-agent workflows
- Managing teams and sessions
- Monitoring metrics and evals
- Interactive agent conversations with tool confirmation

## v1.0 — Minimal Divergence ✓

Established openagent as an independent project forked from [opencode](https://github.com/sst/opencode).

- [x] Squashed history with full attribution to opencode
- [x] Independent repository at github.com/ajshedivy/openagent
- [x] Renamed CLI binary to `openagent`
- [x] Updated branding (ASCII art, README)

## v2.0 — AgentOS Integration (Next)

Deep integration with the AgentOS ecosystem via the [agentos-sdk](https://github.com/ajshedivy/agentos-sdk).

### Goals

1. **Integrate agentos-sdk**
   - Add agentos-sdk as core dependency
   - Replace current provider abstraction with SDK client
   - Leverage SDK's type-safe agent/team/workflow interfaces
   - Use SDK's built-in auth and session management

2. **Clean out AI provider integrations**
   - Remove Anthropic, OpenAI, Google, etc. direct integrations
   - Keep client code and UI infrastructure intact
   - Route all AI interactions through AgentOS API
   - Simplify provider factory to AgentOS-only

3. **Add AgentOS slash commands**
   - `/agents` — List and select available agents
   - `/teams` — Browse and activate agent teams
   - `/workflows` — Discover and run workflows
   - `/sessions` — Manage conversation sessions
   - `/evals` — View evaluation results
   - `/metrics` — Dashboard for agent metrics

4. **Custom TUI components for AgentOS**
   - Agent picker with capabilities preview
   - Team composition viewer
   - Workflow step visualizer
   - Session browser with history
   - Metrics dashboard (latency, tokens, costs)
   - Eval results table

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    openagent TUI                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ Agents  │  │  Teams  │  │Workflows│  │ Metrics │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│       └────────────┴────────────┴────────────┘          │
│                         │                                │
│              ┌──────────▼──────────┐                    │
│              │    agentos-sdk      │                    │
│              │  (TypeScript SDK)   │                    │
│              └──────────┬──────────┘                    │
└─────────────────────────┼───────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │     AgentOS API       │
              │  (agents, teams, etc) │
              └───────────────────────┘
```

### Dependencies

- **agentos-sdk** — TypeScript SDK for AgentOS (in development)
- **Existing TUI** — SolidJS components, chat interface, tool confirmation
- **Vercel AI SDK** — May keep for streaming abstraction or replace with SDK

## Future Milestones

### v2.1 — Teams & Workflows
- Multi-agent orchestration UI
- Workflow builder/runner
- Team composition management

### v2.2 — Sessions & History
- Persistent session management
- Cross-session context
- Session sharing/export

### v2.3 — Observability
- Real-time metrics dashboard
- Cost tracking
- Eval integration

## Tech Stack

- **Runtime:** Bun 1.3.5+
- **UI:** SolidJS + Ink (terminal rendering)
- **SDK:** agentos-sdk (TypeScript)
- **Build:** Turbo monorepo

## Contributing

This project is in active development. The agentos-sdk is being built in parallel.

## Links

- [openagent](https://github.com/ajshedivy/openagent) — This project
- [agentos-sdk](https://github.com/ajshedivy/agentos-sdk) — TypeScript SDK for AgentOS
- [AgentOS](https://github.com/agno-agi/agno) — Agent runtime and orchestration
- [opencode](https://github.com/sst/opencode) — Original project (forked with attribution)

---

*Last updated: 2026-01-31*
