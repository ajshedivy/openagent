# Codebase Structure

**Analysis Date:** 2026-01-31

## Directory Layout

```
opencode-agno/
├── .planning/               # GSD planning documents (created by this analysis)
├── .opencode/              # OpenCode plugin definitions
│   ├── agent/              # Agent skill plugins
│   ├── command/            # Command plugins
│   ├── skill/              # Skills (tools/abilities)
│   ├── themes/             # Theme plugins
│   └── tool/               # Tool definitions
├── .husky/                 # Git hooks configuration
├── agentos/                # Python AgentOS integration (example)
│   ├── main.py             # AgentOS agent definition
│   └── pyproject.toml      # Python dependencies
├── github/                 # GitHub integration package
│   └── src/                # GitHub API handlers
├── infra/                  # Infrastructure configuration (CloudFormation, SST)
├── nix/                    # Nix environment setup
├── patches/                # Patch files for dependencies (e.g., ghostty-web)
├── script/                 # Root-level scripts
├── specs/                  # API specifications
├── sdks/                   # SDK implementations for various platforms
│   └── vscode/             # VS Code extension
│       └── src/            # Extension source code
├── packages/               # Monorepo workspace packages
│   ├── app/                # Main web application (SolidJS)
│   │   ├── e2e/            # End-to-end tests (Playwright)
│   │   ├── public/         # Static assets
│   │   ├── src/
│   │   │   ├── addons/     # Addon/plugin components
│   │   │   ├── components/ # React/Solid components (33 subdirs)
│   │   │   ├── context/    # State management providers (23 providers)
│   │   │   ├── hooks/      # Custom SolidJS hooks
│   │   │   ├── i18n/       # Internationalization files (en, zh)
│   │   │   ├── pages/      # Page components (layout, session, home, error)
│   │   │   ├── utils/      # Utility functions (13 files)
│   │   │   ├── app.tsx     # Main app component with provider setup
│   │   │   ├── entry.tsx   # Application entry point
│   │   │   └── index.ts    # Package exports
│   │   ├── vite.config.ts  # Vite build configuration
│   │   ├── tsconfig.json   # TypeScript configuration with path alias @/*
│   │   └── playwright.config.ts # E2E test configuration
│   ├── ui/                 # Component library & design system
│   │   ├── src/
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── context/    # UI-specific contexts (marked, diff, code)
│   │   │   ├── hooks/      # UI hooks (filtered lists, etc)
│   │   │   ├── i18n/       # UI i18n translations
│   │   │   ├── pierre/     # Pierre diff visualization library
│   │   │   ├── theme/      # Theme system & colors
│   │   │   └── styles/     # Global styles & Tailwind
│   │   └── vite.config.ts
│   ├── sdk/                # API SDK packages
│   │   ├── js/             # JavaScript/TypeScript SDK
│   │   │   ├── src/
│   │   │   │   ├── client.ts   # SDK client factory
│   │   │   │   ├── server.ts   # Server stubs
│   │   │   │   ├── index.ts    # Re-exports
│   │   │   │   ├── v2/         # v2 API implementation
│   │   │   │   └── gen/        # Generated types from OpenAPI spec
│   │   │   └── script/build.ts # Build script
│   │   └── openapi.json    # OpenAPI specification
│   ├── util/               # Shared utilities package
│   │   └── src/
│   │       ├── array.ts    # Array utilities
│   │       ├── error.ts    # Error handling
│   │       ├── path.ts     # Path manipulation
│   │       ├── encode.ts   # Encoding utilities
│   │       └── ... (11 utility files)
│   ├── opencode/           # CLI & core package (JavaScript)
│   │   └── src/
│   │       ├── cli/        # Command-line interface
│   │       │   ├── cmd/    # Command handlers (run, serve, auth, etc)
│   │       │   └── ui.ts   # CLI UI components
│   │       ├── util/       # CLI utilities
│   │       └── index.ts    # CLI entry point
│   ├── plugin/             # Plugin system
│   │   └── src/
│   │       ├── index.ts    # Plugin API
│   │       ├── tool.ts     # Tool definitions
│   │       └── shell.ts    # Shell integration
│   ├── script/             # Script utilities
│   │   └── src/            # Script runner & builder
│   ├── function/           # Serverless function templates
│   ├── web/                # Web server package
│   ├── desktop/            # Desktop application (Tauri)
│   ├── enterprise/         # Enterprise features (Cloudflare Workers)
│   ├── docs/               # Documentation
│   ├── identity/           # Identity/auth service
│   ├── console/            # Admin console
│   └── slack/              # Slack integration
├── package.json            # Root workspace config, Bun 1.3.5
└── sst.config.ts          # SST (Serverless Stack) infrastructure config
```

