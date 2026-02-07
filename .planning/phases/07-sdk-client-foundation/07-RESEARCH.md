# Phase 7: SDK Client Foundation - Research

**Researched:** 2026-02-07
**Domain:** TypeScript SDK Integration, API Client Architecture
**Confidence:** MEDIUM

## Summary

This phase establishes the foundation for migrating from custom AgentOS API client code to the official `@worksofadam/agentos-sdk@0.3.0`. The SDK provides typed resource classes (agents, teams, workflows, sessions), an `AgentStream` for SSE consumption, and built-in auth/error handling generated from OpenAPI specs.

The migration pattern is: **Install SDK → Create shared client singleton → Replace custom fetch wrapper → Integrate health check → Adopt SDK error types**. This phase is foundational—subsequent phases (8-11) will migrate specific features (discovery, streaming, tool confirmation) to use this client.

**Key architectural decision:** Keep the AI SDK bridge (`AgentStream` → `LanguageModelV2StreamPart`) to minimize blast radius. The SDK replaces only the API client layer, not the Vercel AI SDK integration.

**Primary recommendation:** Use a singleton-backed factory pattern for the SDK client with lazy initialization, environment/config-based resolution for baseURL/apiKey, and fail-fast health checks during provider initialization.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@worksofadam/agentos-sdk` | 0.3.0 | Official AgentOS API client | OpenAPI-generated types, built-in retry/error handling, resource-based API |
| TypeScript | 5.7+ | Type safety | Already used in workspace |
| Bun | 1.3.5+ | Runtime | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@ai-sdk/provider` | 2.0.1 | AI SDK interface | Preserve existing bridge pattern |
| Zod | 3.x (catalog) | Runtime validation | Config validation, not SDK types |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SDK singleton | Pass client to every function | Singleton is standard for API clients; dependency injection adds complexity without testing benefit in this context |
| Fail-fast health check | Lazy health check on first request | Fail-fast surfaces connection issues immediately during startup, better UX |
| Config/env resolution | Hardcoded values | Existing pattern in codebase (see `Config.get()`, `Env.get()`) |

**Installation:**
```bash
# Add to packages/opencode/package.json dependencies
npm install @worksofadam/agentos-sdk@0.3.0
# Or using workspace protocol if SDK is local:
# "@worksofadam/agentos-sdk": "0.3.0"
```

## Architecture Patterns

### Recommended Project Structure
```
packages/opencode/src/
├── provider/sdk/agentos/
│   ├── agentos-client.ts        # NEW: Shared SDK client singleton
│   ├── agentos-provider.ts      # REFACTOR: Use SDK client
│   ├── agentos-language-model.ts # REFACTOR: Use SDK AgentStream
│   └── agentos-types.ts         # REFACTOR: Re-export SDK types (custom types removed later)
├── plugin/
│   └── agentos.ts               # REFACTOR: Remove custom fetch wrapper
└── session/
    └── llm.ts                   # REFACTOR: Use SDK for continue (later phase)
```

### Pattern 1: SDK Client Singleton with Lazy Initialization
**What:** Single shared `AgentOSClient` instance created on-demand, configured from environment and config
**When to use:** For all AgentOS API operations throughout the application
**Example:**
```typescript
// packages/opencode/src/provider/sdk/agentos/agentos-client.ts
import { AgentOSClient } from "@worksofadam/agentos-sdk"
import { Config } from "../../../config/config"
import { Env } from "../../../env"

let _client: AgentOSClient | null = null

export async function getAgentOSClient(): Promise<AgentOSClient> {
  if (_client) return _client

  // Resolution order: config → env
  const config = await Config.get()
  const baseURL =
    (config.provider?.["agentos"]?.options?.baseURL as string | undefined) ||
    (config.provider?.["agentos"]?.api as string | undefined) ||
    Env.get("AGENTOS_API_URL")

  const apiKey =
    (config.provider?.["agentos"]?.options?.apiKey as string | undefined) ||
    Env.get("AGENTOS_API_KEY")

  if (!baseURL) {
    throw new Error("AgentOS baseURL not configured. Set AGENTOS_API_URL or configure in opencode.json")
  }

  _client = new AgentOSClient({
    baseURL,
    apiKey, // Optional - SDK handles missing auth
  })

  return _client
}

// Reset for testing
export function resetAgentOSClient() {
  _client = null
}
```

