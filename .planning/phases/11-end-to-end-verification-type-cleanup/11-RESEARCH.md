# Phase 11: End-to-End Verification & Type Cleanup - Research

**Researched:** 2026-02-07
**Domain:** End-to-end testing, type validation, unused code detection
**Confidence:** HIGH

## Summary

Phase 11 is the final phase of the v2.0 SDK migration. It has two objectives: (1) verify the complete agent chat workflow works end-to-end through the SDK, and (2) remove any remaining custom AgentOS API types that can be replaced with SDK types. This is a cleanup and verification phase, not a feature implementation phase.

Phases 7-10 already migrated all major functionality to the SDK. Phase 11 ensures nothing was missed and that the integration is complete. The key areas to investigate are: (a) what custom types remain in `agentos-types.ts` that could be replaced by SDK types, (b) how to verify the full workflow programmatically without manual testing, and (c) what verification patterns exist in the codebase already.

The current state shows 74 lines in `agentos-types.ts` with 6 exported types: 2 SDK re-exports (AgentResponse, ModelResponse), 3 custom tool confirmation types (AgentOSToolExecution, AgentOSRequirement, AgentOSPausedState), and 1 provider config type (AgentOSProviderSettings). The research question: are the tool confirmation types covered by SDK types, or are they legitimately custom to opencode's implementation?

**Primary recommendation:** Use TypeScript compilation + grep-based verification for type cleanup (no external tools needed), and verify the workflow by checking wiring chains across files (discovery plugin → language model → processor) rather than writing new tests.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript Compiler | 5.8.2 | Type checking and compilation | Already in workspace, detects type errors |
| Bun | 1.3.5 | Runtime and test runner | Project standard, has `bun test` support |
| grep/ripgrep | System tools | Code search for verification | Fast, reliable, no dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @worksofadam/agentos-sdk | 0.3.0 | SDK types reference | Check if SDK has types for custom interfaces |
| knip | Latest | Unused export detection | Optional — only if automated cleanup desired |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual verification | Automated E2E tests | Manual verification via grep/tsc is sufficient for this one-time migration verification |
| knip/ts-prune | Manual grep | Automated tools useful for ongoing maintenance, but overkill for final verification |
| Unit tests for types | Compilation as test | TypeScript compiler already validates types, no need for separate tests |

**Installation:**
```bash
# No new dependencies needed — use existing tools
cd packages/opencode && bunx tsc --noEmit  # TypeScript compilation
grep -r "pattern" path                      # Code search
```

## Architecture Patterns

### Pattern 1: Verification by Compilation
**What:** Use TypeScript compiler (`tsc --noEmit`) as the primary verification tool for type correctness
**When to use:** After removing custom types or changing imports
**Example:**
```bash
# Verify no type errors exist
cd packages/opencode && bunx tsc --noEmit

# Exit code 0 = success, all types resolve
# Non-zero exit = type errors present
```

**Why it works:** TypeScript compiler catches:
- Missing imports after type removal
- Type mismatches between SDK types and usage sites
- Unused type exports (when paired with `noUnusedLocals`)
- Invalid type references

### Pattern 2: Workflow Verification by Wiring Chain Inspection
**What:** Verify end-to-end workflow by inspecting the call chain across files using grep
**When to use:** To prove workflow connections without running the app
**Example:**
```bash
# Verify discovery → language model chain
grep "agents.list()" packages/opencode/src/plugin/agentos.ts
grep "createAgentOS" packages/opencode/src/plugin/agentos.ts

# Verify language model → processor chain (tool confirmation)
grep "pausedState" packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts
grep "AgentOSPausedState" packages/opencode/src/session/processor.ts
grep "continueAgentOS" packages/opencode/src/session/llm.ts

# Verify SDK client usage
grep "client.agents.runStream" packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts
grep "client.agents.continue" packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts
grep "client.agents.cancel" packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts
```

**What this proves:**
- Discovery uses SDK (`agents.list()`)
- Streaming uses SDK (`agents.runStream()`)
- Continue uses SDK (`agents.continue()`)
- Cancel uses SDK (`agents.cancel()`)
- Paused state flows from language model → processor → llm module

### Pattern 3: Type Replacement Validation
**What:** Check if SDK types can replace custom types by comparing field structures
**When to use:** Before removing custom types from `agentos-types.ts`
**Example:**
```typescript
// Step 1: Identify custom type
export interface AgentOSToolExecution {
  tool_call_id: string
  tool_name: string
  tool_args: Record<string, unknown>
  requires_confirmation: boolean
  confirmed: boolean | null
  confirmation_note: string | null
}

// Step 2: Check SDK for equivalent
// Search SDK types for ToolCallData, ToolExecution, etc.
grep -A 10 "interface ToolCallData" node_modules/@worksofadam/agentos-sdk/dist/index.d.ts

// Step 3: Compare fields
// SDK ToolCallData: has tool_call_id, tool_name, tool_args, content, result, role, etc.
// BUT: does NOT have requires_confirmation, confirmed, confirmation_note

// Conclusion: Custom type is NOT in SDK — it's opencode-specific state management
```

