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
  AgentStream,
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
import type { AgentOSPausedState, AgentOSRequirement } from "./agentos-types"

/**
 * Configuration for the AgentOS language model
 */
export interface AgentOSConfig {
  provider: string
  getClient: () => Promise<AgentOSClient>
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
    let runCompleted = false
    let abortCleanup: (() => void) | null = null

    const self = this

    // Convert SDK AgentStream (AsyncIterable) to ReadableStream for AI SDK
    const stream = new ReadableStream<LanguageModelV2StreamPart>({
      async start(controller) {
        controller.enqueue({ type: "stream-start", warnings })

        try {
          for await (const event of agentStream) {
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

                // Wire abort signal to cancel run (only if still in progress)
                if (options.abortSignal && runId) {
                  const onAbort = () => {
                    if (runCompleted) return
                    self.cancelRun(runId!).catch(() => {
                      // Cancel is best-effort
                    })
                  }
                  if (options.abortSignal.aborted) {
                    onAbort()
                  } else {
                    options.abortSignal.addEventListener("abort", onAbort, { once: true })
                    abortCleanup = () => options.abortSignal!.removeEventListener("abort", onAbort)
                  }
                }
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
                break
              }

              case "RunCompleted": {
                const e = event as RunCompletedEvent
                runCompleted = true
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
                runCompleted = true

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
                runCompleted = true
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
                break
              }

              default: {
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

        // Clean up abort listener since run is done
        abortCleanup?.()

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
   * Continue a paused run after tool confirmation using SDK client.agents.continue().
   */
  async continueRun(options: {
    runId: string
    sessionId: string
    requirements: AgentOSRequirement[]
    abortSignal?: AbortSignal
  }): Promise<{
    text: string
    toolResults: Array<{ toolName: string; toolCallId: string; result: unknown }>
    usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number }
  }> {
    const client = await this.config.getClient()

    // Build tools JSON from requirements (pass full tool_execution objects)
    const tools = options.requirements.map((req) => req.tool_execution)
    const toolsJSON = JSON.stringify(tools)

    // Use SDK continue method (returns AgentStream when streaming)
    const stream = (await client.agents.continue(this.modelId, options.runId, {
      tools: toolsJSON,
      sessionId: options.sessionId,
      stream: true,
    })) as AgentStream

    // Accumulate results from stream (same pattern as doStream event handling)
    let text = ""
    const toolResults: Array<{ toolName: string; toolCallId: string; result: unknown }> = []
    const usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number } = {}

    for await (const event of stream) {
      if (options.abortSignal?.aborted) break

      switch (event.event) {
        case "RunContent": {
          const e = event as RunContentEvent
          const content = typeof e.content === "string" ? e.content : undefined
          if (content) text += content
          break
        }
        case "ToolCallCompleted": {
          const e = event as ToolCallCompletedEvent
          const toolData = e.tool
          if (toolData) {
            toolResults.push({
              toolName: toolData.tool_name,
              toolCallId: toolData.tool_call_id,
              result: toolData.result,
            })
          }
          break
        }
        case "RunCompleted": {
          const e = event as RunCompletedEvent
          if (e.metrics) {
            usage.inputTokens = e.metrics.input_tokens
            usage.outputTokens = e.metrics.output_tokens
            usage.totalTokens = e.metrics.total_tokens
          }
          break
        }
        case "RunError": {
          const e = event as RunErrorEvent
          const errorMsg = (typeof e.content === "string" ? e.content : undefined) || "Unknown error"
          throw new Error(`AgentOS continue error: ${errorMsg}`)
        }
      }
    }

    return { text, toolResults, usage }
  }

  /**
   * Cancel an active run using SDK client.agents.cancel().
   */
  async cancelRun(runId: string): Promise<void> {
    const client = await this.config.getClient()
    await client.agents.cancel(this.modelId, runId)
  }
}
