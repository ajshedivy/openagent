# Codebase Concerns

**Analysis Date:** 2026-01-31

## Tech Debt

### Path Security - Symlink Bypass Vulnerability
- **Issue:** Filesystem path containment check is lexical-only, allowing symlinks inside project to escape bounds
- **Files:** `packages/opencode/src/file/index.ts` (lines 284-285, 304-305)
- **Impact:** Could allow unauthorized file access outside project directory if symlinks are exploited
- **Fix approach:** Replace lexical checks with realpath canonicalization before validation. Use `fs.realpathSync()` to resolve all symlinks and compare canonical paths.
- **Current workaround:** realpathSync is available in `packages/opencode/src/util/filesystem.ts` but not consistently applied

### Windows Path Bypass
- **Issue:** On Windows, cross-drive paths bypass containsPath check (e.g., `C:\project` and `D:\external` appear different)
- **Files:** `packages/opencode/src/file/index.ts` (lines 285, 305)
- **Impact:** Permission system can be bypassed on Windows with cross-drive access
- **Fix approach:** Normalize drive letters and use platform-aware path comparison before lexical checks

### GitHub Copilot Provider Maintenance Burden
- **Issue:** Legacy code marked for removal with @ts-ignore suppressing type errors
- **Files:** `packages/opencode/src/provider/provider.ts` (line 78)
- **Impact:** Type safety lost; hard to maintain deprecated code; unknown future of GitHub Copilot integration
- **Fix approach:** Remove GitHub Copilot support or migrate to fully-typed provider implementation. References to models.dev presets need to be resolved first.

### Server Architecture Complexity
- **Issue:** server.ts file is monolithic and growing, causing TypeScript type inference failures
- **Files:** `packages/opencode/src/server/server.ts` (line 60)
- **Impact:** Slow compilation, type inference breaks with larger route definitions, making debugging harder
- **Fix approach:** Split server.ts into modular route files (auth.ts, sessions.ts, files.ts, etc.) with proper typing per route
- **Current size:** ~939 lines

### Pricing Model Dependency on External Service
- **Issue:** Reasoning token pricing hardcoded to match output token pricing (workaround for models.dev limitation)
- **Files:** `packages/opencode/src/session/index.ts` (line 481)
- **Impact:** Cost calculation inaccuracy; if reasoning token pricing changes on models.dev, billing breaks silently
- **Fix approach:** Implement dynamic pricing model that reads from models.dev, or create local pricing cache that's regularly updated

### Tool Input Complexity
- **Issue:** Task tool input forced to plain string to avoid complexity; loses structured data
- **Files:** `packages/opencode/src/session/prompt.ts` (line 1706)
- **Impact:** Subtasks lose context and structured information; reduces reliability of task execution
- **Fix approach:** Redesign task tool interface to accept complex inputs with proper serialization

## Known Issues & Workarounds

### Copilot Rate Limiting Disabled
- **Issue:** GitHub Copilot messages API disabled due to rate limits
- **Files:** `packages/opencode/src/plugin/copilot.ts` (lines 43-44)
- **Risk:** Feature incomplete; dead code remains
- **Workaround:** Code is commented out; need clarity if this should be removed or fixed

### Bun Package Manager Cache Issue
- **Issue:** Workaround for Bun issue #19936 requiring --no-cache flag in proxied environments
- **Files:** `packages/opencode/src/bun/index.ts` (line 92)
- **External ref:** https://github.com/oven-sh/bun/issues/19936
- **Status:** Tied to external Bun release; adds complexity to package installation logic

### HTML Parser Injections Not Working
- **Issue:** Tree-sitter HTML injections queries commented out; unknown why they don't work
- **Files:** `packages/opencode/parsers-config.ts` (line 145)
- **Impact:** Code syntax highlighting may be incomplete for embedded languages in HTML
- **Risk:** Silent degradation; no error if injections fail

### Tree-sitter Nix Parser Workaround
- **Issue:** Using unofficial WASM build instead of official tree-sitter-nix
- **Files:** `packages/opencode/parsers-config.ts` (line 240)
- **External ref:** https://github.com/nix-community/tree-sitter-nix/issues/66
- **Risk:** Unofficial parser may have bugs; depends on external GitHub URL for WASM binary

