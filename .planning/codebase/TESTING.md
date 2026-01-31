# Testing Patterns

**Analysis Date:** 2026-01-31

## Test Framework

**Runner:**
- Bun's built-in test runner (`bun:test`)
- All unit tests use Bun test
- E2E tests use Playwright 1.51.0

**Assertion Library:**
- Bun test built-in: `{ describe, test, expect }`
- Playwright assertions: `{ test, expect } from "@playwright/test"`

**Run Commands:**
```bash
# Run all tests for a package
bun test

# From root (explicitly disabled)
bun run test  # Returns error: "do not run tests from root"

# Watch mode / Coverage
# Not configured at root level; varies by package
```

**Configuration:**
- Root `package.json` has `"test": "echo 'do not run tests from root' && exit 1"`
- Each package has its own `bunfig.toml` for test configuration

## Test File Organization

**Location:**
- **Unit tests:** Co-located with source code
  - `src/context/layout-scroll.test.ts` alongside `src/context/layout-scroll.ts`
  - `src/addons/serialize.test.ts` alongside source
  - Pattern: `src/*/[name].test.ts`

- **Integration tests:** `test/` directory at package root
  - `test/skill/skill.test.ts`
  - `test/util/timeout.test.ts`
  - `test/fixture/fixture.ts` - shared test utilities
  - `test/preload.ts` - test environment setup

- **E2E tests:** `e2e/` directory
  - `packages/app/e2e/*.spec.ts`
  - Separate from source code
  - All files use `.spec.ts` suffix

**Naming:**
- Unit/integration: `[feature].test.ts` or `[feature].test.tsx`
- E2E: `[scenario].spec.ts`

**Structure:**
```
packages/opencode/
├── src/
│   ├── skill/
│   │   ├── skill.ts
│   │   └── skill.test.ts  ← unit test co-located
│   └── util/
│       ├── timeout.ts
│       └── (no test here)
├── test/
│   ├── fixture/fixture.ts
│   ├── preload.ts
│   ├── util/timeout.test.ts  ← integration test
│   └── skill/skill.test.ts  ← integration test
└── bunfig.toml

packages/app/
├── src/
│   ├── context/layout-scroll.test.ts  ← co-located
│   └── addons/serialize.test.ts  ← co-located
└── e2e/
    ├── fixtures.ts
    ├── utils.ts
    ├── navigation.spec.ts  ← E2E test
    └── [20+ other .spec.ts files]
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, test, expect } from "bun:test"

describe("createScrollPersistence", () => {
  test("debounces persisted scroll writes", async () => {
    // test body
  })
})
```

**Patterns:**
- `describe()` for test suites (one per file, sometimes nested)
- `test()` for individual test cases
- Each test is self-contained; cleanup via `afterEach()` or resource disposal

**Setup/Teardown:**
```typescript
import { describe, test, expect, beforeAll, afterEach } from "bun:test"

let ghostty: Ghostty
beforeAll(async () => {
  ghostty = await Ghostty.load()
})

const terminals: Terminal[] = []

afterEach(() => {
  for (const term of terminals) {
    term.dispose()
  }
  terminals.length = 0
  document.body.innerHTML = ""
})
```

**Fixture Pattern:**
Use custom fixture helper for shared resource setup:
```typescript
function createTerminal(cols = 80, rows = 24): { term: Terminal; addon: SerializeAddon; container: HTMLElement } {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const term = new Terminal({ cols, rows, ghostty })
  const addon = new SerializeAddon()
  term.loadAddon(addon)
  term.open(container)
  terminals.push(term)
  return { term, addon, container }
}
```

**Assertion Pattern:**
```typescript
expect(origLine!.getCell(0)!.isBold()).toBe(1)
expect(skills.length).toBe(1)
expect(testSkill).toBeDefined()
expect(testSkill!.description).toBe("A test skill for verification.")
```

## Mocking