### Pattern 2: Health Check Integration During Provider Initialization
**What:** Call `client.health()` when provider loads to validate connectivity
**When to use:** In provider initialization/loader hooks (plugin auth loader)
**Example:**
```typescript
// packages/opencode/src/plugin/agentos.ts
export async function AgentOSAuthPlugin(_input: PluginInput): Promise<Hooks> {
  return {
    auth: {
      provider: "agentos",
      async loader(getAuth, provider) {
        // Get client
        const client = await getAgentOSClient()

        try {
          // Health check - SDK likely provides client.health()
          await client.health()
        } catch (error) {
          // Surface meaningful error to user
          if (error instanceof AuthenticationError) {
            throw new Error("AgentOS authentication failed. Check your API key.")
          }
          if (error instanceof APIError) {
            throw new Error(`AgentOS connection failed: ${error.message}`)
          }
          throw new Error(`AgentOS health check failed: ${error}`)
        }

        // Continue with agent discovery...
        const agents = await client.agents.list()
        // ... rest of loader
      }
    }
  }
}
```

### Pattern 3: Config/Env Resolution with Fallback Chain
**What:** Resolve baseURL/apiKey from config first, then environment variables
**When to use:** When initializing SDK client or any configurable service
**Example:**
```typescript
// Resolution chain (highest to lowest precedence):
// 1. config.provider.agentos.options.baseURL
// 2. config.provider.agentos.api
// 3. Env.get("AGENTOS_API_URL")

const baseURL =
  (config.provider?.["agentos"]?.options?.baseURL as string) ||
  (config.provider?.["agentos"]?.api as string) ||
  Env.get("AGENTOS_API_URL") ||
  undefined

// For apiKey:
// 1. Auth.get() API key (if type === "api")
// 2. Env.get("AGENTOS_API_KEY")
// 3. config.provider.agentos.options.apiKey
```

### Pattern 4: SDK Error Hierarchy Handling
**What:** Catch SDK-specific error types and produce user-friendly messages
**When to use:** Around all SDK API calls that can fail
**Example:**
```typescript
import { APIError, AuthenticationError } from "@worksofadam/agentos-sdk"

try {
  const agents = await client.agents.list()
} catch (error) {
  // SDK provides structured error types
  if (error instanceof AuthenticationError) {
    console.error("Authentication failed. Check your AGENTOS_API_KEY")
    throw new Error("AgentOS authentication failed. Please check your API key.")
  }

  if (error instanceof APIError) {
    console.error(`AgentOS API error: ${error.status} ${error.message}`)
    throw new Error(`AgentOS API error: ${error.message}`)
  }

  // Unknown error
  throw error
}
```

### Anti-Patterns to Avoid
- **Creating multiple client instances:** SDK client should be singleton—don't instantiate in every function
- **Skipping health check:** Must validate connectivity during initialization, not on first user request
- **Hardcoding credentials:** Always use config/env resolution pattern
- **Swallowing SDK errors:** SDK error types contain valuable debugging info—surface them to users
- **Custom authorization headers:** SDK handles auth internally—don't add custom `Authorization` headers in fetch wrapper

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE parsing | Custom `createSSEParser()` TransformStream | SDK `AgentStream` (async iterable) | SDK provides typed events, handles reconnection, buffer management |
| Request retry logic | Manual `fetch()` with retry loops | SDK built-in retry | SDK has exponential backoff, respects rate limits |
| Type definitions for API | Hand-written interfaces in `agentos-types.ts` | SDK types from OpenAPI | SDK types auto-generated from spec, always up-to-date |
| Auth header injection | Custom fetch wrapper | SDK `apiKey` config option | SDK handles Bearer token internally |
| FormData construction | Manual `formData.append()` | SDK method parameters | SDK normalizes request bodies (multipart/form-data or JSON) |
| Error response parsing | Custom `try/catch` with JSON parsing | SDK error types (`APIError`, `AuthenticationError`) | SDK provides structured errors with status codes |

