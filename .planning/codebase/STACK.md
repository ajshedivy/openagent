# Technology Stack

**Analysis Date:** 2026-01-31

## Languages

**Primary:**
- TypeScript 5.8.2 - Core language across all packages and applications
- JavaScript/TSX - Frontend UI components and scripting
- SQL - Database schema definitions via Drizzle ORM

**Secondary:**
- Bash - Installation scripts and shell utilities (`/install` script)
- JSONC - Configuration files (`.opencode/opencode.jsonc`)

## Runtime

**Environment:**
- Bun 1.3.5 - Primary JavaScript runtime and package manager
- Node.js 22+ - Required for full compatibility (`packages/console/app/package.json` specifies `"engines": {"node": ">=22"}`)

**Package Manager:**
- Bun 1.3.5 - Workspace manager, build runner, test runner
- Lockfile: `bun.lock` (present)

## Frameworks

**Core Application Frameworks:**
- **Solid.js 1.9.10** - Reactive UI framework for web applications
  - Used in: `packages/app`, `packages/web`, `packages/desktop`, `packages/console/app`
  - Supporting: `@solidjs/router 0.15.4`, `@solidjs/meta 0.29.4`, `@solidjs/start`

- **Astro 5.7.13** - Static site generation and documentation
  - Used in: `packages/web` (documentation site)
  - Integrations: `@astrojs/cloudflare`, `@astrojs/solid-js`, `@astrojs/starlight`

- **Hono 4.10.7** - Lightweight HTTP framework
  - Used in: `packages/opencode` (CLI backend), `packages/console` (serverless functions)
  - Supporting: `@hono/zod-validator 0.4.2`, `hono-openapi 1.1.2`

- **Nitro 3.0.1-alpha.1** - Full-stack JavaScript framework
  - Used in: `packages/console/app` (backend integration)
  - Supports Cloudflare Workers deployment

**Desktop Framework:**
- **Tauri 2.x** - Desktop application framework
  - Used in: `packages/desktop`
  - Provides OS-level integrations (dialogs, notifications, file system, process management)

**Build & Vite Integration:**
- **Vite 7.1.4** - Module bundler and dev server
  - Used in: `packages/app`, `packages/desktop`, `packages/console/app`
  - Supporting: `vite-plugin-solid 2.11.10`

- **SST (Serverless Stack Toolkit) 3.17.23** - Infrastructure as code
  - Location: `sst.config.ts`
  - Manages infrastructure via Stripe, Cloudflare, and PlanetScale integrations
  - Supports: Cloudflare Workers, Lambda functions, database connections

**Testing:**
- **Playwright 1.51.0 / 1.57.0** - E2E testing framework
  - Location: `packages/app/package.json` (marked as dev dependency)
  - Scripts: `test`, `test:e2e`, `test:e2e:ui`, `test:e2e:report`
  - Config: Likely in `playwright.config.ts`

- **Bun test** - Native unit testing via Bun runtime
  - Used in: `packages/opencode`, `packages/app` for unit tests
  - Run: `bun test`

**Documentation & Code Generation:**
- **Starlight 0.34.3** - Documentation theme (built on Astro)
- **Shiki 3.20.0** - Syntax highlighting for code blocks
- **Marked 17.0.1** - Markdown parser
- **Marked-shiki 1.2.1** - Markdown-to-Shiki integration
- **Hey API OpenAPI TypeScript 0.90.10** - API code generation from OpenAPI specs
  - Used in: `packages/sdk/js` for generating SDK code

## Key Dependencies

