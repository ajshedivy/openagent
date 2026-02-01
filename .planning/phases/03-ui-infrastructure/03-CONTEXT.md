# Phase 3: UI Infrastructure - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

User can open AgentOS hub via `/agno` slash command and navigate between tabbed sections (Agents | Teams | Workflows). This phase establishes the UI infrastructure — the shell and navigation. Content for each section is handled in later phases.

</domain>

<decisions>
## Implementation Decisions

### Tab bar design
- Underline style — active tab has colored underline beneath text (like browser tabs, GitHub)
- Position at top of dialog — horizontal tabs across the top, content below
- Text-only labels — just "Agents", "Teams", "Workflows" (no icons)
- Theme accent color for active tab underline — use existing opencode accent/primary color

### Hub dialog sizing & layout
- Follow existing opencode dialog patterns — match the "Select model" dialog sizing
- Centered modal with comfortable margins (not full-screen)
- Content-aware height that grows with content
- Title: "AgentOS Hub" displayed in dialog header
- Search field at top — filters content in whichever tab is active
- Keyboard hints at bottom — display shortcuts like Tab, Enter, Esc

### Tab switching behavior
- Tab key cycles between sections: Agents → Teams → Workflows → Agents
- No number key shortcuts (1, 2, 3) — Tab key only
- Visual indicator shows which tab is active (underline in accent color)

### Claude's Discretion
- Empty section states and loading indicators
- Exact spacing and typography within existing patterns
- Focus ring style for keyboard navigation
- How search field filters content (fuzzy match, prefix, etc.)

</decisions>

<specifics>
## Specific Ideas

- Reference: "Select model" dialog as the sizing/layout template (see existing opencode dialogs)
- Should feel consistent with existing opencode UI — not a new visual language

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-ui-infrastructure*
*Context gathered: 2026-02-01*
