# Feature Landscape: OpenCode to OpenAgent Rename

**Domain:** Codebase Renaming/Rebranding
**Researched:** 2026-01-31
**Confidence:** HIGH (based on comprehensive codebase grep analysis)

## Summary

This research identifies all occurrences of "opencode" in the codebase that need to be renamed to "openagent" for the fork/rename operation. The codebase contains **586 files** with "opencode" references across multiple categories.

## Must Rename (Critical - Breaks Functionality)

These changes are required for the application to function correctly with the new name.

| Feature | Why Critical | File Count | Notes |
|---------|--------------|------------|-------|
| Package scope `@opencode-ai/*` | NPM package publishing, imports fail | ~200 files | All workspace package names, imports, dependencies |
| CLI binary `opencode` | User-facing command, PATH references | ~20 files | `bin/opencode`, package.json bin field, install scripts |
| Config directory `.opencode/` | User configuration path, feature discovery | ~50 files | Documentation, code references to config paths |
| Config file `opencode.json(c)` | Configuration loading logic | ~30 files | Parser references, schema URLs, i18n strings |
| Environment variables `OPENCODE_*` | Runtime configuration | ~15 files | Server, storage, deployment configs |
| Repository URL `github.com/anomalyco/opencode` | Git operations, install scripts | ~30 files | package.json, README files, CI/CD |
| Domain references `opencode.ai` | API endpoints, download links, auth | ~100 files | URLs, schema references, service endpoints |
| GitHub App `opencode-agent[bot]` | GitHub integration bot name | ~10 files | Workflows, git config, SDK |
| Provider name `opencode` (Zen) | Model provider identifier | ~5 files | Config, i18n, provider system |

## Should Rename (Branding/Consistency)

These changes are important for brand consistency but won't break functionality immediately.

| Feature | Why Important | File Count | Notes |
|---------|---------------|------------|-------|
| Documentation references | User-facing branding | ~80 files | All README*.md files (15 languages), docs site content |
| Display names in UI | User experience consistency | ~50 files | i18n files, package.json displayName, extension names |
| Comments and internal docs | Developer experience | ~100 files | Code comments, planning docs, AGENTS.md files |
| Image assets | Visual branding | ~10 files | Icons, screenshots, logos in packages/web/src/assets/ |
| GitHub Actions workflow names | CI/CD clarity | ~5 files | Workflow YAML file names and job names |
| VSCode extension metadata | Marketplace presence | 1 file | sdks/vscode/package.json (name, displayName, description) |
| Desktop app metadata | Application identity | 1 file | packages/desktop/package.json |

## Can Keep (Internal/No Impact)

These items can remain unchanged without affecting functionality or user experience.

| Feature | Why Safe to Keep | Notes |
|---------|------------------|-------|
| Git history | Historical record | Commit messages, branch names in history |
| Archived documentation | Reference material | Old changelog entries (but new ones should use new name) |
| Internal variable names | Code internals | Some internal variable names if not user-facing |
| Test fixtures | Test data | Unless tests validate against actual config/names |

## Detailed Breakdown by Category

### 1. Package Scope: `@opencode-ai/*`

**Impact:** HIGH - NPM publishing and module resolution

**Files affected:** ~200 files

**Specific packages to rename:**
- `@opencode-ai/app` → `@openagent-ai/app`
- `@opencode-ai/console-core` → `@openagent-ai/console-core`
- `@opencode-ai/console-resource` → `@openagent-ai/console-resource`
- `@opencode-ai/console-mail` → `@openagent-ai/console-mail`
- `@opencode-ai/desktop` → `@openagent-ai/desktop`
- `@opencode-ai/docs` → `@openagent-ai/docs`
- `@opencode-ai/plugin` → `@openagent-ai/plugin`
- `@opencode-ai/script` → `@openagent-ai/script`
- `@opencode-ai/sdk` → `@openagent-ai/sdk`
- `@opencode-ai/ui` → `@openagent-ai/ui`
- `@opencode-ai/util` → `@openagent-ai/util`