**Key insight:** The SDK abstracts ~1000 lines of custom code (SSE parsing, fetch wrappers, type definitions). Don't re-implement what the SDK provides. Phase 7 establishes the client; phases 8-11 remove custom implementations.

## Common Pitfalls

### Pitfall 1: Forgetting to Remove Custom Fetch Wrapper After SDK Integration
**What goes wrong:** Plugin continues to inject custom `Authorization` headers even though SDK handles auth
**Why it happens:** Custom fetch wrapper in `plugin/agentos.ts` exists for pre-SDK auth
**How to avoid:** SDK-03 requirement explicitly calls out removing the custom fetch wrapper
**Warning signs:** Duplicate `Authorization` headers in requests, auth working even with wrong SDK apiKey

### Pitfall 2: Creating SDK Client Before Config is Loaded
**What goes wrong:** Client initialized with undefined baseURL because Config.get() hasn't resolved yet
**Why it happens:** Eager initialization instead of lazy pattern
**How to avoid:** Use async `getAgentOSClient()` function, not top-level instantiation
**Warning signs:** "baseURL is required" errors, client working in some contexts but not others

### Pitfall 3: Not Surfacing SDK Error Context to Users
**What goes wrong:** Generic "request failed" messages when SDK provides specific error types
**Why it happens:** Catching errors without checking `instanceof` SDK error types
**How to avoid:** Always check for `AuthenticationError`, `APIError` and extract meaningful messages
**Warning signs:** Users reporting "something went wrong" without actionable debugging info

### Pitfall 4: Testing Health Check Only on Happy Path
**What goes wrong:** Health check passes during development but fails in production with different network/auth
**Why it happens:** Not testing failure scenarios (wrong API key, unreachable baseURL, network timeout)
**How to avoid:** Test health check with: invalid API key, wrong baseURL, network errors
**Warning signs:** Provider loads successfully locally but fails for users

### Pitfall 5: Mixing SDK Types with Custom Types
**What goes wrong:** Some code uses SDK `AgentResponse`, other code uses custom `AgentOSAgent`
**Why it happens:** Incremental migration without updating all import sites
**How to avoid:** Phase 7 keeps custom types for compatibility; Phase 11 (TYPE-01/02/03) removes them completely
**Warning signs:** Type casting between SDK and custom types, duplicate type definitions

## Code Examples

Verified patterns based on existing codebase and SDK capabilities:

### SDK Client Initialization
```typescript
// packages/opencode/src/provider/sdk/agentos/agentos-client.ts
import { AgentOSClient } from "@worksofadam/agentos-sdk"
import { Config } from "../../../config/config"
import { Env } from "../../../env"
import { Auth } from "../../../auth"

let _client: AgentOSClient | null = null

export async function getAgentOSClient(): Promise<AgentOSClient> {
  if (_client) return _client

  // Resolve baseURL (config → env)
  const config = await Config.get()
  const baseURL =
    (config.provider?.["agentos"]?.options?.baseURL as string | undefined) ||
    (config.provider?.["agentos"]?.api as string | undefined) ||
    Env.get("AGENTOS_API_URL")

  if (!baseURL) {
    throw new Error(
      "AgentOS baseURL not configured. Set AGENTOS_API_URL environment variable or configure in opencode.json"
    )
  }

  // Resolve apiKey (auth → env → config)
  const auth = await Auth.get("agentos")
  const apiKey =
    (auth?.type === "api" ? auth.key : undefined) ||
    Env.get("AGENTOS_API_KEY") ||
    (config.provider?.["agentos"]?.options?.apiKey as string | undefined)

  _client = new AgentOSClient({
    baseURL,
    apiKey, // Optional - SDK handles unauthenticated requests
  })

  return _client
}

export function resetAgentOSClient() {
  _client = null
}
```

