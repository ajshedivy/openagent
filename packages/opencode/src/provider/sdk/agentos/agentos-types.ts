import type { components } from "@worksofadam/agentos-sdk"

// ============================================================================
// SDK Type Re-exports
// ============================================================================
// These types come directly from the AgentOS SDK OpenAPI schema and represent
// API response structures.

/**
 * Agent response from SDK - replaces custom AgentOSAgent interface.
 * Re-exported from SDK components["schemas"]["AgentResponse"].
 */
export type AgentResponse = components["schemas"]["AgentResponse"]

/**
 * Model information from SDK - replaces custom AgentOSModelInfo interface.
 * Re-exported from SDK components["schemas"]["ModelResponse"].
 */
export type ModelResponse = components["schemas"]["ModelResponse"]

// ============================================================================
// Application-Specific Types (Tool Confirmation Workflow)
// ============================================================================
// These types are NOT API response types - they are application state structures
// used by the tool confirmation workflow. They extend SDK concepts (ToolCallData,
// RunPausedEvent) with app-specific fields like `confirmed` and `confirmation_note`.

/**
 * Tool execution details for confirmation workflow.
 * Extends SDK ToolCallData with application-specific confirmation state.
 *
 * Note: The `confirmed` and `confirmation_note` fields are app state, not API fields.
 */
export interface AgentOSToolExecution {
  tool_call_id: string
  tool_name: string
  tool_args: Record<string, unknown>
  requires_confirmation: boolean
  confirmed: boolean | null
  confirmation_note: string | null
}

/**
 * Requirement with tool execution that needs confirmation.
 * Based on SDK RunPausedEvent.requirements structure with app-specific tool_execution.
 */
export interface AgentOSRequirement {
  id: string
  created_at: string
  tool_execution: AgentOSToolExecution
}

/**
 * State stored when a run is paused for tool confirmation.
 * Aggregates data from SDK RunPausedEvent for the confirmation workflow.
 */
export interface AgentOSPausedState {
  runId: string
  sessionId: string
  agentId: string
  requirements: AgentOSRequirement[]
  tools: AgentOSToolExecution[]
}

// ============================================================================
// Provider Configuration
// ============================================================================

/**
 * Provider factory options for createAgentOS().
 * Note: baseURL/apiKey are resolved by the SDK client singleton (agentos-client.ts),
 * not passed through provider settings.
 */
export interface AgentOSProviderSettings {
  /**
   * Provider name for identification
   * @default "agentos"
   */
  name?: string
}