**AI/LLM Provider SDKs (Extensive):**
- `ai` (Vercel AI SDK) 5.0.119 - Core framework for LLM integration
- `@ai-sdk/anthropic` 2.0.57 - Anthropic Claude models
- `@ai-sdk/openai` 2.0.89 - OpenAI GPT models
- `@ai-sdk/azure` 2.0.91 - Azure OpenAI
- `@ai-sdk/google` 2.0.52 - Google Gemini/PaLM
- `@ai-sdk/google-vertex` 3.0.97 - Google Vertex AI
- `@ai-sdk/amazon-bedrock` 3.0.73 - AWS Bedrock
- `@ai-sdk/cohere` 2.0.22 - Cohere
- `@ai-sdk/groq` 2.0.34 - Groq
- `@ai-sdk/mistral` 2.0.27 - Mistral AI
- `@ai-sdk/xai` 2.0.51 - xAI
- `@ai-sdk/perplexity` 2.0.23 - Perplexity
- `@ai-sdk/togetherai` 1.0.31 - Together AI
- `@ai-sdk/deepinfra` 1.0.31 - DeepInfra
- `@ai-sdk/gateway` 2.0.25 - Gateway abstraction
- `@ai-sdk/openai-compatible` 1.0.30 - OpenAI-compatible endpoints
- `@ai-sdk/provider` 2.0.1 - Provider abstraction
- `@openrouter/ai-sdk-provider` 1.5.2 - OpenRouter proxy
- `@gitlab/gitlab-ai-provider` 3.3.1 - GitLab AI integration

**Protocol & Agent Integration:**
- `@modelcontextprotocol/sdk` 1.25.2 - Model Context Protocol (MCP) support
- `@agentclientprotocol/sdk` 0.12.0 - Agent Client Protocol

**Authentication & Authorization:**
- `@openauthjs/openauth` 0.0.0-20250322224806 - Open authentication framework
- `@actions/core` 1.11.1 - GitHub Actions SDK
- `@actions/github` 6.0.1 - GitHub REST API client

**Database & ORM:**
- `drizzle-orm` 0.41.0 - Type-safe ORM for databases
  - `drizzle-kit` 0.30.5 - CLI tools for migrations and schema management
- `@planetscale/database` 1.19.0 - PlanetScale (MySQL) driver
- `postgres` 3.4.7 - PostgreSQL driver

**Version Control Integration:**
- `@octokit/rest` 22.0.0 - GitHub REST API client
- `@octokit/graphql` 9.0.2 - GitHub GraphQL API client
- `@octokit/webhooks-types` 7.6.1 - GitHub webhook type definitions

**Payment Processing:**
- `stripe` 18.0.0 - Stripe SDK (server-side)
- `@stripe/stripe-js` 8.6.1 - Stripe SDK (client-side)
- `solid-stripe` 0.8.1 - Stripe integration for Solid.js

**UI Component Libraries:**
- `@kobalte/core` 0.13.11 - Headless UI component library (Solid.js)
- `@opentui/core` 0.1.75 - OpenTUI components
- `@opentui/solid` 0.1.75 - OpenTUI for Solid.js
- `@thisbeyond/solid-dnd` 0.7.5 - Drag-and-drop for Solid.js
- `virtua` 0.42.3 - Virtual scrolling

**Styling:**
- `tailwindcss` 4.1.11 - Utility-first CSS framework
- `@tailwindcss/vite` 4.1.11 - Vite plugin for Tailwind CSS

**Utilities & Helpers:**
- `remeda` 2.26.0 - Functional utilities
- `zod` 4.1.8 - TypeScript schema validation
- `luxon` 3.6.1 - Date/time library
- `fuzzysort` 3.1.0 - Fuzzy search algorithm
- `decimal.js` 10.5.0 - Arbitrary precision decimal arithmetic
- `partial-json` 0.1.7 - Partial JSON parsing
- `turndown` 7.2.1 - HTML to Markdown converter
- `diff` 8.0.2 - Text diffing and patching
- `@pierre/diffs` 1.0.2 - Advanced diff utilities
- `ulid` 3.0.1 - Universally unique Lexicographically sortable identifiers

**Code Parsing & Analysis:**
- `tree-sitter` (multiple variants) - Incremental parsing library
  - `tree-sitter-bash` 0.25.0 - Bash language support
  - `web-tree-sitter` 0.25.10 - Web assembly version