### Desktop Binary Naming Issue (macOS/Linux)
- **Issue:** Binary name conflict on case-sensitive filesystems; workaround in place for Linux only
- **Files:** `nix/desktop.nix` (line 85)
- **Impact:** Potential confusion with app vs. binary naming; macOS exempt due to .app bundle
- **Fix approach:** Decide on single canonical binary name and update all references

### Permission Ruleset Not Persisted
- **Issue:** Permission configuration loaded from UI but not saved to disk; in-memory only
- **Files:** `packages/opencode/src/permission/next.ts` (line 223)
- **Impact:** Permission settings reset on restart; users must re-confirm repeatedly
- **Dependency:** Blocked by permission management UI implementation

### Console Placeholder Workspaces
- **Issue:** Console workspace selection using hardcoded placeholder data
- **Files:** `packages/console/app/src/routes/black/workspace.tsx` (line 21)
- **Impact:** Real workspace management not implemented; blocking production readiness
- **Note:** Needs architecture decision from Frank

## Security Considerations

### Environment Variable Access Pattern
- **Risk:** Direct process.env access scattered throughout codebase without centralized validation
- **Files affected:** Multiple files access AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AZURE credentials directly
- **Current mitigation:** Some validation in enterprise storage module
- **Recommendations:**
  - Create centralized env config validator using zod or similar
  - Validate required secrets on startup, fail fast if missing
  - Use read-only views of env config to prevent accidental mutations
  - Add audit logging for credential access

### Debug Logging to Home Directory
- **Issue:** AgentOS debug logs written to ~/.agentos-debug.log without size rotation
- **Files:** `packages/opencode/src/provider/sdk/agentos/agentos-language-model.ts` (line 15, 21)
- **Risk:** Could leak sensitive request/response data if enabled; unbounded file growth possible
- **Impact:** May contain API keys, model outputs, or other sensitive information
- **Recommendations:**
  - Implement log rotation with configurable max size
  - Only enable debug logging in development mode
  - Clear logs on app startup or periodically
  - Document what data is logged

### Type Suppression Count
- **Issue:** 198+ instances of `any` type usage and 50 @ts-ignore directives
- **Files affected:** 63 files across core packages
- **Risk:** Type safety loss enables entire categories of bugs (null ref, type confusion, etc.)
- **Largest offenders:** Provider SDK, session management, utilities
- **Fix approach:** Gradual type safety improvement; prioritize high-risk areas first

## Performance Bottlenecks

### Large File Parsing
- **Problem:** 812 TypeScript files with some complex modules reaching 4993 lines
- **Files:**
  - `packages/sdk/js/src/v2/gen/types.gen.ts` (4993 lines) - Generated code, acceptable
  - `packages/app/src/pages/session.tsx` (3054 lines) - Complex UI component, needs refactoring
  - `packages/opencode/src/session/prompt.ts` (1824 lines) - Monolithic prompt handling
- **Impact:** Slow IDE performance, long type-checking times, harder to test
- **Improvement path:**
  - Extract session.tsx into separate components (session-view, session-toolbar, session-history, etc.)
  - Split prompt.ts by concern (message formatting, tool invocation, context management)
  - Use file splitting to improve incremental compilation

### Git Diff Performance
- **Problem:** File reading triggers git diff/staging checks for all modified files
- **Files:** `packages/opencode/src/file/index.ts` (lines 311-321)
- **Impact:** Could be slow for large files or many changes; called frequently by tools
- **Improvement:** Cache diff results per file with invalidation strategy

## Fragile Areas

### Provider Transformation Logic
- **Files:** `packages/opencode/src/provider/transform.ts` (line 351)
- **Why fragile:** Complex conditional logic mapping effort/reasoning settings across different SDK versions; max_tokens conflict undocumented
- **Safe modification:** Add detailed comments explaining each branch; write tests for each SDK version combination
- **Test coverage:** Provider transform has dedicated test file (1727 lines) but gaps likely exist around new model parameters

