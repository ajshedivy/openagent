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
 * const agentos = createAgentOS({ name: "agentos" })
 * const model = agentos.languageModel("my-agent")
 * ```
 */

export { createAgentOS, type AgentOSProvider } from "./agentos-provider"
export { AgentOSLanguageModel, type AgentOSConfig } from "./agentos-language-model"
export type {
  AgentOSProviderSettings,
  AgentResponse,
  ModelResponse,
  AgentOSPausedState,
  AgentOSRequirement,
  AgentOSToolExecution,
} from "./agentos-types"
