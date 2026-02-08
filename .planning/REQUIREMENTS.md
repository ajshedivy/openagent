# Requirements: openagent

**Defined:** 2026-02-08
**Core Value:** Connect to AgentOS agents from the terminal with a great user experience

## v3.0 Requirements

Requirements for v3.0 Deployment & Branding milestone. Each maps to roadmap phases.

### Publishing

- [ ] **PUB-01**: GitHub Actions workflow builds the package on push/tag
- [ ] **PUB-02**: GitHub Actions publishes `@worksofadam/openagent` to npm on `v*` tag
- [ ] **PUB-03**: `package.json` sets name to `@worksofadam/openagent`, version `0.1.0`
- [ ] **PUB-04**: User can `npm i -g @worksofadam/openagent` and run `openagent` CLI
- [ ] **PUB-05**: Package includes only necessary files (no dev artifacts, tests, planning docs)

### Config

- [ ] **CFG-01**: App reads `openagent.json` as primary config file
- [ ] **CFG-02**: App falls back to `opencode.json` if `openagent.json` not found
- [ ] **CFG-03**: Existing `OPENCODE_*` environment variables continue to work unchanged
- [ ] **CFG-04**: Config schema validates identically for both config file names

### Branding

- [ ] **BRD-01**: All user-facing "opencode" text strings replaced with "openagent"
- [ ] **BRD-02**: TUI tips/hints updated to openagent-specific content
- [ ] **BRD-03**: Package display name in `package.json` reflects "openagent"
- [ ] **BRD-04**: Error messages and log output reference "openagent" not "opencode"
- [ ] **BRD-05**: Help text and `--version` output show "openagent"

### Release

- [ ] **REL-01**: Git tag `v0.1.0` created at release
- [ ] **REL-02**: README updated with npm install instructions

## Future Requirements

### Platform Binaries

- **BIN-01**: Prebuilt binaries for linux-x64, darwin-arm64, windows-x64
- **BIN-02**: Platform-specific npm packages (`@worksofadam/openagent-linux-x64`, etc.)

### Full Internal Rebrand

- **REB-01**: Internal package directory renamed from `opencode` to `openagent`
- **REB-02**: Internal module/import paths updated

## Out of Scope

| Feature | Reason |
|---------|--------|
| Platform binary packages | Deferred — npm publish sufficient for v3.0 |
| Renaming `OPENCODE_*` env vars | Backward compatibility — existing vars preserved |
| Unscoped `openagent` npm package | Scoped `@worksofadam/openagent` only |
| Internal directory/module rename | Internals can remain `opencode` for now |
| Teams/Workflows hub implementation | Separate feature milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PUB-01 | — | Pending |
| PUB-02 | — | Pending |
| PUB-03 | — | Pending |
| PUB-04 | — | Pending |
| PUB-05 | — | Pending |
| CFG-01 | — | Pending |
| CFG-02 | — | Pending |
| CFG-03 | — | Pending |
| CFG-04 | — | Pending |
| BRD-01 | — | Pending |
| BRD-02 | — | Pending |
| BRD-03 | — | Pending |
| BRD-04 | — | Pending |
| BRD-05 | — | Pending |
| REL-01 | — | Pending |
| REL-02 | — | Pending |

**Coverage:**
- v3.0 requirements: 16 total
- Mapped to phases: 0
- Unmapped: 16 ⚠️

---
*Requirements defined: 2026-02-08*
*Last updated: 2026-02-08 after initial definition*
