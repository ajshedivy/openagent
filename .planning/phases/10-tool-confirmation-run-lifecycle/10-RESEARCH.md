# Phase 10: Tool Confirmation & Run Lifecycle - Research

**Researched:** 2026-02-07
**Domain:** AgentOS SDK tool confirmation workflow and run lifecycle
**Confidence:** HIGH

## Summary

Phase 10 migrates the tool confirmation (continue) and run cancellation flows from custom HTTP+SSE implementations to the AgentOS SDK's built-in methods. The SDK provides `client.agents.continue()` and `client.agents.cancel()` that replace the custom `makeContinueRequest()` and FormData handling currently in the language model.

The current implementation (preserved during Phase 9) uses custom fetch with FormData and SSE parsing for the continue endpoint. The SDK abstracts this with a single method that returns either an `AgentStream` (streaming) or plain result (non-streaming). The tool confirmation workflow in `processor.ts` already handles paused state detection and permission prompts - Phase 10 focuses on replacing the HTTP layer only.

**Primary recommendation:** Replace `makeContinueRequest()` and `processContinueStream()` with `client.agents.continue()`, converting the returned `AgentStream` to accumulated text/tool results. Wire up `client.agents.cancel()` for abort signal handling.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @worksofadam/agentos-sdk | 0.3.0 | AgentOS HTTP API client | Official SDK with continue() and cancel() methods |
| ai | latest | AI SDK provider interface | Bridge between SDK events and AI SDK streaming |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @ai-sdk/provider | latest | LanguageModelV2 interface types | Type definitions for stream parts |
| @ai-sdk/provider-utils | latest | generateId utility | Generate IDs when SDK doesn't provide them |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SDK continue() | Custom fetch + SSE parsing | SDK provides auth, error handling, type safety - no reason to hand-roll |
| SDK cancel() | Direct HTTP DELETE | SDK handles path construction and auth headers correctly |

**Installation:**
```bash
# Already installed in Phase 7
bun add @worksofadam/agentos-sdk@github:ajshedivy/agentos-sdk#v0.3.0
```

## Architecture Patterns

### Pattern 1: SDK Continue Method Signature
**What:** The SDK's `continue()` method accepts agent ID, run ID, and continue options
**When to use:** After receiving RunPausedEvent with tool confirmation requirements
**Example:**
```typescript
// Source: SDK README.md and index.d.ts
interface ContinueOptions {
  /** JSON string containing array of tool execution results */
  tools: string;
  /** Optional session ID */
  sessionId?: string;
  /** Optional user ID */
  userId?: string;
  /** Whether to stream the response (default: true) */
  stream?: boolean;
}

const stream = await client.agents.continue('agent-id', 'run-id', {
  tools: JSON.stringify([
    { tool_call_id: 'call_123', confirmed: true, confirmation_note: null }
  ]),
  sessionId: 'session-123',
  stream: true
});

// Returns AgentStream (AsyncIterable<StreamEvent>) when stream: true
for await (const event of stream) {
  if (event.event === 'RunContent') {
    console.log(event.content);
  }
}
```

### Pattern 2: Tool Execution Confirmation Structure
**What:** The continue endpoint expects tool_execution objects with confirmation fields
**When to use:** Building the tools JSON string for continue request
**Example:**
```typescript
// Source: agentos-types.ts and current implementation
export interface AgentOSToolExecution {
  tool_call_id: string
  tool_name: string
  tool_args: Record<string, unknown>
  requires_confirmation: boolean
  confirmed: boolean | null  // User's approval decision
  confirmation_note: string | null  // Optional rejection reason
}

// The requirements array from RunPausedEvent contains full tool_execution objects
const tools = requirements.map((req) => req.tool_execution)
const toolsJSON = JSON.stringify(tools)

await client.agents.continue(agentId, runId, {
  tools: toolsJSON,
  sessionId,
  stream: true
})
```

