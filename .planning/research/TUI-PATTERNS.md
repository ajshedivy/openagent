# TUI Patterns Research

**Researched:** 2026-02-01
**Focus:** Dialog and tab patterns for `/agno` hub implementation

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Dialog` | `tui/ui/dialog.tsx` | Base wrapper, escape handling, sizing |
| `DialogSelect` | `tui/ui/dialog-select.tsx` | Filterable list with categories, keybinds |
| Tab pattern | `dialog-export-options.tsx` | `createStore` + active state cycling |
| `DialogStatus` | `component/dialog-status.tsx` | Detail view with sections |

## Tab Navigation Pattern

From `dialog-export-options.tsx`:

```typescript
const [store, setStore] = createStore({
  active: "agents" as "agents" | "teams" | "workflows"
})

// Tab key cycles through sections
useKeyboard((evt) => {
  if (evt.name === "tab") {
    const order = ["agents", "teams", "workflows"]
    const currentIndex = order.indexOf(store.active)
    setStore("active", order[(currentIndex + 1) % order.length])
  }
})

// Visual indicator for active tab
<box backgroundColor={store.active === "agents" ? theme.primary : undefined}>
  <text>Agents</text>
</box>
```

## DialogSelect Option Structure

```typescript
interface DialogSelectOption<T> {
  title: string
  value: T
  description?: string
  footer?: JSX.Element | string
  category?: string
  disabled?: boolean
  gutter?: JSX.Element  // Custom icon/element (status indicator)
  onSelect?: (ctx: DialogContext) => void
}
```

## Status Indicators

```typescript
// Connected (filled)
<text style={{ fg: theme.success }}>●</text>

// Available (outline)
<text style={{ fg: theme.textMuted }}>○</text>

// Error
<text style={{ fg: theme.error }}>●</text>
```

## Dialog Navigation

```typescript
const dialog = useDialog()

// Open new dialog
dialog.replace(() => <MyDialog />)

// Close current dialog
dialog.clear()

// Navigate to detail view
onSelect: () => {
  dialog.replace(() => <AgentDetail agentId={option.value} />)
}
```

## Command Registration

```typescript
// In app.tsx or component
command.register(() => [
  {
    title: "AgentOS Hub",
    value: "agno.hub",
    category: "AgentOS",
    slash: { name: "agno" },
    onSelect: () => {
      dialog.replace(() => <DialogAgno />)
    },
  },
])
```

## Key Files for Implementation

1. **Base dialog:** `packages/opencode/src/cli/cmd/tui/ui/dialog.tsx`
2. **List component:** `packages/opencode/src/cli/cmd/tui/ui/dialog-select.tsx`
3. **Tab pattern:** `packages/opencode/src/cli/cmd/tui/ui/dialog-export-options.tsx`
4. **Detail view pattern:** `packages/opencode/src/cli/cmd/tui/component/dialog-status.tsx`
5. **Command registration:** `packages/opencode/src/cli/cmd/tui/app.tsx` (lines 284-583)

## Recommended Approach

**Hybrid:** Tab navigation at top + `DialogSelect` for lists + custom detail panel

1. Create `DialogAgno.tsx` with tabbed layout
2. Use `createStore` for active tab state
3. Render `DialogSelect` for agent list in Agents tab
4. Use `dialog.replace()` to drill into detail view
5. "Coming soon" placeholder for Teams/Workflows tabs

---
*Research for v1.1 AgentOS Hub milestone*
