# Technology Stack: TypeScript Monorepo Rename

**Project:** opencode-agno (opencode → openagent)
**Researched:** 2026-01-31
**Confidence:** HIGH

## Overview

Renaming a TypeScript/Bun monorepo involves updating multiple layers of configuration, code references, and infrastructure. This document provides a prescriptive guide for renaming from "opencode" to "openagent" with specific file paths and dependencies mapped from this codebase.

## Core Technologies

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Bun | 1.3.5 | Package manager & runtime | Monorepo workspace support, see `package.json` |
| TypeScript | 5.8.2 | Type system | Multiple tsconfig files across packages |
| Turbo | 2.5.6 | Build orchestration | Task dependencies in `turbo.json` |
| Tauri | 2.x | Desktop app framework | Native executable with deep linking |
| Rust | Stable | Desktop backend | Cargo package in `packages/desktop/src-tauri/` |

## Rename Scope Dimensions

### 1. Package Names & Scopes

**Current state:**
- NPM scope: `@opencode-ai/*`
- Binary name: `opencode`
- Repository: `anomalyco/opencode`

**Files requiring updates:**

| File | Current Value | Update To | Priority |
|------|---------------|-----------|----------|
| `/package.json` | `"name": "opencode"` | `"name": "openagent"` | P0 |
| `/package.json` | `"@opencode-ai/plugin": "workspace:*"` | `"@openagent/plugin": "workspace:*"` | P0 |
| `/package.json` | `"@opencode-ai/script": "workspace:*"` | `"@openagent/script": "workspace:*"` | P0 |
| `/package.json` | `"@opencode-ai/sdk": "workspace:*"` | `"@openagent/sdk": "workspace:*"` | P0 |
| `/package.json` | `"repository": { "url": "https://github.com/anomalyco/opencode" }` | Update to new repo URL | P0 |

**All package.json files:**
```bash
# Complete list of package.json files to update
/package.json
/packages/opencode/package.json → /packages/openagent/package.json
/packages/app/package.json
/packages/ui/package.json
/packages/util/package.json
/packages/sdk/js/package.json
/packages/plugin/package.json
/packages/script/package.json
/packages/web/package.json
/packages/desktop/package.json
/packages/slack/package.json
/packages/enterprise/package.json
/packages/function/package.json
/packages/console/app/package.json
/packages/console/core/package.json
/packages/console/function/package.json
/packages/console/mail/package.json
/packages/console/resource/package.json
/github/package.json
/sdks/vscode/package.json
```