### Pattern 3: AgentStream to Accumulated Content
**What:** Convert SDK's AsyncIterable<StreamEvent> to accumulated text and tool results
**When to use:** Processing the continue response for display and metrics
**Example:**
```typescript
// Source: Current processContinueStream() method
async function processContinue(stream: AgentStream): Promise<{
  text: string
  toolResults: Array<{ toolName: string; toolCallId: string; result: unknown }>
  usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number }
}> {
  let text = ""
  const toolResults: Array<{ toolName: string; toolCallId: string; result: unknown }> = []
  const usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number } = {}

  for await (const event of stream) {
    switch (event.event) {
      case "RunContent":
        text += event.content
        break
      case "ToolCallCompleted":
        toolResults.push({
          toolName: event.tool_name,
          toolCallId: event.tool_call_id,
          result: event.result,
        })
        break
      case "ModelRequestCompleted":
        usage.inputTokens = event.input_tokens
        usage.outputTokens = event.output_tokens
        usage.totalTokens = event.total_tokens
        break
    }
  }

  return { text, toolResults, usage }
}
```

### Pattern 4: Cancel Method Usage
**What:** SDK's cancel() method terminates a running agent
**When to use:** When abort signal is triggered or user cancels
**Example:**
```typescript
// Source: SDK README.md and index.d.ts
await client.agents.cancel('agent-id', 'run-id');
// Returns: Promise<void>
// No response body - just confirms cancellation
```

### Anti-Patterns to Avoid
- **Manual FormData construction:** The SDK handles this internally - don't replicate it
- **Custom SSE parsing for continue:** The SDK returns AgentStream, no need for createSSEParser()
- **Building Authorization headers manually:** SDK handles auth via apiKey in constructor
- **Mixing SDK and custom fetch:** Either use SDK for all endpoints or none - mixing causes duplicate auth logic

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Continue request with FormData | Custom fetch + FormData + headers | `client.agents.continue()` | SDK handles FormData, Content-Type boundaries, auth headers, error parsing |
| SSE parsing for continue response | Custom createSSEParser() TransformStream | Iterate over AgentStream | SDK returns AsyncIterable already parsed |
| Run cancellation HTTP | Direct fetch to /cancel endpoint | `client.agents.cancel()` | SDK constructs correct path and handles auth |
| Tool results serialization | Custom JSON.stringify with field mapping | Pass tool_execution objects directly | API expects full tool_execution, not just confirmation fields |

**Key insight:** The continue endpoint is complex (FormData with multipart/form-data boundary, SSE streaming, error handling). The SDK has already solved all these edge cases. Phase 9 proved the SDK's streaming works reliably - Phase 10 extends that trust to continue/cancel.

## Common Pitfalls

### Pitfall 1: Tools Field Format Mismatch
**What goes wrong:** Passing only confirmation fields instead of full tool_execution objects to continue()
**Why it happens:** The API docs show "tools" as a string, unclear what structure it expects
**How to avoid:** Pass the full `tool_execution` objects from requirements, not a subset of fields. The current implementation does this correctly: `const tools = options.requirements.map((req) => req.tool_execution)`
**Warning signs:** 400 Bad Request with "Invalid JSON in tools field" or "Invalid tool structure"

### Pitfall 2: Stream Type Assumption
**What goes wrong:** Assuming `continue()` always returns `AgentStream`
**Why it happens:** The SDK signature is `Promise<AgentStream | unknown>` - non-streaming returns unknown
**How to avoid:** Default to `stream: true` in ContinueOptions, or check return type with `Symbol.asyncIterator in result`
**Warning signs:** TypeScript errors about missing iterator methods, runtime "for await" failures

### Pitfall 3: Abort Signal Not Wired to Cancel
**What goes wrong:** Run continues even after user aborts
**Why it happens:** No integration between abort signal and `client.agents.cancel()`
**How to avoid:** Add abort signal listener that calls `client.agents.cancel(runId, sessionId)` on abort. The current code checks `abortSignal?.aborted` in loops but doesn't proactively cancel the run.
**Warning signs:** UI shows abort but backend run continues, wasted tokens/cost

### Pitfall 4: Not Accumulating Continue Stream Results
**What goes wrong:** Tool results and text from continue are lost or incomplete
**Why it happens:** The continue stream is consumed but not stored for display/metrics
**How to avoid:** Follow the Pattern 3 accumulation approach - collect text, tool results, and usage metrics from the stream before returning
**Warning signs:** UI shows tool execution indicator but no results, missing usage metrics after continue

### Pitfall 5: Removing Legacy Methods Too Early
**What goes wrong:** Breaking code that still references buildHeaders, createSSEParser, etc.
**Why it happens:** Phase 9 preserved these for Phase 10, but removing them before full migration breaks continue flow
**How to avoid:** Remove `makeContinueRequest()` and `processContinueStream()` only after new SDK continue() implementation is complete and tested. Keep `buildHeaders` if any other code paths use it (unlikely after full SDK migration).
**Warning signs:** TypeScript errors about missing methods, runtime "method not found" errors