**Framework:**
- Custom mock fixtures in test code
- No external mocking library (Vitest's `vi.mock()` / Jest mocks not used)
- DOM mocking via HappyDOM (configured in `bunfig.toml` via `preload`)

**Patterns:**
```typescript
// Custom mock storage object
const storage = {
  getItem: (k: string) => data.get(k) ?? null,
  setItem: (k: string, v: string) => {
    data.set(k, v)
    if (k === key) writes.push(v)
  },
  removeItem: (k: string) => {
    data.delete(k)
  },
} as SyncStorage
```

**E2E Mocking:**
```typescript
// Playwright fixture setup with addInitScript
await page.addInitScript(
  (input: { directory: string; serverUrl: string }) => {
    const key = "opencode.global.dat:server"
    // mock localStorage setup
  },
  { directory, serverUrl },
)
```

**What to Mock:**
- Storage implementations (custom objects matching interface)
- DOM state setup via fixtures

**What NOT to Mock:**
- Actual file system operations (use `tmpdir()` fixture instead)
- Network calls in E2E tests (use real server via Playwright webServer config)
- Module imports (no module mocking)

## Fixtures and Factories

**Test Data:**
Fixture factory in `test/fixture/fixture.ts`:
```typescript
export async function tmpdir<T>(options?: TmpDirOptions<T>) {
  const dirpath = sanitizePath(path.join(os.tmpdir(), "opencode-test-" + Math.random().toString(36).slice(2)))
  await fs.mkdir(dirpath, { recursive: true })

  if (options?.git) {
    await $`git init`.cwd(dirpath).quiet()
    await $`git commit --allow-empty -m "root commit ${dirpath}"`.cwd(dirpath).quiet()
  }

  if (options?.config) {
    await Bun.write(path.join(dirpath, "opencode.json"), JSON.stringify({...}))
  }

  const extra = await options?.init?.(dirpath)
  return {
    [Symbol.asyncDispose]: async () => { /* cleanup */ },
    path: realpath,
    extra: extra as T,
  }
}
```

**Usage:**
```typescript
test("discovers skills from .opencode/skill/ directory", async () => {
  await using tmp = await tmpdir({
    git: true,
    init: async (dir) => {
      const skillDir = path.join(dir, ".opencode", "skill", "test-skill")
      await Bun.write(path.join(skillDir, "SKILL.md"), `...`)
    },
  })

  await Instance.provide({
    directory: tmp.path,
    fn: async () => {
      const skills = await Skill.all()
      expect(skills.length).toBe(1)
    },
  })
})
```

**Location:**
- `packages/opencode/test/fixture/fixture.ts` - main fixture factory
- `packages/app/e2e/fixtures.ts` - Playwright E2E fixtures
- `packages/app/e2e/utils.ts` - E2E utility functions

**Async Disposal:**
- Uses `Symbol.asyncDispose` with `await using` syntax
- Cleans up temporary directories and resources

## E2E Testing

**Framework:**
- Playwright 1.51.0
- Config: `packages/app/playwright.config.ts`

**Configuration:**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/test-results",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { outputFolder: "e2e/playwright-report" }], ["line"]],
  webServer: {
    command: `bun run dev -- --host 0.0.0.0 --port 3000`,
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
```

**Fixture Setup:**
```typescript
// E2E fixtures extend Playwright base test
export const test = base.extend<TestFixtures, WorkerFixtures>({
  directory: [
    async ({}, use) => {
      const directory = await getWorktree()
      await use(directory)
    },
    { scope: "worker" },
  ],
  gotoSession: async ({ page, directory }, use) => {
    await page.addInitScript((input: { directory: string; serverUrl: string }) => {
      // mock localStorage
    }, { directory, serverUrl })
    await use(gotoSession)
  },
})
export { expect }
```

**Test Example:**
```typescript
test("project route redirects to /session", async ({ page, directory, slug }) => {
  await page.goto(dirPath(directory))
  await expect(page).toHaveURL(new RegExp(`/${slug}/session`))
  await expect(page.locator(promptSelector)).toBeVisible()
})
```

**Test Results:**
- Reports: `e2e/playwright-report/`
- Traces on first retry: `on-first-retry`
- Videos on failure: `retain-on-failure`
- Screenshots on failure: `only-on-failure`

## Coverage

**Requirements:** Not detected - no coverage enforcement configured

**View Coverage:**
```bash
# Coverage not explicitly configured in build scripts
# May be available via Bun's built-in coverage (bun test --coverage)
```

## Common Patterns

**Async Testing:**
```typescript
test("should resolve when promise completes before timeout", async () => {
  const fastPromise = new Promise<string>((resolve) => {
    setTimeout(() => resolve("fast"), 10)
  })

  const result = await withTimeout(fastPromise, 100)
  expect(result).toBe("fast")
})
```

**Async Promises with await using:**
```typescript
test("discovers skills from .opencode/skill/ directory", async () => {
  await using tmp = await tmpdir({
    git: true,
    init: async (dir) => {
      // setup
    },
  })

  // resource is automatically disposed after test
})
```

**Error Testing:**
```typescript
test("should reject when promise exceeds timeout", async () => {
  const slowPromise = new Promise<string>((resolve) => {
    setTimeout(() => resolve("slow"), 200)
  })

  await expect(withTimeout(slowPromise, 50)).rejects.toThrow("Operation timed out after 50ms")
})
```

**DOM Testing:**
```typescript
test("should preserve text attributes", async () => {
  const { term, addon } = createTerminal()

  const input = "\x1b[1mBOLD\x1b[0m"
  await writeAndWait(term, input)

  const origLine = term.buffer.active.getLine(0)
  expect(origLine!.getCell(0)!.isBold()).toBe(1)

  const serialized = addon.serialize({ range: { start: 0, end: 0 } })

  // Verify round-trip
  const { term: term2 } = createTerminal()
  await writeAndWait(term2, serialized)
  const line = term2.buffer.active.getLine(0)
  expect(line!.getCell(0)!.isBold()).toBe(1)
})
```

## Test Environment Setup

**Preloads:**
- `bunfig.toml` configures test preloads for DOM support
- Main preload: `preload = ["./happydom.ts"]` or `preload = ["./test/preload.ts"]`
- Additional Solid.js preload for UI tests: `preload = ["@opentui/solid/preload"]`

**Bun Test Timeout:**
- Default: 5000ms
- Configured in `bunfig.toml`: `timeout = 10000` (10 seconds) in opencode package

---

*Testing analysis: 2026-01-31*
