---
phase: 14
plan: 01
subsystem: user-interface
tags:
  - branding
  - cli
  - tui
  - user-experience
dependency_graph:
  requires:
    - 13-01 (config file dual support)
  provides:
    - Consistent "openagent" branding in all user-facing text
  affects:
    - Help text (--help)
    - Command descriptions
    - Console output
    - Error messages
    - TUI components
tech_stack:
  added: []
  patterns:
    - User-facing text updates
    - Brand consistency
key_files:
  created: []
  modified:
    - packages/opencode/src/cli/cmd/web.ts
    - packages/opencode/src/cli/cmd/upgrade.ts
    - packages/opencode/src/cli/cmd/tui/attach.ts
    - packages/opencode/src/cli/cmd/tui/thread.ts
    - packages/opencode/src/cli/cmd/mcp.ts
    - packages/opencode/src/cli/cmd/github.ts
    - packages/opencode/src/cli/cmd/tui/app.tsx
    - packages/opencode/src/cli/cmd/tui/component/dialog-status.tsx
    - packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx
    - packages/opencode/src/cli/cmd/tui/routes/session/permission.tsx
decisions:
  - Keep internal identifiers (provider.id === "opencode", theme names) unchanged - these are not user-facing
  - Keep package manager package names (brew/choco/scoop "opencode") unchanged for backward compatibility
  - Keep config file names (opencode.json/openagent.json) unchanged per Phase 13
  - Keep environment variable names (OPENCODE_*) unchanged per backward compatibility decision
  - Keep binary name reference (spawn("opencode")) unchanged - mapped via package.json bin field
  - Keep domain references (opencode.ai) unchanged - external service
metrics:
  duration: 181
  completed_date: 2026-02-08
---

# Phase 14 Plan 01: User-Facing Text Branding Summary

**One-liner:** Replaced all user-facing "opencode"/"OpenCode" text with "openagent" in CLI help, command descriptions, console output, and TUI components for consistent branding.

## What Was Built

Completed systematic rebranding of all user-facing text strings from "opencode"/"OpenCode" to "openagent" across CLI commands and TUI interface components. This ensures users see consistent "openagent" branding throughout their interaction with the application.

### Task Breakdown

**Task 1: CLI script name and core messaging** (Already complete from prior execution)
- Updated `.scriptName("openagent")` in index.ts for help text
- Updated `Log.Default.info("openagent", {...})` for internal logging

**Task 2: Command descriptions and console output** (Commit: 9142c63cb)
- **web.ts**: Changed description to "start openagent server and open web interface"
- **upgrade.ts**: Changed description to "upgrade openagent to the latest or a specific version"
- **upgrade.ts**: Changed error message to "openagent is installed to ${process.execPath}..."
- **attach.ts**: Changed description to "attach to a running openagent server"
- **thread.ts**: Changed descriptions to "start openagent tui" and "path to start openagent in"
- **mcp.ts**: Changed help text to "Add servers with: openagent mcp add"
- **github.ts**: Changed console logs to "openagent session" and "Sending message to openagent..."

**Task 3: TUI component user-facing text** (Commit: 6412c60cd)
- **app.tsx**: Changed terminal title from "OpenCode" to "openagent" (2 locations)
- **dialog-status.tsx**: Changed status dialog from "OpenCode v{VERSION}" to "openagent v{VERSION}"
- **sidebar.tsx**: Changed getting started text from "OpenCode includes free models" to "openagent includes free models"
- **permission.tsx**: Changed permission dialog text from "until OpenCode is restarted" to "until openagent is restarted" (2 locations)
- **permission.tsx**: Changed reject text from "Tell OpenCode what to do differently" to "Tell openagent what to do differently"

## Verification Results

**CLI Help Output:**
- `openagent --help` displays logo and "openagent [command]" as expected
- Command descriptions (serve, run, web, upgrade, attach, tui) all reference "openagent"
- Server startup message: "openagent server listening on http://..."
- MCP help text: "Add servers with: openagent mcp add"

**Console Output:**
- GitHub command logs: "openagent session {id}" and "Sending message to openagent..."
- Uninstall prompts: "Uninstall openagent" and "Thank you for using openagent!"
- Error messages consistently use "openagent"

**TUI Components:**
- Terminal title: "openagent"
- Status dialog: "openagent v{VERSION}"
- Sidebar help: "openagent includes free models so you can start immediately"
- Permission dialogs: "until openagent is restarted", "Tell openagent what to do differently"