## Code Examples

Verified patterns from SDK documentation and current implementation:

### Continue a Paused Run (SDK Approach)
```typescript
// Source: SDK README.md + current implementation pattern
const client = await this.config.getClient()

// Build tools array from paused state requirements
const tools = JSON.stringify(
  pausedState.requirements.map((req) => req.tool_execution)
)

// Call SDK continue method
const agentStream = await client.agents.continue(
  pausedState.agentId,
  pausedState.runId,
  {
    tools,
    sessionId: pausedState.sessionId,
    stream: true,
  }
)

// Process stream to accumulate content
let text = ""
const toolResults: Array<{ toolName: string; toolCallId: string; result: unknown }> = []
const usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 }

for await (const event of agentStream) {
  if (abortSignal?.aborted) break

  switch (event.event) {
    case "RunContent":
      text += event.content
      break
    case "ToolCallCompleted":
      toolResults.push({
        toolName: event.tool_name,
        toolCallId: event.tool_call_id,
        result: event.result,
      })
      break
    case "ModelRequestCompleted":
      usage.inputTokens = event.input_tokens || 0
      usage.outputTokens = event.output_tokens || 0
      usage.totalTokens = event.total_tokens || 0
      break
  }
}

return { text, toolResults, usage }
```

### Cancel a Running Agent (SDK Approach)
```typescript
// Source: SDK README.md
const client = await this.config.getClient()

try {
  await client.agents.cancel(agentId, runId)
  log.info("Agent run cancelled successfully")
} catch (error) {
  log.error("Failed to cancel agent run", { error })
  // Don't throw - cancellation is best-effort
}
```

### Replace makeContinueRequest with SDK
```typescript
// BEFORE (custom fetch + FormData):
async makeContinueRequest(options: {
  runId: string
  sessionId: string
  requirements: AgentOSRequirement[]
  headers?: Record<string, string | undefined>
  abortSignal?: AbortSignal
}): Promise<{ responseHeaders: Record<string, string>; body: ReadableStream<Uint8Array> }> {
  const url = `${this.config.baseURL}/agents/${this.modelId}/runs/${options.runId}/continue`
  const headers = this.buildHeaders(options.headers)
  const fetchFn = this.config.fetch ?? fetch
  const tools = options.requirements.map((req) => req.tool_execution)

  const formData = new FormData()
  formData.append("tools", JSON.stringify(tools))
  formData.append("session_id", options.sessionId)
  formData.append("stream", "true")

  const response = await fetchFn(url, {
    method: "POST",
    headers,
    body: formData,
    signal: options.abortSignal,
  })

  if (!response.ok) {
    throw new Error(`AgentOS API error: ${response.status}`)
  }

  return {
    responseHeaders: Object.fromEntries(response.headers.entries()),
    body: response.body!,
  }
}

// AFTER (SDK method):
// This entire method is replaced by:
const client = await this.config.getClient()
const agentStream = await client.agents.continue(
  this.modelId,
  options.runId,
  {
    tools: JSON.stringify(options.requirements.map(r => r.tool_execution)),
    sessionId: options.sessionId,
    stream: true,
  }
)
// agentStream is already an AsyncIterable<StreamEvent> - no need for SSE parsing
```