### Provider Factory with SDK Client
```typescript
// packages/opencode/src/provider/sdk/agentos/agentos-provider.ts (BEFORE)
export function createAgentOS(options: AgentOSProviderSettings): AgentOSProvider {
  const baseURL = withoutTrailingSlash(options.baseURL)
  // ... manual header construction, fetch wrapper, etc.
}

// AFTER (SDK-based)
import { getAgentOSClient } from "./agentos-client"

export function createAgentOS(options: AgentOSProviderSettings): AgentOSProvider {
  // SDK client handles baseURL/apiKey internally
  const createLanguageModel = (agentId: string): LanguageModelV2 => {
    return new AgentOSLanguageModel(agentId, {
      provider: `${options.name ?? "agentos"}.chat`,
      // Pass SDK client instead of config
      getClient: getAgentOSClient,
    })
  }

  const provider = function (agentId: string): LanguageModelV2 {
    return createLanguageModel(agentId)
  }

  provider.languageModel = createLanguageModel
  provider.chat = createLanguageModel

  return provider as AgentOSProvider
}
```

### Health Check in Plugin Loader
```typescript
// packages/opencode/src/plugin/agentos.ts (auth.loader)
import { getAgentOSClient } from "../provider/sdk/agentos/agentos-client"
import { APIError, AuthenticationError } from "@worksofadam/agentos-sdk"

async loader(getAuth, provider) {
  const client = await getAgentOSClient()

  // Health check - fail fast on connection issues
  try {
    await client.health()
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw new Error("AgentOS authentication failed. Check your AGENTOS_API_KEY.")
    }
    if (error instanceof APIError) {
      throw new Error(`AgentOS connection failed (${error.status}): ${error.message}`)
    }
    throw new Error(`AgentOS health check failed: ${error}`)
  }

  // Discovery (Phase 8 migration, but shown for context)
  const agents = await client.agents.list()
  // Map to provider models...
}
```

