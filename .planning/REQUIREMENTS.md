# Requirements: openagent

**Defined:** 2026-01-31
**Core Value:** Connect to AgentOS agents from the terminal

## v1 Requirements

Requirements for initial divergence milestone. Minimal changes to establish openagent identity.

### Git Divergence

- [ ] **GIT-01**: Squash git history into single initial commit with opencode attribution
- [ ] **GIT-02**: Push squashed history to new openagent repository (https://github.com/ajshedivy/openagent.git)

### CLI Binary

- [ ] **CLI-01**: Rename bin file from `opencode` to `openagent`
- [ ] **CLI-02**: Update package.json bin field to register `openagent` command
- [ ] **CLI-03**: Update bin script internal references (env var, binary names, error messages)
- [ ] **CLI-04**: Verify `openagent` command works with existing local install instructions

### Branding

- [ ] **BRAND-01**: Update ASCII art banner in logo.ts from "opencode" to "openagent"

### Documentation

- [ ] **DOC-01**: Add openagent initiative section to top of README.md (English only)

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Full Rebrand

- **REBRAND-01**: Rename package scope from `@opencode-ai/*` to `@openagent/*`
- **REBRAND-02**: Rename directory `packages/opencode/` to `packages/openagent/`
- **REBRAND-03**: Update all import statements referencing old package names
- **REBRAND-04**: Update config directory `.opencode/` to `.openagent/`
- **REBRAND-05**: Update config file `opencode.json` to `openagent.json`
- **REBRAND-06**: Update environment variables `OPENCODE_*` to `OPENAGENT_*`
- **REBRAND-07**: Update documentation and README files

### Cleanup

- **CLEAN-01**: Remove non-AgentOS AI provider integrations
- **CLEAN-02**: Remove enterprise features
- **CLEAN-03**: Update all user-visible strings mentioning "opencode"

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full package scope rename | Defer to v2 - not needed for local testing |
| Directory structure changes | Defer to v2 - breaking change |
| Environment variable rename | Defer to v2 - keep compatibility |
| Full documentation rewrite | Defer to v2 - just add initiative section for now |
| NPM publishing | Defer until full rebrand complete |
| Native binary builds | Defer until full rebrand complete |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GIT-01 | Phase 1 | Pending |
| GIT-02 | Phase 1 | Pending |
| CLI-01 | Phase 2 | Pending |
| CLI-02 | Phase 2 | Pending |
| CLI-03 | Phase 2 | Pending |
| CLI-04 | Phase 2 | Pending |
| BRAND-01 | Phase 2 | Pending |
| DOC-01 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after initial definition*
