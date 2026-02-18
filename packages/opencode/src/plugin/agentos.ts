import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import type { AgentResponse, TeamResponse } from "../provider/sdk/agentos/agentos-types"
import { getAgentOSClient } from "../provider/sdk/agentos/agentos-client"
import { APIError, AuthenticationError } from "@worksofadam/agentos-sdk"
import { Config } from "../config/config"
import { Env } from "../env"

/**
 * AgentOS Authentication Plugin
 *
 * Provides authentication and agent discovery for Agno AgentOS instances.
 * Agents from the AgentOS /agents endpoint are mapped to models in OpenCode.
 */
export async function AgentOSAuthPlugin(_input: PluginInput): Promise<Hooks> {
  return {
    auth: {
      provider: "agentos",

      /**
       * Loader function that discovers agents and configures the provider.
       * Called when the provider is being initialized.
       */
      async loader(getAuth, provider) {
        try {
          const auth = await getAuth()

          // Get API key from auth, env, or config
          const apiKey = await (async () => {
            if (auth?.type === "api") return auth.key
            const envKey = Env.get("AGENTOS_API_KEY")
            if (envKey) return envKey
            const cfg = await Config.get()
            return cfg.provider?.["agentos"]?.options?.apiKey as string | undefined
          })()

          // Get base URL from config or env
          const cfg = await Config.get()
          const baseURL =
            (cfg.provider?.["agentos"]?.options?.baseURL as string | undefined) ||
            (cfg.provider?.["agentos"]?.api as string | undefined) ||
            Env.get("AGENTOS_API_URL")

          if (!baseURL) return {}

          // Get SDK client
          const client = await getAgentOSClient()

          // Health check - fail fast on connection issues
          try {
            await client.health()
          } catch (error) {
            // Handle SDK-specific errors
            if (error instanceof AuthenticationError) {
              console.warn("AgentOS authentication failed. Check your AGENTOS_API_KEY.")
              return {}
            }
            if (error instanceof APIError) {
              console.warn(`AgentOS API error (${error.status}): ${error.message}`)
              return {}
            }
            // Handle network/connection errors (ECONNREFUSED, DNS, etc.)
            if (error instanceof Error) {
              if (
                error.message.includes("ECONNREFUSED") ||
                error.message.includes("ENOTFOUND") ||
                error.message.includes("fetch failed") ||
                error.message.includes("connect")
              ) {
                console.warn(`Cannot connect to AgentOS at ${baseURL}. Check that the server is running.`)
                return {}
              }
            }
            // Unknown error - log and return empty
            console.warn(`AgentOS health check failed: ${error instanceof Error ? error.message : String(error)}`)
            return {}
          }

          // Fetch agents and teams
          const [agents, teams] = await Promise.all([
            client.agents.list(),
            client.teams.list().catch(() => [] as TeamResponse[]),
          ])

          // Map each agent to a model in the provider
          if (provider && provider.models) {
            for (const agent of agents) {
              const model = agentToModel(agent, baseURL)
              provider.models[agent.id!] = model
            }

            // Map each team to a model with team: prefix
            for (const team of teams) {
              const model = teamToModel(team, baseURL)
              provider.models[`team:${team.id!}`] = model
            }
          }

          // Return options for the provider SDK
          // Note: SDK handles auth internally, so no custom fetch wrapper needed
          return {
            baseURL,
            apiKey,
          }
        } catch (error) {
          // Catch any uncaught errors (e.g., from getAgentOSClient() if not configured)
          if (error instanceof Error && error.message.includes("not configured")) {
            // AgentOS not configured - this is fine, other providers may be used
            return {}
          }
          // Log and return empty to allow other providers to continue
          console.warn(`AgentOS provider failed to initialize: ${error instanceof Error ? error.message : String(error)}`)
          return {}
        }
      },

      /**
       * Authentication methods available for this provider.
       * Users can authenticate via API key.
       */
      methods: [
        {
          type: "api" as const,
          label: "Connect with API Key",
        },
      ],
    },
  }
}

/**
 * Convert an AgentOS agent to an OpenCode provider model
 */
function agentToModel(
  agent: AgentResponse,
  baseURL: string,
): {
  id: string
  providerID: string
  name: string
  api: { id: string; url: string; npm: string }
  cost: { input: number; output: number; cache: { read: number; write: number } }
  limit: { context: number; output: number }
  capabilities: {
    temperature: boolean
    reasoning: boolean
    attachment: boolean
    toolcall: boolean
    input: { text: boolean; audio: boolean; image: boolean; video: boolean; pdf: boolean }
    output: { text: boolean; audio: boolean; image: boolean; video: boolean; pdf: boolean }
    interleaved: boolean
  }
  status: "active" | "alpha" | "beta" | "deprecated"
  options: Record<string, unknown>
  headers: Record<string, string>
  release_date: string
} {
  // Determine capabilities based on agent configuration
  const hasTools = !!(agent.tools && Object.keys(agent.tools).length > 0)
  const hasKnowledge = !!(agent.knowledge && Object.keys(agent.knowledge).length > 0)
  const hasReasoning = !!(agent.reasoning && Object.keys(agent.reasoning).length > 0)

  return {
    id: agent.id!,
    providerID: "agentos",
    name: agent.name || agent.id!,
    api: {
      id: agent.id!,
      url: baseURL,
      npm: "@opencode/agentos",
    },
    cost: {
      input: 0,
      output: 0,
      cache: { read: 0, write: 0 },
    },
    limit: {
      context: 128000, // Default context limit
      output: 4096, // Default output limit
    },
    capabilities: {
      temperature: false, // AgentOS manages temperature internally
      reasoning: hasReasoning,
      attachment: hasKnowledge,
      toolcall: hasTools,
      input: { text: true, audio: false, image: false, video: false, pdf: false },
      output: { text: true, audio: false, image: false, video: false, pdf: false },
      interleaved: false,
    },
    status: "active",
    options: {
      agentMetadata: {
        description: agent.description,
        role: agent.role,
        model: agent.model,
        introduction: agent.introduction,
      },
    },
    headers: {},
    release_date: new Date().toISOString().split("T")[0],
  }
}

/**
 * Convert an AgentOS team to an OpenCode provider model
 */
function teamToModel(
  team: TeamResponse,
  baseURL: string,
): ReturnType<typeof agentToModel> {
  const members = (team.members ?? []).map((m) => ({
    id: m.id,
    name: m.name,
  }))

  return {
    id: `team:${team.id!}`,
    providerID: "agentos",
    name: team.name || team.id!,
    api: {
      id: `team:${team.id!}`,
      url: baseURL,
      npm: "@opencode/agentos",
    },
    cost: {
      input: 0,
      output: 0,
      cache: { read: 0, write: 0 },
    },
    limit: {
      context: 128000,
      output: 4096,
    },
    capabilities: {
      temperature: false,
      reasoning: false,
      attachment: false,
      toolcall: false,
      input: { text: true, audio: false, image: false, video: false, pdf: false },
      output: { text: true, audio: false, image: false, video: false, pdf: false },
      interleaved: false,
    },
    status: "active",
    options: {
      isTeam: true,
      teamMetadata: {
        description: team.description,
        role: team.role,
        model: team.model,
        introduction: team.introduction,
        members,
      },
    },
    headers: {},
    release_date: new Date().toISOString().split("T")[0],
  }
}
