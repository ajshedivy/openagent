import { test, expect, describe, mock, beforeEach } from "bun:test"
import { AgentOSTeamLanguageModel } from "../../src/provider/sdk/agentos/agentos-team-language-model"
import type { AgentOSClient, StreamEvent } from "@worksofadam/agentos-sdk"

/**
 * Helper to create a mock AgentStream from an array of events.
 */
function mockStream(events: StreamEvent[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const event of events) {
        yield event
      }
    },
  }
}

function createModel(streamEvents: StreamEvent[], runResult?: any) {
  const mockClient = {
    teams: {
      runStream: mock(async () => mockStream(streamEvents)),
      run: mock(async () => runResult ?? { content: "test response", metrics: {} }),
      cancel: mock(async () => {}),
    },
  } as unknown as AgentOSClient

  const model = new AgentOSTeamLanguageModel("test-team", {
    provider: "agentos.chat",
    getClient: async () => mockClient,
  })

  return { model, mockClient }
}

function createPrompt(message: string) {
  return {
    prompt: [
      {
        role: "user" as const,
        content: [{ type: "text" as const, text: message }],
      },
    ],
    mode: { type: "regular" as const },
  }
}

async function collectStreamParts(model: AgentOSTeamLanguageModel, message = "test") {
  const result = await model.doStream(createPrompt(message) as any)
  const reader = result.stream.getReader()
  const parts: any[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    parts.push(value)
  }
  return parts
}

