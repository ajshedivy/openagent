/**
 * Test script: Run an AgentOS team with streaming and analyze the event flow.
 * Focuses on delegation structure and per-member attribution.
 *
 * Usage:  bun run scripts/test-team-run.ts [message]
 */

import { AgentOSClient } from "@worksofadam/agentos-sdk"

const BASE_URL = "http://localhost:8000"
const TEST_MESSAGE =
  process.argv[2] ?? "Check the current CPU utilization on the system"

async function main() {
  const client = new AgentOSClient({ baseUrl: BASE_URL })

  // ── 1. Discover teams ──────────────────────────────────────────
  console.log(`\nConnecting to ${BASE_URL} …`)
  const teams = await client.teams.list()
  if (teams.length === 0) {
    console.log("No teams found.")
    process.exit(0)
  }

  for (const t of teams) {
    console.log(`\n  Team: ${t.name} (${t.id})`)
    console.log(`  Members: ${(t.members ?? []).map((m) => m.name).join(", ")}`)
  }

  // ── 2. Run first team with streaming ───────────────────────────
  const team = teams[0]!
  console.log(`\n${"─".repeat(72)}`)
  console.log(`Running team "${team.name}" …`)
  console.log(`Message: "${TEST_MESSAGE}"`)
  console.log("─".repeat(72))

  const stream = await client.teams.runStream(team.id!, {
    message: TEST_MESSAGE,
  })

  // Accumulators
  let eventCount = 0
  const memberText: Record<string, string> = {} // agent_name → accumulated text
  let teamText = ""
  let currentMember = "(team leader)"
  let memberResponses: unknown[] = []

  for await (const event of stream) {
    eventCount++
    const e = event as any
    const evt: string = e.event

    // ── Team-level structural events ──
    if (evt === "TeamRunStarted") {
      console.log(`\n[${eventCount}] TEAM STARTED  model=${e.model}`)
      continue
    }

    if (evt === "TeamToolCallStarted") {
      const tool = e.tool ?? {}
      const memberId = tool.tool_args?.member_id ?? "?"
      const task = (tool.tool_args?.task ?? "").slice(0, 120)
      console.log(`\n[${eventCount}] TEAM DELEGATES → ${memberId}`)
      console.log(`   task: ${task}`)
      continue
    }

    if (evt === "TeamToolCallCompleted") {
      const tool = e.tool ?? {}
      const result = String(tool.result ?? "").slice(0, 150)
      console.log(`[${eventCount}] TEAM DELEGATION COMPLETE`)
      console.log(`   result: ${result}…`)
      continue
    }

    if (evt === "TeamRunContent") {
      const content = typeof e.content === "string" ? e.content : ""
      teamText += content
      // Don't print every chunk — we'll show accumulated at end
      continue
    }

    if (evt === "TeamRunContentCompleted") {
      console.log(`[${eventCount}] TEAM CONTENT DONE (${teamText.length} chars)`)
      continue
    }

    if (evt === "TeamRunCompleted") {
      const content = e.content
      memberResponses = e.member_responses ?? []
      console.log(`\n[${eventCount}] TEAM RUN COMPLETED`)
      console.log(`   metrics: ${JSON.stringify(e.metrics ?? {})}`)
      console.log(`   member_responses: ${memberResponses.length}`)
      continue
    }

    if (evt === "TeamRunError") {
      console.log(`[${eventCount}] TEAM ERROR: ${e.content}`)
      continue
    }

    // ── Member-level events (no "Team" prefix) ──
    const agentName: string = e.agent_name ?? ""
    const agentId: string = e.agent_id ?? ""

    if (evt === "RunStarted") {
      currentMember = agentName || agentId || "unknown"
      console.log(`\n[${eventCount}] MEMBER STARTED: ${currentMember} (${agentId})`)
      console.log(`   parent_run_id: ${e.parent_run_id ?? "none"}`)
      continue
    }

    if (evt === "RunContent") {
      const content = typeof e.content === "string" ? e.content : ""
      const key = agentName || currentMember
      memberText[key] = (memberText[key] ?? "") + content
      continue
    }

    if (evt === "ToolCallStarted") {
      const tool = e.tool ?? {}
      console.log(
        `  [${eventCount}] ${agentName} TOOL CALL: ${tool.tool_name}(${JSON.stringify(tool.tool_args ?? {}).slice(0, 80)})`,
      )
      continue
    }

    if (evt === "ToolCallCompleted") {
      const tool = e.tool ?? {}
      const result = String(tool.result ?? "").slice(0, 100)
      console.log(`  [${eventCount}] ${agentName} TOOL DONE: ${tool.tool_name} → ${result}…`)
      continue
    }

    if (evt === "RunCompleted" || evt === "RunContentCompleted") {
      const src = agentName || currentMember
      console.log(
        `[${eventCount}] MEMBER DONE: ${src} (${(memberText[src] ?? "").length} chars output)`,
      )
      continue
    }

    // Everything else — log event type + key fields
    const fields: Record<string, unknown> = {}
    if (agentName) fields.agent = agentName
    if (e.model) fields.model = e.model
    if (e.input_tokens) fields.input_tokens = e.input_tokens
    if (e.output_tokens) fields.output_tokens = e.output_tokens
    const extra = Object.keys(fields).length > 0 ? ` ${JSON.stringify(fields)}` : ""
    console.log(`  [${eventCount}] ${evt}${extra}`)
  }

  // ── 3. Summary ─────────────────────────────────────────────────
  console.log(`\n${"═".repeat(72)}`)
  console.log("SUMMARY")
  console.log("═".repeat(72))
  console.log(`Total events: ${eventCount}`)

  console.log(`\nTeam leader text (${teamText.length} chars):`)
  console.log(teamText.slice(0, 300) + (teamText.length > 300 ? "…" : ""))

  console.log(`\nMember outputs:`)
  for (const [name, text] of Object.entries(memberText)) {
    console.log(`\n  ${name} (${text.length} chars):`)
    console.log(`  ${text.slice(0, 300).replace(/\n/g, "\n  ")}${text.length > 300 ? "…" : ""}`)
  }

  if (memberResponses.length > 0) {
    console.log(`\nmember_responses (${memberResponses.length}):`)
    console.log(JSON.stringify(memberResponses, null, 2).slice(0, 1000))
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
