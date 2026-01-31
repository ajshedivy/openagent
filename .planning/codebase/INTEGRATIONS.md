# External Integrations

**Analysis Date:** 2026-01-31

## APIs & External Services

**LLM & AI Model Providers:**
- **Anthropic (Claude)** - Primary AI model provider
  - SDK: `@ai-sdk/anthropic` 2.0.57
  - Auth: `ANTHROPIC_API_KEY`
  - Location: `packages/opencode/src/provider/` (multiple SDK implementations)

- **OpenAI (GPT-4, GPT-3.5)** - LLM provider
  - SDK: `@ai-sdk/openai` 2.0.89
  - Auth: `OPENAI_API_KEY`
  - Location: `packages/opencode/src/provider/sdk/openai-compatible/`

- **Azure OpenAI** - Microsoft's OpenAI deployment
  - SDK: `@ai-sdk/azure` 2.0.91
  - Auth: `AZURE_OPENAI_API_KEY`

- **Google Gemini/PaLM** - Google AI models
  - SDK: `@ai-sdk/google` 2.0.52
  - Auth: `GOOGLE_API_KEY` (inferred)

- **Google Vertex AI** - Enterprise Google AI
  - SDK: `@ai-sdk/google-vertex` 3.0.97

- **AWS Bedrock** - AWS-hosted model service
  - SDK: `@ai-sdk/amazon-bedrock` 3.0.73
  - Auth: `AWS_ACCESS_KEY_ID`, `AWS_REGION`, `AWS_BEARER_TOKEN_BEDROCK`

- **Cohere** - Text generation models
  - SDK: `@ai-sdk/cohere` 2.0.22

- **Groq** - Fast inference provider
  - SDK: `@ai-sdk/groq` 2.0.34

- **Mistral AI** - Open-source model provider
  - SDK: `@ai-sdk/mistral` 2.0.27

- **xAI** - Grok models provider
  - SDK: `@ai-sdk/xai` 2.0.51

- **Perplexity** - Research AI models
  - SDK: `@ai-sdk/perplexity` 2.0.23

- **Together AI** - Model inference platform
  - SDK: `@ai-sdk/togetherai` 1.0.31

- **DeepInfra** - Serverless model inference
  - SDK: `@ai-sdk/deepinfra` 1.0.31

- **GitLab AI** - GitLab-integrated AI
  - SDK: `@gitlab/gitlab-ai-provider` 3.3.1
  - Location: Referenced in `packages/opencode/package.json`

- **OpenRouter** - LLM proxy/aggregator
  - SDK: `@openrouter/ai-sdk-provider` 1.5.2

**Protocol & Agent Support:**
- **Model Context Protocol (MCP)** - Protocol for AI context
  - SDK: `@modelcontextprotocol/sdk` 1.25.2
  - Location: `packages/opencode` (likely in agent/provider integration)

- **Agent Client Protocol** - Client protocol for agents
  - SDK: `@agentclientprotocol/sdk` 0.12.0

## Data Storage

**Databases:**
- **PlanetScale (MySQL)** - Primary relational database
  - Client: `@planetscale/database` 1.19.0
  - ORM: `drizzle-orm` 0.41.0
  - Location: Schema files in `packages/console/core/src/schema/`
    - `user.sql.ts` - User management
    - `workspace.sql.ts` - Workspace/organization
    - `provider.sql.ts` - Provider configuration
    - `key.sql.ts` - API keys and credentials
    - `model.sql.ts` - Model catalog
    - `billing.sql.ts` - Billing/subscription data
    - `account.sql.ts` - Account information
    - `ip.sql.ts` - IP address tracking
    - `benchmark.sql.ts` - Performance metrics
    - `auth.sql.ts` - Authentication records
  - Connection: Managed via SST environment
  - Migrations: `drizzle-kit` CLI (`bun run db`, `bun run db-dev`, `bun run db-prod`)

- **PostgreSQL Support** - Alternative database (driver available)
  - Client: `postgres` 3.4.7
  - Status: Optional/secondary support via Drizzle ORM

**File Storage:**
- **AWS S3** - Object storage for files
  - SDK: `@aws-sdk/client-s3` 3.933.0
  - Location: Root `package.json` dependencies
  - Auth: `AWS_ACCESS_KEY_ID`, `AWS_REGION`
  - Used for: File uploads, model artifacts

**Caching:**
- **None detected** - No explicit caching layer found
- In-memory caching via Solid.js reactive stores
- HTTP caching headers likely leveraged via Hono

## Authentication & Identity

**Auth Provider:**
- **OpenAuth Framework** - Custom authentication implementation
  - Package: `@openauthjs/openauth` 0.0.0-20250322224806
  - Location: `packages/console/function/src/auth.ts`
  - Features: Email/social authentication likely supported
  - Integration: Handles multi-provider auth (GitHub, email, OAuth)
  - Used in: `packages/console/app` and `packages/console/function`

**Authorization:**
- **Role-based Access Control (RBAC)** - Custom implementation
  - Schema: `UserRole` enum in `packages/console/core/src/schema/user.sql.ts`
  - Workspace-scoped permissions
  - Actor-based authorization via `packages/console/core/src/actor.ts`

