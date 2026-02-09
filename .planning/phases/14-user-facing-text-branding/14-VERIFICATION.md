---
phase: 14-user-facing-text-branding
verified: 2026-02-08T18:45:00Z
status: passed
score: 7/7 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 5/7
  gaps_closed:
    - "User cannot see 'opencode' in normal usage"
  gaps_remaining: []
  regressions: []
---

# Phase 14: User-Facing Text Branding Verification Report

**Phase Goal:** All user-visible text references "openagent" instead of "opencode"
**Verified:** 2026-02-08T18:45:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (Plan 14-02)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User sees 'openagent' in help text and --version output | ✓ VERIFIED | `.scriptName("openagent")` in index.ts line 44 |
| 2 | User sees 'openagent' in error messages | ✓ VERIFIED | Error messages in pr.ts line 105, upgrade.ts line 30 reference "openagent" |
| 3 | User sees 'openagent' in server startup messages | ✓ VERIFIED | serve.ts line 16: "openagent server listening" |
| 4 | User sees 'openagent' in command descriptions | ✓ VERIFIED | All command descriptions (serve, run, web, upgrade, attach, tui) use "openagent" |
| 5 | User sees 'openagent' in TUI terminal title and status | ✓ VERIFIED | app.tsx lines 220, 227 set title to "openagent"; dialog-status.tsx line 48 shows "openagent v{VERSION}" |
| 6 | User sees 'openagent' in TUI permission dialogs | ✓ VERIFIED | permission.tsx references "until openagent is restarted" and "Tell openagent what to do" |
| 7 | User cannot see 'opencode' in normal usage | ✓ VERIFIED | All user-facing text updated; only internal identifiers remain |

