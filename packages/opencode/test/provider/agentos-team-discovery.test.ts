import { test, expect, describe } from "bun:test"

/**
 * Tests for the teamToModel() function logic.
 * Since teamToModel is a private function in the plugin, we test the expected
 * output shape that the provider factory and TUI components depend on.
 */
describe("team model shape", () => {
  // Recreate the teamToModel logic for unit testing
  function teamToModel(team: { id: string; name: string; description?: string; members?: { id?: string; name?: string }[]; model?: any; role?: string }) {
    const members = (team.members ?? []).map((m) => ({ id: m.id, name: m.name }))
    return {
      id: `team:${team.id}`,
      providerID: "agentos",
      name: team.name || team.id,
      options: {
        isTeam: true,
        teamMetadata: {
          description: team.description ?? null,
          role: team.role ?? null,
          model: team.model ?? null,
          members,
        },
      },
    }
  }

  test("model ID has team: prefix", () => {
    const model = teamToModel({ id: "ibmi-team", name: "IBM i Team" })
    expect(model.id).toBe("team:ibmi-team")
  })

  test("isTeam flag is set", () => {
    const model = teamToModel({ id: "t1", name: "Test" })
    expect(model.options.isTeam).toBe(true)
  })

  test("members are mapped correctly", () => {
    const model = teamToModel({
      id: "t1",
      name: "Test Team",
      members: [
        { id: "agent-1", name: "SQL Expert" },
        { id: "agent-2", name: "Performance Analyst" },
      ],
    })
    expect(model.options.teamMetadata.members).toEqual([
      { id: "agent-1", name: "SQL Expert" },
      { id: "agent-2", name: "Performance Analyst" },
    ])
  })

  test("empty members handled", () => {
    const model = teamToModel({ id: "t1", name: "Solo Team" })
    expect(model.options.teamMetadata.members).toEqual([])
  })

  test("providerID is agentos", () => {
    const model = teamToModel({ id: "t1", name: "Test" })
    expect(model.providerID).toBe("agentos")
  })

  test("name falls back to id", () => {
    const model = teamToModel({ id: "my-team", name: "" })
    expect(model.name).toBe("my-team")
  })

  test("description and role pass through", () => {
    const model = teamToModel({
      id: "t1",
      name: "Test",
      description: "A test team",
      role: "coordinator",
    })
    expect(model.options.teamMetadata.description).toBe("A test team")
    expect(model.options.teamMetadata.role).toBe("coordinator")
  })
})

describe("team: prefix routing", () => {
  test("team: prefix detected correctly", () => {
    const modelId = "team:ibmi-team"
    expect(modelId.startsWith("team:")).toBe(true)
    expect(modelId.slice("team:".length)).toBe("ibmi-team")
  })

  test("non-team IDs not matched", () => {
    expect("sql-agent".startsWith("team:")).toBe(false)
    expect("teamwork-agent".startsWith("team:")).toBe(false)
  })
})