### Session State Machine
- **Files:** `packages/opencode/src/session/index.ts` (~500+ lines)
- **Why fragile:** Manages cost calculation, token tracking, multiple concurrent models; pricing model is externalized and hardcoded
- **Safe modification:** Extract cost calculation to separate module with unit tests; add session state validation
- **Test coverage:** Core session logic missing dedicated tests; test/snapshot/snapshot.test.ts (994 lines) appears to be integration-focused

### Prompt Construction System
- **Files:** `packages/opencode/src/session/prompt.ts` (1824 lines)
- **Why fragile:** Handles multiple model variants, prompt templates, tool integration; tight coupling to model selection
- **Safe modification:** Create PromptBuilder pattern; separate template logic from model-specific handling
- **Test coverage:** Limited unit test coverage for prompt construction variants

### Configuration Merging
- **Files:** `packages/opencode/src/config/config.ts` (1388 lines)
- **Why fragile:** Merges configs from multiple sources (CLI, config file, env vars); complex precedence rules
- **Safe modification:** Document precedence clearly; add config validation schema; test each source combination
- **Test coverage:** 1613 lines of config tests exist but edge cases likely

## Scaling Limits

### Package Installation via Bun
- **Current approach:** Downloads and caches npm packages on-demand
- **Limit:** No clear limit on cache directory growth; cache cleanup not documented
- **Scaling path:** Implement cache size limits, LRU eviction, and periodic cleanup

### Permission System Scalability
- **Current:** Ruleset evaluated with findLast (linear search)
- **Limit:** Performance degrades with many rules; no indexing
- **Scaling path:** Index rules by permission pattern; use trie or similar for fast matching

## Dependencies at Risk

### @ai-sdk/github-copilot Provider
- **Risk:** Legacy code with unknown maintenance status
- **Impact:** Type safety compromised with @ts-ignore
- **Migration plan:** Remove and redirect users to official GitHub Copilot extension

### Tree-sitter Ecosystem
- **Risk:** Multiple unofficial/unreleased parser workarounds (nix, html injections)
- **Impact:** Depends on external URLs and GitHub releases
- **Migration plan:** Monitor official releases; establish fallback parsers

### models.dev Integration
- **Risk:** Pricing model, provider presets, all external
- **Impact:** Tight coupling; no local fallback
- **Migration plan:** Implement local provider registry cache; periodic sync from models.dev

## Missing Critical Features

### Permission Management UI
- **Problem:** Permission ruleset not exposed in UI; users can't configure it
- **Blocks:** Production deployments where permission control is needed
- **Impact:** High-security deployments can't enforce restrictions

### Workspace Management
- **Problem:** Console workspace selection is placeholder only
- **Blocks:** Multi-workspace enterprise features
- **Impact:** Enterprise sales blocked; no workspace isolation

## Test Coverage Gaps

### File Security Checks
- **Untested:** Symlink and cross-drive path bypass scenarios
- **Files:** `packages/opencode/src/file/index.ts` (containsPath, read, list functions)
- **Risk:** Security regression possible without tests
- **Priority:** High - Security critical

### Provider Model Loading
- **Untested:** Error cases in custom loader initialization
- **Files:** `packages/opencode/src/provider/provider.ts` (CustomModelLoader logic)
- **Risk:** Crashes when model loading fails in edge cases
- **Priority:** High

### Configuration Precedence
- **Untested:** All combinations of config source precedence (CLI > env > file > defaults)
- **Files:** `packages/opencode/src/config/config.ts`
- **Risk:** Wrong config values used in production
- **Priority:** High

### Session Cost Calculation
- **Untested:** Reasoning token cost calculations with different pricing models
- **Files:** `packages/opencode/src/session/index.ts` (cost calculation, line 481)
- **Risk:** Billing inaccuracy
- **Priority:** Medium

### Tool Integration Points
- **Untested:** Subtask tool input serialization and deserialization
- **Files:** `packages/opencode/src/session/prompt.ts` (line 1706-1708)
- **Risk:** Subtasks fail silently or with confusing errors
- **Priority:** Medium

---

*Concerns audit: 2026-01-31*
