# Phase 4: Agent List View - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Display all available agents from AgentOS API in the Agents tab of the hub. Users can see agent names with connection status and select one to open the detail view. Agent details and connect functionality are Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Agent row layout
- Name + status only — keep it minimal, details in the detail view
- Plain text names, no icon prefix
- Connected agent listed first, then remaining agents alphabetically
- Compact density (single line per agent)

### Status indicators
- Follow the model selector pattern exactly (see DialogSelect/DialogModel)
- Filled dot for connected agent, no dot for available agents
- Dot color: theme accent color (same as tab underline)
- Connected agent text also uses accent color (like "News Agent" in model selector)
- Available agents use normal text color

### List interaction
- Arrow keys move highlight, Enter opens detail view
- Use same highlighting style as DialogSelect (background highlight on selected row)
- Cursor starts on connected agent when dialog opens
- List scrolls within fixed dialog size when many agents

### Claude's Discretion
- Exact padding/spacing matching existing dialogs
- Empty state if no agents found
- Loading state while fetching agents

</decisions>

<specifics>
## Specific Ideas

- Match the model selector UI pattern exactly — user provided screenshot reference showing:
  - Colored dot on left for active item
  - Name in accent color for active item
  - Normal text for other items
  - Clean, compact rows

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-agent-list-view*
*Context gathered: 2026-02-01*
