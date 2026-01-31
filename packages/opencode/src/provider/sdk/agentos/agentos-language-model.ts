import {
  type LanguageModelV2,
  type LanguageModelV2CallWarning,
  type LanguageModelV2FinishReason,
  type LanguageModelV2StreamPart,
  type LanguageModelV2Usage,
  type LanguageModelV2Content,
} from "@ai-sdk/provider"
import { generateId } from "@ai-sdk/provider-utils"
import type { AgentOSEvent, AgentOSPausedState, AgentOSRequirement } from "./agentos-types"
import { appendFileSync } from "fs"
import { join } from "path"

// Debug log file path - writes to user's home directory
const DEBUG_LOG_PATH = join(process.env.HOME || "/tmp", ".agentos-debug.log")

function debugLog(message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  const logLine = data ? `[${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}\n` : `[${timestamp}] ${message}\n`
  try {
    appendFileSync(DEBUG_LOG_PATH, logLine)
  } catch {
    // Ignore write errors
  }
}

/**
 * Configuration for the AgentOS language model
 */
export interface AgentOSConfig {
  provider: string
  baseURL: string
  apiKey?: string
  headers?: Record<string, string> | (() => Record<string, string>)
  fetch?: typeof fetch
}

/**
 * AgentOS Language Model implementing the AI SDK LanguageModelV2 interface.
 *
 * This model communicates with AgentOS agents via the /agents/{agent_id}/runs endpoint
 * and transforms the SSE streaming responses to AI SDK format.
 */
