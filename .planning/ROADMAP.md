# Roadmap: v1.1 AgentOS Hub

**Milestone:** v1.1 AgentOS Hub
**Created:** 2026-02-01
**Phases:** 4 (continuing from v1.0's Phase 2)
**Depth:** Comprehensive

## Overview

This roadmap delivers the `/agno` slash command as a central hub for viewing and managing AgentOS artifacts. Starting with UI infrastructure and tabbed navigation, we progressively build agent list view, agent detail view, and placeholder sections for Teams and Workflows. Each phase delivers a complete, verifiable capability.

## Phases

### Phase 3: UI Infrastructure

**Goal:** User can open AgentOS hub via slash command and navigate between tabbed sections.

**Dependencies:** None (builds on existing TUI infrastructure)

**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md — Create DialogAgno tabbed hub component
- [x] 03-02-PLAN.md — Register /agno slash command

**Requirements:**
- UI-01: `/agno` slash command registered in TUI command system
- UI-02: Tabbed dialog component with Agents | Teams | Workflows sections
- UI-03: Tab key cycles between sections with visual indicator
- UI-04: Dialog styling consistent with existing opencode dialogs (theme, spacing)

**Success Criteria:**
1. User types `/agno` in chat and hub dialog opens
2. User sees three tabs: Agents, Teams, Workflows
3. User presses Tab to cycle between tabs with visible highlight
4. Hub dialog visually matches existing dialogs (spacing, borders, colors)

---

### Phase 4: Agent List View

**Goal:** User can see all available agents with their status and select one for details.

**Dependencies:** Phase 3 (tabbed dialog infrastructure)

**Plans:** 1 plan

Plans:
- [x] 04-01-PLAN.md — Implement agent list with selection and detail view placeholder

**Requirements:**
- AGNT-01: Agent list displays all discovered agents from AgentOS API
- AGNT-02: Each agent row shows name and status indicator (connected/available)
- AGNT-03: Currently connected agent is visually highlighted
- AGNT-04: Selecting an agent opens detail view

**Success Criteria:**
1. User opens hub and sees list of all agents discovered from AgentOS API
2. User can distinguish connected agent (filled indicator) from available agents (outline indicator)
3. Currently connected agent has distinct visual highlight (e.g., background color)
4. User presses Enter on an agent row and detail view appears

---

### Phase 5: Agent Detail View

**Goal:** User can view agent information and connect to a different agent.

**Dependencies:** Phase 4 (agent list with selection)

**Plans:** 1 plan

Plans:
- [x] 05-01-PLAN.md — Enhance AgentDetail with full information display and connect action

**Requirements:**
- DETL-01: Detail panel displays agent name prominently
- DETL-02: Detail panel shows model identifier
- DETL-03: Detail panel shows tool count and tool names
- DETL-04: Detail panel shows health/connection status
- DETL-05: "Connect" action switches active agent
- DETL-06: "Back" action returns to agent list
- DETL-07: Keyboard navigation (Enter to connect, Escape to go back)

**Success Criteria:**
1. User sees agent name, model, tools, and health status in detail view
2. User presses Enter on Connect action and active agent switches
3. User presses Escape and returns to agent list
4. After connecting, user returns to chat with new agent active
5. Keyboard-only workflow: navigate to agent, view details, connect, all without mouse

---

### Phase 6: Model Provider Separation

**Goal:** AgentOS agents are only accessible via /agno hub; /models shows only external providers.

**Dependencies:** Phase 5 (core hub functionality complete)

**Plans:** 1 plan

Plans:
- [x] 06-01-PLAN.md — Filter AgentOS from /models dialog in web app and TUI

**Requirements:**
- SEP-01: Remove AgentOS provider from /models dialog
- SEP-02: /models shows only external model providers (Anthropic, OpenAI, etc.)
- SEP-03: /agno is the exclusive interface for AgentOS agents
- SEP-04: Placeholders for Teams and Workflows tabs show "Coming soon"

**Success Criteria:**
1. User types /models and sees only external providers (no AgentOS)
2. User types /agno to access AgentOS agents exclusively
3. Clear separation: /models = external LLMs, /agno = AgentOS agents
4. Teams and Workflows tabs show placeholder content

---

## Progress

| Phase | Name | Status | Plans | Completed |
|-------|------|--------|-------|-----------|
| 3 | UI Infrastructure | ✓ Complete | 2 | 2 |
| 4 | Agent List View | ✓ Complete | 1 | 1 |
| 5 | Agent Detail View | ✓ Complete | 1 | 1 |
| 6 | Model Provider Separation | ✓ Complete | 1 | 1 |

**Coverage:** 19/19 requirements mapped

## Requirement Coverage

| Category | Requirements | Phase |
|----------|--------------|-------|
| UI Infrastructure | UI-01, UI-02, UI-03, UI-04 | Phase 3 |
| Agent List | AGNT-01, AGNT-02, AGNT-03, AGNT-04 | Phase 4 |
| Agent Detail | DETL-01, DETL-02, DETL-03, DETL-04, DETL-05, DETL-06, DETL-07 | Phase 5 |
| Model Separation | SEP-01, SEP-02, SEP-03, SEP-04 | Phase 6 |

---
*Roadmap created: 2026-02-01*
*Milestone: v1.1 AgentOS Hub*
