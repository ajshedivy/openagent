# Roadmap: openagent

## Milestones

- v1.0 Minimal Divergence - Phases 1-2 (shipped 2026-01-31)
- v1.1 AgentOS Hub - Phases 3-6 (shipped 2026-02-01)
- v2.0 AgentOS SDK Migration - Phases 7-11 (shipped 2026-02-07)
- v3.0 Deployment & Branding - Phases 12-17 (in progress)

## Phases

<details>
<summary>v1.0 Minimal Divergence (Phases 1-2) - SHIPPED 2026-01-31</summary>

See `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>v1.1 AgentOS Hub (Phases 3-6) - SHIPPED 2026-02-01</summary>

See `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>v2.0 AgentOS SDK Migration (Phases 7-11) - SHIPPED 2026-02-07</summary>

See `.planning/milestones/v2.0-ROADMAP.md`

</details>

### v3.0 Deployment & Branding (In Progress)

**Milestone Goal:** Make openagent installable via npm (`@worksofadam/openagent`), fully branded, and config-compatible — so users can install, configure an AgentOS endpoint, and chat with agents.

#### Phase 12: Package Configuration

**Goal**: Package metadata reflects openagent brand and scoped publishing name

**Depends on**: Nothing (first phase of milestone)

**Requirements**: PUB-03, BRD-03

**Success Criteria** (what must be TRUE):
  1. Package name is `@worksofadam/openagent` in package.json
  2. Package version is set to `0.1.0`
  3. Package display name and description reference openagent
  4. Package.json bin field correctly points to openagent CLI

**Plans**: 1 plan

Plans:
- [x] 12-01-PLAN.md — Update package.json identity fields (name, version, description, author, repository, keywords)

#### Phase 13: Config File Dual Support

**Goal**: Users can configure openagent using either openagent.json or opencode.json with identical behavior

**Depends on**: Phase 12

**Requirements**: CFG-01, CFG-02, CFG-03, CFG-04

**Success Criteria** (what must be TRUE):
  1. App reads openagent.json if present
  2. App falls back to opencode.json if openagent.json not found
  3. Existing OPENCODE_* environment variables continue to work
  4. Both config file formats validate identically
  5. Config resolution logic is tested and verified

**Plans**: 1 plan

Plans:
- [x] 13-01-PLAN.md — Add dual config file resolution (openagent.json preferred, opencode.json fallback)

#### Phase 14: User-Facing Text Branding

**Goal**: All user-visible text references "openagent" instead of "opencode"

**Depends on**: Phase 13

**Requirements**: BRD-01, BRD-04, BRD-05

**Success Criteria** (what must be TRUE):
  1. Help text and --version output show "openagent"
  2. Error messages reference "openagent" not "opencode"
  3. Log output references "openagent" consistently
  4. CLI welcome/banner text uses openagent branding
  5. User cannot see "opencode" in normal usage

**Plans**: 2 plans

Plans:
- [x] 14-01-PLAN.md — Update CLI scriptName, command descriptions, and console messages to reference "openagent"
- [ ] 14-02-PLAN.md — Gap closure: Update TUI tips, notifications, and provider dialogs to reference "openagent"

#### Phase 15: GitHub Actions CI/CD Cleanup

**Goal**: Disable irrelevant opencode-specific workflows and configure essential CI workflows for the openagent fork

**Depends on**: Phase 14

**Requirements**: BRD-02

**Success Criteria** (what must be TRUE):
  1. Opencode-specific workflows are disabled (not removed) via `if: false` condition
  2. Essential PR workflows (typecheck, test) trigger on PRs to main branch
  3. PR standards workflow has correct team whitelist
  4. Maintenance workflows (stale issues/PRs) work for the fork
  5. No workflow runs fail due to missing opencode-specific secrets or repo checks

**Plans**: TBD

Plans:
- [ ] 15-01: TBD

#### Phase 16: Publishing Pipeline

**Goal**: GitHub Actions workflow builds and publishes @worksofadam/openagent to npm on release tags

**Depends on**: Phase 15

**Requirements**: PUB-01, PUB-02, PUB-05

**Success Criteria** (what must be TRUE):
  1. New publish workflow builds package on v* tags
  2. Workflow publishes @worksofadam/openagent to npm with correct credentials
  3. Published package includes only necessary files (no dev artifacts)
  4. PR workflow runs typecheck and build validation
  5. Workflow is simple and maintainable (single workflow file)

**Plans**: 1 plan

Plans:
- [ ] 16-01-PLAN.md — Create publish-openagent.yml (npm publish on v* tags), ci.yml (PR quality gate), and fix package.json for publishing

#### Phase 17: Release Verification

**Goal**: Package is published, tagged, and verified installable end-to-end

**Depends on**: Phase 16

**Requirements**: PUB-04, REL-01, REL-02

**Success Criteria** (what must be TRUE):
  1. Git tag v0.1.0 exists at release commit
  2. User can run `npm i -g @worksofadam/openagent` successfully
  3. Installed openagent binary works and shows correct version
  4. README contains accurate npm install instructions
  5. Published package appears on npmjs.com at correct scope

**Plans**: TBD

Plans:
- [ ] 17-01: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Git Divergence | v1.0 | 1/1 | Complete | 2026-01-31 |
| 2. CLI & Branding | v1.0 | 2/2 | Complete | 2026-01-31 |
| 3. UI Infrastructure | v1.1 | 2/2 | Complete | 2026-02-01 |
| 4. Agent List View | v1.1 | 1/1 | Complete | 2026-02-01 |
| 5. Agent Detail View | v1.1 | 1/1 | Complete | 2026-02-01 |
| 6. Model Provider Separation | v1.1 | 1/1 | Complete | 2026-02-01 |
| 7. SDK Client Foundation | v2.0 | 2/2 | Complete | 2026-02-07 |
| 8. Agent Discovery Migration | v2.0 | 1/1 | Complete | 2026-02-07 |
| 9. Streaming & Language Model | v2.0 | 2/2 | Complete | 2026-02-07 |
| 10. Tool Confirmation & Run Lifecycle | v2.0 | 2/2 | Complete | 2026-02-07 |
| 11. E2E Verification & Type Cleanup | v2.0 | 2/2 | Complete | 2026-02-07 |
| 12. Package Configuration | v3.0 | 1/1 | Complete | 2026-02-08 |
| 13. Config File Dual Support | v3.0 | 1/1 | Complete | 2026-02-08 |
| 14. User-Facing Text Branding | v3.0 | 0/1 | Not started | - |
| 15. TUI Tips Content | v3.0 | 0/TBD | Not started | - |
| 16. Publishing Pipeline | v3.0 | 0/TBD | Not started | - |
| 17. Release Verification | v3.0 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-31*
*Last updated: 2026-02-08 (Phase 14 planned)*