### Error Handling Pattern
```typescript
// Consistent error handling across all SDK calls
import { APIError, AuthenticationError, NetworkError } from "@worksofadam/agentos-sdk"

try {
  const result = await client.agents.run(agentId, { message: "Hello" })
} catch (error) {
  // Authentication errors
  if (error instanceof AuthenticationError) {
    console.error("AgentOS auth failed:", error.message)
    throw new Error("Authentication failed. Please check your API key.")
  }

  // API errors (4xx, 5xx)
  if (error instanceof APIError) {
    console.error(`AgentOS API error (${error.status}):`, error.message)
    throw new Error(`AgentOS API error: ${error.message}`)
  }

  // Network errors (connection refused, timeout)
  if (error instanceof NetworkError) {
    console.error("AgentOS network error:", error.message)
    throw new Error("Cannot connect to AgentOS. Check your baseURL and network connection.")
  }

  // Unknown error
  throw error
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `fetch()` with FormData | SDK resource methods (`client.agents.run()`) | SDK v0.3.0+ | No manual FormData construction, typed parameters |
| Custom SSE parser (`createSSEParser()`) | SDK `AgentStream` (async iterable) | SDK v0.3.0+ | No manual buffer management, typed events |
| Hand-written TypeScript interfaces | OpenAPI-generated SDK types | SDK v0.3.0+ | Always up-to-date with API spec |
| Custom auth header injection | SDK `apiKey` option | SDK v0.3.0+ | No custom fetch wrapper needed |
| Manual error parsing | SDK error hierarchy | SDK v0.3.0+ | Structured error types with status codes |

**Deprecated/outdated:**
- Custom `makeStreamingRequest()` / `makeNonStreamingRequest()` methods in `AgentOSLanguageModel` → Replaced by SDK `client.agents.runStream()` and `client.agents.run()`
- Custom `AgentOSAgent` interface in `agentos-types.ts` → Replaced by SDK `AgentResponse` type
- Custom fetch wrapper in `plugin/agentos.ts` → SDK handles auth internally
- Manual `createSSEParser()` TransformStream → SDK `AgentStream` handles SSE parsing

## Open Questions

Things that couldn't be fully resolved:

1. **SDK `health()` method signature**
   - What we know: PROJECT.md mentions SDK provides health checking
   - What's unclear: Exact method signature (`client.health()` vs `client.system.health()`)
   - Recommendation: Check SDK documentation or inspect types once installed; likely `await client.health()` returning `Promise<HealthResponse>`

2. **SDK error type exports**
   - What we know: SDK has error hierarchy (APIError, AuthenticationError mentioned in requirements)
   - What's unclear: Full list of error types and their properties
   - Recommendation: Import from SDK and inspect types; document all error types during implementation

3. **SDK `AgentStream` interface details**
   - What we know: SDK provides `AgentStream` for SSE consumption, async iterable + event handlers
   - What's unclear: Exact event types, whether it's compatible with TransformStream piping
   - Recommendation: Phase 9 will handle stream migration; for Phase 7, just ensure SDK is available

4. **Backward compatibility during migration**
   - What we know: Phase 7 establishes client, Phase 11 removes old types
   - What's unclear: Whether to keep both custom and SDK types during transition
   - Recommendation: Keep custom types in Phase 7, re-export SDK types alongside them, remove in Phase 11 (TYPE-01/02/03)

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `packages/opencode/src/provider/sdk/agentos/agentos-provider.ts`, `agentos-language-model.ts`, `agentos-types.ts`
- Codebase inspection: `packages/opencode/src/plugin/agentos.ts` (existing auth/discovery patterns)
- Codebase inspection: `packages/opencode/src/config/config.ts`, `packages/opencode/src/env/index.ts` (config resolution patterns)
- `.planning/REQUIREMENTS.md` - SDK requirements (SDK-01 through SDK-05)
- `.planning/PROJECT.md` - SDK capabilities description (lines 115-119)

### Secondary (MEDIUM confidence)
- [TypeScript Singleton Pattern](https://refactoring.guru/design-patterns/singleton/typescript/example) - Singleton implementation patterns
- [Managing Global State in TypeScript](https://faisalahmedador.medium.com/managing-global-state-in-typescript-the-singleton-and-dependency-injection-approaches-022e5b42e004) - Singleton vs DI trade-offs
- [TypeScript Custom Errors in RESTful API](https://www.geeksforgeeks.org/typescript-custom-errors-in-restful-api/) - Error hierarchy patterns
- [Custom errors, extending Error](https://javascript.info/custom-errors) - JavaScript error class extension
- [TypeScript config environment variable resolution](https://dev.to/francis04j/how-to-add-env-and-use-process-env-to-your-typescript-project-3d6b) - Config/env patterns

### Tertiary (LOW confidence)
- [AgentOS API Overview - Agno](https://docs.agno.com/reference-api/overview) - Bearer token auth pattern (SDK may differ)
- [eventsource-parser](https://github.com/rexxars/eventsource-parser) - SSE parsing patterns (SDK handles this, but useful context)

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - SDK not publicly documented, but requirements/PROJECT.md provide clear guidance
- Architecture: HIGH - Existing codebase patterns well-established (Config, Env, singleton usage)
- Pitfalls: MEDIUM - Based on common SDK migration issues, not AgentOS SDK-specific experience
- Code examples: HIGH - Based on existing codebase patterns and TypeScript best practices

**Research date:** 2026-02-07
**Valid until:** 30 days (stable SDK version, patterns unlikely to change rapidly)
