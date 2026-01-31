import type { LanguageModelV2 } from "@ai-sdk/provider"
import { withoutTrailingSlash } from "@ai-sdk/provider-utils"
import { AgentOSLanguageModel } from "./agentos-language-model"
import type { AgentOSProviderSettings } from "./agentos-types"

// Provider version
const VERSION = "0.1.0"

/**
 * AgentOS provider interface.
 * Provides methods to create language models that communicate with AgentOS agents.
 */
export interface AgentOSProvider {
  /**
   * Create a language model for the specified agent.
   * @param agentId - The AgentOS agent ID
   */
  (agentId: string): LanguageModelV2

  /**
   * Create a language model for the specified agent.
   * @param agentId - The AgentOS agent ID
   */
  languageModel(agentId: string): LanguageModelV2

  /**
   * Alias for languageModel - create a chat model for the specified agent.
   * @param agentId - The AgentOS agent ID
   */
  chat(agentId: string): LanguageModelV2
}

/**
 * Create an AgentOS provider instance.
 *
 * @param options - Provider configuration options
 * @returns An AgentOS provider instance
 *
 * @example
 * ```typescript
 * const agentos = createAgentOS({
 *   baseURL: "http://localhost:7777",
 *   apiKey: "your-api-key",
 * })
 *
 * const model = agentos.languageModel("text2sql-agent")
 * ```
 */
export function createAgentOS(options: AgentOSProviderSettings): AgentOSProvider {
  const baseURL = withoutTrailingSlash(options.baseURL)

  if (!baseURL) {
    throw new Error("AgentOS baseURL is required")
  }

  const providerName = options.name ?? "agentos"

  const getHeaders = (): Record<string, string> => {
    return {
      "User-Agent": `opencode/agentos-provider/${VERSION}`,
      ...options.headers,
    }
  }

  const createLanguageModel = (agentId: string): LanguageModelV2 => {
    return new AgentOSLanguageModel(agentId, {
      provider: `${providerName}.chat`,
      baseURL,
      apiKey: options.apiKey,
      headers: getHeaders,
      fetch: options.fetch,
    })
  }

  const provider = function (agentId: string): LanguageModelV2 {
    return createLanguageModel(agentId)
  }

  provider.languageModel = createLanguageModel
  provider.chat = createLanguageModel

  return provider as AgentOSProvider
}
