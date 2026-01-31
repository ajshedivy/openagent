/**
 * AgentOS Provider for AI SDK
 *
 * This provider enables communication with Agno AgentOS instances,
 * allowing AgentOS agents to be used as language models in OpenCode.
 *
 * @example
 * ```typescript
 * import { createAgentOS } from "./sdk/agentos"
 *
 * const agentos = createAgentOS({
 *   baseURL: "http://localhost:7777",
 *   apiKey: process.env.AGENTOS_API_KEY,
 * })
 *
 * const model = agentos.languageModel("my-agent")
 * ```
 */

export { createAgentOS, type AgentOSProvider } from "./agentos-provider"
export { AgentOSLanguageModel, type AgentOSConfig } from "./agentos-language-model"
export type {
  AgentOSProviderSettings,
  AgentOSAgent,
  AgentOSModelInfo,
  AgentOSEvent,
  AgentOSRunStartedEvent,
  AgentOSRunContentEvent,
  AgentOSToolCallStartedEvent,
  AgentOSToolCallCompletedEvent,
  AgentOSRunCompletedEvent,
  AgentOSRunErrorEvent,
  AgentOSErrorResponse,
} from "./agentos-types"