### Replace processContinueStream with SDK Event Accumulation
```typescript
// BEFORE (manual SSE parsing + accumulation):
async processContinueStream(options: {
  body: ReadableStream<Uint8Array>
  abortSignal?: AbortSignal
}): Promise<{ text: string; toolResults: []; usage: {} }> {
  const textDecoder = new TextDecoderStream()
  const textStream = options.body.pipeThrough(textDecoder)
  const eventStream = textStream.pipeThrough(this.createSSEParser())
  const reader = eventStream.getReader()
  // ... accumulation logic
}

// AFTER (SDK AgentStream iteration):
async processContinue(
  agentStream: AgentStream,
  abortSignal?: AbortSignal
): Promise<{ text: string; toolResults: []; usage: {} }> {
  let text = ""
  const toolResults: Array<{ toolName: string; toolCallId: string; result: unknown }> = []
  const usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 }

  for await (const event of agentStream) {
    if (abortSignal?.aborted) break

    switch (event.event) {
      case "RunContent":
        text += event.content
        break
      case "ToolCallCompleted":
        toolResults.push({
          toolName: event.tool_name,
          toolCallId: event.tool_call_id,
          result: event.result,
        })
        break
      case "ModelRequestCompleted":
        usage.inputTokens = event.input_tokens || 0
        usage.outputTokens = event.output_tokens || 0
        usage.totalTokens = event.total_tokens || 0
        break
    }
  }

  return { text, toolResults, usage }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom fetch + FormData for continue | SDK `client.agents.continue()` | SDK v0.3.0 (2024) | Eliminates 50+ lines of HTTP boilerplate per endpoint |
| Manual SSE parsing with TransformStream | SDK returns parsed AgentStream | SDK v0.3.0 (2024) | No need to maintain SSE parser, SDK handles chunking edge cases |
| Direct HTTP DELETE for cancel | SDK `client.agents.cancel()` | SDK v0.3.0 (2024) | Consistent error handling and auth across all operations |
| requirements.map(r => r.tool_execution) | Same (still correct) | N/A | API expects full tool_execution objects, not just confirmation fields |

**Deprecated/outdated:**
- `makeContinueRequest()`: Custom fetch with FormData - replaced by SDK continue()
- `processContinueStream()`: Custom SSE parser - replaced by SDK AgentStream iteration
- `buildHeaders()`: Manual Authorization header construction - replaced by SDK apiKey config (may still be needed for other legacy code, check before removing)
- `createSSEParser()`: Manual SSE parsing TransformStream - replaced by SDK's internal parsing (preserved for legacy, remove when all endpoints migrated)

## Open Questions

1. **Abort Signal Handling**
   - What we know: Current code checks `abortSignal?.aborted` in loops but doesn't call a cancel API
   - What's unclear: Should abort signal automatically trigger `client.agents.cancel()`? Or just stop consuming the stream?
   - Recommendation: Add abort signal listener that calls `client.agents.cancel()` to stop backend processing, not just frontend consumption. This saves tokens and ensures clean run state.

2. **Non-Streaming Continue Support**
   - What we know: SDK continue() can return non-streaming result if `stream: false`
   - What's unclear: Does the current tool confirmation flow ever need non-streaming continue?
   - Recommendation: Default to `stream: true` for consistency with Phase 9 streaming approach. Only implement non-streaming if there's a specific use case (e.g., tool results too large for UI streaming).

3. **Legacy Method Cleanup**
   - What we know: Phase 9 preserved `buildHeaders()`, `createSSEParser()`, `makeContinueRequest()`, `processContinueStream()` for Phase 10
   - What's unclear: Are any other code paths using `buildHeaders()` or `createSSEParser()`?
   - Recommendation: Grep for usage before removal. If only used by continue flow, safe to delete after migration. If used elsewhere, defer cleanup to Phase 11.

4. **Error Handling for Continue**
   - What we know: SDK throws typed errors (APIError, BadRequestError, etc.) for continue failures
   - What's unclear: Should 400 "Invalid tool structure" errors be shown to user or logged silently?
   - Recommendation: Log validation errors and show generic "Failed to continue run" to user. The processor.ts error handling already does this for run errors - extend same pattern to continue errors.

## Sources

### Primary (HIGH confidence)
- SDK README.md (node_modules/@worksofadam/agentos-sdk/README.md) - Continue and cancel method examples
- SDK TypeScript definitions (node_modules/@worksofadam/agentos-sdk/dist/index.d.ts) - ContinueOptions, AgentStream, cancel() signatures
- Current implementation (agentos-language-model.ts lines 421-641) - makeContinueRequest and processContinueStream patterns
- Current processor (processor.ts lines 350-509) - Tool confirmation workflow and paused state handling

### Secondary (MEDIUM confidence)
- Phase 9 plan (09-01-PLAN.md) - Context on why continue methods were preserved
- AgentOS types (agentos-types.ts) - AgentOSToolExecution, AgentOSRequirement, AgentOSPausedState interfaces

### Tertiary (LOW confidence)
- None - all information verified against SDK source or current implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - SDK is official and only option for AgentOS API
- Architecture: HIGH - SDK README provides clear continue/cancel examples, current code shows exact usage patterns
- Pitfalls: HIGH - Based on current implementation's choices (e.g., full tool_execution objects) and SDK error types

**Research date:** 2026-02-07
**Valid until:** 60 days (SDK is stable, no breaking changes expected in v0.3.x)
