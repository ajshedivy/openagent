# Coding Conventions

**Analysis Date:** 2026-01-31

## Naming Patterns

**Files:**
- PascalCase for components and modules: `skill.ts`, `config.ts`, `Skill.md`
- camelCase for utility functions: `lazy.ts`, `iife.ts`, `defer.ts`
- Lowercase with hyphens for test files: `navigation.spec.ts`, `skill.test.ts`, `layout-scroll.test.ts`
- snake_case for config files and exports: `sst-env.d.ts`

**Functions:**
- camelCase for standalone functions: `lazy()`, `iife()`, `formatDuration()`, `withTimeout()`
- camelCase for async functions: `createGlobalSkill()`, `getWorktree()`, `getWorktreeAsync()`
- verb-first naming: `create*`, `get*`, `add*`, `load*`, `parse*`, `scan*`

**Variables:**
- camelCase for local variables and parameters: `dirpath`, `result`, `storage`, `skills`, `terminals`
- UPPER_SNAKE_CASE for constants: `OPENCODE_SKILL_GLOB`, `CLAUDE_SKILL_GLOB`, `SKILL_GLOB`, `DEBUG`, `INFO`, `WARN`, `ERROR`

**Types:**
- PascalCase for type names: `Logger`, `Level`, `Info`, `Options`, `TmpDirOptions`
- PascalCase for namespaced exports: `namespace Skill`, `namespace Config`, `namespace Log`, `namespace Keybind`
- Type suffixes: Error types end in `Error` (`SkillInvalidError`, `SkillNameMismatchError`)

## Code Style

**Formatting:**
- Tool: Prettier 3.6.2
- Semi-colons: **Disabled** (`semi: false`)
- Print width: 120 characters (`printWidth: 120`)
- No semicolons at end of statements

**Example:**
```typescript
// Correct
const result = iife(() => someValue)
const skills = await Skill.all()
log.error("failed to load skill", { skill: match, err })

// Incorrect
const result = iife(() => someValue);
```

**Linting:**
- Tool: Not detected (no ESLint or Biome config found)
- Strict TypeScript checking enabled across all packages

**Module System:**
- Pure ES modules (`"type": "module"` in root package.json)
- No CommonJS (no require statements)

## Import Organization

**Order:**
1. Built-in Node/Bun modules: `import { $ } from "bun"`, `import path from "path"`, `import fs from "fs/promises"`
2. Third-party packages: `import z from "zod"`, `import { mergeDeep, pipe } from "remeda"`, `import { Log } from "..."` (external packages)
3. Internal imports from root/monorepo: `import { Skill } from "@/skill"`, `import { NamedError } from "@opencode-ai/util/error"`
4. Local relative imports: `import { ConfigMarkdown } from "../config/markdown"`

**Path Aliases:**
- `@/` points to `src/` in the current package (e.g., `@/bus`, `@/global`, `@/util/filesystem`)
- `@opencode-ai/` points to published scoped packages (e.g., `@opencode-ai/sdk`, `@opencode-ai/util`)
- Configured in `tsconfig.json` under `compilerOptions.paths`

**Example:**
```typescript
import path from "path"
import fs from "fs/promises"
import z from "zod"
import { mergeDeep } from "remeda"
import { Skill } from "@/skill"
import { NamedError } from "@opencode-ai/util/error"
import { Config } from "../config/config"
```

## Error Handling

**Patterns:**
- Use `.catch()` for graceful error handling with fallbacks
- Suppress errors with `.catch(() => {})` when failure is non-critical
- Use `NamedError` from `@opencode-ai/util/error` for typed errors with Zod schemas

**NamedError Pattern:**
```typescript
export const InvalidError = NamedError.create(
  "SkillInvalidError",
  z.object({
    path: z.string(),
    message: z.string().optional(),
    issues: z.custom<z.core.$ZodIssue[]>().optional(),
  }),
)
```

**Common Error Handling:**
```typescript
const md = await ConfigMarkdown.parse(match).catch((err) => {
  const message = ConfigMarkdown.FrontmatterError.isInstance(err)
    ? err.data.message
    : `Failed to parse skill ${match}`
  Bus.publish(Session.Event.Error, { error: new NamedError.Unknown({ message }).toObject() })
  log.error("failed to load skill", { skill: match, err })
  return undefined
})
```

## Logging

**Framework:** Custom `Log` namespace in `src/util/log.ts`

**Creation:** `Log.create({ service: "skill" })` - always pass a service name
- Services observed: `"config"`, `"skill"`, `"default"`, etc.

**Log Levels:** DEBUG, INFO, WARN, ERROR
- Configurable via `Log.init(options: Options)`

**Patterns:**
```typescript
const log = Log.create({ service: "skill" })
log.debug("fetching remote config", { url: `${key}/.well-known/opencode` })
log.warn("duplicate skill name", { name: parsed.data.name, existing: skills[parsed.data.name].location })
log.error("failed to load skill", { skill: match, err })
```

**Direct console Usage:** Sparingly seen in CLI and legacy code (`console.warn()`, `console.log()` in a few places), but should use Log instead

**Timing:** Log supports `.time()` method with optional disposal:
```typescript
const timer = log.time("operation name")
timer.stop()
// or use with Symbol.dispose
```

## Comments

**When to Comment:**
- Complex algorithms or non-obvious logic
- Workarounds and bug fixes (reference issue/bug number)
- Defensive code (e.g., null byte stripping with comment "defensive fix for CI environment issues")
- Configuration reasons (e.g., "prevent load() from trying to write back to a non-existent file")

**JSDoc/TSDoc:**
- Minimal use observed; focus is on type declarations via Zod schemas
- Type interfaces documented via Zod schema descriptions

**Example:**
```typescript
// Strip null bytes from paths (defensive fix for CI environment issues)
function sanitizePath(p: string): string {
  return p.replace(/\0/g, "")
}
```

## Function Design

**Size:** Prefer small, focused functions; no explicit limit observed but generally 20-50 lines per function

**Parameters:**
- Use object parameters for 2+ related arguments
- Include type via Zod schema validation when dealing with config/user input
- Async functions consistently use `async/await` syntax

**Return Values:**
- Namespace functions return Promise for async work
- Functions in Instance.state() return object with state
- Gracefully return `undefined` for failures that are handled upstream
- Use Promise-based chaining with `.then()` and `.catch()`

**Example:**
```typescript
export async function tmpdir<T>(options?: TmpDirOptions<T>) {
  const dirpath = sanitizePath(path.join(os.tmpdir(), "opencode-test-" + Math.random().toString(36).slice(2)))
  // ... implementation
  return result
}
```

## Module Design

**Exports:**
- Use namespace pattern extensively: `export namespace Skill { ... }`, `export namespace Config { ... }`
- Namespaced exports group related functionality
- Export types alongside functions: `export type Info = z.infer<typeof Info>`
- Instance.state() for stateful operations that depend on project context

**Barrel Files:**
- Used in `src/*/index.ts` - re-export main module
- Example: `src/skill/index.ts` exports `Skill` namespace

**Instance.state():**
- Pattern for lazy-loaded, context-aware state
- Used in `Config.state()`, `Skill.state()`
- Provides singleton state per project instance

**Example:**
```typescript
export namespace Config {
  const log = Log.create({ service: "config" })

  export const state = Instance.state(async () => {
    // lazy initialization
    return result
  })

  export async function get(name: string) {
    return state().then(x => x[name])
  }
}
```

---

*Convention analysis: 2026-01-31*
