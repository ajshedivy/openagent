import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import type { AgentOSAgent } from "../provider/sdk/agentos/agentos-types"
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

        // Fetch agents from the AgentOS API
        const agents = await fetchAgents(baseURL, apiKey)

        // Map each agent to a model in the provider
        if (provider && provider.models) {
          for (const agent of agents) {
            const model = agentToModel(agent, baseURL)
            provider.models[agent.id] = model
          }
        }

        // Return options for the provider SDK
        return {
          baseURL,
          apiKey,
          async fetch(request: RequestInfo | URL, init?: RequestInit) {
            const headers: Record<string, string> = {
              ...(init?.headers as Record<string, string>),
            }

            // Add authorization header if API key is available
            if (apiKey) {
              headers["Authorization"] = `Bearer ${apiKey}`
            }

            return fetch(request, {
              ...init,
              headers,
            })
          },
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
 * Fetch agents from the AgentOS API
 */
async function fetchAgents(baseURL: string, apiKey?: string): Promise<AgentOSAgent[]> {
  const url = `${baseURL.replace(/\/$/, "")}/agents`

  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`
  }

  try {
    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.warn(`Failed to fetch AgentOS agents: ${response.status} ${response.statusText}`)
      return []
    }

    const agents = (await response.json()) as AgentOSAgent[]
    return agents
  } catch (error) {
    console.warn("Failed to fetch AgentOS agents:", error)
    return []
  }
}

/**
 * Convert an AgentOS agent to an OpenCode provider model
 */
function agentToModel(
  agent: AgentOSAgent,
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
    id: agent.id,
    providerID: "agentos",
    name: agent.name || agent.id,
    api: {
      id: agent.id,
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