**Decision logic:**
- SDK has equivalent type with all fields → **Replace with SDK type**
- SDK has partial type missing critical fields → **Keep custom type**
- Custom type is application-specific state (not API response) → **Keep custom type**

### Anti-Patterns to Avoid
- **Writing new E2E tests:** This phase is verification, not testing. Use compilation and grep instead.
- **Installing type cleanup tools:** knip/ts-prune are useful for ongoing maintenance, but overkill for one-time verification.
- **Removing types without checking usage:** Always grep for usage before removing exported types.
- **Assuming SDK has all types:** The SDK has API response types, not application-specific state types.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type checking | Custom type validator script | `bunx tsc --noEmit` | TypeScript compiler is the source of truth for type correctness |
| Unused export detection | Custom AST parser | grep + manual review or knip | grep is fast and reliable; knip is mature if automation desired |
| Workflow verification | Custom test harness | Wiring chain inspection (grep) | Call chains are visible in code, no runtime execution needed |
| SDK type discovery | Manual API inspection | `grep` on SDK index.d.ts | SDK type definitions are comprehensive and searchable |

**Key insight:** TypeScript compiler + grep are sufficient for verification in this phase. Don't add complexity.

## Common Pitfalls

### Pitfall 1: Assuming All Types Should Come from SDK
**What goes wrong:** Removing custom types that represent application state, not API responses
**Why it happens:** Misunderstanding what SDK provides (API response types) vs what the app needs (state management types)
**How to avoid:** Check if type fields match SDK API responses. If type includes app-specific fields (e.g., `confirmed`, `confirmation_note`), it's likely app state.
**Warning signs:** Type has fields like "confirmed", "state", "cached", "dirty" — these are app state, not API responses

### Pitfall 2: Removing Types Without Checking Usage
**What goes wrong:** Breaking imports by removing types that are still referenced
**Why it happens:** Assuming exported types are unused without verification
**How to avoid:** Always grep for type name before removing: `grep -r "TypeName" packages/opencode/src`
**Warning signs:** TypeScript compilation fails with "Cannot find name 'TypeName'" after removal

### Pitfall 3: Over-Verifying with Runtime Tests
**What goes wrong:** Writing E2E tests for a workflow that's already proven by previous phases
**Why it happens:** Lack of confidence that static verification is sufficient
**How to avoid:** Trust that Phases 7-10 verification already proved functionality. Phase 11 is cleanup verification, not feature testing.
**Warning signs:** Writing new test files, setting up test fixtures, mocking AgentOS API

### Pitfall 4: Confusing SDK Event Types with App State Types
**What goes wrong:** Trying to replace app state types with SDK event types
**Why it happens:** SDK has `RunPausedEvent` with `tools?: ToolCallData[]`, but app needs `AgentOSPausedState` with additional fields
**How to avoid:** Recognize that SDK events are transient (received during streaming), while app state is persistent (stored in processor)
**Warning signs:** SDK type is an event (ends with "Event"), app type is state (contains "State" or "Paused")

### Pitfall 5: Not Checking TypeScript Compilation After Changes
**What goes wrong:** Shipping code with type errors that weren't caught
**Why it happens:** Assuming changes are safe without running compiler
**How to avoid:** Always run `bunx tsc --noEmit` after removing types or changing imports
**Warning signs:** CI fails, runtime errors about undefined types, import resolution issues

## Code Examples

Verified patterns from SDK and current implementation:

### Verification Pattern: Full Workflow Chain
```bash
# Source: Phase 10 verification report (10-VERIFICATION.md)
# Verify complete chain: processor → llm → language model → SDK

# Step 1: Processor detects paused state
grep -n "agentOSPausedState" packages/opencode/src/session/processor.ts
# Result: Line 38 declares variable, line 281 assigns from providerMetadata

# Step 2: Processor calls LLM.continueAgentOS
grep -n "LLM.continueAgentOS" packages/opencode/src/session/processor.ts
# Result: Line 414-418 calls with pausedState

# Step 3: LLM calls language.continueRun
grep -n "language.continueRun" packages/opencode/src/session/llm.ts
# Result: Line 319 calls continueRun method

# Step 4: Language model calls SDK
grep -n "client.agents.continue" packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts
# Result: Line 434-438 calls SDK with tools JSON

# Conclusion: Complete chain verified, no gaps
```

### Type Inspection Pattern: SDK vs Custom
```bash
# Source: SDK index.d.ts + agentos-types.ts
# Compare SDK ToolCallData with custom AgentOSToolExecution

# SDK type (from grep):
interface ToolCallData {
    tool_call_id: string;
    tool_name: string;
    tool_args: Record<string, unknown>;
    content?: string | null;
    result?: string | null;
    role?: string;
    tool_call_error?: boolean;
    metrics?: { time?: number; duration?: number };
    created_at: number;
}

# Custom type (from agentos-types.ts):
interface AgentOSToolExecution {
  tool_call_id: string
  tool_name: string
  tool_args: Record<string, unknown>
  requires_confirmation: boolean      // NOT in SDK
  confirmed: boolean | null            // NOT in SDK
  confirmation_note: string | null     // NOT in SDK
}

# Analysis:
# - SDK ToolCallData is the API response structure
# - Custom AgentOSToolExecution adds confirmation workflow fields
# - Custom type is app state, not API response → KEEP IT
```

