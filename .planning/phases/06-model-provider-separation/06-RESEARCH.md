# Phase 6: Model Provider Separation - Research

**Researched:** 2026-02-01
**Domain:** UI filtering and provider separation
**Confidence:** HIGH

## Summary

Phase 6 requires filtering out the "agentos" provider from the /models dialog in both the web app and TUI, while keeping it accessible exclusively through /agno. This is a straightforward filtering task with clear separation of concerns.

The /models dialog uses a ModelList component that fetches all models from local.model.list() and filters by visibility. The agentos provider is registered dynamically through a plugin system and appears as a standard provider with models. The key is to add a filter that excludes providerID === "agentos" from the model list display.

**Primary recommendation:** Add provider filter in ModelList component to exclude "agentos" provider, ensuring clean separation between /models (external LLMs) and /agno (AgentOS agents).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SolidJS | 1.x | Reactive UI framework | Used throughout the codebase for both web and TUI |
| @kobalte/core | Latest | Popover/Dialog primitives | Used for model selector popover |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| solid-js/store | 1.x | State management | createStore for dialog state management |
| remeda | Latest | Functional utilities | pipe, filter, sortBy for data transformations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SolidJS filters | Direct array filter | No tradeoff - array filter is simpler for this use case |

**Installation:**
No new packages needed - existing dependencies sufficient.

## Architecture Patterns

### Recommended Project Structure
```
packages/app/src/components/
├── dialog-select-model.tsx        # Web app model selector
packages/opencode/src/cli/cmd/tui/component/
├── dialog-model.tsx                # TUI model selector
```

### Pattern 1: Provider Filtering in Model List

**What:** Filter providers at the data source level before rendering

**When to use:** When you need to exclude specific providers from UI display while keeping them functional in other contexts

**Example:**
```typescript
// Source: dialog-select-model.tsx lines 27-32
const models = createMemo(() =>
  local.model
    .list()
    .filter((m) => local.model.visible({ modelID: m.id, providerID: m.provider.id }))
    .filter((m) => (props.provider ? m.provider.id === props.provider : true)),
)
```

**How to apply for Phase 6:**
```typescript
const models = createMemo(() =>
  local.model
    .list()
    .filter((m) => m.provider.id !== "agentos") // Add this filter
    .filter((m) => local.model.visible({ modelID: m.id, providerID: m.provider.id }))
    .filter((m) => (props.provider ? m.provider.id === props.provider : true)),
)
```

### Pattern 2: Provider Filtering in TUI

**What:** Filter providers in the sync.data.provider iteration

**When to use:** TUI uses sync.data.provider directly, needs filtering at that level

**Example:**
```typescript
// Source: dialog-model.tsx lines 114-173
const providerOptions = pipe(
  sync.data.provider,
  sortBy(
    (provider) => provider.id !== "opencode",
    (provider) => provider.name,
  ),
  flatMap((provider) => /* ... */)
)
```

**How to apply for Phase 6:**
```typescript
const providerOptions = pipe(
  sync.data.provider,
  filter((provider) => provider.id !== "agentos"), // Add this filter first
  sortBy(
    (provider) => provider.id !== "opencode",
    (provider) => provider.name,
  ),
  flatMap((provider) => /* ... */)
)
```

### Anti-Patterns to Avoid

- **Don't modify provider registration:** AgentOS provider must remain registered for /agno to work - only filter from /models display
- **Don't filter in multiple places:** Apply filter once at the top of the data flow to avoid inconsistencies
- **Don't break popular providers list:** TUI has a "popular providers" fallback when not connected - ensure agentos isn't in popularProviders array

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Provider visibility | Custom visibility system | Simple filter predicate | One-line filter is clearer than complex visibility state |
| Provider filtering | Modify provider registration | Filter at display layer | Keeps provider system intact for /agno |

**Key insight:** This is a display-layer concern, not a data-layer concern. The agentos provider should remain fully functional in the system, just hidden from the /models dialog.

## Common Pitfalls

### Pitfall 1: Breaking /agno by Filtering Provider Registration

**What goes wrong:** Removing agentos from provider registration breaks /agno functionality

**Why it happens:** Confusion between "hide from /models" and "remove from system"

**How to avoid:** Filter only in the display components (dialog-select-model.tsx and dialog-model.tsx), never in provider registration or sync data

**Warning signs:** /agno dialog shows "No agents found" or fails to load

### Pitfall 2: Incomplete Filtering (Missing TUI or Web)