**GitHub Integration:**
- **GitHub API** - Source control integration
  - SDK: `@octokit/rest` 22.0.0
  - GraphQL: `@octokit/graphql` 9.0.2
  - Webhooks: `@octokit/webhooks-types` 7.6.1
  - Auth: `GITHUB_TOKEN`
  - Location: `packages/opencode/src/cli/cmd/github.ts`
  - Actions: `@actions/core` 1.11.1, `@actions/github` 6.0.1
  - Use Cases:
    - GitHub Actions integration
    - Repository webhook handling
    - Pull request/issue operations
    - Git operations via API

## Monitoring & Observability

**Error Tracking:**
- Not detected explicitly in codebase
- Likely handled via application logging

**Logs:**
- **Console logging** - Default approach via `console.log()`
- **Bun logging** - Native support via Bun runtime
- Potential integration with infrastructure logging via SST

**Debugging:**
- `why-is-node-running` 3.2.2 - Debug memory leaks and hanging processes
  - Used in: `packages/opencode/package.json`

## CI/CD & Deployment

**Hosting:**
- **Cloudflare Workers** - Serverless compute platform
  - Adapter: `@astrojs/cloudflare` 12.6.3, `@cloudflare/workers-types`
  - Vite plugin: `@cloudflare/vite-plugin` 1.15.2
  - Configuration: `wrangler` 4.50.0
  - Used in: Web documentation, console application, function handlers
  - Location: `packages/web` (Astro), `packages/console/app`, `packages/console/function`

- **AWS (via SST)** - Infrastructure provider
  - SDK: `@aws-sdk/client-s3`, `@aws-sdk/client-sts`
  - Lambda functions supported via SST
  - Location: `sst.config.ts`

- **Tauri Desktop** - Desktop application distribution
  - Used in: `packages/desktop`

**CI Pipeline:**
- **GitHub Actions** - Automated workflows
  - Workflows: `.github/workflows/` directory
  - Key workflows detected:
    - `deploy.yml` - Deployment automation
    - `docs-update.yml` - Documentation generation
    - `close-stale-prs.yml` - Maintenance automation
    - `daily-issues-recap.yml` - Issue tracking
    - `daily-pr-recap.yml` - PR tracking
    - `duplicate-issues.yml` - Duplicate detection
    - `contributors-label.yml` - Contributor management
  - Artifacts: `@actions/artifact` 5.0.1 (build outputs)

**Build Infrastructure:**
- **SST (Serverless Stack Toolkit) 3.17.23** - Infrastructure as code
  - Config: `sst.config.ts`
  - Stages: `dev`, `production` (controlled via removal policy)
  - Integrations:
    - Stripe provider for payment handling
    - PlanetScale for database
    - Cloudflare for hosting
  - Infrastructure modules:
    - `infra/app.js` - Main app infrastructure
    - `infra/console.js` - Console infrastructure
    - `infra/enterprise.js` - Enterprise features
  - Environment: Managed via `sst shell` commands

## Environment Configuration

**Required env vars (Console Application):**
- `VITE_AUTH_URL` - Authentication service URL (default: `https://auth.dev.opencode.ai`)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe public key (example: `pk_test_51RtuLNE7fOCwHSD4...`)
- `OPENCODE_DEPLOYMENT_TARGET` - Target deployment (e.g., `cloudflare`)
- `OPENCODE_BASE_URL` - Application base URL
- `STRIPE_SECRET_KEY` - Stripe secret (server-side, stored in SST)

**Secrets location:**
- **Development:** Environment variables via Bun/shell
- **Production:** SST secrets management (encrypted in infrastructure)
- **CI/CD:** GitHub Actions secrets (not shown in code)
- Test isolation: `packages/opencode/test/preload.ts` clears sensitive env vars before tests

## Webhooks & Callbacks

**Incoming Webhooks:**
- **Stripe Webhooks** - Payment event notifications
  - Handler: `packages/console/app/src/routes/stripe/webhook.ts`
  - Events: Payment completion, subscription updates, billing events
  - Signature verification: `Billing.stripe().webhooks.constructEventAsync()`

- **GitHub Webhooks** - Repository event notifications
  - Types: `@octokit/webhooks-types` 7.6.1
  - Handler: Likely in `packages/opencode/src/cli/cmd/github.ts`
  - Events: Push, pull request, issue events

**Outgoing Webhooks:**
- **Email Notifications** - User notifications
  - Renderer: `@jsx-email/render` 1.1.1
  - Location: `packages/console/core` (mail module)
  - Use: Account notifications, billing updates

**Model Data Endpoints:**
- **Models API** - External model registry
  - Endpoint: `process.env.OPENCODE_MODELS_URL` (default: `https://models.dev`)
  - Location: `packages/app/vite.config.ts` (icon fetching)
  - Calls: `GET {url}/api.json` for model listing
  - Icon fetching: `GET {url}/logos/{provider}.svg`

---

*Integration audit: 2026-01-31*
