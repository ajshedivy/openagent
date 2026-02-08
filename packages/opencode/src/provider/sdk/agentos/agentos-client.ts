import { AgentOSClient } from "@worksofadam/agentos-sdk"
import { Config } from "../../../config/config"
import { Env } from "../../../env"
import { Auth } from "../../../auth"

/**
 * Shared AgentOS SDK client singleton
 *
 * Provides a single configured instance of AgentOSClient for all AgentOS operations.
 * The client is lazily initialized on first access and reused for subsequent calls.
 *
 * Configuration resolution order:
 * - baseURL: config.provider.agentos.options.baseURL → config.provider.agentos.api → AGENTOS_API_URL
 * - apiKey: Auth.get("agentos") → AGENTOS_API_KEY → config.provider.agentos.options.apiKey
 */

let _client: AgentOSClient | null = null

/**
 * Get or create the shared AgentOS SDK client
 *
 * @returns Configured AgentOSClient instance
 * @throws Error if baseURL is not configured
 */
export async function getAgentOSClient(): Promise<AgentOSClient> {
  if (_client) return _client

  // Resolve baseURL (config → env)
  const config = await Config.get()
  const baseURL =
    (config.provider?.["agentos"]?.options?.baseURL as string | undefined) ||
    (config.provider?.["agentos"]?.api as string | undefined) ||
    Env.get("AGENTOS_API_URL")

  if (!baseURL) {
    throw new Error(
      "AgentOS baseURL not configured. Set AGENTOS_API_URL environment variable or configure in opencode.json",
    )
  }

  // Resolve apiKey (auth → env → config)
  const auth = await Auth.get("agentos")
  const apiKey =
    (auth?.type === "api" ? auth.key : undefined) ||
    Env.get("AGENTOS_API_KEY") ||
    (config.provider?.["agentos"]?.options?.apiKey as string | undefined)

  // Create SDK client
  // Note: SDK constructor accepts { baseUrl } (not baseURL)
  _client = new AgentOSClient({
    baseUrl: baseURL,
    apiKey, // Optional - SDK handles unauthenticated requests
  })

  return _client
}

/**
 * Reset the shared client singleton
 *
 * Primarily used for testing to ensure a fresh client instance
 */
export function resetAgentOSClient() {
  _client = null
}