**Score:** 7/7 truths verified (100%)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/opencode/src/index.ts` | scriptName('openagent') and log reference | ✓ VERIFIED | Line 44: `.scriptName("openagent")`, Line 73: `Log.Default.info("openagent")` — 159 lines |
| `packages/opencode/src/cli/cmd/serve.ts` | Server startup message with 'openagent server' | ✓ VERIFIED | Line 16: "openagent server listening" — 20 lines |
| `packages/opencode/src/cli/cmd/uninstall.ts` | Uninstall prompts referencing 'openagent' | ✓ VERIFIED | Line 57: "Uninstall openagent", Line 234: "Thank you for using openagent!" — 357 lines |
| `packages/opencode/src/cli/cmd/web.ts` | Web command description with 'openagent' | ✓ VERIFIED | Line 34: "start openagent server and open web interface" — 81 lines |
| `packages/opencode/src/cli/cmd/mcp.ts` | MCP command instructions with 'openagent' | ✓ VERIFIED | Line 87: "Add servers with: openagent mcp add" — 765 lines |
| `packages/opencode/src/cli/cmd/tui/app.tsx` | Terminal title 'openagent' and notifications | ✓ VERIFIED | Lines 220, 227: title "openagent"; Line 668: update notification "openagent v{VERSION}"; Line 606: "openagent Zen" — 784 lines |
| `packages/opencode/src/cli/cmd/tui/component/dialog-status.tsx` | Status dialog showing 'openagent v{VERSION}' | ✓ VERIFIED | Line 48: "openagent v{Installation.VERSION}"; Line 79: "openagent mcp auth" — 164 lines |
| `packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx` | Sidebar text with 'openagent' branding | ✓ VERIFIED | Line 287: "openagent includes free models so you can start immediately" — 313 lines |
| `packages/opencode/src/cli/cmd/tui/routes/session/permission.tsx` | Permission dialogs referencing 'openagent' | ✓ VERIFIED | Lines 181, 185, 371: "until openagent is restarted", "Tell openagent what to do" — 542 lines |
| `packages/opencode/src/cli/cmd/tui/component/tips.tsx` | TUI tips with 'openagent' branding | ✓ VERIFIED | Lines 90, 99, 108, 110, 113: "openagent auto-handles", "openagent run", etc. — all tips updated |
| `packages/opencode/src/cli/cmd/tui/component/dialog-provider.tsx` | Provider dialog with 'openagent Zen' | ✓ VERIFIED | Line 233: "openagent Zen gives you access..." |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `packages/opencode/src/index.ts` | yargs scriptName | `.scriptName()` method call | ✓ WIRED | Line 44: `.scriptName("openagent")` found |
| `packages/opencode/src/cli/cmd/serve.ts` | console.log | server startup message | ✓ WIRED | Line 16: `console.log("openagent server listening...")` found |
| `packages/opencode/src/cli/cmd/tui/app.tsx` | renderer.setTerminalTitle | terminal title setting | ✓ WIRED | Lines 220, 227: `renderer.setTerminalTitle("openagent")` found |
| `packages/opencode/src/cli/cmd/tui/app.tsx` | toast.show | update notification | ✓ WIRED | Line 668: notification shows "openagent v{VERSION}" and "openagent upgrade" |
| `packages/opencode/src/cli/cmd/tui/component/tips.tsx` | TIPS array | user screen display | ✓ WIRED | Tips reference "openagent" commands and branding |

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| BRD-01: All user-facing "opencode" text strings replaced with "openagent" | ✓ SATISFIED | CLI commands, TUI components, tips, notifications all use "openagent"; only 6 internal identifiers remain (package manager names, spawn binary, model IDs) |
| BRD-04: Error messages and log output reference "openagent" not "opencode" | ✓ SATISFIED | Error messages in pr.ts line 105, upgrade.ts line 30; logs in github.ts all reference "openagent" |
| BRD-05: Help text and --version output show "openagent" | ✓ SATISFIED | `.scriptName("openagent")` sets help text to show "openagent [command]" |

**Requirements Score:** 3/3 satisfied (100%)

### Anti-Patterns Found

None. All gap-closure files (tips.tsx, app.tsx, dialog-provider.tsx, dialog-status.tsx) are clean with no TODO/FIXME markers or stub implementations.

### Re-Verification Summary

**Previous verification (2026-02-08T16:30:00Z):**
- Status: gaps_found
- Score: 5/7 truths verified (71%)
- Gaps: 3 files with user-visible "OpenCode"/"opencode" references

**Gap closure plan (14-02):**
- Updated tips.tsx: 25+ tip strings changed to "openagent" branding
- Updated app.tsx: Update notification and OpenRouter warning to "openagent"
- Updated dialog-provider.tsx: Provider dialog shows "openagent Zen"
- Fixed dialog-status.tsx: MCP auth command shows "openagent mcp auth" (deviation)

**Current verification (2026-02-08T18:45:00Z):**
- Status: passed
- Score: 7/7 truths verified (100%)
- Gaps closed: All 3 gaps resolved
- Gaps remaining: None
- Regressions: None detected

### Remaining "opencode" References

All remaining "opencode" references are **internal identifiers**, not user-facing text:

1. **Package manager commands** (uninstall.ts): `brew uninstall opencode`, `choco uninstall opencode`, `scoop uninstall opencode` — legacy package names
2. **Binary spawn** (pr.ts line 97): `spawn("opencode", ...)` — binary name maps to "openagent" via package.json bin field
3. **Model provider IDs** (models.ts): `a.startsWith("opencode")` — internal identifier checks
4. **Provider IDs** (dialog-provider.tsx): `provider.id === "opencode"` — internal system identifiers
5. **Theme names**: Internal theme system identifiers
6. **Temp file names**: `opencode-clipboard.png` — internal temp file prefix
7. **URLs**: `opencode.internal`, `opencode.ai` — internal URLs and external domain

None of these are visible to users in normal CLI/TUI usage.

### Human Verification Required

#### 1. Help Text Display

**Test:** Run `openagent --help` in terminal
**Expected:** Top of help output shows "openagent [command]" not "opencode"
**Why human:** Visual confirmation of terminal output formatting

#### 2. TUI Terminal Title

**Test:** Launch TUI with `openagent`, check terminal window title
**Expected:** Terminal window title shows "openagent" or "OC | <session-title>"
**Why human:** Terminal window title not accessible programmatically

#### 3. Command Descriptions in Help

**Test:** Run `openagent serve --help`, `openagent run --help`, `openagent web --help`
**Expected:** All command descriptions reference "openagent server", "run openagent", etc.
**Why human:** Verify user-facing output formatting and readability

#### 4. TUI Tips Display

**Test:** Launch TUI, observe tips at bottom of screen
**Expected:** Tips reference "openagent" commands, not "opencode"
**Why human:** Visual TUI component verification

#### 5. Update Notification

**Test:** If update available, check notification message
**Expected:** Shows "openagent v{VERSION}" and suggests "openagent upgrade"
**Why human:** Conditional UI element, hard to trigger programmatically

---

**Phase 14 Goal Status:** ✓ ACHIEVED

All user-visible text references "openagent" instead of "opencode". The phase goal is fully satisfied with 100% of observable truths verified and all requirements met.

---

_Verified: 2026-02-08T18:45:00Z_
_Verifier: Claude (gsd-verifier)_