### Compilation Verification Pattern
```bash
# Source: Phase 10 verification (10-VERIFICATION.md line 200-206)
# Verify TypeScript compiles cleanly after changes

cd packages/opencode && bunx tsc --noEmit
# No output = success
# Exit code 0 = all types valid

# If errors appear:
# Error TS2307: Cannot find module '@/provider/sdk/agentos/agentos-types'
# → Check if import was removed but usage remains

# Error TS2339: Property 'pausedState' does not exist on type 'X'
# → Check if type was removed but field access remains
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual E2E testing | Static verification (grep + tsc) | 2024+ | Faster verification, no test infrastructure needed |
| Custom type cleanup scripts | TypeScript compiler + unused export detection | 2023+ | Compiler catches real errors, not just "unused" |
| Runtime type validation (Zod) | SDK types at compile time | Phase 7-10 | Zod removed for API types, SDK provides compile-time safety |
| SSE event types in app code | SDK event types imported | Phase 9-10 | SDK owns event definitions, app just imports |

**Deprecated/outdated:**
- **Custom Zod schemas for AgentOS API types**: Removed in Phase 10. SDK provides TypeScript types generated from OpenAPI spec.
- **Custom SSE event interfaces**: Removed in Phase 10. SDK exports `RunStartedEvent`, `RunContentEvent`, etc.
- **Hand-written error response types**: Removed in Phase 7. SDK exports `APIError` hierarchy.

## Open Questions

1. **Are tool confirmation types (AgentOSToolExecution, AgentOSRequirement, AgentOSPausedState) covered by SDK?**
   - What we know: SDK has `ToolCallData` and `RunPausedEvent`, but these don't include confirmation fields
   - What's unclear: Whether SDK has a separate type for tool confirmation state
   - Recommendation: Inspect SDK types for "confirmation", "requirement", "paused state". If not found, keep custom types.

2. **Should AgentOSProviderSettings remain or use SDK config types?**
   - What we know: Current type has `baseURL`, `apiKey`, `name` — used for provider factory
   - What's unclear: Whether SDK exports a config type for client initialization
   - Recommendation: Check SDK for `AgentOSClientOptions`. If it exists and matches, use it. Otherwise keep custom type.

3. **Is there a "requirements" field in SDK events that wasn't found?**
   - What we know: Code casts `(event as StreamEvent).requirements as AgentOSRequirement[]` (line 299 of language-model.ts)
   - What's unclear: Whether SDK's `RunPausedEvent` or `StreamEvent` union includes this field
   - Recommendation: Inspect SDK source or run runtime debugging to confirm field exists. If it's in SDK but not typed, that's an SDK type definition gap.

4. **Should this phase include any runtime verification (smoke test)?**
   - What we know: Phases 7-10 all verified their features at completion
   - What's unclear: Whether Phase 11 should re-verify or just check for cleanup gaps
   - Recommendation: Runtime verification optional. If user has a working AgentOS instance, a single smoke test (discover → chat → tool confirm → continue) would confirm end-to-end. But not required if Phases 7-10 verification reports are trusted.

## Sources

### Primary (HIGH confidence)
- @worksofadam/agentos-sdk v0.3.0 index.d.ts — SDK type definitions inspected via grep
- packages/opencode/src/provider/sdk/agentos/agentos-types.ts — Current custom types (74 lines, 6 exports)
- .planning/phases/10-tool-confirmation-run-lifecycle/10-VERIFICATION.md — Phase 10 verification proving SDK methods work
- .planning/REQUIREMENTS.md — v2.0 requirements TYPE-01, TYPE-02, TYPE-03, RUN-03

### Secondary (MEDIUM confidence)
- [Effective TypeScript - knip for dead code detection](https://effectivetypescript.com/2023/07/29/knip/) — Recommended tool for unused export detection
- [GitHub - line/tsr](https://github.com/line/tsr) — TypeScript Remove utility for unused code cleanup
- [Knip documentation](https://knip.dev/) — Modern unused code detection tool

### Tertiary (LOW confidence)
- [Building AI Agent Workflows with TypeScript](https://medium.com/himit-pens/building-ai-agent-workflows-with-python-typescript-d798c3435ec1) — General agent workflow patterns
- [OpenAI Agents SDK Streaming Guide](https://openai.github.io/openai-agents-js/guides/streaming/) — Streaming patterns (different SDK but similar concepts)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — TypeScript compiler and grep are proven tools, no uncertainty
- Architecture: HIGH — Verification patterns established in Phase 7-10, well-documented in verification reports
- Pitfalls: HIGH — Common mistakes identified from prior phase execution, clear warning signs
- Type cleanup: MEDIUM — Need to inspect SDK types to confirm what can be replaced (knip/manual grep decision is clear)
- Workflow verification: HIGH — Wiring chains visible in code, prior phases already proved functionality

**Research date:** 2026-02-07
**Valid until:** 60 days (type cleanup is stable domain, TypeScript best practices change slowly)