export class AgentOSLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = "v2"

  /**
   * The agent ID (used as model ID in the AI SDK)
   */
  readonly modelId: string

  private readonly config: AgentOSConfig

  /**
   * Supported URL patterns for different content types.
   * AgentOS agents may support file attachments.
   */
  readonly supportedUrls: Record<string, RegExp[]> = {}

  constructor(agentId: string, config: AgentOSConfig) {
    this.modelId = agentId
    this.config = config
  }

  get provider(): string {
    return this.config.provider
  }

  /**
   * Generate a non-streaming response.
   * Collects all streaming events and returns the final result.
   */
  async doGenerate(
    options: Parameters<LanguageModelV2["doGenerate"]>[0],
  ): Promise<Awaited<ReturnType<LanguageModelV2["doGenerate"]>>> {
    const warnings: LanguageModelV2CallWarning[] = []
    const content: LanguageModelV2Content[] = []
    let finishReason: LanguageModelV2FinishReason = "unknown"

    // Extract the user message from the prompt
    const userMessage = this.extractUserMessage(options.prompt)

    const { responseHeaders, response } = await this.makeNonStreamingRequest({
      agentId: this.modelId,
      message: userMessage,
      headers: options.headers,
      abortSignal: options.abortSignal,
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (response.content) {
      content.push({
        type: "text",
        text: response.content,
      })
      finishReason = "stop"
    }

    return {
      content,
      finishReason,
      usage: {
        inputTokens: undefined,
        outputTokens: undefined,
        totalTokens: undefined,
      },
      request: { body: { message: userMessage } },
      response: {
        headers: responseHeaders,
      },
      warnings,
    }
  }

  /**
   * Generate a streaming response.
   * Transforms AgentOS SSE events to AI SDK stream parts.
   */
  async doStream(
    options: Parameters<LanguageModelV2["doStream"]>[0],
  ): Promise<Awaited<ReturnType<LanguageModelV2["doStream"]>>> {
    const warnings: LanguageModelV2CallWarning[] = []

    // Extract the user message from the prompt
    const userMessage = this.extractUserMessage(options.prompt)

    const { responseHeaders, body } = await this.makeStreamingRequest({
      agentId: this.modelId,
      message: userMessage,
      headers: options.headers,
      abortSignal: options.abortSignal,
    })

    let finishReason: LanguageModelV2FinishReason = "unknown"
    const usage: LanguageModelV2Usage = {
      inputTokens: undefined,
      outputTokens: undefined,
      totalTokens: undefined,
    }

    let runId: string | null = null
    let sessionId: string | null = null
    let currentTextId: string | null = null
    let pausedState: AgentOSPausedState | null = null

    const self = this

    // Create a readable stream from the response body
    const textStream = body.pipeThrough(new TextDecoderStream() as unknown as TransformStream<Uint8Array, string>)

    return {
      stream: textStream
        .pipeThrough(this.createSSEParser())
        .pipeThrough(
          new TransformStream<AgentOSEvent, LanguageModelV2StreamPart>({
            start(controller) {
              controller.enqueue({ type: "stream-start", warnings })
            },

            transform(event, controller) {
              // Helper to get field with snake_case or camelCase
              const getField = (obj: Record<string, unknown>, snakeCase: string, camelCase: string) => {
                return obj[snakeCase] ?? obj[camelCase]
              }

              const eventType = event.event
              const eventObj = event as unknown as Record<string, unknown>

              // Log all events for debugging
              debugLog(`AgentOS event: ${eventType}`, eventObj)

              switch (eventType) {
                case "RunStarted": {
                  runId = (getField(eventObj, "run_id", "runId") as string) || generateId()
                  sessionId = (getField(eventObj, "session_id", "sessionId") as string) || null

                  controller.enqueue({
                    type: "response-metadata",
                    id: runId,
                    timestamp: new Date(((eventObj.created_at as number) || Date.now() / 1000) * 1000),
                    modelId: (eventObj.model as string) || self.modelId,
                  })
                  break
                }

                case "RunContent": {
                  // Handle text content
                  const content = eventObj.content as string | undefined
                  if (content) {
                    if (!currentTextId) {
                      currentTextId = generateId()
                      controller.enqueue({
                        type: "text-start",
                        id: currentTextId,
                      })
                    }

                    controller.enqueue({
                      type: "text-delta",
                      id: currentTextId,
                      delta: content,
                    })
                  }

                  // Handle reasoning content
                  const reasoningContent = getField(eventObj, "reasoning_content", "reasoningContent") as
                    | string
                    | undefined
                  if (reasoningContent) {
                    controller.enqueue({
                      type: "reasoning-delta",
                      id: `${runId}:reasoning`,
                      delta: reasoningContent,
                    })
                  }
                  break
                }

                case "ToolCallStarted": {
                  // Tool info can be at top level or nested in 'tool' object
                  const toolObj = (eventObj.tool as Record<string, unknown>) || eventObj
                  const toolName =
                    (getField(toolObj, "tool_name", "toolName") as string) || (toolObj.name as string) || "unknown"
                  const toolArgs =
                    (getField(toolObj, "tool_args", "toolArgs") as Record<string, unknown>) ||
                    (toolObj.args as Record<string, unknown>) ||
                    {}

                  debugLog(`ToolCallStarted: toolName=${toolName}`)

                  // Close any open text part first
                  if (currentTextId) {
                    controller.enqueue({ type: "text-end", id: currentTextId })
                    currentTextId = null
                  }

                  // Format tool call like MCP tools: ⚙ tool_name param=value, ...
                  // Use backticks for the tool name to get code styling
                  const argsStr = Object.entries(toolArgs)
                    .map(([k, v]) => {
                      const valueStr = typeof v === "string" ? v : JSON.stringify(v)
                      // Truncate long values
                      const truncated = valueStr.length > 50 ? valueStr.slice(0, 47) + "..." : valueStr
                      return `${k}=${truncated}`
                    })
                    .join(", ")

                  const toolTextId = generateId()
                  controller.enqueue({ type: "text-start", id: toolTextId })
                  controller.enqueue({
                    type: "text-delta",
                    id: toolTextId,
                    delta: `\n⚙ \`${toolName}\`${argsStr ? ` ${argsStr}` : ""}\n`,
                  })
                  controller.enqueue({ type: "text-end", id: toolTextId })
                  break
                }

                case "ToolCallCompleted": {
                  // Tool executed on the AgentOS server - no need to emit anything
                  // The agent will continue streaming with the result
                  debugLog(`ToolCallCompleted`)
                  break
                }

                case "RunCompleted": {
                  finishReason = "stop"
                  break
                }

                case "RunContentCompleted": {
                  // Content stream finished - close any open text part
                  if (currentTextId) {
                    controller.enqueue({
                      type: "text-end",
                      id: currentTextId,
                    })
                    currentTextId = null
                  }
                  break
                }

                case "ModelRequestStarted":
                case "ModelRequestCompleted":
                case "ModelResponseStarted":
                case "ModelResponseCompleted":
                case "ReasoningStarted":
                case "ReasoningCompleted": {
                  // These are informational events - no action needed
                  debugLog(`Informational event: ${eventType}`)
                  break
                }

                case "RunPaused": {
                  debugLog("RunPaused event received", eventObj)

                  // Emit any content before pause
                  const pauseContent = eventObj.content as string | undefined
                  if (pauseContent && currentTextId) {
                    controller.enqueue({ type: "text-delta", id: currentTextId, delta: pauseContent })
                  }
                  if (currentTextId) {
                    controller.enqueue({ type: "text-end", id: currentTextId })
                    currentTextId = null
                  }

                  // Store pause state for processor to handle
                  pausedState = {
                    runId: runId || generateId(),
                    sessionId: sessionId || "",
                    agentId: self.modelId,
                    requirements: (eventObj.requirements as AgentOSRequirement[]) || [],
                    tools: (eventObj.tools as AgentOSPausedState["tools"]) || [],
                  }

                  // Signal that tools need handling (triggers processor to check providerMetadata)
                  finishReason = "tool-calls"
                  break
                }

                case "RunError": {
                  finishReason = "error"
                  const errorMsg = (eventObj.error as string) || "Unknown error"
                  controller.enqueue({
                    type: "error",
                    error: new Error(errorMsg),
                  })
                  break
                }

                default: {
                  // Log unknown events for debugging
                  debugLog(`Unknown AgentOS event type: ${eventType}`, eventObj)
                  break
                }
              }
            },

            flush(controller) {
              debugLog("Stream flush called", { currentTextId, finishReason, runId, sessionId, pausedState })

              // Close any open text part
              if (currentTextId) {
                controller.enqueue({
                  type: "text-end",
                  id: currentTextId,
                })
              }

              // Serialize pausedState to JSON-compatible format for providerMetadata
              const serializedPausedState = pausedState
                ? JSON.parse(JSON.stringify(pausedState))
                : null

              controller.enqueue({
                type: "finish",
                finishReason,
                usage,
                providerMetadata: {
                  agentos: {
                    runId,
                    sessionId,
                    pausedState: serializedPausedState,
                  },
                },
              })
            },
          }),
        ),
      request: { body: { message: userMessage } },
      response: { headers: responseHeaders },
    }
  }

  /**
   * Extract the user message from the AI SDK prompt format
   */
  private extractUserMessage(
    prompt: Parameters<LanguageModelV2["doGenerate"]>[0]["prompt"],
  ): string {
    // Find the last user message
    for (let i = prompt.length - 1; i >= 0; i--) {
      const message = prompt[i]
      if (message.role === "user") {
        // Handle both string content and array content
        if (typeof message.content === "string") {
          return message.content
        }
        if (Array.isArray(message.content)) {
          // Find text parts and concatenate them
          const textParts = message.content
            .filter((part): part is { type: "text"; text: string } => part.type === "text")
            .map((part) => part.text)
          return textParts.join("\n")
        }
      }
    }

    return ""
  }

  /**
   * Build headers for the request
   */
  private buildHeaders(additionalHeaders?: Record<string, string | undefined>): Record<string, string> {
    const configHeaders =
      typeof this.config.headers === "function" ? this.config.headers() : this.config.headers ?? {}

    const headers: Record<string, string> = { ...configHeaders }

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`
    }

    if (additionalHeaders) {
      for (const [key, value] of Object.entries(additionalHeaders)) {
        if (value !== undefined) {
          headers[key] = value
        }
      }
    }

    return headers
  }

  /**
   * Make a streaming request to the AgentOS API
   */
  private async makeStreamingRequest(options: {
    agentId: string
    message: string
    sessionId?: string
    userId?: string
    headers?: Record<string, string | undefined>
    abortSignal?: AbortSignal
  }): Promise<{ responseHeaders: Record<string, string>; body: ReadableStream<Uint8Array> }> {
    const url = `${this.config.baseURL}/agents/${options.agentId}/runs`

    // Build form data (AgentOS uses multipart/form-data)
    const formData = new FormData()
    formData.append("message", options.message)
    formData.append("stream", "true")

    if (options.sessionId) {
      formData.append("session_id", options.sessionId)
    }
    if (options.userId) {
      formData.append("user_id", options.userId)
    }

    const headers = this.buildHeaders(options.headers)
    const fetchFn = this.config.fetch ?? fetch

    const response = await fetchFn(url, {
      method: "POST",
      headers,
      body: formData,
      signal: options.abortSignal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `AgentOS API error: ${response.status} ${response.statusText}`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.detail) {
          // Handle detail being either a string or an object
          const detail =
            typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail)
          errorMessage = `AgentOS API error: ${detail}`
        }
      } catch {
        if (errorText) {
          errorMessage = `AgentOS API error: ${errorText}`
        }
      }
      throw new Error(errorMessage)
    }

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    if (!response.body) {
      throw new Error("No response body received from AgentOS API")
    }

    return {
      responseHeaders,
      body: response.body,
    }
  }

  /**
   * Make a non-streaming request to the AgentOS API
   */
  private async makeNonStreamingRequest(options: {
    agentId: string
    message: string
    sessionId?: string
    userId?: string
    headers?: Record<string, string | undefined>
    abortSignal?: AbortSignal
  }): Promise<{
    responseHeaders: Record<string, string>
    response: {
      content?: string
      run_id?: string
      session_id?: string
      error?: string
    }
  }> {
    const url = `${this.config.baseURL}/agents/${options.agentId}/runs`

    // Build form data (AgentOS uses multipart/form-data)
    const formData = new FormData()
    formData.append("message", options.message)
    formData.append("stream", "false")

    if (options.sessionId) {
      formData.append("session_id", options.sessionId)
    }
    if (options.userId) {
      formData.append("user_id", options.userId)
    }

    const headers = this.buildHeaders(options.headers)
    const fetchFn = this.config.fetch ?? fetch

    const fetchResponse = await fetchFn(url, {
      method: "POST",
      headers,
      body: formData,
      signal: options.abortSignal,
    })

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text()
      let errorMessage = `AgentOS API error: ${fetchResponse.status} ${fetchResponse.statusText}`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.detail) {
          // Handle detail being either a string or an object
          const detail =
            typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail)
          errorMessage = `AgentOS API error: ${detail}`
        }
      } catch {
        if (errorText) {
          errorMessage = `AgentOS API error: ${errorText}`
        }
      }
      throw new Error(errorMessage)
    }

    const responseHeaders: Record<string, string> = {}
    fetchResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const response = (await fetchResponse.json()) as {
      content?: string
      run_id?: string
      session_id?: string
      error?: string
    }

    return {
      responseHeaders,
      response,
    }
  }

  /**
   * Make a continue request to resume a paused run after tool confirmation.
   * Returns the raw response body stream for further processing.
   */
  async makeContinueRequest(options: {
    runId: string
    sessionId: string
    requirements: AgentOSRequirement[]
    headers?: Record<string, string | undefined>
    abortSignal?: AbortSignal
  }): Promise<{ responseHeaders: Record<string, string>; body: ReadableStream<Uint8Array> }> {
    const url = `${this.config.baseURL}/agents/${this.modelId}/runs/${options.runId}/continue`

    const headers = this.buildHeaders(options.headers)
    // Don't set Content-Type - let FormData set it with boundary

    const fetchFn = this.config.fetch ?? fetch

    // Build tools array from requirements - pass full tool_execution objects
    // The API expects all fields, not just the confirmation fields
    const tools = options.requirements.map((req) => req.tool_execution)

    debugLog("makeContinueRequest", {
      url,
      sessionId: options.sessionId,
      tools,
    })

    // Use FormData like the run endpoint
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
      const errorText = await response.text()
      let errorMessage = `AgentOS API error: ${response.status} ${response.statusText}`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.detail) {
          // Handle detail being either a string or an object
          const detail =
            typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail)
          errorMessage = `AgentOS API error: ${detail}`
        }
      } catch {
        if (errorText) {
          errorMessage = `AgentOS API error: ${errorText}`
        }
      }
      throw new Error(errorMessage)
    }

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    if (!response.body) {
      throw new Error("No response body received from AgentOS continue API")
    }

    return {
      responseHeaders,
      body: response.body,
    }
  }

  /**
   * Process a continue stream and return the accumulated text content.
   * This consumes the SSE stream and collects all text from RunContent events.
   */
  async processContinueStream(options: {
    body: ReadableStream<Uint8Array>
    abortSignal?: AbortSignal
  }): Promise<{
    text: string
    toolResults: Array<{ toolName: string; toolCallId: string; result: unknown }>
    usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number }
  }> {
    const textDecoder = new TextDecoderStream()
    const textStream = options.body.pipeThrough(textDecoder as unknown as TransformStream<Uint8Array, string>)
    const eventStream = textStream.pipeThrough(this.createSSEParser())

    const reader = eventStream.getReader()
    let text = ""
    const toolResults: Array<{ toolName: string; toolCallId: string; result: unknown }> = []
    const usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number } = {}

    try {
      while (true) {
        if (options.abortSignal?.aborted) {
          break
        }

        const { done, value } = await reader.read()
        if (done) break

        const event = value as AgentOSEvent
        debugLog("Continue stream event", event)

        switch (event.event) {
          case "RunContent": {
            const content = (event as unknown as { content: string }).content
            if (content) {
              text += content
            }
            break
          }

          case "ToolCallCompleted": {
            const toolEvent = event as unknown as {
              tool_call_id: string
              tool_name: string
              result: unknown
            }
            toolResults.push({
              toolName: toolEvent.tool_name,
              toolCallId: toolEvent.tool_call_id,
              result: toolEvent.result,
            })
            break
          }

          case "ModelRequestCompleted": {
            const usageEvent = event as unknown as {
              input_tokens?: number
              output_tokens?: number
              total_tokens?: number
            }
            usage.inputTokens = usageEvent.input_tokens
            usage.outputTokens = usageEvent.output_tokens
            usage.totalTokens = usageEvent.total_tokens
            break
          }

          case "RunCompleted":
            debugLog("Continue stream completed")
            break
        }
      }
    } finally {
      reader.releaseLock()
    }

    debugLog("Continue stream processed", { textLength: text.length, toolResultsCount: toolResults.length, usage })

    return { text, toolResults, usage }
  }

  /**
   * Create a TransformStream that parses SSE events from a text stream
   */
  private createSSEParser(): TransformStream<string, AgentOSEvent> {
    let buffer = ""

    return new TransformStream<string, AgentOSEvent>({
      transform(chunk, controller) {
        buffer += chunk

        // Split on double newlines (SSE event delimiter)
        const events = buffer.split("\n\n")

        // Keep the last part in buffer (it might be incomplete)
        buffer = events.pop() || ""

        for (const eventText of events) {
          if (!eventText.trim()) continue

          let eventData = ""

          for (const line of eventText.split("\n")) {
            if (line.startsWith("data:")) {
              eventData = line.slice(5).trim()
            }
            // event: line is present but we get event type from the data JSON
          }

          if (eventData) {
            try {
              const parsed = JSON.parse(eventData) as AgentOSEvent
              controller.enqueue(parsed)
            } catch {
              // Skip malformed JSON
              console.warn("Failed to parse AgentOS SSE event:", eventData)
            }
          }
        }
      },

      flush(controller) {
        // Process any remaining buffer content
        if (buffer.trim()) {
          const lines = buffer.split("\n")
          let eventData = ""

          for (const line of lines) {
            if (line.startsWith("data:")) {
              eventData = line.slice(5).trim()
            }
          }

          if (eventData) {
            try {
              const parsed = JSON.parse(eventData) as AgentOSEvent
              controller.enqueue(parsed)
            } catch {
              // Skip malformed JSON
            }
          }
        }
      },
    })
  }
}
