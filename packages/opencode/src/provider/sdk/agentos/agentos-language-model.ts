import {
  type LanguageModelV2,
  type LanguageModelV2CallWarning,
  type LanguageModelV2FinishReason,
  type LanguageModelV2StreamPart,
  type LanguageModelV2Usage,
  type LanguageModelV2Content,
} from "@ai-sdk/provider"
import { generateId } from "@ai-sdk/provider-utils"
import type {
  AgentOSClient,
  StreamEvent,
  RunStartedEvent,
  RunContentEvent,
  RunCompletedEvent,
  RunPausedEvent,
  RunErrorEvent,
  ToolCallStartedEvent,
  ToolCallCompletedEvent,
  ToolCallData,
} from "@worksofadam/agentos-sdk"
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
  getClient?: () => Promise<AgentOSClient>
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
   * Uses SDK client.agents.run() for synchronous agent communication.
   */
  async doGenerate(
    options: Parameters<LanguageModelV2["doGenerate"]>[0],
  ): Promise<Awaited<ReturnType<LanguageModelV2["doGenerate"]>>> {
    const warnings: LanguageModelV2CallWarning[] = []
    const content: LanguageModelV2Content[] = []
    let finishReason: LanguageModelV2FinishReason = "unknown"

    const userMessage = this.extractUserMessage(options.prompt)

    // Get SDK client
    if (!this.config.getClient) {
      throw new Error("AgentOS SDK client not configured")
    }
    const client = await this.config.getClient()

    // Use SDK for non-streaming run
    const result = await client.agents.run(this.modelId, {
      message: userMessage,
    })

    // Extract content from RunSchema result
    const responseContent = result.content
    if (responseContent) {
      const text = typeof responseContent === "string"
        ? responseContent
        : JSON.stringify(responseContent)
      content.push({ type: "text", text })
      finishReason = "stop"
    }

    // Extract usage from metrics if available
    const metrics = result.metrics as { input_tokens?: number; output_tokens?: number; total_tokens?: number } | undefined

    return {
      content,
      finishReason,
      usage: {
        inputTokens: metrics?.input_tokens,
        outputTokens: metrics?.output_tokens,
        totalTokens: metrics?.total_tokens,
      },
      request: { body: { message: userMessage } },
      response: { headers: {} },
      warnings,
    }
  }

  /**
   * Generate a streaming response.
   * Transforms AgentOS SDK AgentStream events to AI SDK stream parts.
   */
  async doStream(
    options: Parameters<LanguageModelV2["doStream"]>[0],
  ): Promise<Awaited<ReturnType<LanguageModelV2["doStream"]>>> {
    const warnings: LanguageModelV2CallWarning[] = []
    const userMessage = this.extractUserMessage(options.prompt)

    // Get SDK client
    if (!this.config.getClient) {
      throw new Error("AgentOS SDK client not configured")
    }
    const client = await this.config.getClient()

    // Use SDK to create streaming run
    const agentStream = await client.agents.runStream(this.modelId, {
      message: userMessage,
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

    // Convert SDK AgentStream (AsyncIterable) to ReadableStream for AI SDK
    const stream = new ReadableStream<LanguageModelV2StreamPart>({
      async start(controller) {
        controller.enqueue({ type: "stream-start", warnings })

        try {
          for await (const event of agentStream) {
            debugLog(`AgentOS event: ${event.event}`, event)

            switch (event.event) {
              case "RunStarted": {
                const e = event as RunStartedEvent
                runId = e.run_id || generateId()
                sessionId = e.session_id || null

                controller.enqueue({
                  type: "response-metadata",
                  id: runId,
                  timestamp: new Date((e.created_at || Date.now() / 1000) * 1000),
                  modelId: e.model || self.modelId,
                })
                break
              }

              case "RunContent": {
                const e = event as RunContentEvent
                const content = typeof e.content === "string" ? e.content : undefined
                if (content) {
                  if (!currentTextId) {
                    currentTextId = generateId()
                    controller.enqueue({ type: "text-start", id: currentTextId })
                  }
                  controller.enqueue({ type: "text-delta", id: currentTextId, delta: content })
                }

                const reasoningContent = e.reasoning_content
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
                const e = event as ToolCallStartedEvent
                const toolData = e.tool
                const toolName = toolData?.tool_name || "unknown"
                const toolArgs = toolData?.tool_args || {}

                debugLog(`ToolCallStarted: toolName=${toolName}`)

                // Close any open text part first
                if (currentTextId) {
                  controller.enqueue({ type: "text-end", id: currentTextId })
                  currentTextId = null
                }

                // Format tool call like MCP tools
                const argsStr = Object.entries(toolArgs)
                  .map(([k, v]) => {
                    const valueStr = typeof v === "string" ? v : JSON.stringify(v)
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
                debugLog(`ToolCallCompleted`)
                break
              }

              case "RunCompleted": {
                const e = event as RunCompletedEvent
                finishReason = "stop"

                // Extract usage from metrics if available
                if (e.metrics) {
                  usage.inputTokens = e.metrics.input_tokens
                  usage.outputTokens = e.metrics.output_tokens
                  usage.totalTokens = e.metrics.total_tokens
                }
                break
              }

              case "RunContentCompleted": {
                if (currentTextId) {
                  controller.enqueue({ type: "text-end", id: currentTextId })
                  currentTextId = null
                }
                break
              }

              case "RunPaused": {
                const e = event as RunPausedEvent
                debugLog("RunPaused event received", e)

                // Emit any remaining content before pause
                if (currentTextId) {
                  controller.enqueue({ type: "text-end", id: currentTextId })
                  currentTextId = null
                }

                // Build paused state for processor to handle
                // The SDK RunPausedEvent has tools?: ToolCallData[]
                // The API also returns requirements at the top level of the event
                // Access via index signature since SDK type may not include requirements
                const requirements = ((event as StreamEvent).requirements as AgentOSRequirement[] | undefined) || []
                const tools = (e.tools || []) as unknown as AgentOSPausedState["tools"]

                pausedState = {
                  runId: runId || generateId(),
                  sessionId: sessionId || "",
                  agentId: self.modelId,
                  requirements,
                  tools,
                }

                finishReason = "tool-calls"
                break
              }

              case "RunError": {
                const e = event as RunErrorEvent
                finishReason = "error"
                const errorMsg = (typeof e.content === "string" ? e.content : undefined) || "Unknown error"
                controller.enqueue({ type: "error", error: new Error(errorMsg) })
                break
              }

              // Informational events - no action needed
              case "ModelRequestStarted":
              case "ModelRequestCompleted":
              case "ModelResponseStarted":
              case "ModelResponseCompleted":
              case "ReasoningStarted":
              case "ReasoningCompleted":
              case "ParserModelResponseStarted":
              case "ParserModelResponseCompleted":
              case "OutputModelResponseStarted":
              case "OutputModelResponseCompleted": {
                debugLog(`Informational event: ${event.event}`)
                break
              }

              default: {
                debugLog(`Unknown AgentOS event type: ${event.event}`, event)
                break
              }
            }
          }
        } catch (err) {
          // If stream was aborted, don't enqueue error
          if (options.abortSignal?.aborted) {
            controller.close()
            return
          }
          controller.enqueue({ type: "error", error: err instanceof Error ? err : new Error(String(err)) })
        }

        // Close any open text part
        if (currentTextId) {
          controller.enqueue({ type: "text-end", id: currentTextId })
        }

        // Serialize pausedState for providerMetadata
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

        controller.close()
      },
    })

    return {
      stream,
      request: { body: { message: userMessage } },
      response: { headers: {} },
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
