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
  TeamRunStartedEvent,
  TeamRunContentEvent,
  TeamRunCompletedEvent,
  TeamRunErrorEvent,
  TeamToolCallStartedEvent,
  TeamToolCallCompletedEvent,
  RunStartedEvent,
  RunContentEvent,
  RunCompletedEvent,
  RunErrorEvent,
  ToolCallStartedEvent,
  ToolCallCompletedEvent,
} from "@worksofadam/agentos-sdk"
import type { TeamMemberInfo, TeamStreamState } from "./agentos-types"

/**
 * Configuration for the AgentOS team language model
 */
export interface AgentOSTeamConfig {
  provider: string
  getClient: () => Promise<AgentOSClient>
}

/**
 * AgentOS Team Language Model implementing the AI SDK LanguageModelV2 interface.
 *
 * This model communicates with AgentOS teams via the /teams/{team_id}/runs endpoint
 * and transforms the SSE streaming responses to AI SDK format.
 *
 * Each member delegation creates a separate text part with providerMetadata
 * containing teamMember info for the TUI to render as collapsible blocks.
 */
export class AgentOSTeamLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = "v2"
  readonly modelId: string
  private readonly teamId: string
  private readonly config: AgentOSTeamConfig
  readonly supportedUrls: Record<string, RegExp[]> = {}

  constructor(teamId: string, config: AgentOSTeamConfig) {
    this.teamId = teamId
    this.modelId = `team:${teamId}`
    this.config = config
  }

  get provider(): string {
    return this.config.provider
  }

  /**
   * Generate a non-streaming response.
   * Uses SDK client.teams.run() for synchronous team communication.
   */
  async doGenerate(
    options: Parameters<LanguageModelV2["doGenerate"]>[0],
  ): Promise<Awaited<ReturnType<LanguageModelV2["doGenerate"]>>> {
    const warnings: LanguageModelV2CallWarning[] = []
    const content: LanguageModelV2Content[] = []
    let finishReason: LanguageModelV2FinishReason = "unknown"

    const userMessage = this.extractUserMessage(options.prompt)
    const client = await this.config.getClient()

    const result = await client.teams.run(this.teamId, {
      message: userMessage,
    })

    const responseContent = result.content
    if (responseContent) {
      const text = typeof responseContent === "string"
        ? responseContent
        : JSON.stringify(responseContent)
      content.push({ type: "text", text })
      finishReason = "stop"
    }

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
   * Transforms AgentOS team SSE events to AI SDK stream parts.
   *
   * Each member delegation creates a separate text part with
   * providerMetadata.agentos.teamMember for the TUI to detect.
   */
  async doStream(
    options: Parameters<LanguageModelV2["doStream"]>[0],
  ): Promise<Awaited<ReturnType<LanguageModelV2["doStream"]>>> {
    const warnings: LanguageModelV2CallWarning[] = []
    const userMessage = this.extractUserMessage(options.prompt)
    const client = await this.config.getClient()

    const agentStream = await client.teams.runStream(this.teamId, {
      message: userMessage,
    })

    let finishReason: LanguageModelV2FinishReason = "unknown"
    const usage: LanguageModelV2Usage = {
      inputTokens: undefined,
      outputTokens: undefined,
      totalTokens: undefined,
    }

    const state: TeamStreamState = {
      teamId: this.teamId,
      runId: null,
      sessionId: null,
      currentMember: null,
      members: new Map(),
      memberText: new Map(),
    }

    let currentTextId: string | null = null
    let runCompleted = false
    let abortCleanup: (() => void) | null = null
    const self = this

    const stream = new ReadableStream<LanguageModelV2StreamPart>({
      async start(controller) {
        controller.enqueue({ type: "stream-start", warnings })

        try {
          for await (const event of agentStream) {
            const e = event as StreamEvent & Record<string, any>

            switch (e.event) {
              // ── Team-level events ──────────────────────────────

              case "TeamRunStarted": {
                const evt = e as TeamRunStartedEvent
                state.runId = evt.run_id || generateId()
                state.sessionId = evt.session_id || null

                controller.enqueue({
                  type: "response-metadata",
                  id: state.runId,
                  timestamp: new Date((evt.created_at || Date.now() / 1000) * 1000),
                  modelId: evt.model || self.modelId,
                })

                // Wire abort signal
                if (options.abortSignal && state.runId) {
                  const onAbort = () => {
                    if (runCompleted) return
                    self.cancelRun(state.runId!).catch(() => {})
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

              case "TeamRunContent": {
                const evt = e as TeamRunContentEvent
                const content = typeof evt.content === "string" ? evt.content : undefined
                if (content) {
                  // Team leader text — emit as regular text part (no member metadata)
                  if (!currentTextId || state.currentMember !== null) {
                    // Close any open member text part first
                    if (currentTextId) {
                      controller.enqueue({ type: "text-end", id: currentTextId })
                    }
                    currentTextId = generateId()
                    controller.enqueue({ type: "text-start", id: currentTextId })
                    state.currentMember = null
                  }
                  controller.enqueue({ type: "text-delta", id: currentTextId, delta: content })
                }
                break
              }

              case "TeamRunContentCompleted": {
                if (currentTextId) {
                  controller.enqueue({ type: "text-end", id: currentTextId })
                  currentTextId = null
                }
                break
              }

              case "TeamToolCallStarted": {
                const evt = e as TeamToolCallStartedEvent
                const toolData = evt.tool
                const toolName = toolData?.tool_name || "unknown"

                // Close any open text part
                if (currentTextId) {
                  controller.enqueue({ type: "text-end", id: currentTextId })
                  currentTextId = null
                }

                // Check if this is a delegation (delegate_task_to_member)
                if (toolName === "delegate_task_to_member") {
                  const memberId = toolData?.tool_args?.member_id as string | undefined
                  const task = toolData?.tool_args?.task as string | undefined
                  if (memberId) {
                    const memberInfo: TeamMemberInfo = {
                      id: memberId,
                      name: memberId,
                      status: "running",
                    }
                    state.currentMember = memberInfo
                    state.members.set(memberId, memberInfo)

                    // Open a new text part for this member with attribution metadata
                    currentTextId = generateId()
                    controller.enqueue({
                      type: "text-start",
                      id: currentTextId,
                      providerMetadata: {
                        agentos: {
                          teamMember: { name: memberId, id: memberId, ...(task ? { task } : {}) },
                        },
                      },
                    })
                  }
                } else {
                  // Non-delegation team tool call — format inline
                  const argsStr = Object.entries(toolData?.tool_args || {})
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
                }
                break
              }

              case "TeamToolCallCompleted": {
                // Delegation complete — close any member text part
                if (currentTextId && state.currentMember) {
                  controller.enqueue({ type: "text-end", id: currentTextId })
                  currentTextId = null

                  // Mark member completed
                  const member = state.currentMember
                  member.status = "completed"
                  state.members.set(member.id, member)
                  state.currentMember = null
                }
                break
              }

              case "TeamRunCompleted": {
                const evt = e as TeamRunCompletedEvent
                runCompleted = true
                finishReason = "stop"

                if (evt.metrics) {
                  usage.inputTokens = evt.metrics.input_tokens
                  usage.outputTokens = evt.metrics.output_tokens
                  usage.totalTokens = evt.metrics.total_tokens
                }
                break
              }

              case "TeamRunError": {
                const evt = e as TeamRunErrorEvent
                runCompleted = true
                finishReason = "error"
                const errorMsg = (typeof evt.content === "string" ? evt.content : undefined) || "Unknown error"
                controller.enqueue({ type: "error", error: new Error(errorMsg) })
                break
              }

              // ── Member-level events (no "Team" prefix) ─────────

              case "RunStarted": {
                const evt = e as RunStartedEvent
                const agentName = (e as any).agent_name || ""
                const agentId = (e as any).agent_id || ""

                // Update current member name if we know it
                if (state.currentMember && (agentName || agentId)) {
                  state.currentMember.name = agentName || agentId
                  state.currentMember.id = agentId || state.currentMember.id
                  state.members.set(state.currentMember.id, state.currentMember)

                  // Re-emit text-start with updated name (close old, open new)
                  if (currentTextId) {
                    controller.enqueue({ type: "text-end", id: currentTextId })
                    currentTextId = generateId()
                    controller.enqueue({
                      type: "text-start",
                      id: currentTextId,
                      providerMetadata: {
                        agentos: {
                          teamMember: {
                            name: state.currentMember.name,
                            id: state.currentMember.id,
                          },
                        },
                      },
                    })
                  }
                }
                break
              }

              case "RunContent": {
                const evt = e as RunContentEvent
                const content = typeof evt.content === "string" ? evt.content : undefined
                if (content && currentTextId) {
                  controller.enqueue({ type: "text-delta", id: currentTextId, delta: content })

                  // Accumulate member text for summary
                  if (state.currentMember) {
                    const prev = state.memberText.get(state.currentMember.id) || ""
                    state.memberText.set(state.currentMember.id, prev + content)
                  }
                }
                break
              }

              case "ToolCallStarted": {
                const evt = e as ToolCallStartedEvent
                const toolData = evt.tool
                const toolName = toolData?.tool_name || "unknown"
                const toolArgs = toolData?.tool_args || {}

                // Format member tool calls inline within the member block
                if (currentTextId) {
                  const argsStr = Object.entries(toolArgs)
                    .map(([k, v]) => {
                      const valueStr = typeof v === "string" ? v : JSON.stringify(v)
                      const truncated = valueStr.length > 50 ? valueStr.slice(0, 47) + "..." : valueStr
                      return `${k}=${truncated}`
                    })
                    .join(", ")

                  controller.enqueue({
                    type: "text-delta",
                    id: currentTextId,
                    delta: `\n⚙ \`${toolName}\`${argsStr ? ` ${argsStr}` : ""}\n`,
                  })
                }
                break
              }

              case "ToolCallCompleted": {
                break
              }

              case "RunCompleted": {
                // Member run completed — keep the text part open until
                // TeamToolCallCompleted closes the delegation boundary
                break
              }

              case "RunError": {
                const evt = e as RunErrorEvent
                if (state.currentMember) {
                  state.currentMember.status = "error"
                }
                if (currentTextId) {
                  const errorMsg = (typeof evt.content === "string" ? evt.content : undefined) || "Member error"
                  controller.enqueue({
                    type: "text-delta",
                    id: currentTextId,
                    delta: `\n**Error:** ${errorMsg}\n`,
                  })
                }
                break
              }

              // Informational events — no action needed
              case "RunContentCompleted":
              case "TeamRunIntermediateContent":
              case "TeamPreHookStarted":
              case "TeamPreHookCompleted":
              case "TeamPostHookStarted":
              case "TeamPostHookCompleted":
              case "TeamReasoningStarted":
              case "TeamReasoningStep":
              case "TeamReasoningCompleted":
              case "TeamMemoryUpdateStarted":
              case "TeamMemoryUpdateCompleted":
              case "TeamSessionSummaryStarted":
              case "TeamSessionSummaryCompleted":
              case "TeamParserModelResponseStarted":
              case "TeamParserModelResponseCompleted":
              case "TeamOutputModelResponseStarted":
              case "TeamOutputModelResponseCompleted":
              case "TeamCustomEvent":
              case "TeamRunCancelled":
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
          if (options.abortSignal?.aborted) {
            controller.close()
            return
          }
          controller.enqueue({ type: "error", error: err instanceof Error ? err : new Error(String(err)) })
        }

        // Clean up
        abortCleanup?.()

        // Close any open text part
        if (currentTextId) {
          controller.enqueue({ type: "text-end", id: currentTextId })
        }

        // Build member responses summary for providerMetadata
        const memberResponses = Array.from(state.members.entries()).map(([id, info]) => ({
          id,
          name: info.name,
          status: info.status,
          textLength: state.memberText.get(id)?.length || 0,
        }))

        controller.enqueue({
          type: "finish",
          finishReason,
          usage,
          providerMetadata: {
            agentos: {
              runId: state.runId,
              sessionId: state.sessionId,
              isTeam: true,
              memberResponses,
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
    for (let i = prompt.length - 1; i >= 0; i--) {
      const message = prompt[i]
      if (message.role === "user") {
        if (typeof message.content === "string") {
          return message.content
        }
        if (Array.isArray(message.content)) {
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
   * Cancel an active team run using SDK client.teams.cancel().
   */
  async cancelRun(runId: string): Promise<void> {
    const client = await this.config.getClient()
    await client.teams.cancel(this.teamId, runId)
  }
}
