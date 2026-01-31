# Roadmap: openagent

## Overview

This minimal divergence milestone establishes openagent as an independent project forked from opencode. Phase 1 creates a clean git history with squashed commits and pushes to the new repository. Phase 2 renames the CLI binary, updates branding, and documents the initiative. All 8 requirements deliver the minimum viable divergence while preserving existing AgentOS integration.

## Phases

**Phase Numbering:**

- Integer phases (1, 2): Planned milestone work
- Decimal phases (1.1, 2.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Git Divergence** - Establish independent repository with clean history
- [ ] **Phase 2: CLI and Branding** - Rename binary, update branding, document initiative

## Phase Details

### Phase 1: Git Divergence

**Goal**: Repository independence established with clean history pointing to new openagent remote
**Depends on**: Nothing (first phase)
**Requirements**: GIT-01, GIT-02
**Success Criteria** (what must be TRUE):

1. Git history squashed into single initial commit with opencode attribution
2. New repository at https://github.com/ajshedivy/openagent.git contains squashed history
3. Local repository origin remote points to new openagent repository
4. Git log shows exactly one commit marking divergence point
   **Plans:** 1 plan

Plans:

- [x] 01-01-PLAN.md — Squash history and push to new openagent repository ✓

### Phase 2: CLI and Branding

**Goal**: User can invoke openagent command and see distinct branding
**Depends on**: Phase 1
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, BRAND-01, DOC-01
**Success Criteria** (what must be TRUE):

1. User can run `openagent` command from terminal after local install
2. ASCII art banner displays "openagent" instead of "opencode"
3. Binary name, package.json bin field, and error messages all reference "openagent"
4. README.md top section explains openagent initiative and AgentOS focus
5. Existing local install instructions work with renamed command
   **Plans**: 2 plans

Plans:

- [ ] 02-01-PLAN.md — Rename CLI binary and wrapper references to openagent
- [ ] 02-02-PLAN.md — Update ASCII art branding and README docs for openagent

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase               | Plans Complete | Status      | Completed  |
| ------------------- | -------------- | ----------- | ---------- |
| 1. Git Divergence   | 1/1            | ✓ Complete  | 2026-01-31 |
| 2. CLI and Branding | 0/TBD          | Not started | -          |
