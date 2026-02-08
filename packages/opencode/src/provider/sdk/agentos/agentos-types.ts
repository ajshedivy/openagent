import type { components } from "@worksofadam/agentos-sdk"

// ============================================================================
// AgentOS API Types
// ============================================================================

/**
 * Agent response from SDK - replaces custom AgentOSAgent interface
 */
export type AgentResponse = components["schemas"]["AgentResponse"]

/**
 * Model information from SDK - replaces custom AgentOSModelInfo interface
 */
export type ModelResponse = components["schemas"]["ModelResponse"]

// ============================================================================
// Tool Confirmation Types (RunPaused)
// ============================================================================

/**
 * Tool execution details for confirmation workflow
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
 * Requirement with tool execution that needs confirmation
 */
export interface AgentOSRequirement {
  id: string
  created_at: string
  tool_execution: AgentOSToolExecution
}

/**
 * State stored when a run is paused for tool confirmation
 */
export interface AgentOSPausedState {
  runId: string
  sessionId: string
  agentId: string
  requirements: AgentOSRequirement[]
  tools: AgentOSToolExecution[]
}

// ============================================================================
// Provider Configuration Types
// ============================================================================

export interface AgentOSProviderSettings {
  /**
   * Base URL for the AgentOS API
   * @example "http://localhost:7777" or "https://your-agentos.com"
   */
  baseURL: string

  /**
   * API key for Bearer token authentication
   */
  apiKey?: string

  /**
   * Provider name for identification
   * @default "agentos"
   */
  name?: string
}
