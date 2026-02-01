# Phase 5: Agent Detail View - Research

**Researched:** 2026-02-01
**Domain:** TUI detail panel with SolidJS, agent information display
**Confidence:** HIGH

## Summary

Phase 5 implements the agent detail view within the AgentOS hub dialog. When a user selects an agent from the list (Phase 4), they navigate to a detail panel showing comprehensive agent information: name, model identifier, tool count and names, and connection status. The detail view provides "Connect" and "Back" actions with full keyboard navigation support.

The established pattern in this codebase is inline detail components within the same dialog file, using SolidJS `Show` components for view switching. The AgentDetail component will consume agent data from the sync provider (already populated by the AgentOS plugin), extract tool information from the agent's model configuration, and display status using the existing theme color patterns (success/error/warning/muted).

**Primary recommendation:** Build AgentDetail as an inline component in dialog-agno.tsx, following the existing DialogStatus pattern for information display with colored status indicators.

## Standard Stack

The codebase already uses these technologies. No new libraries needed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| solid-js | 1.9.10 | Reactive UI framework | Established in codebase, fine-grained reactivity |
| @opentui/core | 0.1.75 | Terminal UI primitives | Core TUI rendering, box/text/scrollbox |
| @opentui/solid | 0.1.75 | SolidJS TUI bindings | Keyboard hooks, terminal dimensions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| solid-js/store | (included) | State management | Dialog component state (already in use) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline component | Separate file | Phase 4 already has placeholder, inline keeps navigation simple |
| createMemo | createEffect | Memo is appropriate for derived data (tools, status) |
| Theme colors | Hardcoded | Theme provides semantic colors (success, error, primary, textMuted) |

**Installation:**
```bash
# No additional packages needed - already in dependencies
```

## Architecture Patterns

### Recommended Component Structure
```
dialog-agno.tsx (existing file)
├── DialogAgno (main component)
├── AgentRow (existing, Phase 4)
└── AgentDetail (new component)
```

### Pattern 1: Inline Detail Component with View Switching
**What:** AgentDetail component defined in same file, rendered conditionally
**When to use:** Simple detail views that don't need separate routing
**Example:**
```typescript
// Source: dialog-agno.tsx (Phase 4 implementation)
<Show when={store.activeTab === "agents"}>
  <Show
    when={!store.selectedAgent}
    fallback={<AgentDetail agent={store.selectedAgent!} onBack={() => setStore("selectedAgent", null)} />}
  >
    {/* Agent list */}
  </Show>
</Show>
```

### Pattern 2: Extract Data from Sync Provider
**What:** Agent data comes from sync.data.provider, enriched by plugin
**When to use:** Displaying server-side data in UI
**Example:**
```typescript
// Source: plugin/agentos.ts lines 40-51
const agentosProvider = sync.data.provider.find(p => p.id === "agentos")
const model = agentosProvider.models[agent.id]
// model contains: name, capabilities, options.agentMetadata
```

### Pattern 3: Status Indicators with Theme Colors
**What:** Use theme.success/error/warning/textMuted with bullet points
**When to use:** Connection status, health indicators
**Example:**
```typescript
// Source: dialog-status.tsx lines 56-70
<text
  flexShrink={0}
  style={{
    fg: ({
      connected: theme.success,
      failed: theme.error,
      disabled: theme.textMuted,
      needs_auth: theme.warning,
    })[item.status]
  }}
>
  •
</text>
<text fg={theme.text}>
  <b>{key}</b> <span style={{ fg: theme.textMuted }}>{item.status}</span>
</text>
```

### Pattern 4: Tool Information Display
**What:** Extract tool names from agent.tools object, display as list
**When to use:** Showing agent capabilities
**Example:**
```typescript
// Source: agentos-types.ts line 26
// agent.tools is Record<string, unknown> | null
const toolNames = agent.tools ? Object.keys(agent.tools) : []
const toolCount = toolNames.length

// Display pattern from dialog-status.tsx
<text fg={theme.text}>{toolCount} Tools</text>
<For each={toolNames}>
  {(toolName) => (
    <box flexDirection="row" gap={1}>
      <text flexShrink={0} fg={theme.success}>•</text>
      <text fg={theme.text}><b>{toolName}</b></text>
    </box>
  )}
</For>
```