**Scope change pattern:**
- All `@opencode-ai/*` → `@openagent/*`
- Uses Bun workspace protocol: `"workspace:*"`
- See [Bun Workspaces documentation](https://bun.com/docs/pm/workspaces) for workspace protocol behavior
- When publishing, `workspace:*` versions are replaced by actual semver

### 2. Directory & File Names

**Directories to rename:**

| Current Path | New Path | Contains |
|--------------|----------|----------|
| `/packages/opencode/` | `/packages/openagent/` | Main CLI package |
| `/.opencode/` | `/.openagent/` | Local config directory |

**Files to rename:**

| Current Path | New Path | Type |
|--------------|----------|------|
| `/.opencode/opencode.jsonc` | `/.openagent/openagent.jsonc` | User config |
| `/packages/opencode/bin/opencode` | `/packages/openagent/bin/openagent` | CLI shim |
| `/nix/opencode.nix` | `/nix/openagent.nix` | Nix package definition |
| `/install` | Keep same name | Install script (content update only) |

### 3. Binary & Executable Names

**CLI binary:**
- Current: `opencode` command
- New: `openagent` command

**Files requiring updates:**

| File | Line(s) | Current | Update To |
|------|---------|---------|-----------|
| `/packages/opencode/package.json` | 21 | `"opencode": "./bin/opencode"` | `"openagent": "./bin/openagent"` |
| `/packages/opencode/bin/opencode` | 47 | `const base = "opencode-" + platform + "-" + arch` | `const base = "openagent-" + platform + "-" + arch` |
| `/packages/opencode/bin/opencode` | 48 | `const binary = platform === "windows" ? "opencode.exe" : "opencode"` | `const binary = platform === "windows" ? "openagent.exe" : "openagent"` |
| `/install` | 3 | `APP=opencode` | `APP=openagent` |
| `/install` | 68 | `INSTALL_DIR=$HOME/.opencode/bin` | `INSTALL_DIR=$HOME/.openagent/bin` |

### 4. Import Statements

**TypeScript/JavaScript imports:**

Files with `@opencode-ai` imports (sample from grep results):
- `packages/opencode/src/plugin/agentos.ts`
- `packages/opencode/src/provider/provider.ts`
- `packages/opencode/src/plugin/index.ts`
- `packages/slack/src/index.ts`
- `packages/sdk/js/example/example.ts`
- `script/*.ts` files
- `.opencode/tool/*.ts` files

**Pattern to find and replace:**
```bash
# Find all TypeScript imports
grep -r "from ['\"]@opencode-ai" --include="*.ts" --include="*.tsx"

# Replace pattern
@opencode-ai/plugin → @openagent/plugin
@opencode-ai/sdk → @openagent/sdk
@opencode-ai/ui → @openagent/ui
@opencode-ai/util → @openagent/util
@opencode-ai/script → @openagent/script
@opencode-ai/app → @openagent/app
```

### 5. Configuration Files

**TypeScript configs:**

All `tsconfig*.json` files (20 total) need path mapping updates if they reference:
- Package paths
- Root references

| File | Check For |
|------|-----------|
| `/tsconfig.json` | Root paths, references |
| `/packages/*/tsconfig.json` | Local extends, paths |

**Turbo config:**

| File | Updates Needed |
|------|----------------|
| `/turbo.json` | `"opencode#test"` → `"openagent#test"` |
| `/turbo.json` | `"@opencode-ai/app#test"` → `"@openagent/app#test"` |

**Tauri config (Desktop app):**

| File | Field | Current | Update To |
|------|-------|---------|-----------|
| `/packages/desktop/src-tauri/tauri.conf.json` | `productName` | `"OpenCode Dev"` | `"OpenAgent Dev"` |
| `/packages/desktop/src-tauri/tauri.conf.json` | `identifier` | `"ai.opencode.desktop.dev"` | `"ai.openagent.desktop.dev"` |
| `/packages/desktop/src-tauri/tauri.conf.json` | `mainBinaryName` | `"OpenCode"` | `"OpenAgent"` |
| `/packages/desktop/src-tauri/tauri.conf.json` | `windows[0].title` | `"OpenCode"` | `"OpenAgent"` |
| `/packages/desktop/src-tauri/tauri.conf.json` | `bundle.externalBin` | `["sidecars/opencode-cli"]` | `["sidecars/openagent-cli"]` |
| `/packages/desktop/src-tauri/tauri.conf.json` | `plugins.deep-link.desktop.schemes` | `["opencode"]` | `["openagent"]` |
| `/packages/desktop/src-tauri/tauri.prod.conf.json` | Same as above | - | - |

**Rust/Cargo config:**

| File | Field | Current | Update To |
|------|-------|---------|-----------|
| `/packages/desktop/src-tauri/Cargo.toml` | `package.name` | `"opencode-desktop"` | `"openagent-desktop"` |
| `/packages/desktop/src-tauri/Cargo.toml` | `lib.name` | `"opencode_lib"` | `"openagent_lib"` |

**Nix config:**

| File | Updates Needed |
|------|----------------|
| `/nix/opencode.nix` | Rename file + update `pname`, binary paths, references |
| `/flake.nix` | Update package references to `openagent` |

### 6. Schema & URLs

**JSON Schema references:**

| File | Current | Update To |
|------|---------|-----------|
| `/.opencode/opencode.jsonc` | `"$schema": "https://opencode.ai/config.json"` | `"$schema": "https://openagent.ai/config.json"` |
| `/.opencode/themes/mytheme.json` | `"$schema": "https://opencode.ai/theme.json"` | `"$schema": "https://openagent.ai/theme.json"` |
| `/packages/ui/src/theme/desktop-theme.schema.json` | `"$id": "https://opencode.ai/desktop-theme.json"` | `"$id": "https://openagent.ai/desktop-theme.json"` |
| `/packages/ui/src/theme/themes/*.json` | `"$schema": "https://opencode.ai/desktop-theme.json"` | `"$schema": "https://openagent.ai/desktop-theme.json"` |

**Domain references to update:**

All references to `opencode.ai` → `openagent.ai` (or new domain):
```bash
# Files containing opencode.ai
grep -r "opencode.ai" --include="*.json" --include="*.jsonc" --include="*.yml" --include="*.yaml"
```

**API endpoints:**

| File | Current | Considerations |
|------|---------|----------------|
| `/.opencode/opencode.jsonc` | `"url": "https://enterprise.dev.opencode.ai"` | Update if self-hosted |
| `/github/action.yml` | `https://api.opencode.ai` | Update if forking GitHub Actions |

### 7. GitHub Workflows & CI/CD

**Workflow files (`.github/workflows/`):**

| File | Updates Needed |
|------|----------------|
| `publish.yml` | Repository checks, binary names, Docker tags, artifact names |
| `opencode.yml` | Workflow name, binary installation |
| All other workflows | Search for `opencode` strings |

**Key patterns in publish.yml:**
- Line 34: `if: github.repository == 'anomalyco/opencode'` → Update repo check
- Line 46: `run: bun i -g opencode-ai@1.0.169` → Change package name
- Line 68-69: Git config user `opencode@sst.dev`, name `opencode` → Update
- Line 85: Artifact name `opencode-cli` → `openagent-cli`
- Line 194: Asset pattern `opencode-desktop-[platform]-[arch][ext]` → `openagent-desktop-...`
- Environment variables: `OPENCODE_BUMP`, `OPENCODE_VERSION`, `OPENCODE_API_KEY` → Consider renaming

**GitHub Action:**

| File | Updates |
|------|---------|
| `/github/action.yml` | Input descriptions, install URL, default API URL |
| `/github/README.md` | Documentation of action usage |

### 8. Documentation & User-Facing Content

**README files:**

All language variants need updating:
```
README.md
README.*.md (15+ language variants)
```

**Key sections to update:**
- Logo images (paths reference `opencode`)
- npm package name in installation instructions
- Repository URLs
- Discord/community links
- GitHub badges (workflow status, npm version)

**Markdown documentation:**

| Pattern | Files |
|---------|-------|
| `packages/*/README.md` | Package-specific docs |
| `packages/web/src/content/docs/*.mdx` | Website documentation |
| `.opencode/*/SKILL.md`, `*.md` | Local config docs |
| `specs/*.md` | Specification documents |

### 9. Build Scripts & Automation

**TypeScript build scripts:**

| File | Purpose | Updates |
|------|---------|---------|
| `/script/publish-start.ts` | Release automation | Package names, binary names |
| `/script/publish-complete.ts` | Post-publish tasks | Package names |
| `/script/changelog.ts` | Changelog generation | Repository references |
| `/packages/opencode/script/build.ts` | CLI build | Output paths, binary names |
| `/packages/opencode/script/publish.ts` | Package publish | NPM package name |
| `/packages/plugin/script/publish.ts` | Plugin publish | Scoped package name |
| `/packages/sdk/js/script/publish.ts` | SDK publish | Scoped package name |

**Environment variables:**

Scripts reference environment variables:
- `OPENCODE_VERSION` → `OPENAGENT_VERSION`
- `OPENCODE_BUMP` → `OPENAGENT_BUMP`
- `OPENCODE_CHANNEL` → `OPENAGENT_CHANNEL`
- `OPENCODE_API_KEY` → `OPENAGENT_API_KEY`
- `OPENCODE_BIN_PATH` → `OPENAGENT_BIN_PATH`

### 10. Runtime Configuration

**User config directories:**

| Current | New | Platform |
|---------|-----|----------|
| `~/.opencode/` | `~/.openagent/` | All |
| `$HOME/.opencode/bin` | `$HOME/.openagent/bin` | Install script |

**Config file structure:**

The `.opencode/` directory contains:
- `opencode.jsonc` - Main config
- `agent/` - Agent definitions
- `command/` - Custom commands
- `skill/` - Custom skills
- `tool/` - Custom tools
- `themes/` - UI themes

All need to be renamed to `.openagent/` with `openagent.jsonc`.

### 11. Docker & Containers

**Dockerfile:**

| File | Updates |
|------|---------|
| `/packages/opencode/Dockerfile` | Binary names, package references |

**Container registries:**

If publishing to `ghcr.io/anomalyco/opencode`, update to new repository.

### 12. External SDK Integrations

**VSCode extension:**

| File | Updates |
|------|---------|
| `/sdks/vscode/package.json` | Extension name, dependencies |
| `/sdks/vscode/README.md` | Documentation |

**Zed extension:**

| File | Updates |
|------|---------|
| `/packages/extensions/zed/extension.toml` | Extension metadata |

## Order of Operations

### Phase 1: Pre-Rename Preparation (P0)

1. **Freeze development** - Stop accepting PRs that modify package.json files
2. **Document current state** - Snapshot all version numbers
3. **Create rename branch** - Work on isolated branch for atomic commit
4. **Run full test suite** - Baseline test results before rename

### Phase 2: Core Rename (P0)

**Step 1: Rename directories**
```bash
# Main package directory
git mv packages/opencode packages/openagent

# Config directory
git mv .opencode .openagent
```

**Step 2: Update package.json files (all 19 files)**

Order matters due to workspace dependencies:
1. Root `/package.json` - Update name, workspace deps, repository URL
2. Leaf packages (no workspace deps): `/packages/util/`, `/packages/script/`
3. Mid-level packages: `/packages/ui/`, `/packages/sdk/js/`
4. Top-level packages: `/packages/app/`, `/packages/openagent/` (renamed)
5. Auxiliary packages: `/github/`, `/sdks/vscode/`

**Step 3: Update imports (automated)**
```bash
# Find all TypeScript files with @opencode-ai imports
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/@opencode-ai/@openagent/g'

# Verify with grep
grep -r "@opencode-ai" --include="*.ts" --include="*.tsx"
# Should return no results
```

### Phase 3: Configuration Updates (P1)

**Step 4: Update Turbo config**
```bash
# Edit turbo.json
# opencode#test → openagent#test
# @opencode-ai/app#test → @openagent/app#test
```

**Step 5: Update TypeScript configs**
```bash
# Check all tsconfig*.json files for path mappings
# Most should auto-resolve through workspace protocol
```

**Step 6: Update Tauri configs**
```bash
# Edit packages/desktop/src-tauri/tauri.conf.json
# Edit packages/desktop/src-tauri/tauri.prod.conf.json
# Update all fields from section 5 above
```

**Step 7: Update Rust config**
```bash
# Edit packages/desktop/src-tauri/Cargo.toml
# Update package name and lib name
```

### Phase 4: Infrastructure & Build (P1)

**Step 8: Update Nix configs**
```bash
git mv nix/opencode.nix nix/openagent.nix
# Edit nix/openagent.nix - update pname, paths
# Edit flake.nix - update package references
```

**Step 9: Update build scripts**
```bash
# Edit all files in /script/ directory
# Edit all files in /packages/*/script/ directories
# Update package names, binary names, env vars
```

**Step 10: Update GitHub workflows**
```bash
# Edit all .github/workflows/*.yml files
# Update repository checks, binary names, artifact names
# Update environment variable names
```

### Phase 5: Documentation & User-Facing (P2)

**Step 11: Update install script**
```bash
# Edit /install
# APP=opencode → APP=openagent
# INSTALL_DIR path update
```

**Step 12: Update README files**
```bash
# All README*.md files (16+ files)
# Update package names, install commands, URLs
```

**Step 13: Update docs site**
```bash
# packages/web/src/content/docs/*.mdx
# Update all code examples and references
```

**Step 14: Update schemas and URLs**
```bash
# All JSON schema $schema and $id fields
# opencode.ai → openagent.ai (or new domain)
```

### Phase 6: Verification (P0)

**Step 15: Reinstall dependencies**
```bash
# Clear lockfile and reinstall
rm bun.lock
bun install
```

**Step 16: Run build**
```bash
bun run typecheck
bun run build # in each package
```

**Step 17: Run tests**
```bash
bun run test # in each package with tests
```

**Step 18: Test CLI binary**
```bash
cd packages/openagent
bun run build
./dist/openagent-*/bin/openagent --version
```

**Step 19: Search for remaining references**
```bash
# Case-sensitive search for old name
grep -r "opencode" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.yml" \
  | grep -v "node_modules" | grep -v ".git"

# Check for old scope
grep -r "@opencode-ai" --include="*.ts" --include="*.tsx" --include="*.json"

# Should only find references in:
# - Comments/documentation (OK)
# - Historical changelog (OK)
# - Git history (OK)
```

## Dependencies Between Changes

### Critical Path

```
Directory Rename → package.json Updates → Import Updates → Dependency Reinstall → Build → Test
```

### Dependency Graph

```
package.json updates
  ├─ Must complete before: Import statement updates
  ├─ Must complete before: Dependency reinstall
  └─ Blocks: All build/test activities

Import updates
  ├─ Depends on: package.json updates
  └─ Must complete before: Type checking

Turbo config updates
  ├─ Depends on: package.json updates (task names reference packages)
  └─ Must complete before: Build orchestration

Tauri config updates
  ├─ Independent of package.json
  ├─ Must complete before: Desktop build
  └─ Affects: Deep linking, binary names

GitHub workflow updates
  ├─ Independent of code changes
  ├─ Should match: New repository location
  └─ Affects: CI/CD, releases

Documentation updates
  ├─ Independent of code changes
  └─ Should complete before: Public announcement
```

### Parallel-Safe Operations

These can be done in parallel (no dependencies):
- README updates
- Docs site updates
- Schema URL updates
- GitHub workflow updates (except repository checks)
- Nix config updates

## Tools & Commands

### Recommended Tools

| Tool | Purpose | Command |
|------|---------|---------|
| `git mv` | Rename directories | `git mv packages/opencode packages/openagent` |
| `sed` | Bulk find/replace | `sed -i '' 's/@opencode-ai/@openagent/g' file.ts` |
| `grep` | Verify changes | `grep -r "opencode" --include="*.ts"` |
| `bun` | Package manager | `bun install`, `bun run build` |
| TypeScript compiler | Type checking | `bun run typecheck` |

### Verification Scripts

**Check for old package name:**
```bash
#!/bin/bash
# check-rename-complete.sh

echo "Checking for @opencode-ai references..."
grep -r "@opencode-ai" --include="*.ts" --include="*.tsx" --include="*.json" \
  | grep -v node_modules | grep -v .git

echo "Checking for opencode binary references..."
grep -r '"opencode"' --include="*.json" | grep -v node_modules | grep -v .git

echo "Checking package.json names..."
find . -name package.json -exec grep -l '"name".*opencode' {} \;
```

**Validate workspace structure:**
```bash
# After rename, verify all workspace deps resolve
bun install --dry-run
```

## Pitfalls to Avoid

### 1. Inconsistent Renames

**Problem:** Renaming some but not all references leads to broken imports.

**Prevention:**
- Use global find/replace for scope changes
- Run verification grep after each phase
- Use TypeScript compiler to catch missing imports

### 2. Forgetting Binary Names

**Problem:** Binary executable names are referenced in multiple places (package.json, install script, CI/CD).

**Prevention:**
- Checklist all binary name locations (see section 3)
- Test install script locally
- Verify GitHub workflow artifact names

### 3. Breaking Workspace Protocol

**Problem:** Invalid workspace references prevent `bun install` from working.

**Prevention:**
- Update root package.json first
- Update all package.json files before running `bun install`
- Use `workspace:*` protocol consistently

### 4. Schema URL Dead Links

**Problem:** Changing `$schema` URLs before hosting new schemas breaks IDE validation.

**Prevention:**
- Keep old schema URLs active during transition, OR
- Update schemas only after new domain is live with schemas hosted

### 5. Tauri Deep Linking

**Problem:** Deep link scheme (`opencode://`) is registered in OS. Renaming breaks existing links.

**Prevention:**
- Document that deep linking scheme changes
- Consider migration period supporting both schemes
- Update all documentation with new scheme

### 6. Docker Build Context

**Problem:** Dockerfile references package paths that change.

**Prevention:**
- Update Dockerfile `COPY` commands for renamed directories
- Test Docker build locally before pushing

### 7. Git History Preservation

**Problem:** Bulk find/replace creates unreadable git blame history.

**Prevention:**
- Use `git mv` for directory renames (preserves history)
- Consider separate commits for:
  1. Directory renames (`git mv`)
  2. package.json updates
  3. Import statement updates
  4. Documentation updates
- This allows git blame to follow file history better

### 8. Bun Lockfile Conflicts

**Problem:** Changing package names invalidates existing lockfile.

**Prevention:**
- Delete `bun.lock` after all package.json updates
- Run `bun install` fresh to regenerate lockfile
- Commit new lockfile in same PR as rename

### 9. Published Package Confusion

**Problem:** Old NPM packages (`opencode-ai`) still exist and may confuse users.

**Prevention:**
- Publish deprecation notice to old NPM packages
- Add deprecation warning to old package README
- Point users to new packages in deprecation message

### 10. Environment Variable Scope

**Problem:** Scripts and CI/CD reference environment variables with old names.

**Prevention:**
- Search for all `OPENCODE_*` environment variables
- Update scripts and workflow files
- Document new environment variable names
- Consider supporting both old and new names during transition

## Post-Rename Validation

### Checklist

- [ ] All package.json files updated with new scope
- [ ] All imports updated from `@opencode-ai` to `@openagent`
- [ ] Directories renamed (`packages/opencode`, `.opencode`)
- [ ] Binary names updated (package.json bin field, install script)
- [ ] Turbo config task names updated
- [ ] Tauri config updated (identifier, productName, deep-link scheme)
- [ ] Cargo.toml package name updated
- [ ] Nix configs updated
- [ ] GitHub workflows updated (repo checks, artifact names)
- [ ] Install script updated
- [ ] All README files updated
- [ ] Docs site updated
- [ ] Schema URLs updated
- [ ] `bun.lock` regenerated
- [ ] `bun install` succeeds
- [ ] `bun run typecheck` passes
- [ ] All tests pass
- [ ] CLI binary builds and runs
- [ ] Desktop app builds
- [ ] No grep results for old scope in code files
- [ ] Git history preserved for moved files

### Test Plan

**Local testing:**
1. Fresh clone of rename branch
2. `bun install` - should complete without errors
3. `bun run typecheck` - should pass
4. Build CLI: `cd packages/openagent && bun run build`
5. Test CLI: `./dist/openagent-*/bin/openagent --version`
6. Build desktop: `cd packages/desktop && bun run build`
7. Run tests: `bun run test` in packages with tests

**CI/CD testing:**
1. Push rename branch to test repository
2. Verify GitHub workflows run
3. Check artifact names match new naming
4. Verify Docker build succeeds

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Breaking internal imports | HIGH | TypeScript compiler will catch; run typecheck |
| Workspace deps unresolved | HIGH | Delete lockfile, fresh install; test before commit |
| Binary name conflicts | MEDIUM | Test install script locally; check PATH |
| Deep link registration broken | MEDIUM | Document scheme change; consider dual support |
| CI/CD failures | MEDIUM | Test in fork before pushing to main repo |
| User confusion | LOW | Clear documentation; deprecation notices |

## Success Criteria

Rename is complete when:
1. ✅ All code references updated (no grep hits for old scope)
2. ✅ `bun install` succeeds from fresh clone
3. ✅ All TypeScript compilation passes
4. ✅ All tests pass
5. ✅ CLI binary builds and runs
6. ✅ Desktop app builds
7. ✅ Install script works with new binary name
8. ✅ Documentation updated
9. ✅ GitHub workflows updated and passing
10. ✅ Git history preserved (git log --follow works for renamed files)

## References

- [Bun Workspaces Documentation](https://bun.com/docs/pm/workspaces) - Workspace protocol and package management
- [npm Workspaces Guide](https://docs.npmjs.com/cli/v8/using-npm/workspaces/) - Workspace concepts (applicable to Bun)
- [Managing TypeScript Packages in Monorepos](https://nx.dev/blog/managing-ts-packages-in-monorepos) - TypeScript monorepo patterns
- [TypeScript in Monorepo](https://graphite.com/guides/typescript-in-monorepo) - Path mappings and project references
- [Git Move Files Guide](https://thelinuxcode.com/git-move-files-practical-renames-refactors-and-history-preservation-in-2026/) - Preserving git history during renames

## Notes

- This monorepo uses Bun's workspace protocol (`workspace:*`) exclusively for internal dependencies
- The workspace protocol automatically resolves to local packages during development
- When publishing, workspace versions are replaced by actual semver from package.json
- Bun 1.3.5 has full workspace support comparable to pnpm/yarn
- Git history preservation is critical for long-term maintainability - use `git mv` for directory renames
- Consider a migration period where old package names are deprecated but still functional
