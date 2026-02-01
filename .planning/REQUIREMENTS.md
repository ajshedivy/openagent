# Requirements: openagent

**Defined:** 2026-02-01
**Core Value:** Connect to AgentOS agents from the terminal with a great user experience

## v1.1 Requirements

Requirements for the AgentOS Hub milestone. Each maps to roadmap phases.

### UI Infrastructure

- [ ] **UI-01**: `/agno` slash command registered in TUI command system
- [ ] **UI-02**: Tabbed dialog component with Agents | Teams | Workflows sections
- [ ] **UI-03**: Tab key cycles between sections with visual indicator
- [ ] **UI-04**: Dialog styling consistent with existing opencode dialogs (theme, spacing)

### Agent List

- [ ] **AGNT-01**: Agent list displays all discovered agents from AgentOS API
- [ ] **AGNT-02**: Each agent row shows name and status indicator (connected/available)
- [ ] **AGNT-03**: Currently connected agent is visually highlighted
- [ ] **AGNT-04**: Selecting an agent opens detail view

### Agent Detail

- [ ] **DETL-01**: Detail panel displays agent name prominently
- [ ] **DETL-02**: Detail panel shows model identifier
- [ ] **DETL-03**: Detail panel shows tool count and tool names
- [ ] **DETL-04**: Detail panel shows health/connection status
- [ ] **DETL-05**: "Connect" action switches active agent
- [ ] **DETL-06**: "Back" action returns to agent list
- [ ] **DETL-07**: Keyboard navigation (Enter to connect, Escape to go back)

### Placeholder Sections

- [ ] **PLCH-01**: Teams tab visible in tab bar
- [ ] **PLCH-02**: Teams section shows "Coming soon" message when selected
- [ ] **PLCH-03**: Workflows tab visible in tab bar
- [ ] **PLCH-04**: Workflows section shows "Coming soon" message when selected

## Future Requirements

Deferred to later milestones. Tracked but not in v1.1 roadmap.

### Agent List Enhancements

- **AGNT-05**: Filter/search capability for agent list
- **AGNT-06**: Show model name in list row
- **AGNT-07**: Show tool count in list row

### Teams (v1.2+)

- **TEAM-01**: Teams list displays all teams from AgentOS API
- **TEAM-02**: Team detail view with member agents
- **TEAM-03**: Connect to team for multi-agent orchestration

### Workflows (v1.2+)

- **WKFL-01**: Workflows list displays all workflows from AgentOS API
- **WKFL-02**: Workflow detail view with steps/stages
- **WKFL-03**: Execute workflow from hub

### API Integration

- **API-01**: Fetch agent configuration data from AgentOS API
- **API-02**: Fetch agent health/metrics from AgentOS API
- **API-03**: Real-time status updates via SSE

## Out of Scope

Explicitly excluded from v1.1. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| System prompt display | Bloats UI per user feedback |
| Agent creation/editing | Read-only hub for v1.1 |
| Session management in hub | Separate feature, already exists elsewhere |
| Metrics dashboard | Deferred to dedicated /metrics command |
| Full Teams functionality | v1.2+ after Agents pattern established |
| Full Workflows functionality | v1.2+ after Agents pattern established |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| AGNT-01 | Phase 4 | Pending |
| AGNT-02 | Phase 4 | Pending |
| AGNT-03 | Phase 4 | Pending |
| AGNT-04 | Phase 4 | Pending |
| DETL-01 | Phase 5 | Pending |
| DETL-02 | Phase 5 | Pending |
| DETL-03 | Phase 5 | Pending |
| DETL-04 | Phase 5 | Pending |
| DETL-05 | Phase 5 | Pending |
| DETL-06 | Phase 5 | Pending |
| DETL-07 | Phase 5 | Pending |
| PLCH-01 | Phase 6 | Pending |
| PLCH-02 | Phase 6 | Pending |
| PLCH-03 | Phase 6 | Pending |
| PLCH-04 | Phase 6 | Pending |

**Coverage:**
- v1.1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after roadmap creation*