### Pattern 5: Keyboard Navigation with useKeyboard
**What:** Handle Enter/Escape in detail view for Connect/Back actions
**When to use:** Modal-like views within dialogs
**Example:**
```typescript
// Source: dialog-agno.tsx lines 297-303 (Phase 4 placeholder)
useKeyboard((evt) => {
  if (evt.name === "escape") {
    props.onBack()
    evt.preventDefault()
  }
  // Add: Enter key for Connect action
})
```

### Anti-Patterns to Avoid
- **Don't create separate route:** Detail view is modal-style, not routed navigation
- **Don't mutate store directly:** Use setStore() with property path
- **Don't fetch data in component:** Data already loaded by plugin into sync provider
- **Don't use hardcoded colors:** Theme provides semantic color tokens

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status color mapping | Switch statement or if/else chain | Theme object with semantic keys | Consistent colors, theme-aware, maintainable |
| Tool list display | Custom list rendering | `<For>` with pattern from dialog-status.tsx | Established pattern, reactive updates |
| View switching | Custom state machine | SolidJS `Show` with fallback | Declarative, built-in, no edge cases |
| Keyboard handling | Manual event listeners | useKeyboard hook from @opentui/solid | Handles cleanup, preventDefault, terminal key codes |
| Layout spacing | Manual padding calculations | box gap/padding props | Flex-based, consistent spacing |

**Key insight:** The codebase has established patterns for every aspect of this phase. Follow dialog-status.tsx for information display, dialog-agno.tsx (Phase 4) for component structure, and theme.tsx for colors.

## Common Pitfalls

### Pitfall 1: Assuming Tools Data Structure
**What goes wrong:** Agent tools data varies - can be null, empty object, or populated
**Why it happens:** AgentOS API returns different structures depending on agent configuration
**How to avoid:**
- Check for null/undefined before accessing
- Use `Object.keys(agent.tools || {})` pattern
- Display "No tools configured" for empty case
**Warning signs:** "Cannot read property 'length' of null" errors

### Pitfall 2: Connection Status Logic
**What goes wrong:** Incorrectly determining if agent is currently connected
**Why it happens:** Connection state is in local.model.current(), not agent object
**How to avoid:**
- Get current model: `const current = local.model.current()`
- Check match: `current?.providerID === "agentos" && current?.modelID === agent.id`
- Don't rely on agent.isConnected (that's a derived property for list display)
**Warning signs:** Wrong agent marked as connected, or none marked

### Pitfall 3: Model vs Agent Data Confusion
**What goes wrong:** Agent object from list doesn't have full metadata
**Why it happens:** List shows simplified data, detail needs full provider model
**How to avoid:**
- Re-fetch from provider: `sync.data.provider.find(p => p.id === "agentos").models[agent.id]`
- Model object has: capabilities, options.agentMetadata (description, role, model info)
- Agent object from list only has: id, name, isConnected
**Warning signs:** Missing model name, tool info, metadata

### Pitfall 4: Keyboard Event Conflicts
**What goes wrong:** Escape key doesn't work in detail view, or works in wrong view
**Why it happens:** Multiple useKeyboard hooks active, event handling order matters
**How to avoid:**
- Put detail view keyboard handler in AgentDetail component (scoped)
- Call evt.preventDefault() to stop event propagation
- Check component is actually visible before handling
**Warning signs:** Escape closes entire dialog instead of going back to list

### Pitfall 5: Empty State Handling
**What goes wrong:** UI breaks or shows confusing content when no tools, no model info
**Why it happens:** Not all agents have full metadata, some might be minimal config
**How to avoid:**
- Use SolidJS `Show` with fallback for conditional sections
- Display "N/A" or "Not configured" for missing data
- Test with minimal agent (just id and name)
**Warning signs:** Blank sections, undefined text, layout breaks

## Code Examples

Verified patterns from codebase:

### Extracting Full Agent Data
```typescript
// Source: plugin/agentos.ts lines 31-51
const sync = useSync()
const agentosProvider = sync.data.provider.find(p => p.id === "agentos")
if (!agentosProvider) return // No AgentOS configured

const model = agentosProvider.models[props.agent.id]
// model.name - agent name
// model.options.agentMetadata - description, role, model info
// model.capabilities.toolcall - has tools?
```

