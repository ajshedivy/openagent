# Phase 12: Package Configuration - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Update package.json metadata to reflect the `@worksofadam/openagent` brand and scoped publishing name. This phase changes package identity fields (name, version, description, bin, author, repo) — not build pipelines, CI, or publishing workflows.

</domain>

<decisions>
## Implementation Decisions

### Package identity
- Name: `@worksofadam/openagent`
- Version: `0.1.0`
- Description: "A terminal UI for interacting with Agno AgentOS"
- Author: "Adam Shedivy" with GitHub link (email + homepage)
- Repository: `https://github.com/ajshedivy/openagent`
- License: MIT (unchanged)

### CLI binary
- Bin field maps `openagent` → `./bin/openagent` (already correct)
- After global install (`npm i -g @worksofadam/openagent`), users run `openagent` command
- No additional aliases needed

### Publish readiness
- Keep `"private": true` for now — Phase 16 (Publishing Pipeline) will remove it when CI is ready
- Leverage existing opencode packaging patterns and utils — adapt for openagent, don't reinvent
- Exports field stays as-is (`"./*": "./src/*.ts"`) — build/dist mapping deferred to publishing phase
- Files filter deferred to Phase 16

### Claude's Discretion
- Keywords for npm discoverability (Claude picks appropriate tags)
- Homepage URL format
- Any additional package.json fields that make sense (engines, funding, etc.)

</decisions>

<specifics>
## Specific Ideas

- "After install, users should be able to run command 'openagent' to run the TUI" — this is the primary UX requirement
- Leverage existing opencode packaging standards, just adapt them for the openagent brand

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-package-configuration*
*Context gathered: 2026-02-08*