**Location examples:**
- `/package.json` (lines 76-78)
- All `packages/*/package.json` files
- All import statements: `import { X } from "@opencode-ai/Y"`
- Documentation: `.planning/codebase/CONVENTIONS.md`, specs files

### 2. CLI Binary: `opencode`

**Impact:** HIGH - User-facing command

**Files affected:** ~20 files

**Locations:**
- `/packages/opencode/package.json` (line 21: `"bin": { "opencode": "./bin/opencode" }`)
- `/packages/opencode/bin/opencode` (actual binary script)
- `/install` script (lines 68, 170-171)
- `/bun.lock` (line 263)
- All README files: installation instructions using `opencode` command
- VSCode extension: `sdks/vscode/package.json` commands (lines 28-29, 36, 44, etc.)

**Note:** Also consider the package directory name `/packages/opencode/` itself

### 3. Config Directory: `.opencode/`

**Impact:** HIGH - Configuration and feature discovery

**Files affected:** ~50 files

**Locations:**
- `.planning/codebase/STRUCTURE.md` (line 10)
- `.planning/codebase/TESTING.md` (lines 216, 220, 345)
- All documentation in `packages/web/src/content/docs/*.mdx`:
  - `config.mdx` (lines 49, 55, 135, 143, 337, 401)
  - `themes.mdx` (lines 87-88, 108-109)
  - `skills.mdx` (line 17)
  - `modes.mdx` (line 271)
  - `custom-tools.mdx` (line 21)
  - `plugins.mdx` (line 23)
- Actual project config: `.opencode/` directory itself
- Install script fallback: `$HOME/.opencode/bin` in README files (line 85)

### 4. Config File: `opencode.json` / `opencode.jsonc`

**Impact:** HIGH - Configuration loading

**Files affected:** ~30 files

**Locations:**
- `.gitignore` (line 19)
- `.planning/codebase/STACK.md` (line 14)
- `.planning/codebase/TESTING.md` (line 202)
- All i18n files in `packages/app/src/i18n/*.ts`:
  - `dialog.plugins.empty`: "Plugins configured in opencode.json"
  - `error.chain.checkConfig`: "Check your config (opencode.json) provider/model names"
- Actual config file: `.opencode/opencode.jsonc`
- Schema reference in config file: `"$schema": "https://opencode.ai/config.json"`

### 5. Global Config: `~/.config/opencode/`

**Impact:** HIGH - User configuration path

**Files affected:** ~30 files

**Locations:**
- Documentation files in `packages/web/src/content/docs/*.mdx`:
  - `config.mdx` (lines 46, 55, 98)
  - `commands.mdx` (lines 82, 85)
  - `modes.mdx` (lines 90, 93, 271, 297)
  - `custom-tools.mdx` (line 21)
  - `providers.mdx` (lines 959, 987)
  - `skills.mdx` (lines 17, 28)
  - `rules.mdx` (lines 65, 74, 92, 95, 101, 222)
  - `themes.mdx` (lines 86, 101-102)
  - `permissions.mdx` (line 222)
  - `plugins.mdx` (lines 23, 58, 60)
  - `troubleshooting.mdx` (lines 60, 78)

### 6. Environment Variables: `OPENCODE_*`

**Impact:** HIGH - Runtime configuration

**Files affected:** ~15 files

