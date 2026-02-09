---
phase: 14-user-facing-text-branding
plan: 02
subsystem: tui-branding
tags: [gap-closure, user-experience, branding]
dependency_graph:
  requires: [14-01]
  provides: [complete-tui-branding]
  affects: [tui-tips, tui-notifications, tui-dialogs]
tech_stack:
  added: []
  patterns: [user-facing-text-consistency]
key_files:
  created: []
  modified:
    - packages/opencode/src/cli/cmd/tui/component/tips.tsx
    - packages/opencode/src/cli/cmd/tui/app.tsx
    - packages/opencode/src/cli/cmd/tui/component/dialog-provider.tsx
    - packages/opencode/src/cli/cmd/tui/component/dialog-status.tsx
decisions:
  - "Applied lowercase 'openagent' consistently across all user-facing text"
  - "Preserved internal identifiers (provider IDs, theme names) as 'opencode'"
  - "Updated config file references to 'openagent.json' as preferred name"
  - "Fixed missed MCP auth command reference in status dialog (deviation)"
metrics:
  duration_seconds: 184
  tasks_completed: 4
  files_modified: 4
  commits: 4
  deviations: 1
  completed_date: 2026-02-09
---

# Phase 14 Plan 02: TUI User-Facing Text Branding Summary

**One-liner:** Completed user-facing text branding by updating all remaining TUI tips, notifications, and dialogs to reference "openagent" instead of "OpenCode"/"opencode".

## What Was Built

Closed verification gaps from Phase 14-01 by updating the final three categories of user-facing text in the TUI:

1. **TUI Tips** - Updated 25 tip strings with "openagent" brand name and command references
2. **Update Notifications** - Changed version notification and OpenRouter warning to "openagent" branding
3. **Provider Dialogs** - Updated "openagent Zen" reference in provider selection dialog
4. **Status Dialog** (deviation) - Fixed missed MCP auth command reference

All user-visible text now consistently uses lowercase "openagent" for brand name, commands, and service references. Internal identifiers remain unchanged.

## Tasks Completed

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Update TUI tips branding | da94c7295 | ✓ Complete |
| 2 | Update TUI update notification and warning | 380bf1f00 | ✓ Complete |
| 3 | Update provider dialog branding | 62901370c | ✓ Complete |
| - | Fix MCP auth command (deviation) | f4d34a19d | ✓ Complete |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Fixed MCP auth command in status dialog**
- **Found during:** Final verification grep check
- **Issue:** Status dialog showed "opencode mcp auth" command to users when MCP server needs authentication - this is user-facing text that was missed in plan
- **Fix:** Updated command reference to "openagent mcp auth" for branding consistency
- **Files modified:** packages/opencode/src/cli/cmd/tui/component/dialog-status.tsx
- **Commit:** f4d34a19d
- **Rationale:** User-facing command text must match branding standard (lowercase "openagent"). This was critical to complete Phase 14 objectives.

## Verification Results

All verification checks passed:

1. **Grep check for user-visible references:** ✓ No user-facing "OpenCode"/"opencode" text remains
2. **Tips content spot-check:** ✓ Confirmed "openagent auto-handles OAuth", "openagent auto-formats files", "openagent run" patterns
3. **Update notification check:** ✓ Shows "openagent v{VERSION}" and suggests "openagent upgrade"
4. **Provider dialog check:** ✓ References "openagent Zen gives you access..."
5. **Status dialog check:** ✓ Shows "openagent mcp auth" command

Remaining "opencode" references are all internal identifiers (provider IDs, temp file names, query params) or legitimate external URLs - not user-facing app text.

## Key Decisions Made

1. **Lowercase "openagent" everywhere** - Applied Phase 14 branding consistency decision to all new user-facing text changes
2. **Config file preference** - Updated tips to recommend "openagent.json" as primary config file (Phase 13 dual support)
3. **Directory path updates** - Changed all directory references from ".opencode/" to ".openagent/"
4. **Preserved external URLs** - Kept "opencode.ai" domain references (external service, not app branding)

## Impact Analysis

**User Experience:**
- Users see consistent "openagent" branding throughout TUI (tips, notifications, dialogs)
- Command examples match actual CLI name (no confusion between "opencode" vs "openagent")
- Config file tips align with Phase 13 dual support (prefer new name, support old)

**Developer Experience:**
- Internal code uses "opencode" provider IDs (no breaking changes)
- Theme system references preserved (backward compatibility)

**Breaking Changes:**
- None - only user-facing display text changed, no API or config changes

## Self-Check: PASSED

**Created files verification:**
- None (this was a text update plan, no new files)

**Modified files verification:**
```bash
✓ packages/opencode/src/cli/cmd/tui/component/tips.tsx exists
✓ packages/opencode/src/cli/cmd/tui/app.tsx exists
✓ packages/opencode/src/cli/cmd/tui/component/dialog-provider.tsx exists
✓ packages/opencode/src/cli/cmd/tui/component/dialog-status.tsx exists
```

**Commit verification:**
```bash
✓ da94c7295 found: feat(14-02): update TUI tips branding to openagent
✓ 380bf1f00 found: feat(14-02): update TUI notifications to openagent branding
✓ 62901370c found: feat(14-02): update provider dialog to openagent branding
✓ f4d34a19d found: fix(14-02): update MCP auth command in status dialog
```

All commits exist in git history. All modified files verified.

## Phase 14 Status

**Phase 14 Goal:** Update all user-facing text to reference "openagent" instead of "OpenCode"/"opencode"

**Status:** ✓ COMPLETE

Plans completed:
- 14-01: Terminal title, help dialog, theme names → openagent
- 14-02: Tips, notifications, provider dialogs → openagent (this plan)

**Success criteria met:**
1. ✓ All TUI tips reference "openagent" (not "OpenCode" or "opencode")
2. ✓ Update notification shows "openagent v{VERSION}" and suggests "openagent upgrade"
3. ✓ Provider dialogs reference "openagent Zen" consistently
4. ✓ Config file tips recommend "openagent.json" as primary
5. ✓ Directory tips reference ".openagent/" paths
6. ✓ External domain "opencode.ai" preserved (not app branding)
7. ✓ Grep verification confirms no user-visible "OpenCode"/"opencode" references remain
8. ✓ Phase 14 goal achieved: User cannot see "opencode" in normal TUI usage

**Next Phase:** Phase 15 - Documentation Updates (update README, CONTRIBUTING, etc. for npm publish)