## Directory Purposes

**packages/app:**
- Purpose: Main web application - the user-facing UI
- Contains: SolidJS components, pages, context providers, styling
- Key files: `entry.tsx` (bootstrap), `app.tsx` (provider setup), `pages/session.tsx` (core UI)

**packages/ui:**
- Purpose: Reusable component library and design system
- Contains: Components, hooks, theme, i18n, styling
- Key files: Component exports via `package.json` path mapping

**packages/sdk/js:**
- Purpose: Type-safe client for OpenCode server API
- Contains: Client factory, server stubs, generated types from OpenAPI
- Key files: `client.ts` (main entry), `gen/` (generated from spec)

**packages/util:**
- Purpose: Shared utilities across all packages
- Contains: Helper functions with no external dependencies
- Key files: Each file is self-contained (array, error, path, etc)

**packages/opencode:**
- Purpose: CLI and core application logic
- Contains: Command handlers, CLI infrastructure, utilities
- Key files: `index.ts` (CLI bootstrap), `cli/cmd/*` (command implementations)

**packages/plugin:**
- Purpose: Plugin system for extending OpenCode
- Contains: Plugin interface, tool definitions, shell integration
- Key files: `tool.ts`, `shell.ts`

**.opencode/:**
- Purpose: Plugin definitions that register with OpenCode
- Contains: Agent skills, commands, tools, themes
- Subdirectories: agent/, command/, skill/, themes/, tool/

**agentos/:**
- Purpose: Example Python AgentOS integration
- Contains: Agent definitions using Anthropic's AgentOS framework
- Key files: `main.py` (agent setup)

**sdks/vscode/:**
- Purpose: VS Code extension for OpenCode
- Contains: Extension source code, scripts, images
- Key files: `src/` (TypeScript extension code)

## Key File Locations

**Entry Points:**

- `packages/app/src/entry.tsx`: Web app bootstrap - mounts SolidJS to DOM root
- `packages/opencode/src/index.ts`: CLI entry - Yargs parser setup
- `packages/app/src/pages/layout.tsx`: Main application shell layout
- `packages/app/src/pages/session.tsx`: Chat session page (largest component: 116KB)

**Configuration:**

- `package.json`: Root workspace config with Bun workspaces, dev dependencies
- `packages/app/tsconfig.json`: TypeScript config with `@/*` path alias
- `packages/app/vite.config.ts`: Vite build config for web app
- `packages/app/playwright.config.ts`: E2E test configuration
- `sst.config.ts`: Infrastructure-as-code via Serverless Stack

**Core Logic:**

- `packages/sdk/js/src/client.ts`: SDK client factory - creates `createOpencodeClient()`
- `packages/app/src/context/global-sdk.tsx`: Event streaming and SDK initialization (108 lines core logic)
- `packages/app/src/context/server.tsx`: Server connection management and project tracking
- `packages/app/src/context/global-sync.tsx`: State synchronization with backend (33KB)
- `packages/app/src/context/file.tsx`: File selection and management state

**Testing:**