**Specific variables to rename:**
- `OPENCODE_INSTALL_DIR` → `OPENAGENT_INSTALL_DIR`
- `OPENCODE_DEPLOYMENT_TARGET` → `OPENAGENT_DEPLOYMENT_TARGET`
- `OPENCODE_BASE_URL` → `OPENAGENT_BASE_URL`
- `OPENCODE_MODELS_URL` → `OPENAGENT_MODELS_URL`
- `OPENCODE_STORAGE_ADAPTER` → `OPENAGENT_STORAGE_ADAPTER`
- `OPENCODE_STORAGE_ACCOUNT_ID` → `OPENAGENT_STORAGE_ACCOUNT_ID`
- `OPENCODE_STORAGE_ACCESS_KEY_ID` → `OPENAGENT_STORAGE_ACCESS_KEY_ID`
- `OPENCODE_STORAGE_SECRET_ACCESS_KEY` → `OPENAGENT_STORAGE_SECRET_ACCESS_KEY`
- `OPENCODE_STORAGE_BUCKET` → `OPENAGENT_STORAGE_BUCKET`
- `OPENCODE_VERSION` → `OPENAGENT_VERSION`
- `OPENCODE_CHANNEL` → `OPENAGENT_CHANNEL`
- `OPENCODE_PERMISSION` → `OPENAGENT_PERMISSION`
- `OPENCODE_API_KEY` → `OPENAGENT_API_KEY`
- `OPENCODE_SERVER_PASSWORD` → `OPENAGENT_SERVER_PASSWORD`
- `OPENCODE_CALLER` → `OPENAGENT_CALLER`
- `_EXTENSION_OPENCODE_PORT` → `_EXTENSION_OPENAGENT_PORT`

**Locations:**
- All README*.md files (installation instructions)
- `SECURITY.md` (line 17)
- `.planning/codebase/INTEGRATIONS.md` (lines 200-201, 231)
- `.planning/codebase/STACK.md` (lines 198-200)
- `.planning/codebase/CONVENTIONS.md` (line 20)
- `infra/enterprise.ts` (lines 11-15)
- `sdks/vscode/src/extension.ts` (lines 37, 59-60)
- `.github/workflows/*.yml` (review.yml, triage.yml, daily-pr-recap.yml)
- `nix/opencode.nix` (lines 37-38)

### 7. Repository References: `github.com/anomalyco/opencode`

**Impact:** HIGH - Git operations, CI/CD, install scripts

**Files affected:** ~30 files

**Locations:**
- Root `package.json` (line 83: `"url": "https://github.com/anomalyco/opencode"`)
- `sdks/vscode/package.json` (line 9)
- All README*.md files (~15 files):
  - Build status badges
  - Release page links
  - Issue reporting links
- `SECURITY.md` (line 35)
- `install` script (lines 44, 170-171)
- `github/action.yml` (line 44)
- `github/README.md` (line 104)

### 8. Domain References: `opencode.ai`

**Impact:** HIGH - API endpoints, services, downloads

**Files affected:** ~100 files

**Specific URLs to update:**
- `https://opencode.ai` → `https://openagent.ai`
- `https://opencode.ai/install` → `https://openagent.ai/install`
- `https://opencode.ai/download` → `https://openagent.ai/download`
- `https://opencode.ai/discord` → `https://openagent.ai/discord`
- `https://opencode.ai/zen` → `https://openagent.ai/zen`
- `https://opencode.ai/docs/*` → `https://openagent.ai/docs/*`
- `https://opencode.ai/config.json` → `https://openagent.ai/config.json`
- `https://opencode.ai/theme.json` → `https://openagent.ai/theme.json`
- `https://api.opencode.ai/*` → `https://api.openagent.ai/*`
- `https://dev.opencode.ai` → `https://dev.openagent.ai`
- `https://enterprise.dev.opencode.ai` → `https://enterprise.dev.openagent.ai`
- `https://app.opencode.ai` → `https://app.openagent.ai`
- `https://auth.dev.opencode.ai` → `https://auth.dev.openagent.ai`
- `https://models.dev` (may or may not need change - verify separately)

**Locations:**
- All README*.md files
- Theme files: `themes/*.json` (`$schema` field)
- Config file: `.opencode/opencode.jsonc` (schema, enterprise URL)
- Documentation: `packages/web/src/content/docs/*.mdx`
- Infrastructure: `infra/stage.ts`, `github/index.ts`
- Web package: `packages/web/package.json` (dev script)
- i18n files: `packages/app/src/i18n/*.ts` (provider.connect.opencodeZen references)

