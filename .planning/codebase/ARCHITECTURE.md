# Architecture

**Analysis Date:** 2026-01-31

## Pattern Overview

**Overall:** Monorepo with layered architecture consisting of:
1. **Frontend UI layer** - SolidJS-based web application with reactive context providers
2. **SDK layer** - Type-safe client/server abstractions for OpenCode API communication
3. **CLI layer** - Command-line interface with command patterns for operations
4. **Utility layer** - Shared utilities, helpers, and type definitions
5. **Backend/Server layer** - Not in this repo but communicated via SDK

**Key Characteristics:**
- Workspace-based monorepo using Bun package manager
- Provider-based state management with SolidJS reactivity
- Event-driven architecture for real-time updates
- Separation between SDK client/server implementations and UI consumption
- Command pattern for CLI operations
- TypeScript strict mode throughout

## Layers

**Presentation Layer (Frontend):**
- Purpose: Renders UI components, manages user interactions, displays application state
- Location: `packages/app/src`, `packages/ui/src`
- Contains: React/SolidJS components, pages, theme providers, context providers
- Depends on: SDK (for API calls), Util (for helpers), UI primitives
- Used by: End users via web browser or desktop application

**Context & State Management Layer:**
- Purpose: Manages application state using SolidJS context providers and stores
- Location: `packages/app/src/context/`
- Contains: Context providers like `GlobalSDKProvider`, `ServerProvider`, `FileProvider`, `TerminalProvider`, `PromptProvider`, `PermissionProvider`, `LayoutProvider`, `SettingsProvider`, `NotificationProvider`, `ModelsProvider`, `CommandProvider`
- Depends on: SDK client, SolidJS primitives
- Used by: Components throughout the application

**SDK Layer:**
- Purpose: Provides type-safe abstraction over OpenCode server API with client/server patterns
- Location: `packages/sdk/js/src/`
- Contains: Client implementation (`client.ts`), server stubs (`server.ts`), generated types (`gen/`)
- Depends on: API schema (via OpenAPI spec)
- Used by: Global SDK context, all parts of the application needing server communication

**Component Library:**
- Purpose: Reusable UI components and styling system
- Location: `packages/ui/src/`
- Contains: Components (`components/`), hooks (`hooks/`), context helpers (`context/`), theming (`theme/`), internationalization (`i18n/`), styling (`styles/`)
- Depends on: SolidJS, Tailwind, Kobalte (headless UI)
- Used by: App layer and other packages

**Utility Layer:**
- Purpose: Shared utility functions and helpers used across packages
- Location: `packages/util/src/`
- Contains: Array utilities, binary operations, error handling, encoding, lazy loading, path utilities, retry logic
- Depends on: None
- Used by: SDK, UI, App, CLI packages

**CLI Layer:**
- Purpose: Command-line interface for OpenCode operations
- Location: `packages/opencode/src/cli/`
- Contains: Command handlers (`cmd/`), UI components (`ui.ts`), error formatting
- Depends on: Util layer, Agent libraries, File I/O
- Used by: Command-line users and integrations

**Plugin System:**
- Purpose: Extension mechanism for adding capabilities
- Location: `packages/plugin/src/`
- Contains: Plugin interface definitions and registration
- Depends on: SDK, Shell abstractions
- Used by: OpenCode core and extensions

## Data Flow

**Event-Driven Real-time Updates:**

1. User connects to server via `ServerProvider` with base URL
2. `GlobalSDKProvider` creates `createOpencodeClient` with server URL
3. Client subscribes to global events via `eventSdk.global.event()` (streaming)
4. Events flow into an event emitter with coalescing logic (in `global-sdk.tsx`)
5. Components use event emitter via context to receive updates
6. Components render based on reactive SolidJS signals/stores

**Server Communication Pattern:**

1. Component calls SDK method via `useGlobalSDK().client`
2. SDK client makes HTTP request to server
3. Response is typed via generated types in `packages/sdk/js/src/gen/`
4. Promise resolves with typed data
5. Component updates state, causing re-render

**State Management Pattern:**