**What goes wrong:** Filtering only web app or only TUI leaves one interface showing AgentOS in /models

**Why it happens:** Two separate codebases (app/ and opencode/src/cli/cmd/tui/) with different component structures

**How to avoid:** Filter in both locations:
  - `packages/app/src/components/dialog-select-model.tsx` (web app)
  - `packages/opencode/src/cli/cmd/tui/component/dialog-model.tsx` (TUI)

**Warning signs:** One interface works but the other still shows AgentOS

### Pitfall 3: Filtering Recent/Favorites Lists

**What goes wrong:** Recent or favorite agentos models still appear in lists even after filtering providers

**Why it happens:** Recent/favorites lists may bypass provider filtering

**How to avoid:**
  - Web: The existing visibility filter should handle this (line 30 in dialog-select-model.tsx)
  - TUI: Check favoriteOptions and recentOptions in dialog-model.tsx (lines 48-112)

**Warning signs:** User sees AgentOS in recent/favorites but not in main list

### Pitfall 4: Popular Providers Array

**What goes wrong:** "agentos" appears in popularProviders constant, showing up in unpopulated state

**Why it happens:** popularProviders is hardcoded list in use-providers.ts

**How to avoid:** Verify "agentos" is NOT in popularProviders array

**Warning signs:** When no providers connected, agentos appears in "Popular providers" section

## Code Examples

Verified patterns from official sources:

### Web App: Filter AgentOS from Model List
```typescript
// Source: packages/app/src/components/dialog-select-model.tsx
// Location: ModelList component, lines 27-32

const ModelList: Component<{
  provider?: string
  class?: string
  onSelect: () => void
  action?: JSX.Element
}> = (props) => {
  const local = useLocal()
  const language = useLanguage()

  const models = createMemo(() =>
    local.model
      .list()
      .filter((m) => m.provider.id !== "agentos") // NEW: Filter out AgentOS
      .filter((m) => local.model.visible({ modelID: m.id, providerID: m.provider.id }))
      .filter((m) => (props.provider ? m.provider.id === props.provider : true)),
  )

  // ... rest of component
}
```

### TUI: Filter AgentOS from Provider Options
```typescript
// Source: packages/opencode/src/cli/cmd/tui/component/dialog-model.tsx
// Location: DialogModel component, options memo

const providerOptions = pipe(
  sync.data.provider,
  filter((provider) => provider.id !== "agentos"), // NEW: Filter out AgentOS
  sortBy(
    (provider) => provider.id !== "opencode",
    (provider) => provider.name,
  ),
  flatMap((provider) =>
    pipe(
      provider.models,
      entries(),
      filter(([_, info]) => info.status !== "deprecated"),
      filter(([_, info]) => (props.providerID ? info.providerID === props.providerID : true)),
      // ... rest of mapping
    )
  ),
)
```

### Verification: Popular Providers Check
```typescript
// Source: packages/app/src/hooks/use-providers.ts
// Line 6 - Verify "agentos" is NOT in this list

export const popularProviders = [
  "opencode",
  "anthropic",
  "github-copilot",
  "openai",
  "google",
  "openrouter",
  "vercel"
]
// Good: "agentos" is NOT in the list
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All providers in /models | Separate /agno for agents | Phase 6 (now) | Clear separation of concerns |
| Agent selection unclear | Dedicated /agno hub | Phase 3-5 (complete) | Better UX for agent management |

**Deprecated/outdated:**
- N/A - This is a new feature, no deprecated patterns

## Open Questions

None - the implementation path is clear and straightforward.

## Sources

### Primary (HIGH confidence)
- Codebase analysis - dialog-select-model.tsx (web app model selector)
- Codebase analysis - dialog-model.tsx (TUI model selector)
- Codebase analysis - dialog-agno.tsx (AgentOS hub, already complete from Phase 5)
- Codebase analysis - use-providers.ts (popularProviders constant)
- Codebase analysis - agentos.ts plugin (provider registration)

### Secondary (MEDIUM confidence)
- STATE.md - Phase 5 complete, Teams/Workflows placeholders already implemented

### Tertiary (LOW confidence)
- N/A

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Direct codebase analysis, no dependencies needed
- Architecture: HIGH - Clear patterns from existing dialog components
- Pitfalls: HIGH - Identified from codebase structure (two separate implementations)

**Research date:** 2026-02-01
**Valid until:** 30 days (2026-03-03) - stable UI patterns, unlikely to change
