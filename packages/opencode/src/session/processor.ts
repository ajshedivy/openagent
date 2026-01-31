import { MessageV2 } from "./message-v2"
import { Log } from "@/util/log"
import { Identifier } from "@/id/id"
import { Session } from "."
import { Agent } from "@/agent/agent"
import { Snapshot } from "@/snapshot"
import { SessionSummary } from "./summary"
import { Bus } from "@/bus"
import { SessionRetry } from "./retry"
import { SessionStatus } from "./status"
import { Plugin } from "@/plugin"
import type { Provider } from "@/provider/provider"
import { LLM } from "./llm"
import { Config } from "@/config/config"
import { SessionCompaction } from "./compaction"
import { PermissionNext } from "@/permission/next"
import { Question } from "@/question"
import type { AgentOSPausedState } from "@/provider/sdk/agentos/agentos-types"

export namespace SessionProcessor {
  const DOOM_LOOP_THRESHOLD = 3
  const log = Log.create({ service: "session.processor" })

  export type Info = Awaited<ReturnType<typeof create>>
  export type Result = Awaited<ReturnType<Info["process"]>>

  export function create(input: {
    assistantMessage: MessageV2.Assistant
    sessionID: string
    model: Provider.Model
    abort: AbortSignal
  }) {
    const toolcalls: Record<string, MessageV2.ToolPart> = {}
    let snapshot: string | undefined
    let blocked = false
    let attempt = 0
    let needsCompaction = false
    let agentOSPausedState: AgentOSPausedState | null = null

    const result = {
      get message() {
        return input.assistantMessage
      },
      partFromToolCall(toolCallID: string) {
        return toolcalls[toolCallID]
      },
      async process(streamInput: LLM.StreamInput) {
        log.info("process")
        needsCompaction = false
        const shouldBreak = (await Config.get()).experimental?.continue_loop_on_deny !== true
        while (true) {
          try {
            let currentText: MessageV2.TextPart | undefined
            let reasoningMap: Record<string, MessageV2.ReasoningPart> = {}
            const stream = await LLM.stream(streamInput)

            for await (const value of stream.fullStream) {
              input.abort.throwIfAborted()
              switch (value.type) {
                case "start":
                  SessionStatus.set(input.sessionID, { type: "busy" })
                  break

                case "reasoning-start":
                  if (value.id in reasoningMap) {
                    continue
                  }
                  reasoningMap[value.id] = {
                    id: Identifier.ascending("part"),
                    messageID: input.assistantMessage.id,
                    sessionID: input.assistantMessage.sessionID,
                    type: "reasoning",
                    text: "",
                    time: {
                      start: Date.now(),
                    },
                    metadata: value.providerMetadata,
                  }
                  break

                case "reasoning-delta":
                  if (value.id in reasoningMap) {
                    const part = reasoningMap[value.id]
                    part.text += value.text
                    if (value.providerMetadata) part.metadata = value.providerMetadata
                    if (part.text) await Session.updatePart({ part, delta: value.text })
                  }
                  break

                case "reasoning-end":
                  if (value.id in reasoningMap) {
                    const part = reasoningMap[value.id]
                    part.text = part.text.trimEnd()

                    part.time = {
                      ...part.time,
                      end: Date.now(),
                    }
                    if (value.providerMetadata) part.metadata = value.providerMetadata
                    await Session.updatePart(part)
                    delete reasoningMap[value.id]
                  }
                  break

                case "tool-input-start":
                  const part = await Session.updatePart({
                    id: toolcalls[value.id]?.id ?? Identifier.ascending("part"),
                    messageID: input.assistantMessage.id,
                    sessionID: input.assistantMessage.sessionID,
                    type: "tool",
                    tool: value.toolName,
                    callID: value.id,
                    state: {
                      status: "pending",
                      input: {},
                      raw: "",
                    },
                  })
                  toolcalls[value.id] = part as MessageV2.ToolPart
                  break

                case "tool-input-delta":
                  break

                case "tool-input-end":
                  break

                case "tool-call": {
                  const match = toolcalls[value.toolCallId]
                  if (match) {
                    const part = await Session.updatePart({
                      ...match,
                      tool: value.toolName,
                      state: {
                        status: "running",
                        input: value.input,
                        time: {
                          start: Date.now(),
                        },
                      },
                      metadata: value.providerMetadata,
                    })
                    toolcalls[value.toolCallId] = part as MessageV2.ToolPart

                    const parts = await MessageV2.parts(input.assistantMessage.id)
                    const lastThree = parts.slice(-DOOM_LOOP_THRESHOLD)

                    if (
                      lastThree.length === DOOM_LOOP_THRESHOLD &&
                      lastThree.every(
                        (p) =>
                          p.type === "tool" &&
                          p.tool === value.toolName &&
                          p.state.status !== "pending" &&
                          JSON.stringify(p.state.input) === JSON.stringify(value.input),
                      )
                    ) {
                      const agent = await Agent.get(input.assistantMessage.agent)
                      await PermissionNext.ask({
                        permission: "doom_loop",
                        patterns: [value.toolName],
                        sessionID: input.assistantMessage.sessionID,
                        metadata: {
                          tool: value.toolName,
                          input: value.input,
                        },
                        always: [value.toolName],
                        ruleset: agent.permission,
                      })
                    }
                  }
                  break
                }
                case "tool-result": {
                  const match = toolcalls[value.toolCallId]
                  if (match && match.state.status === "running") {
                    await Session.updatePart({
                      ...match,
                      state: {
                        status: "completed",
                        input: value.input ?? match.state.input,
                        output: value.output.output,
                        metadata: value.output.metadata,
                        title: value.output.title,
                        time: {
                          start: match.state.time.start,
                          end: Date.now(),
                        },
                        attachments: value.output.attachments,
                      },
                    })

                    delete toolcalls[value.toolCallId]
                  }
                  break
                }

                case "tool-error": {
                  const match = toolcalls[value.toolCallId]
                  if (match && match.state.status === "running") {
                    await Session.updatePart({
                      ...match,
                      state: {
                        status: "error",
                        input: value.input ?? match.state.input,
                        error: (value.error as any).toString(),
                        time: {
                          start: match.state.time.start,
                          end: Date.now(),
                        },
                      },
                    })

                    if (
                      value.error instanceof PermissionNext.RejectedError ||
                      value.error instanceof Question.RejectedError
                    ) {
                      blocked = shouldBreak
                    }
                    delete toolcalls[value.toolCallId]
                  }
                  break
                }
                case "error":
                  throw value.error

                case "start-step":
                  snapshot = await Snapshot.track()
                  await Session.updatePart({
                    id: Identifier.ascending("part"),
                    messageID: input.assistantMessage.id,
                    sessionID: input.sessionID,
                    snapshot,
                    type: "step-start",
                  })
                  break

                case "finish-step":
                  const usage = Session.getUsage({
                    model: input.model,
                    usage: value.usage,
                    metadata: value.providerMetadata,
                  })
                  input.assistantMessage.finish = value.finishReason
                  input.assistantMessage.cost += usage.cost
                  input.assistantMessage.tokens = usage.tokens
                  await Session.updatePart({
                    id: Identifier.ascending("part"),
                    reason: value.finishReason,
                    snapshot: await Snapshot.track(),
                    messageID: input.assistantMessage.id,
                    sessionID: input.assistantMessage.sessionID,
                    type: "step-finish",
                    tokens: usage.tokens,
                    cost: usage.cost,
                  })
                  await Session.updateMessage(input.assistantMessage)
                  if (snapshot) {
                    const patch = await Snapshot.patch(snapshot)
                    if (patch.files.length) {
                      await Session.updatePart({
                        id: Identifier.ascending("part"),
                        messageID: input.assistantMessage.id,
                        sessionID: input.sessionID,
                        type: "patch",
                        hash: patch.hash,
                        files: patch.files,
                      })
                    }
                    snapshot = undefined
                  }
                  SessionSummary.summarize({
                    sessionID: input.sessionID,
                    messageID: input.assistantMessage.parentID,
                  })
                  if (await SessionCompaction.isOverflow({ tokens: usage.tokens, model: input.model })) {
                    needsCompaction = true
                  }
                  // Check for AgentOS paused state (tool confirmation required)
                  if (value.providerMetadata?.agentos?.pausedState) {
                    agentOSPausedState = value.providerMetadata.agentos.pausedState as unknown as AgentOSPausedState
                    log.info("AgentOS run paused for tool confirmation", {
                      runId: agentOSPausedState.runId,
                      toolCount: agentOSPausedState.requirements.length,
                    })
                  }
                  break

                case "text-start":
                  currentText = {
                    id: Identifier.ascending("part"),
                    messageID: input.assistantMessage.id,
                    sessionID: input.assistantMessage.sessionID,
                    type: "text",
                    text: "",
                    time: {
                      start: Date.now(),
                    },
                    metadata: value.providerMetadata,
                  }
                  break

                case "text-delta":
                  if (currentText) {
                    currentText.text += value.text
                    if (value.providerMetadata) currentText.metadata = value.providerMetadata
                    if (currentText.text)
                      await Session.updatePart({
                        part: currentText,
                        delta: value.text,
                      })
                  }
                  break

                case "text-end":
                  if (currentText) {
                    currentText.text = currentText.text.trimEnd()
                    const textOutput = await Plugin.trigger(
                      "experimental.text.complete",
                      {
                        sessionID: input.sessionID,
                        messageID: input.assistantMessage.id,
                        partID: currentText.id,
                      },
                      { text: currentText.text },
                    )
                    currentText.text = textOutput.text
                    currentText.time = {
                      start: Date.now(),
                      end: Date.now(),
                    }
                    if (value.providerMetadata) currentText.metadata = value.providerMetadata
                    await Session.updatePart(currentText)
                  }
                  currentText = undefined
                  break

                case "finish":
                  break

                default:
                  log.info("unhandled", {
                    ...value,
                  })
                  continue
              }
              if (needsCompaction) break
            }

            // Handle AgentOS paused state (tool confirmation workflow)
            if (agentOSPausedState) {
              const agent = await Agent.get(input.assistantMessage.agent)

              log.info("AgentOS paused state detected, processing tool confirmations", {
                runId: agentOSPausedState.runId,
                requirementsCount: agentOSPausedState.requirements.length,
                agentPermissionRules: agent.permission.length,
              })

              // Process each requirement that needs confirmation
              for (const req of agentOSPausedState.requirements) {
                log.info("Processing requirement", {
                  toolName: req.tool_execution.tool_name,
                  requiresConfirmation: req.tool_execution.requires_confirmation,
                })

                if (req.tool_execution.requires_confirmation) {
                  try {
                    log.info("Asking for permission", {
                      permission: "agentos_tool",
                      toolName: req.tool_execution.tool_name,
                    })

                    // Append an "ask" rule for agentos_tool to override the default "*": "allow"
                    // The evaluate() function uses findLast(), so the last matching rule wins
                    const agentOSRuleset: PermissionNext.Ruleset = [
                      ...agent.permission,
                      { permission: "agentos_tool", pattern: "*", action: "ask" },
                    ]

                    await PermissionNext.ask({
                      permission: "agentos_tool",
                      patterns: [req.tool_execution.tool_name],
                      sessionID: input.sessionID,
                      metadata: {
                        tool_name: req.tool_execution.tool_name,
                        tool_args: req.tool_execution.tool_args,
                        tool_call_id: req.tool_execution.tool_call_id,
                      },
                      always: [req.tool_execution.tool_name],
                      ruleset: agentOSRuleset,
                    })

                    log.info("Permission granted for tool", { toolName: req.tool_execution.tool_name })
                    // User approved
                    req.tool_execution.confirmed = true
                  } catch (e) {
                    log.info("Permission denied for tool", { toolName: req.tool_execution.tool_name, error: e })
                    // User rejected
                    req.tool_execution.confirmed = false
                    if (e instanceof PermissionNext.CorrectedError) {
                      req.tool_execution.confirmation_note = e.message
                    }
                    blocked = shouldBreak
                  }
                }
              }

              // If not all tools were rejected, continue the run
              const hasApproved = agentOSPausedState.requirements.some((r) => r.tool_execution.confirmed === true)
              if (hasApproved || !blocked) {
                try {
                  // Call continue endpoint to resume the run and process the response stream
                  const continueResult = await LLM.continueAgentOS({
                    model: input.model,
                    pausedState: agentOSPausedState,
                    abort: input.abort,
                  })

                  log.info("AgentOS run continued after tool confirmation", {
                    runId: agentOSPausedState.runId,
                    approvedCount: agentOSPausedState.requirements.filter((r) => r.tool_execution.confirmed).length,
                    rejectedCount: agentOSPausedState.requirements.filter((r) => r.tool_execution.confirmed === false)
                      .length,
                    textLength: continueResult.text.length,
                    toolResultsCount: continueResult.toolResults.length,
                  })

                  // Create tool call indicator text parts for confirmed tools
                  for (const req of agentOSPausedState.requirements) {
                    if (req.tool_execution.confirmed) {
                      const toolName = req.tool_execution.tool_name
                      const toolArgs = req.tool_execution.tool_args
                      const argsStr = Object.entries(toolArgs)
                        .map(([k, v]) => {
                          const valueStr = typeof v === "string" ? v : JSON.stringify(v)
                          const truncated = valueStr.length > 50 ? valueStr.slice(0, 47) + "..." : valueStr
                          return `${k}=${truncated}`
                        })
                        .join(", ")

                      await Session.updatePart({
                        id: Identifier.ascending("part"),
                        messageID: input.assistantMessage.id,
                        sessionID: input.sessionID,
                        type: "text",
                        text: `⚙ \`${toolName}\`${argsStr ? ` ${argsStr}` : ""}`,
                        time: {
                          start: Date.now(),
                          end: Date.now(),
                        },
                      })
                    }
                  }

                  // Create a text part for the continued response
                  if (continueResult.text.trim()) {
                    await Session.updatePart({
                      id: Identifier.ascending("part"),
                      messageID: input.assistantMessage.id,
                      sessionID: input.sessionID,
                      type: "text",
                      text: continueResult.text.trim(),
                      time: {
                        start: Date.now(),
                        end: Date.now(),
                      },
                    })
                  }

                  // Update usage/cost if available
                  if (continueResult.usage.inputTokens || continueResult.usage.outputTokens) {
                    const usage = Session.getUsage({
                      model: input.model,
                      usage: {
                        inputTokens: continueResult.usage.inputTokens ?? 0,
                        outputTokens: continueResult.usage.outputTokens ?? 0,
                        totalTokens: continueResult.usage.totalTokens ?? 0,
                      },
                      metadata: undefined,
                    })
                    input.assistantMessage.cost += usage.cost
                    input.assistantMessage.tokens = {
                      input: (input.assistantMessage.tokens?.input ?? 0) + (usage.tokens?.input ?? 0),
                      output: (input.assistantMessage.tokens?.output ?? 0) + (usage.tokens?.output ?? 0),
                      cache: {
                        read: (input.assistantMessage.tokens?.cache?.read ?? 0) + (usage.tokens?.cache?.read ?? 0),
                        write: (input.assistantMessage.tokens?.cache?.write ?? 0) + (usage.tokens?.cache?.write ?? 0),
                      },
                      reasoning: (input.assistantMessage.tokens?.reasoning ?? 0) + (usage.tokens?.reasoning ?? 0),
                    }
                  }

                  // After successful continue, mark the message as complete and stop
                  input.assistantMessage.time.completed = Date.now()
                  await Session.updateMessage(input.assistantMessage)
                  agentOSPausedState = null
                  return "stop"
                } catch (e) {
                  log.error("Failed to continue AgentOS run", { error: e })
                  input.assistantMessage.error = MessageV2.fromError(e as Error, {
                    providerID: input.model.providerID,
                  })
                }
              }

              // Clear paused state
              agentOSPausedState = null
            }
          } catch (e: any) {
            log.error("process", {
              error: e,
              stack: JSON.stringify(e.stack),
            })
            const error = MessageV2.fromError(e, { providerID: input.model.providerID })
            const retry = SessionRetry.retryable(error)
            if (retry !== undefined) {
              attempt++
              const delay = SessionRetry.delay(attempt, error.name === "APIError" ? error : undefined)
              SessionStatus.set(input.sessionID, {
                type: "retry",
                attempt,
                message: retry,
                next: Date.now() + delay,
              })
              await SessionRetry.sleep(delay, input.abort).catch(() => {})
              continue
            }
            input.assistantMessage.error = error
            Bus.publish(Session.Event.Error, {
              sessionID: input.assistantMessage.sessionID,
              error: input.assistantMessage.error,
            })
          }
          if (snapshot) {
            const patch = await Snapshot.patch(snapshot)
            if (patch.files.length) {
              await Session.updatePart({
                id: Identifier.ascending("part"),
                messageID: input.assistantMessage.id,
                sessionID: input.sessionID,
                type: "patch",
                hash: patch.hash,
                files: patch.files,
              })
            }
            snapshot = undefined
          }
          const p = await MessageV2.parts(input.assistantMessage.id)
          for (const part of p) {
            if (part.type === "tool" && part.state.status !== "completed" && part.state.status !== "error") {
              await Session.updatePart({
                ...part,
                state: {
                  ...part.state,
                  status: "error",
                  error: "Tool execution aborted",
                  time: {
                    start: Date.now(),
                    end: Date.now(),
                  },
                },
              })
            }
          }
          input.assistantMessage.time.completed = Date.now()
          await Session.updateMessage(input.assistantMessage)
          if (needsCompaction) return "compact"
          if (blocked) return "stop"
          if (input.assistantMessage.error) return "stop"
          return "continue"
        }
      },
    }
    return result
  }
}