- `gray-matter` 4.0.3 - YAML frontmatter parser
- `jsonc-parser` 3.3.1 - JSON with Comments parser

**File System & Monitoring:**
- `@parcel/watcher` 2.5.1 - File system watcher
- `chokidar` 4.0.3 - Robust file watching
- `ignore` 7.0.5 - `.gitignore` implementation
- `minimatch` 10.0.3 - File glob pattern matching
- `clipboardy` 4.0.0 - Clipboard access
- `open` 10.1.2 - Open URLs/apps in default application

**System Utilities:**
- `xdg-basedir` 5.1.0 - XDG base directory specification
- `bun-pty` 0.4.4 - Pseudo-terminal support for Bun
- `bonjour-service` 1.3.0 - mDNS/Bonjour service discovery
- `yargs` 18.0.0 - CLI argument parsing
- `@clack/prompts` 1.0.0-alpha.1 - Interactive CLI prompts
- `strip-ansi` 7.1.2 - Remove ANSI color codes
- `opentui-spinner` 0.0.6 - Terminal spinner UI

**Web Utilities:**
- `dompurify` 3.3.1 - XSS sanitizer
- `@zip.js/zip.js` 2.7.62 - ZIP file creation/extraction
- `js-base64` 3.7.7 - Base64 encoding/decoding
- `lang-map` 0.4.0 - Programming language metadata

**Development Tools:**
- `prettier` 3.6.2 - Code formatter
- `turbo` 2.5.6 - Monorepo build system
- `typescript` 5.8.2 - TypeScript compiler
- `@typescript/native-preview` 7.0.0-dev - TypeScript native bindings

## Configuration

**Environment Variables:**
The following environment variables are referenced throughout the codebase:

**AI/LLM Providers:**
- `ANTHROPIC_API_KEY` - Anthropic API key
- `OPENAI_API_KEY` - OpenAI API key
- `AZURE_OPENAI_API_KEY` - Azure OpenAI API key
- `AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_REGION`, `AWS_BEARER_TOKEN_BEDROCK` - AWS credentials
- `GITHUB_TOKEN` - GitHub API access

**Application Configuration:**
- `OPENCODE_MODELS_URL` - Models API endpoint (default: `https://models.dev`)
- `OPENCODE_BASE_URL` - Application base URL
- `OPENCODE_DEPLOYMENT_TARGET` - Deployment target (e.g., `cloudflare`)
- `VITE_API_URL` - Frontend API URL
- `VITE_AUTH_URL` - Authentication service URL
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for frontend

**Build & Infrastructure:**
- `GITHUB_RUN_ID` - GitHub Actions run identifier
- `USE_GITHUB_TOKEN` - Flag to enable GitHub token usage
- `STRIPE_SECRET_KEY` - Stripe secret key (server-side)

**Build Configuration Files:**
- `tsconfig.json` - Extends `@tsconfig/bun`
- `vite.config.ts` - Vite configuration per package
- `astro.config.ts` - Astro configuration
- `sst.config.ts` - Infrastructure configuration
- `.prettierrc` - Prettier formatting config
- `bunfig.toml` - Bun configuration

## Platform Requirements

**Development:**
- Bun 1.3.5 (primary runtime)
- Node.js 22+ (for console/app compatibility)
- macOS, Linux, or Windows with WSL support
- Git for version control

**Production:**
- **Web/App:** Cloudflare Workers (specified in Vite configs)
- **Desktop:** Windows, macOS, Linux (via Tauri)
- **Console:** Cloudflare Workers or Node.js 22+
- **Database:** PlanetScale (MySQL via Drizzle ORM) or PostgreSQL

**Infrastructure:**
- **Compute:** Cloudflare Workers, AWS Lambda
- **Database:** PlanetScale MySQL (primary), PostgreSQL support
- **Payment:** Stripe
- **Storage:** AWS S3 (via `@aws-sdk/client-s3`)
- **Authentication:** OpenAuth framework

---

*Stack analysis: 2026-01-31*