1. Context providers initialize stores (e.g., `persisted()` for persistence)
2. Components call `useProvider()` hooks to access context
3. Stores use SolidJS `createStore()` for fine-grained reactivity
4. Components create effects with `createEffect()` to react to state changes
5. State updates batch via `batch()` for performance

**State Management:**
- SolidJS stores created via `createStore()` for fine-grained reactivity
- Persistent state via custom `Persist` utility (stored in localStorage)
- Event-based updates via global emitter for cross-component communication
- Batch updates for performance (16ms throttling in event flushing)

## Key Abstractions

**Context Providers:**
- Purpose: Encapsulate and provide access to feature domains
- Examples: `ServerProvider` (connection), `GlobalSDKProvider` (API), `TerminalProvider` (terminal state), `FileProvider` (file selection), `PromptProvider` (chat state)
- Pattern: Each provider is a factory function using `createSimpleContext()` from `@opencode-ai/ui/context`, returning `{use, provider}` tuple

**SDK Client:**
- Purpose: Type-safe wrapper around OpenCode server API
- Examples: `createOpencodeClient()` exported from `packages/sdk/js/src/client.ts`
- Pattern: Creates HTTP client with base URL, handles request/response, includes error throwing option

**Store & Persist Utility:**
- Purpose: Manage application state with optional persistence
- Examples: Used in `ServerProvider`, `SettingsProvider` - `persisted(Persist.global(...), createStore(...))`
- Pattern: Wraps SolidJS store with localStorage serialization/deserialization

**Platform Abstraction:**
- Purpose: Abstract platform-specific APIs (web, desktop, mobile)
- Location: `packages/app/src/context/platform.tsx`
- Pattern: Platform object defines methods like `openLink()`, `restart()`, `notify()`, `getDefaultServerUrl()`

## Entry Points

**Web Application:**
- Location: `packages/app/src/entry.tsx`
- Triggers: Browser loads HTML with script tag
- Responsibilities: Mounts SolidJS app, initializes platform context, sets up providers

**App Component:**
- Location: `packages/app/src/app.tsx`
- Triggers: Called by entry point
- Responsibilities: Wraps application with provider hierarchy, sets up routing, initializes error boundary

**Main Layout:**
- Location: `packages/app/src/pages/layout.tsx`
- Triggers: Router navigates to directory paths
- Responsibilities: Main shell, sidebar, header, content areas

**Session Page:**
- Location: `packages/app/src/pages/session.tsx`
- Triggers: Router navigates to `/[dir]/session/[id]`
- Responsibilities: Chat interface, file tree, terminal, message rendering

**CLI Entry:**
- Location: `packages/opencode/src/index.ts`
- Triggers: User runs `opencode` command
- Responsibilities: Yargs CLI parser, command routing to handlers

## Error Handling

**Strategy:** Multi-layered error handling with boundaries and fallbacks

**Patterns:**
- Error boundary at app root catches React/SolidJS errors, renders `ErrorPage` component
- SDK client configured with `throwOnError: true` to propagate API errors
- Context providers handle errors in setup with `.catch()` blocks
- Commands in CLI format errors via `FormatError` utility
- Global error handlers on process: `unhandledRejection` and `uncaughtException` logged via `Log.Default.error()`

**Example from global-sdk.tsx:**
```typescript
void (async () => {
  const events = await eventSdk.global.event()
  for await (const event of events.stream) {
    // Process events with coalescing
  }
})()
  .finally(flush)
  .catch(() => undefined)  // Suppress errors on stream end
```

## Cross-Cutting Concerns

**Logging:** Custom `Log` utility in `packages/opencode/src/util/log.ts` with structured logging

**Validation:** Zod schemas used throughout for runtime validation (`import { zod } from "catalog:"`), found in UI components and SDK

**Authentication:** Handled via `@openauthjs/openauth` - integration at server level, SDK client passes auth via fetch options

**Internationalization:** i18n Provider with locale switching, translations in `packages/app/src/i18n/` (en.ts, zh.ts)

**Theming:** Theme provider with dark/light modes, Tailwind-based styling in `packages/ui/src/theme/`

**Permissions:** Permission context checks feature access, stored alongside server state

---

*Architecture analysis: 2026-01-31*