- `packages/app/e2e/*.spec.ts`: Playwright E2E tests (8 test files)
- `packages/app/src/context/layout-scroll.test.ts`: Unit test example
- `packages/app/playwright.config.ts`: E2E configuration

**Utilities:**

- `packages/app/src/utils/persist.ts`: State persistence to localStorage
- `packages/app/src/utils/id.ts`: ID generation utilities
- `packages/opencode/src/util/log.ts`: Structured logging utility

## Naming Conventions

**Files:**

- Components: PascalCase with `.tsx` extension (e.g., `FileTree.tsx`, `prompt-input.tsx`)
- Utilities: kebab-case with `.ts` extension (e.g., `layout-scroll.ts`, `persist.ts`)
- Contexts: kebab-case with `.tsx` extension (e.g., `global-sdk.tsx`, `server.tsx`)
- Pages: kebab-case with `.tsx` (e.g., `session.tsx`, `error.tsx`, `layout.tsx`)
- Tests: `.test.ts` or `.spec.ts` suffix (Playwright uses `.spec.ts`)

**Directories:**

- Feature directories: kebab-case plural (e.g., `components/`, `context/`, `pages/`)
- Subdirectories for organizational clarity: kebab-case (e.g., `file-icons/`, `provider-icons/`)

**Functions & Variables:**

- Functions: camelCase (e.g., `createOpencodeClient()`, `normalizeServerUrl()`, `useGlobalSDK()`)
- Hooks: Start with `use` prefix in camelCase (e.g., `useGlobalSDK()`, `useServer()`, `useLayout()`)
- Context providers: Exported as `{use: <name>, provider: <Name>Provider}` tuple pattern
- Stores: camelCase with `store`/`Store` suffix (e.g., `createStore()`)

## Where to Add New Code

**New Feature:**
- Primary code: `packages/app/src/pages/` (if new page) or `packages/app/src/components/` (if component)
- Context/state: `packages/app/src/context/[feature].tsx` following `createSimpleContext()` pattern
- Tests: `packages/app/e2e/[feature].spec.ts` (E2E) or `packages/app/src/[path].test.ts` (unit)
- Styles: Tailwind classes in component JSX or `packages/ui/src/styles/`

**New Component/Module:**
- Shared component: `packages/ui/src/components/[feature]/`
- App-specific component: `packages/app/src/components/[feature]/`
- Export from appropriate `index.ts` or package.json exports entry

**Utilities:**
- General utilities: `packages/util/src/[category].ts` (no external dependencies)
- App utilities: `packages/app/src/utils/[name].ts` (app-specific helpers)
- Context utilities: Store helper functions in context files or `packages/app/src/utils/`

**Styling:**
- Global styles: `packages/ui/src/styles/index.css` or theme files
- Component styles: Tailwind classes in JSX (inline) or separate CSS modules if needed
- Theme customization: `packages/ui/src/theme/`

**CLI Commands:**
- New command: `packages/opencode/src/cli/cmd/[command-name].ts`
- Follow existing command pattern: export class extending yargs Command interface

**SDK Extensions:**
- API types: Update `packages/sdk/openapi.json` specification
- Client implementation: `packages/sdk/js/src/client.ts` or `v2/client.ts`
- Generated types: Regenerated via `@hey-api/openapi-ts` from spec

## Special Directories

**node_modules/:**
- Purpose: Dependency installations
- Generated: Yes (via `bun install`)
- Committed: No (.gitignored)

**.next/:**
- Purpose: Next.js build output (if applicable)
- Generated: Yes
- Committed: No (.gitignored)

**packages/*/dist/:**
- Purpose: Compiled package output
- Generated: Yes (via build scripts)
- Committed: No (published from dist for npm)

**packages/app/build/:
- Purpose: Vite build output for web app
- Generated: Yes (via `vite build`)
- Committed: No

**logs/:**
- Purpose: Runtime logs
- Generated: Yes (at runtime)
- Committed: No

---

*Structure analysis: 2026-01-31*
