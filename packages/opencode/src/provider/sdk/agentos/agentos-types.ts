import { z } from "zod/v4"

// ============================================================================
// AgentOS API Types
// ============================================================================

/**
 * Model information from AgentOS agent configuration
 */
export interface AgentOSModelInfo {
  name: string
  model: string
  provider: string
}

/**
 * Agent response from GET /agents endpoint
 */
export interface AgentOSAgent {
  id: string
  name: string | null
  db_id: string | null
  description: string | null
  role: string | null
  model: AgentOSModelInfo | null
  tools: Record<string, unknown> | null
  sessions: Record<string, unknown> | null
  knowledge: Record<string, unknown> | null
  memory: Record<string, unknown> | null
  reasoning: Record<string, unknown> | null
  default_tools: Record<string, unknown> | null
  system_message: Record<string, unknown> | null
  extra_messages: Record<string, unknown> | null
  response_settings: Record<string, unknown> | null
  introduction: string | null
  streaming: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  input_schema: Record<string, unknown> | null
}

// ============================================================================
// SSE Event Types
// ============================================================================

/**
 * Base SSE event structure
 */
export interface AgentOSBaseEvent {
  created_at: number
  event: string
  agent_id: string
  agent_name: string
  run_id: string
  session_id: string
}

/**
 * RunStarted event - emitted when agent run begins
 */
export interface AgentOSRunStartedEvent extends AgentOSBaseEvent {
  event: "RunStarted"
  model: string
  model_provider: string
}

/**
 * ModelRequestStarted event - emitted when model request begins
 */
export interface AgentOSModelRequestStartedEvent extends AgentOSBaseEvent {
  event: "ModelRequestStarted"
  model: string
  model_provider: string
}

/**
 * ModelRequestCompleted event - emitted when model request finishes
 */
export interface AgentOSModelRequestCompletedEvent extends AgentOSBaseEvent {
  event: "ModelRequestCompleted"
  model: string
  model_provider: string
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
}

/**
 * RunContent event - emitted for text content chunks
 */
export interface AgentOSRunContentEvent extends AgentOSBaseEvent {
  event: "RunContent"
  content: string
  content_type: "str" | "json" | string
  reasoning_content: string
  workflow_agent: boolean
}

/**
 * ToolCallStarted event - emitted when a tool call begins
 */
export interface AgentOSToolCallStartedEvent extends AgentOSBaseEvent {
  event: "ToolCallStarted"
  tool_call_id: string
  tool_name: string
  tool_args: Record<string, unknown>
}

/**
 * ToolCallCompleted event - emitted when a tool call completes
 */
export interface AgentOSToolCallCompletedEvent extends AgentOSBaseEvent {
  event: "ToolCallCompleted"
  tool_call_id: string
  tool_name: string
  result: unknown
}

/**
 * RunCompleted event - emitted when agent run finishes
 */
export interface AgentOSRunCompletedEvent extends AgentOSBaseEvent {
  event: "RunCompleted"
}

/**
 * RunContentCompleted event - emitted when content streaming finishes
 */
export interface AgentOSRunContentCompletedEvent extends AgentOSBaseEvent {
  event: "RunContentCompleted"
}

/**
 * ModelResponseStarted event - emitted when model response begins
 */
export interface AgentOSModelResponseStartedEvent extends AgentOSBaseEvent {
  event: "ModelResponseStarted"
}

/**
 * ModelResponseCompleted event - emitted when model response finishes
 */
export interface AgentOSModelResponseCompletedEvent extends AgentOSBaseEvent {
  event: "ModelResponseCompleted"
}

/**
 * ReasoningStarted event - emitted when reasoning begins
 */
export interface AgentOSReasoningStartedEvent extends AgentOSBaseEvent {
  event: "ReasoningStarted"
}

/**
 * ReasoningCompleted event - emitted when reasoning finishes
 */
export interface AgentOSReasoningCompletedEvent extends AgentOSBaseEvent {
  event: "ReasoningCompleted"
}

/**
 * RunError event - emitted when an error occurs
 */
export interface AgentOSRunErrorEvent extends AgentOSBaseEvent {
  event: "RunError"
  error: string
  error_code?: string
}

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
 * RunPaused event - emitted when agent pauses for tool confirmation
 */