**Grep Verification:**
Remaining "opencode" references are all internal/backward-compatible:
- Internal provider ID checks (`provider.id === "opencode"`)
- Package manager package names (brew/choco/scoop for backward compat)
- Config file names (opencode.json/openagent.json per Phase 13)
- Environment variables (OPENCODE_* per backward compat)
- Domain references (opencode.ai external service)

## Deviations from Plan

None - plan executed exactly as specified. All user-facing text successfully rebranded to "openagent" while preserving internal identifiers and backward compatibility references.

## Key Decisions

**Preserved References:**
1. **Internal identifiers** - Provider IDs, theme names remain "opencode" (not user-facing)
2. **Package manager names** - brew/choco/scoop still reference "opencode" package (backward compatibility)
3. **Config files** - Both opencode.json and openagent.json supported (Phase 13 decision)
4. **Environment variables** - OPENCODE_* names unchanged (backward compatibility)
5. **Binary spawning** - spawn("opencode") remains (maps to openagent via package.json bin field)
6. **External services** - opencode.ai domain references unchanged

**Brand Consistency:**
- All user-visible strings now use lowercase "openagent" (not "OpenAgent" or "Openagent")
- TUI previously used title case "OpenCode", now uses lowercase "openagent" for consistency
- Terminal window title, status dialogs, help text all use consistent casing

## Integration Points

**Depends On:**
- Phase 13-01: Config file dual support (opencode.json/openagent.json coexistence)
- Phase 12-01: Package.json branding (@worksofadam/openagent)

**Enables:**
- Phase 14-02+: Remaining branding updates (documentation, comments, etc.)
- v3.0 milestone: Complete brand transition to "openagent"

**Backward Compatibility:**
- Package manager installations still work (package names unchanged)
- Environment variables still recognized (OPENCODE_* names preserved)
- Config files work for both names (opencode.json/openagent.json)
- Binary executable name handled by package.json bin field mapping

## Testing Notes

**Manual Verification Performed:**
1. Help output: `bun run src/index.ts --help` shows "openagent [command]"
2. Command descriptions: All commands show "openagent" in help text
3. Console output: Server messages and logs reference "openagent"
4. Grep check: Confirmed remaining "opencode" refs are internal/backward-compat only

**Recommended Testing:**
- Run `openagent --help` and verify branding
- Start server: `openagent serve` and check console output
- Launch TUI: `openagent` and verify terminal title and status dialog
- Test MCP commands to verify help text
- Try uninstall flow to verify prompts

## Files Changed

**Modified (10 files):**
- packages/opencode/src/cli/cmd/web.ts
- packages/opencode/src/cli/cmd/upgrade.ts
- packages/opencode/src/cli/cmd/tui/attach.ts
- packages/opencode/src/cli/cmd/tui/thread.ts
- packages/opencode/src/cli/cmd/mcp.ts
- packages/opencode/src/cli/cmd/github.ts
- packages/opencode/src/cli/cmd/tui/app.tsx
- packages/opencode/src/cli/cmd/tui/component/dialog-status.tsx
- packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx
- packages/opencode/src/cli/cmd/tui/routes/session/permission.tsx

**Note:** index.ts, serve.ts, uninstall.ts, pr.ts, run.ts, auth.ts were already updated in a prior execution and did not require changes in this execution.

## Self-Check: PASSED

**Files Verified:**
- web.ts: FOUND - contains "openagent server"
- upgrade.ts: FOUND - contains "upgrade openagent"
- attach.ts: FOUND - contains "openagent server"
- thread.ts: FOUND - contains "start openagent tui"
- mcp.ts: FOUND - contains "openagent mcp add"
- github.ts: FOUND - contains "openagent session"
- app.tsx: FOUND - contains 'setTerminalTitle("openagent")'
- dialog-status.tsx: FOUND - contains "openagent v"
- sidebar.tsx: FOUND - contains "openagent includes free models"
- permission.tsx: FOUND - contains "until openagent is restarted" and "Tell openagent"

**Commits Verified:**
- 9142c63cb: FOUND - Task 2 commit
- 6412c60cd: FOUND - Task 3 commit

All files exist, all commits recorded, all changes verified in codebase.

## Next Steps

1. Continue with remaining Phase 14 plans (code comments, documentation, etc.)
2. Complete Phase 14 to finish user-facing branding
3. Proceed to Phase 15-17 for deployment preparation
4. Target v3.0 milestone completion with full "openagent" branding