describe("AgentOSTeamLanguageModel", () => {
  test("has correct model ID with team: prefix", () => {
    const { model } = createModel([])
    expect(model.modelId).toBe("team:test-team")
    expect(model.specificationVersion).toBe("v2")
  })

  test("doGenerate calls teams.run()", async () => {
    const { model, mockClient } = createModel([], {
      content: "team response",
      metrics: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
    })

    const result = await model.doGenerate(createPrompt("hello") as any)
    expect(result.content).toEqual([{ type: "text", text: "team response" }])
    expect(result.finishReason).toBe("stop")
    expect(result.usage.inputTokens).toBe(10)
    expect(result.usage.outputTokens).toBe(20)
    expect((mockClient.teams.run as any).mock.calls.length).toBe(1)
  })

  test("stream: TeamRunStarted emits response-metadata", async () => {
    const events: StreamEvent[] = [
      {
        event: "TeamRunStarted",
        created_at: 1700000000,
        run_id: "run-1",
        session_id: "sess-1",
        model: "gpt-4",
      } as any,
      {
        event: "TeamRunCompleted",
        created_at: 1700000001,
        content: "",
        content_type: "str",
        metrics: { input_tokens: 5, output_tokens: 10, total_tokens: 15 },
      } as any,
    ]

    const { model } = createModel(events)
    const parts = await collectStreamParts(model)

    const metadata = parts.find((p) => p.type === "response-metadata")
    expect(metadata).toBeDefined()
    expect(metadata.id).toBe("run-1")
    expect(metadata.modelId).toBe("gpt-4")
  })

  test("stream: TeamRunContent emits text-start/delta/end", async () => {
    const events: StreamEvent[] = [
      { event: "TeamRunStarted", created_at: 1, run_id: "r1", session_id: "s1" } as any,
      { event: "TeamRunContent", created_at: 2, content: "Hello " } as any,
      { event: "TeamRunContent", created_at: 3, content: "world" } as any,
      { event: "TeamRunContentCompleted", created_at: 4 } as any,
      {
        event: "TeamRunCompleted",
        created_at: 5,
        content: "",
        content_type: "str",
        metrics: {},
      } as any,
    ]

    const { model } = createModel(events)
    const parts = await collectStreamParts(model)

    const textStarts = parts.filter((p) => p.type === "text-start")
    const textDeltas = parts.filter((p) => p.type === "text-delta")
    const textEnds = parts.filter((p) => p.type === "text-end")

    expect(textStarts.length).toBeGreaterThanOrEqual(1)
    expect(textDeltas.length).toBe(2)
    expect(textDeltas[0].delta).toBe("Hello ")
    expect(textDeltas[1].delta).toBe("world")
    expect(textEnds.length).toBeGreaterThanOrEqual(1)
  })

  test("stream: member delegation creates text part with teamMember metadata", async () => {
    const events: StreamEvent[] = [
      { event: "TeamRunStarted", created_at: 1, run_id: "r1", session_id: "s1" } as any,
      {
        event: "TeamToolCallStarted",
        created_at: 2,
        tool: {
          tool_name: "delegate_task_to_member",
          tool_call_id: "tc1",
          tool_args: { member_id: "agent-1", task: "Analyze the data" },
        },
      } as any,
      {
        event: "RunStarted",
        created_at: 3,
        run_id: "mr1",
        agent_name: "DataAnalyst",
        agent_id: "agent-1",
      } as any,
      { event: "RunContent", created_at: 4, content: "Analyzing...", agent_name: "DataAnalyst" } as any,
      { event: "RunCompleted", created_at: 5, agent_name: "DataAnalyst" } as any,
      {
        event: "TeamToolCallCompleted",
        created_at: 6,
        tool: { tool_name: "delegate_task_to_member", result: "done" },
      } as any,
      {
        event: "TeamRunCompleted",
        created_at: 7,
        content: "",
        content_type: "str",
        metrics: {},
      } as any,
    ]

    const { model } = createModel(events)
    const parts = await collectStreamParts(model)

    // Find text-start parts with teamMember metadata
    const memberTextStarts = parts.filter(
      (p) => p.type === "text-start" && p.providerMetadata?.agentos?.teamMember,
    )
    expect(memberTextStarts.length).toBeGreaterThanOrEqual(1)

    // Check the member attribution
    const memberMeta = memberTextStarts[0].providerMetadata.agentos.teamMember
    expect(memberMeta.name).toBeDefined()
    expect(memberMeta.id).toBeDefined()

    // Verify member text delta
    const memberDeltas = parts.filter(
      (p) => p.type === "text-delta" && p.delta === "Analyzing...",
    )
    expect(memberDeltas.length).toBe(1)
  })

  test("stream: member tool calls rendered inline", async () => {
    const events: StreamEvent[] = [
      { event: "TeamRunStarted", created_at: 1, run_id: "r1", session_id: "s1" } as any,
      {
        event: "TeamToolCallStarted",
        created_at: 2,
        tool: {
          tool_name: "delegate_task_to_member",
          tool_call_id: "tc1",
          tool_args: { member_id: "agent-1", task: "Run query" },
        },
      } as any,
      {
        event: "RunStarted",
        created_at: 3,
        run_id: "mr1",
        agent_name: "SQLAgent",
        agent_id: "agent-1",
      } as any,
      {
        event: "ToolCallStarted",
        created_at: 4,
        tool: { tool_name: "run_sql", tool_args: { query: "SELECT 1" } },
        agent_name: "SQLAgent",
      } as any,
      { event: "ToolCallCompleted", created_at: 5, tool: { tool_name: "run_sql", result: "1" } } as any,
      { event: "RunContent", created_at: 6, content: "Result is 1", agent_name: "SQLAgent" } as any,
      { event: "RunCompleted", created_at: 7, agent_name: "SQLAgent" } as any,
      { event: "TeamToolCallCompleted", created_at: 8, tool: {} } as any,
      {
        event: "TeamRunCompleted",
        created_at: 9,
        content: "",
        content_type: "str",
        metrics: {},
      } as any,
    ]

    const { model } = createModel(events)
    const parts = await collectStreamParts(model)

    // Should have a text-delta containing the tool call format
    const toolDelta = parts.find(
      (p) => p.type === "text-delta" && p.delta?.includes("run_sql"),
    )
    expect(toolDelta).toBeDefined()
    expect(toolDelta.delta).toContain("⚙")
  })

  test("stream: TeamRunError emits error part", async () => {
    const events: StreamEvent[] = [
      { event: "TeamRunStarted", created_at: 1, run_id: "r1", session_id: "s1" } as any,
      { event: "TeamRunError", created_at: 2, content: "Something went wrong" } as any,
    ]

    const { model } = createModel(events)
    const parts = await collectStreamParts(model)

    const errorPart = parts.find((p) => p.type === "error")
    expect(errorPart).toBeDefined()
    expect(errorPart.error.message).toBe("Something went wrong")
  })

  test("stream: finish has isTeam and memberResponses in providerMetadata", async () => {
    const events: StreamEvent[] = [
      { event: "TeamRunStarted", created_at: 1, run_id: "r1", session_id: "s1" } as any,
      {
        event: "TeamToolCallStarted",
        created_at: 2,
        tool: {
          tool_name: "delegate_task_to_member",
          tool_call_id: "tc1",
          tool_args: { member_id: "agent-1", task: "Do work" },
        },
      } as any,
      { event: "RunStarted", created_at: 3, agent_name: "Worker", agent_id: "agent-1" } as any,
      { event: "RunContent", created_at: 4, content: "Working...", agent_name: "Worker" } as any,
      { event: "RunCompleted", created_at: 5, agent_name: "Worker" } as any,
      { event: "TeamToolCallCompleted", created_at: 6, tool: {} } as any,
      {
        event: "TeamRunCompleted",
        created_at: 7,
        content: "",
        content_type: "str",
        metrics: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
      } as any,
    ]

    const { model } = createModel(events)
    const parts = await collectStreamParts(model)

    const finish = parts.find((p) => p.type === "finish")
    expect(finish).toBeDefined()
    expect(finish.finishReason).toBe("stop")
    expect(finish.providerMetadata.agentos.isTeam).toBe(true)
    expect(finish.providerMetadata.agentos.runId).toBe("r1")
    expect(finish.providerMetadata.agentos.memberResponses).toBeDefined()
    expect(finish.providerMetadata.agentos.memberResponses.length).toBe(1)
    expect(finish.providerMetadata.agentos.memberResponses[0].name).toBe("Worker")
    expect(finish.providerMetadata.agentos.memberResponses[0].status).toBe("completed")
    expect(finish.usage.inputTokens).toBe(100)
    expect(finish.usage.outputTokens).toBe(50)
  })

  test("cancelRun calls teams.cancel()", async () => {
    const { model, mockClient } = createModel([])
    await model.cancelRun("run-123")
    expect((mockClient.teams.cancel as any).mock.calls.length).toBe(1)
    expect((mockClient.teams.cancel as any).mock.calls[0]).toEqual(["test-team", "run-123"])
  })

  test("extractUserMessage finds last user message", async () => {
    const { model, mockClient } = createModel([
      { event: "TeamRunStarted", created_at: 1, run_id: "r1", session_id: "s1" } as any,
      {
        event: "TeamRunCompleted",
        created_at: 2,
        content: "",
        content_type: "str",
        metrics: {},
      } as any,
    ])

    await model.doStream({
      prompt: [
        { role: "user" as const, content: [{ type: "text" as const, text: "first" }] },
        { role: "assistant" as const, content: [{ type: "text" as const, text: "response" }] },
        { role: "user" as const, content: [{ type: "text" as const, text: "second" }] },
      ],
      mode: { type: "regular" as const },
    } as any)

    const call = (mockClient.teams.runStream as any).mock.calls[0]
    expect(call[1].message).toBe("second")
  })

  test("stream: multiple delegations create separate text parts", async () => {
    const events: StreamEvent[] = [
      { event: "TeamRunStarted", created_at: 1, run_id: "r1", session_id: "s1" } as any,
      // First delegation
      {
        event: "TeamToolCallStarted",
        created_at: 2,
        tool: {
          tool_name: "delegate_task_to_member",
          tool_call_id: "tc1",
          tool_args: { member_id: "agent-1", task: "Task 1" },
        },
      } as any,
      { event: "RunStarted", created_at: 3, agent_name: "Agent1", agent_id: "agent-1" } as any,
      { event: "RunContent", created_at: 4, content: "Output 1", agent_name: "Agent1" } as any,
      { event: "RunCompleted", created_at: 5 } as any,
      { event: "TeamToolCallCompleted", created_at: 6, tool: {} } as any,
      // Second delegation
      {
        event: "TeamToolCallStarted",
        created_at: 7,
        tool: {
          tool_name: "delegate_task_to_member",
          tool_call_id: "tc2",
          tool_args: { member_id: "agent-2", task: "Task 2" },
        },
      } as any,
      { event: "RunStarted", created_at: 8, agent_name: "Agent2", agent_id: "agent-2" } as any,
      { event: "RunContent", created_at: 9, content: "Output 2", agent_name: "Agent2" } as any,
      { event: "RunCompleted", created_at: 10 } as any,
      { event: "TeamToolCallCompleted", created_at: 11, tool: {} } as any,
      // Team synthesis
      { event: "TeamRunContent", created_at: 12, content: "Summary" } as any,
      { event: "TeamRunContentCompleted", created_at: 13 } as any,
      {
        event: "TeamRunCompleted",
        created_at: 14,
        content: "",
        content_type: "str",
        metrics: {},
      } as any,
    ]

    const { model } = createModel(events)
    const parts = await collectStreamParts(model)

    // Should have multiple text-start parts: at least 2 for members + 1 for team leader
    const textStarts = parts.filter((p) => p.type === "text-start")
    expect(textStarts.length).toBeGreaterThanOrEqual(3)

    // Verify member metadata on separate starts
    const memberStarts = textStarts.filter(
      (p) => p.providerMetadata?.agentos?.teamMember,
    )
    expect(memberStarts.length).toBeGreaterThanOrEqual(2)

    // Verify team leader text (no member metadata)
    const leaderStart = textStarts.find(
      (p) => !p.providerMetadata?.agentos?.teamMember,
    )
    expect(leaderStart).toBeDefined()
  })
})