export interface AgentOSRunPausedEvent extends AgentOSBaseEvent {
  event: "RunPaused"
  content: string
  tools: AgentOSToolExecution[]
  requirements: AgentOSRequirement[]
}

/**
 * Union type for all SSE events
 */
export type AgentOSEvent =
  | AgentOSRunStartedEvent
  | AgentOSModelRequestStartedEvent
  | AgentOSModelRequestCompletedEvent
  | AgentOSRunContentEvent
  | AgentOSToolCallStartedEvent
  | AgentOSToolCallCompletedEvent
  | AgentOSRunCompletedEvent
  | AgentOSRunContentCompletedEvent
  | AgentOSModelResponseStartedEvent
  | AgentOSModelResponseCompletedEvent
  | AgentOSReasoningStartedEvent
  | AgentOSReasoningCompletedEvent
  | AgentOSRunErrorEvent
  | AgentOSRunPausedEvent

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const agentOSBaseEventSchema = z.object({
  created_at: z.number(),
  event: z.string(),
  agent_id: z.string(),
  agent_name: z.string(),
  run_id: z.string(),
  session_id: z.string(),
})

export const agentOSRunStartedEventSchema = agentOSBaseEventSchema.extend({
  event: z.literal("RunStarted"),
  model: z.string(),
  model_provider: z.string(),
})

export const agentOSModelRequestStartedEventSchema = agentOSBaseEventSchema.extend({
  event: z.literal("ModelRequestStarted"),
  model: z.string(),
  model_provider: z.string(),
})

export const agentOSRunContentEventSchema = agentOSBaseEventSchema.extend({
  event: z.literal("RunContent"),
  content: z.string(),
  content_type: z.string(),
  reasoning_content: z.string(),
  workflow_agent: z.boolean(),
})

export const agentOSToolCallStartedEventSchema = agentOSBaseEventSchema.extend({
  event: z.literal("ToolCallStarted"),
  tool_call_id: z.string(),
  tool_name: z.string(),
  tool_args: z.record(z.string(), z.unknown()),
})

export const agentOSToolCallCompletedEventSchema = agentOSBaseEventSchema.extend({
  event: z.literal("ToolCallCompleted"),
  tool_call_id: z.string(),
  tool_name: z.string(),
  result: z.unknown(),
})

export const agentOSRunCompletedEventSchema = agentOSBaseEventSchema.extend({
  event: z.literal("RunCompleted"),
})

export const agentOSRunErrorEventSchema = agentOSBaseEventSchema.extend({
  event: z.literal("RunError"),
  error: z.string(),
  error_code: z.string().optional(),
})

export const agentOSToolExecutionSchema = z.object({
  tool_call_id: z.string(),
  tool_name: z.string(),
  tool_args: z.record(z.string(), z.unknown()),
  requires_confirmation: z.boolean(),
  confirmed: z.boolean().nullable(),
  confirmation_note: z.string().nullable(),
})

export const agentOSRequirementSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  tool_execution: agentOSToolExecutionSchema,
})

export const agentOSRunPausedEventSchema = agentOSBaseEventSchema.extend({
  event: z.literal("RunPaused"),
  content: z.string(),
  tools: z.array(agentOSToolExecutionSchema),
  requirements: z.array(agentOSRequirementSchema),
})

export const agentOSEventSchema = z.union([
  agentOSRunStartedEventSchema,
  agentOSModelRequestStartedEventSchema,
  agentOSRunContentEventSchema,
  agentOSToolCallStartedEventSchema,
  agentOSToolCallCompletedEventSchema,
  agentOSRunCompletedEventSchema,
  agentOSRunErrorEventSchema,
  agentOSRunPausedEventSchema,
  z.object({ event: z.string() }).catchall(z.unknown()), // fallback for unknown events
])

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
   * Custom headers to include in requests
   */
  headers?: Record<string, string>

  /**
   * Custom fetch implementation
   */
  fetch?: typeof fetch

  /**
   * Provider name for identification
   * @default "agentos"
   */
  name?: string
}

// ============================================================================
// Error Response Types
// ============================================================================

export interface AgentOSErrorResponse {
  detail: string
  error_code: string
}

export const agentOSErrorResponseSchema = z.object({
  detail: z.string(),
  error_code: z.string(),
})

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