### Checking Connection Status
```typescript
// Source: dialog-agno.tsx lines 35-43
const local = useLocal()
const currentModel = local.model.current()
const isConnected =
  currentModel?.providerID === "agentos" &&
  currentModel?.modelID === props.agent.id
```

### Extracting Tools from Agent
```typescript
// Source: agentos-types.ts line 26, plugin/agentos.ts line 147
// Original AgentOSAgent has tools: Record<string, unknown> | null
// Model capabilities.toolcall indicates if tools exist
const agentData = await fetchAgentFromAPI(agent.id) // Would need API call
// For Phase 5, we infer from capabilities:
const hasTools = model.capabilities.toolcall
const toolNames = hasTools ? ["Tools available (count unknown)"] : []

// NOTE: Tool names require separate API call to /agents/{id}
// Plugin only stores boolean capability, not actual tool list
// For Phase 5, display tool count as "Available" if capabilities.toolcall is true
```

### Status Indicator Display
```typescript
// Source: dialog-status.tsx lines 54-89
const statusColor = isConnected ? theme.success : theme.textMuted
const statusText = isConnected ? "Connected" : "Available"

<box flexDirection="row" gap={1}>
  <text flexShrink={0} fg={statusColor}>•</text>
  <text fg={theme.text}>
    <b>Status</b> <span style={{ fg: theme.textMuted }}>{statusText}</span>
  </text>
</box>
```

### Model Information Display
```typescript
// Source: plugin/agentos.ts lines 183-185 (agentMetadata)
const metadata = model.options.agentMetadata as {
  description: string | null
  role: string | null
  model: { name: string; model: string; provider: string } | null
}

<box flexDirection="column" gap={1}>
  <text fg={theme.text} attributes={TextAttributes.BOLD}>
    {model.name || agent.id}
  </text>
  <Show when={metadata.model}>
    <text fg={theme.textMuted}>
      Model: {metadata.model.model} ({metadata.model.provider})
    </text>
  </Show>
  <Show when={metadata.description}>
    <text fg={theme.textMuted} wrapMode="word">
      {metadata.description}
    </text>
  </Show>
</box>
```

### Connect Action Handler
```typescript
// Source: dialog-model.tsx lines 66-75 (pattern for switching models)
const local = useLocal()

function handleConnect() {
  local.model.set(
    {
      providerID: "agentos",
      modelID: props.agent.id,
    },
    { recent: true }
  )
  props.onBack() // Return to list after connecting
}
```