### 9. GitHub App: `opencode-agent[bot]`

**Impact:** HIGH - GitHub integration

**Files affected:** ~10 files

**Rename to:** `openagent-bot[bot]` or similar

**Locations:**
- `.github/workflows/duplicate-prs.yml` (line 19)
- `.github/workflows/pr-standards.yml` (line 19)
- `script/changelog.ts` (line 17)
- `github/index.ts` (lines 666-667)
- `github/README.md` (line 63: `https://github.com/apps/opencode-agent`)
- `sdks/vscode/bun.lock` (line 5)
- `packages/web/src/content/docs/github.mdx` (line 36)
- `packages/opencode/src/cli/cmd/github.ts` (lines 134, 321)

**Note:** This also requires creating/reconfiguring the GitHub App itself

### 10. Provider Name: `opencode` (Zen provider)

**Impact:** MEDIUM - Model provider identifier

**Files affected:** ~5 files

**Locations:**
- `.opencode/opencode.jsonc` (line 8: provider config)
- `packages/app/src/i18n/*.ts` files:
  - `provider.connect.opencodeZen.*` translation keys
- Provider registration code (search for provider definitions)

### 11. Documentation Content

**Impact:** MEDIUM - User-facing content

**Files affected:** ~80 files

**Major categories:**
- **README files (15 languages):**
  - README.md, README.*.md (ar, br, da, de, es, fr, it, ja, ko, no, pl, ru, th, zh, zht)
  - All contain product name, installation instructions, URLs, badges

- **Documentation site:**
  - `packages/web/src/content/docs/*.mdx` (~30 files)
  - All references to "OpenCode" product name

- **Planning/internal docs:**
  - `.planning/codebase/*.md` (7 files)
  - `.planning/PROJECT.md`
  - `specs/*.md` (8 files)
  - Various AGENTS.md, README.md in packages

### 12. Package Metadata

**Impact:** MEDIUM - Publishing and distribution

**Files affected:** ~5 files

**VSCode Extension (`sdks/vscode/package.json`):**
- `name`: "opencode" → "openagent"
- `displayName`: "opencode" → "OpenAgent"
- `description`: "opencode for VS Code" → "OpenAgent for VS Code"
- `repository.url`
- All `command` IDs: `opencode.*` → `openagent.*`
- All command titles mentioning "opencode"

**Desktop App (`packages/desktop/package.json`):**
- Package name already scoped: `@opencode-ai/desktop` → `@openagent-ai/desktop`

**Root package.json:**
- `name`: "opencode" → "openagent"
- `description`: Update product name
- `repository.url`
- Workspace dependencies

**Main CLI package (`packages/opencode/package.json`):**
- `name`: "opencode" → "openagent"
- `bin.opencode` → `bin.openagent`
- Directory name: `packages/opencode/` → `packages/openagent/`

## Special Considerations

### Constants and Code Patterns

**Convention references (`.planning/codebase/CONVENTIONS.md`):**
- Line 20: `OPENCODE_SKILL_GLOB` constant name pattern
- This suggests internal constants follow `OPENCODE_*` pattern

**Search for these patterns in code:**
```typescript
OPENCODE_SKILL_GLOB
CLAUDE_SKILL_GLOB  // Keep as-is, Claude-specific
SKILL_GLOB
```

### Schema URLs

Both config and theme files reference schema URLs:
- `"$schema": "https://opencode.ai/config.json"`
- `"$schema": "https://opencode.ai/theme.json"`

These need to work post-rename, requiring either:
1. Domain ownership and DNS setup for openagent.ai
2. Updating schema URLs to new domain
3. Redirects from old to new

### GitHub Actions and Workflows

Workflow file: `.github/workflows/opencode.yml`
- Rename file to `openagent.yml`
- Update any references within workflows

### Authentication and OIDC