### Full AgentDetail Component Structure
```typescript
// Inline component in dialog-agno.tsx
function AgentDetail(props: {
  agent: { id: string; name: string };
  onBack: () => void
}) {
  const { theme } = useTheme()
  const sync = useSync()
  const local = useLocal()
  const dialog = useDialog()

  // Get full model data from provider
  const model = createMemo(() => {
    const provider = sync.data.provider.find(p => p.id === "agentos")
    return provider?.models[props.agent.id]
  })

  const isConnected = createMemo(() => {
    const current = local.model.current()
    return current?.providerID === "agentos" && current?.modelID === props.agent.id
  })

  const metadata = createMemo(() =>
    model()?.options.agentMetadata as {
      description: string | null
      role: string | null
      model: { name: string; model: string; provider: string } | null
    } | undefined
  )

  function handleConnect() {
    local.model.set(
      { providerID: "agentos", modelID: props.agent.id },
      { recent: true }
    )
    dialog.clear() // Close dialog after connecting
  }

  useKeyboard((evt) => {
    if (evt.name === "escape") {
      props.onBack()
      evt.preventDefault()
    }
    if (evt.name === "return" && !isConnected()) {
      handleConnect()
      evt.preventDefault()
    }
  })

  return (
    <box flexDirection="column" gap={2} paddingTop={1}>
      {/* Agent name */}
      <text fg={theme.text} attributes={TextAttributes.BOLD}>
        {model()?.name || props.agent.name}
      </text>

      {/* Status */}
      <box flexDirection="row" gap={1}>
        <text flexShrink={0} fg={isConnected() ? theme.success : theme.textMuted}>•</text>
        <text fg={theme.text}>
          <b>Status</b>{" "}
          <span style={{ fg: theme.textMuted }}>
            {isConnected() ? "Connected" : "Available"}
          </span>
        </text>
      </box>

      {/* Model info */}
      <Show when={metadata()?.model}>
        <text fg={theme.text}>
          <b>Model</b>{" "}
          <span style={{ fg: theme.textMuted }}>
            {metadata()!.model!.model} ({metadata()!.model!.provider})
          </span>
        </text>
      </Show>

      {/* Tools */}
      <Show when={model()?.capabilities.toolcall}>
        <text fg={theme.text}>
          <b>Tools</b>{" "}
          <span style={{ fg: theme.textMuted }}>Available</span>
        </text>
      </Show>

      {/* Description */}
      <Show when={metadata()?.description}>
        <box flexDirection="column">
          <text fg={theme.text}><b>Description</b></text>
          <text fg={theme.textMuted} wrapMode="word">
            {metadata()!.description}
          </text>
        </box>
      </Show>

      {/* Actions hint */}
      <box flexDirection="row" gap={3} paddingTop={1}>
        <Show when={!isConnected()}>
          <text fg={theme.textMuted}>
            <span style={{ fg: theme.text }}>Enter</span> connect
          </text>
        </Show>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.text }}>Esc</span> back
        </text>
      </box>
    </box>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React-style class components | SolidJS functional components | 2023-2024 | Fine-grained reactivity, no VDOM |
| Separate component files | Inline components for simple views | Established pattern | Fewer files, simpler navigation |
| Manual event handling | useKeyboard hook | @opentui/solid v0.1+ | Automatic cleanup, terminal key support |
| Hardcoded colors | Theme tokens | Established pattern | Theme switching support, semantic meaning |

**Deprecated/outdated:**
- None - this is a new feature using current patterns

## Open Questions

Things that couldn't be fully resolved:

1. **Tool Names vs Tool Count**
   - What we know: Plugin stores capabilities.toolcall boolean, not actual tool list
   - What's unclear: Whether to fetch full agent data from API for tool names
   - Recommendation: Display "Tools: Available" for Phase 5, defer detailed tool list to future enhancement (requires GET /agents/{id} endpoint call)

2. **Health Status Beyond Connected/Available**
   - What we know: Current pattern is connected vs not connected
   - What's unclear: Whether AgentOS API provides health metrics (response time, error rate)
   - Recommendation: Start with Connected/Available, add health metrics when API integration is clarified

3. **Model Provider Display**
   - What we know: metadata.model has provider field (e.g., "openai")
   - What's unclear: Whether to show model provider prominently or just model name
   - Recommendation: Show both as "model (provider)" for clarity

## Sources

### Primary (HIGH confidence)
- Codebase: packages/opencode/src/cli/cmd/tui/component/dialog-agno.tsx (Phase 4 implementation)
- Codebase: packages/opencode/src/cli/cmd/tui/component/dialog-status.tsx (status display pattern)
- Codebase: packages/opencode/src/plugin/agentos.ts (agent-to-model mapping)
- Codebase: packages/opencode/src/provider/sdk/agentos/agentos-types.ts (data structures)
- Codebase: packages/opencode/src/cli/cmd/tui/component/dialog-model.tsx (model switching pattern)

### Secondary (MEDIUM confidence)
- [TUI: Speed of a CLI, Comfort of a GUI](https://medium.com/@ashwinjosh/tui-speed-of-a-cli-comfort-of-a-gui-5a0dc249de1d) - TUI navigation patterns
- [GitHub - rothgar/awesome-tuis](https://github.com/rothgar/awesome-tuis) - TUI best practices
- [SolidJS Docs - Basics](https://docs.solidjs.com/concepts/components/basics) - Component patterns

### Tertiary (LOW confidence)
- [The 2026 Guide to AI Agent Architecture Components](https://procreator.design/blog/guide-to-ai-agent-architecture-components/) - Agent UI patterns (general, not TUI-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, verified versions
- Architecture: HIGH - Patterns extracted from existing codebase files
- Pitfalls: HIGH - Based on actual data structures and implementation details
- Code examples: HIGH - All examples from codebase or derived from existing patterns

**Research date:** 2026-02-01
**Valid until:** 30 days (stable domain, established codebase patterns)