`github/action.yml` line 34:
- Default URL: `https://api.opencode.ai`
- Used for OIDC token exchange
- Critical for auth flow

### Install Script

The `/install` script is heavily referenced in documentation and contains:
- Download URLs pointing to GitHub releases
- Installation directory defaults
- Binary name assumptions

### Nix Package

`nix/opencode.nix`:
- File should be renamed
- Contains version and channel environment variables

## Rename Strategy Recommendations

### Phase 1: Critical Path (Must Complete for Fork)
1. Update all package.json files (names, bin, dependencies)
2. Rename package directories (`packages/opencode/` → `packages/openagent/`)
3. Update all import statements (`@opencode-ai/*` → `@openagent-ai/*`)
4. Update bin references (CLI command name)
5. Update repository URLs
6. Rename GitHub App and update references

### Phase 2: Configuration (Required for Runtime)
1. Update config directory paths (`.opencode/` → `.openagent/`)
2. Update config file names (opencode.json → openagent.json)
3. Update global config paths (`~/.config/opencode/` → `~/.config/openagent/`)
4. Update all environment variable names (`OPENCODE_*` → `OPENAGENT_*`)
5. Update schema URLs

### Phase 3: Documentation (Required for Users)
1. Update all README files (15 language versions)
2. Update documentation site content
3. Update install script
4. Update VSCode extension metadata
5. Update domain references (requires openagent.ai DNS)

### Phase 4: Branding (Polish)
1. Update image assets
2. Update UI display names
3. Update i18n strings
4. Update internal documentation
5. Update comments

## Automated Rename Tools

**Recommended approach:**
1. Use `rg` (ripgrep) with `--files-with-matches` to find all files
2. Use `sed` or custom script for bulk replacements
3. Handle special cases manually (binary names, directory names)
4. Test thoroughly after each category

**Example commands:**
```bash
# Find all package.json files
rg --files | rg 'package\.json$'

# Replace @opencode-ai/ with @openagent-ai/ in all TypeScript files
rg -t ts -t tsx '@opencode-ai/' -l | xargs sed -i 's/@opencode-ai\//@openagent-ai\//g'

# Replace opencode.json references
rg 'opencode\.jsonc?' -l | xargs sed -i 's/opencode\.json/openagent.json/g'
```

## Validation Checklist

After rename, verify:
- [ ] All packages build successfully (`bun run build`)
- [ ] All tests pass (`bun test`)
- [ ] Type checking passes (`bun run typecheck`)
- [ ] CLI installs and runs (`openagent --version`)
- [ ] Config files load from correct paths
- [ ] Environment variables are read correctly
- [ ] Documentation renders correctly
- [ ] Links in documentation are valid
- [ ] VSCode extension activates
- [ ] Desktop app launches
- [ ] GitHub Actions run successfully

## Estimated Effort

Based on file counts:

| Category | Files | Estimated Hours | Risk |
|----------|-------|-----------------|------|
| Package scope (@opencode-ai/*) | 200 | 4-6 | HIGH |
| CLI binary name | 20 | 2-3 | HIGH |
| Config paths (.opencode/) | 50 | 3-4 | HIGH |
| Environment variables | 15 | 1-2 | MEDIUM |
| Repository URLs | 30 | 1-2 | LOW |
| Domain references | 100 | 3-4 | MEDIUM |
| Documentation | 80 | 6-8 | LOW |
| Testing & validation | N/A | 8-12 | HIGH |
| **Total** | **~586** | **28-41 hours** | - |

**Note:** This is developer time, not wall-clock time. Parallel execution possible for independent categories.

## Sources

- **HIGH Confidence:** Direct codebase analysis via grep/ripgrep
  - `grep -ri "opencode"` across entire repository
  - `rg "@opencode-ai/"` for package scope
  - `rg "OPENCODE_"` for environment variables
  - `rg "opencode\.ai"` for domain references
  - Manual verification of key files (package.json, config files)
