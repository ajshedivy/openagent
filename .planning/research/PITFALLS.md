# Domain Pitfalls: Monorepo Rename/Fork

**Domain:** TypeScript monorepo rename and GitHub fork migration
**Researched:** 2026-01-31
**Confidence:** HIGH (verified with official docs and recent 2025-2026 sources)

## Critical Pitfalls

These mistakes cause rewrites, data loss, or major breaking changes for users.

### Pitfall 1: GitHub Redirect Breaking When New Repo Created

**What goes wrong:** GitHub redirects from old repo name work indefinitely... UNTIL someone creates a new repo at the old location. Then all redirects immediately break.

**Why it happens:** GitHub's redirect system prioritizes active repos over redirects. If `anomalyco/opencode` is created after you've renamed/forked to `anomalyco/openagent`, the redirect stops working instantly.

**Consequences:**
- Users cloning from old URL get wrong repo (or 404 if someone else claims the name)
- GitHub Actions referencing the old repo fail with "repository not found"
- Forks and pull requests pointing to old location break
- README badges and links across the internet break

**Prevention:**
1. Reserve the old name: Create a stub repo at `anomalyco/opencode` immediately after fork
2. Add clear README: "This project has moved to anomalyco/openagent"
3. Archive the stub repo: Mark it as archived so users know it's not active
4. Update GitHub Actions: Never rely on redirects for workflows - update all action references immediately

**Detection:**
- Test clone from old URL after fork: `git clone https://github.com/anomalyco/opencode.git`
- Monitor 404s in GitHub traffic analytics
- Search GitHub for repos referencing old name

**Sources:**
- [GitHub repository rename redirect behavior](https://github.com/orgs/community/discussions/22669)
- [GitHub Actions workflow breakage](https://github.com/github/docs/issues/15575)

---

### Pitfall 2: Workspace Dependencies Not Updated (849+ occurrences)

**What goes wrong:** The monorepo has 849 occurrences of `@opencode-ai` across 228 files. Missing even one breaks the build or causes runtime import failures.

**Why it happens:**
- Scoped package names (`@opencode-ai/*`) are in 5 places per package:
  1. `package.json` "name" field
  2. `package.json` "dependencies" fields
  3. Import statements in source files
  4. TypeScript type references
  5. Build tool configs (turbo.json, tsconfig.json)
- Global find/replace catches most but misses:
  - Comments and documentation
  - String literals in code
  - JSON schema references
  - Lock file entries (bun.lock has 66 occurrences)

**Consequences:**
- Build fails with "module not found" errors
- Bun workspace resolution breaks
- Type checking fails on cross-package imports
- Published packages have wrong dependencies

**Prevention:**
1. **Audit workspace dependencies:**
   ```bash
   grep -r "@opencode-ai" --include="*.json" --include="*.ts" --include="*.tsx"
   ```

2. **Update in order:**
   - Step 1: Root `package.json` workspace dependencies
   - Step 2: All `package.json` files (name + dependencies)
   - Step 3: Source code imports
   - Step 4: Type references
   - Step 5: Config files (turbo.json, tsconfig paths)
   - Step 6: Delete and regenerate `bun.lock` (never manual edit)

3. **Verify each package builds:**
   ```bash
   bun run typecheck  # Run in each workspace
   ```

4. **Test workspace protocol:**
   ```bash
   # Ensure workspace:* references work
   bun install
   bun run build
   ```

**Detection:**
- Build fails: "Cannot find module '@opencode-ai/sdk'"
- Runtime error: Module not found
- Type errors: Cannot find namespace
- Turbo cache misses: Tasks rebuild unnecessarily

**Sources:**
- [Bun workspace dependency resolution issues](https://github.com/oven-sh/bun/issues/10889)
- [Workspace packages getting stale](https://github.com/oven-sh/bun/issues/3686)

---

### Pitfall 3: CLI Binary Name Breaking Global Installs

**What goes wrong:** Users with `npm install -g opencode-ai` have a binary called `opencode` in their PATH. After rename to `openagent`, the binary name changes and their scripts/aliases break.

**Why it happens:** The binary name is defined in `packages/opencode/package.json`:
```json
"bin": {
  "opencode": "./bin/opencode"
}
```

When you rename the package to `@openagent/cli`, the binary becomes `openagent`, but users' systems still have the old binary.

**Consequences:**
- User runs `opencode` and gets old version (or "command not found" if they uninstalled)
- Shell scripts using `opencode` command fail
- CI/CD pipelines break
- VS Code extension commands fail (uses `opencode.openTerminal`)
- Documentation and tutorials show wrong command

**Prevention:**
1. **Transition period: Support both binary names**
   ```json
   "bin": {
     "openagent": "./bin/openagent",
     "opencode": "./bin/opencode-deprecated"
   }
   ```
   Where `opencode-deprecated` prints:
   ```
   WARNING: 'opencode' is deprecated. Use 'openagent' instead.
   The 'opencode' binary will be removed in v2.0.0
   ```

2. **Document migration path:**
   ```bash
   npm uninstall -g opencode-ai
   npm install -g @openagent/cli
   ```

3. **Update VS Code extension immediately:**
   - All command IDs in `sdks/vscode/package.json`
   - Extension activation commands
   - Keyboard shortcuts

4. **Add postinstall message:**
   ```json
   "scripts": {
     "postinstall": "node ./script/migration-notice.js"
   }
   ```

**Detection:**
- Test global install flow
- Check `which opencode` vs `which openagent`
- Verify VS Code extension commands work

**Sources:**
- [exercism CLI binary naming issue](https://github.com/exercism/cli/issues/139)
- [Langchain CLI binary installation problems](https://github.com/langchain-ai/langchain/issues/13743)

---

### Pitfall 4: Environment Variables Breaking User Configs

**What goes wrong:** The codebase uses environment variables like `OPENCODE_BUMP`, `OPENCODE_VERSION`, `OPENCODE_API_KEY`. Users with `.env` files or CI/CD configs must update all of these.

**Why it happens:** Environment variables are in:
- GitHub Actions workflows (`.github/workflows/publish.yml` has `OPENCODE_*` vars)
- User config files (`.opencode/opencode.jsonc`)
- Docker containers
- CI/CD pipelines
- Local development `.env` files

**Consequences:**
- GitHub Actions workflows fail silently (missing env vars)
- API authentication fails (wrong key name)
- Feature flags don't work (old var names)
- Docker builds fail (missing build args)

**Prevention:**
1. **Support both old and new env vars during transition:**
   ```typescript
   const apiKey = process.env.OPENAGENT_API_KEY || process.env.OPENCODE_API_KEY
   if (process.env.OPENCODE_API_KEY) {
     console.warn('OPENCODE_API_KEY is deprecated. Use OPENAGENT_API_KEY')
   }
   ```

2. **Document all env var renames:**
   Create `MIGRATION.md`:
   ```
   Environment Variable Changes:
   - OPENCODE_API_KEY -> OPENAGENT_API_KEY
   - OPENCODE_BUMP -> OPENAGENT_BUMP
   - OPENCODE_VERSION -> OPENAGENT_VERSION
   ```

3. **Update GitHub workflows first:**
   - Use organization/repository secrets
   - Update workflow files before merge
   - Test workflows in fork before production

4. **Migration script for user configs:**
   ```bash
   # .opencode/ -> .openagent/
   if [ -d ~/.opencode ]; then
     echo "Migrating config from ~/.opencode to ~/.openagent"
     mv ~/.opencode ~/.openagent
   fi
   ```

**Detection:**
- Workflows fail with unclear errors
- Auth errors in production
- Feature toggles don't work
- grep for old env var names: `grep -r "OPENCODE_" .github/`

**Sources:**
- [Salesforce CLI config migration](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_mig_env_config.htm)
- [Environment variable migration issues](https://github.com/SigNoz/signoz/issues/7294)

---

### Pitfall 5: NPM Package Deprecation Not Communicating Migration Path

**What goes wrong:** You publish `@openagent/cli` but forget to deprecate `opencode-ai` on npm. Users keep installing the old package and get confused.

**Why it happens:** npm deprecation is a separate manual step. Just publishing a new package doesn't tell existing users to migrate.

**Consequences:**
- Users install wrong/outdated package
- Bug reports for old package you're not maintaining
- Ecosystem fragmentation (some use old, some use new)
- Security vulnerabilities in old package

**Prevention:**
1. **Deprecate old package immediately after publishing new one:**
   ```bash
   npm deprecate opencode-ai "Package renamed to @openagent/cli. Install with: npm install @openagent/cli"
   ```

2. **Publish a final version of old package that shows migration notice:**
   ```javascript
   // opencode-ai/index.js
   console.error(`
   ============================================
   WARNING: opencode-ai is deprecated
   This package has been renamed to @openagent/cli

   Please update your package.json:
   npm uninstall opencode-ai
   npm install @openagent/cli
   ============================================
   `)
   ```

3. **Update old package README on npm:**
   - Add banner: "DEPRECATED - Use @openagent/cli instead"
   - Link to migration guide
   - Show install command for new package

4. **Announce 6-12 months in advance:**
   - Blog post
   - GitHub Discussions
   - Release notes
   - Email users (if you have a list)

5. **Maintain old package for transition period (3-6 months):**
   - Security fixes only
   - Clear timeline for full deprecation

**Detection:**
- Check npm download stats for old package
- Monitor issue tracker for confusion
- `npm view opencode-ai` shows deprecation notice

**Sources:**
- [npm deprecation best practices](https://docs.npmjs.com/deprecating-and-undeprecating-packages-or-package-versions/)
- [Package deprecation policy](https://json-server.dev/deprecation-package-policy/)
- [Lerna package renaming guide](https://medium.com/@dlacustodio/lerna-a-tale-of-renaming-npm-packages-4d3c534bc31)

---

### Pitfall 6: Docker Image Name Breaking Production Deployments

**What goes wrong:** Production systems pulling `ghcr.io/anomalyco/opencode:latest` continue pulling old images even after you publish `ghcr.io/anomalyco/openagent:latest`.

**Why it happens:**
- Docker image registry is part of the tag (`ghcr.io/org/name:tag`)
- Renaming doesn't automatically alias old images
- Users' docker-compose.yml and K8s manifests have hardcoded image names

**Consequences:**
- Production deployments use stale images
- Security patches don't reach users
- Users confused why features missing (running old image)
- CI/CD pipelines fail when old image eventually deleted

**Prevention:**
1. **Publish to BOTH image names during transition:**
   ```yaml
   # In GitHub Actions
   - name: Push to old location (transitional)
     run: |
       docker tag openagent:latest ghcr.io/anomalyco/opencode:latest
       docker push ghcr.io/anomalyco/opencode:latest

   - name: Push to new location
     run: |
       docker tag openagent:latest ghcr.io/anomalyco/openagent:latest
       docker push ghcr.io/anomalyco/openagent:latest
   ```

2. **Add deprecation notice to old image:**
   ```dockerfile
   # Old image Dockerfile
   RUN echo "WARNING: ghcr.io/anomalyco/opencode is deprecated" > /etc/motd
   RUN echo "Use ghcr.io/anomalyco/openagent instead" >> /etc/motd
   ```

3. **Update documentation with both images:**
   ```
   # Recommended (new)
   docker pull ghcr.io/anomalyco/openagent:latest

   # Legacy (will be removed 2026-06-01)
   docker pull ghcr.io/anomalyco/opencode:latest
   ```

4. **Set retention policy on old images:**
   - Keep old images for 6 months minimum
   - Add clear sunset date in release notes

**Detection:**
- Pull both images and verify they're identical
- Monitor download stats in GitHub Container Registry
- Test deployment with new image name

**Sources:**
- [Docker image tag management](https://docs.docker.com/reference/cli/docker/image/tag/)
- [Docker Registry migration 2025](https://dasroot.net/posts/2025/12/docker-registry-setup-and-image/)
- [GitHub Container Registry migration](https://www.docker.com/blog/docker-best-practices-using-tags-and-labels-to-manage-docker-image-sprawl/)

---

## Moderate Pitfalls

These cause delays or technical debt but are recoverable.

### Pitfall 7: Import Paths Not Updated in Source Files

**What goes wrong:** Automated find/replace misses dynamic imports, require statements, and type-only imports.

**Why it happens:**
- String literals: `import(/* webpackChunkName: "opencode" */ "@opencode-ai/sdk")`
- Conditional imports: `const mod = condition ? "@opencode-ai/sdk" : "@other"`
- Type imports: `import type { Config } from "@opencode-ai/sdk"`
- JSDoc comments: `@see {@link @opencode-ai/sdk}`

**Prevention:**
1. Use TypeScript compiler to find imports:
   ```bash
   # This will error on missing modules
   bun run typecheck
   ```

2. Search for string literals:
   ```bash
   grep -r '"@opencode-ai' --include="*.ts" --include="*.tsx"
   grep -r "'@opencode-ai" --include="*.ts" --include="*.tsx"
   grep -r "\`@opencode-ai" --include="*.ts" --include="*.tsx"
   ```

3. Check dynamic imports separately:
   ```bash
   grep -r "import(" --include="*.ts" | grep "opencode"
   ```

**Sources:**
- [TypeScript import path management](https://blog.logrocket.com/using-path-aliases-cleaner-react-typescript-imports/)

---

### Pitfall 8: TypeScript Path Aliases Breaking After Rename

**What goes wrong:** If you use tsconfig.json path aliases pointing to `@opencode-ai/*`, they break after package rename.

**Why it happens:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@opencode-ai/*": ["packages/*/src"]
    }
  }
}
```

After rename, the path alias doesn't match the new package name.

**Prevention:**
1. **Prefer workspace protocol over path aliases:**
   ```json
   // package.json (better)
   "dependencies": {
     "@openagent/sdk": "workspace:*"
   }
   ```

2. **If using path aliases, update tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@openagent/*": ["packages/*/src"]
       }
     }
   }
   ```

3. **Modern approach: Use Node.js subpath imports (2025+ recommended):**
   ```json
   // package.json
   {
     "imports": {
       "#sdk": "@openagent/sdk",
       "#util": "@openagent/util"
     }
   }
   ```

**Sources:**
- [TypeScript paths in monorepo](https://github.com/vercel/turborepo/discussions/620)
- [Managing TypeScript packages in monorepos](https://nx.dev/blog/managing-ts-packages-in-monorepos)

---

### Pitfall 9: Hardcoded Strings in Documentation and Comments

**What goes wrong:** Comments, error messages, and documentation still reference "opencode" causing user confusion.

**Why it happens:** Find/replace often skips:
- Comments (developers think they don't matter)
- String literals (not caught by type system)
- README files in subdirectories
- Markdown documentation
- JSDoc comments

**Prevention:**
1. Search for all references:
   ```bash
   grep -ri "opencode" --include="*.md" --include="*.ts" --include="*.tsx"
   ```

2. Update error messages:
   ```typescript
   // Before
   throw new Error("opencode config not found")

   // After
   throw new Error("openagent config not found")
   ```

3. Check internationalized content:
   - Multiple README languages (README.zh.md, README.fr.md, etc.)
   - Translation files
   - Help text

**Prevention checklist:**
- [ ] README.md (all languages)
- [ ] CONTRIBUTING.md
- [ ] Error messages
- [ ] JSDoc comments
- [ ] Code comments
- [ ] Examples in `/examples` or `/docs`

---

### Pitfall 10: Config File Paths Breaking User Experience

**What goes wrong:** The config file is `.opencode/opencode.jsonc` with schema at `https://opencode.ai/config.json`. Users need to migrate both location AND schema URL.

**Why it happens:** Three things change at once:
1. Directory name: `.opencode/` -> `.openagent/`
2. File name: `opencode.jsonc` -> `openagent.jsonc`
3. Schema URL: `https://opencode.ai/config.json` -> `https://openagent.ai/config.json`

**Consequences:**
- CLI looks for config in wrong location
- User's existing config ignored
- Schema validation fails
- IDE autocomplete breaks

**Prevention:**
1. **Support both locations during transition:**
   ```typescript
   const configPaths = [
     path.join(homeDir, '.openagent', 'openagent.jsonc'),  // new
     path.join(homeDir, '.opencode', 'opencode.jsonc'),     // old (fallback)
   ]

   for (const configPath of configPaths) {
     if (fs.existsSync(configPath)) {
       config = loadConfig(configPath)
       if (configPath.includes('.opencode')) {
         console.warn('Config location changed: mv ~/.opencode ~/.openagent')
       }
       break
     }
   }
   ```

2. **Auto-migrate on first run:**
   ```typescript
   if (fs.existsSync('~/.opencode') && !fs.existsSync('~/.openagent')) {
     console.log('Migrating config from ~/.opencode to ~/.openagent')
     fs.renameSync('~/.opencode', '~/.openagent')
     fs.renameSync('~/.openagent/opencode.jsonc', '~/.openagent/openagent.jsonc')
   }
   ```

3. **Keep old schema URL redirecting:**
   ```
   https://opencode.ai/config.json -> 301 redirect -> https://openagent.ai/config.json
   ```

**Detection:**
- Test with existing user config
- Verify schema autocomplete in VS Code
- Check CLI finds config in both locations

---

### Pitfall 11: Bun Lock File Desync

**What goes wrong:** After renaming packages, `bun.lock` still references old package names (66 occurrences of `@opencode-ai`), causing resolution failures.

**Why it happens:** Lock files are binary in Bun and can't be manually edited. They contain cached resolution data with old package names.

**Consequences:**
- `bun install` fails or resolves wrong versions
- Workspace dependencies don't link correctly
- CI/CD gets different packages than local dev

**Prevention:**
1. **Delete and regenerate lock file:**
   ```bash
   rm bun.lock
   bun install
   ```

2. **NEVER manually edit bun.lock:**
   - It's a binary format
   - Corruption causes cryptic errors

3. **Commit new lock file immediately:**
   ```bash
   git add bun.lock
   git commit -m "chore: regenerate lock file after rename"
   ```

4. **Verify workspace links work:**
   ```bash
   bun install
   ls -la node_modules/@openagent  # Should show symlinks to workspace packages
   ```

**Detection:**
- `bun install` fails with "package not found"
- Workspace packages resolve from registry instead of local
- Different behavior between `bun install` and `npm install`

**Sources:**
- [Bun workspace dependency issues](https://github.com/oven-sh/bun/issues/10889)

---

## Minor Pitfalls

These cause annoyance but are easily fixable.

### Pitfall 12: GitHub Actions Hardcoded Repository Checks

**What goes wrong:** Workflows have hardcoded repo checks that fail after fork/rename:

```yaml
if: github.repository == 'anomalyco/opencode'
```

After forking to new org or renaming, this condition is always false and workflows skip.

**Prevention:**
1. Search for hardcoded repo references:
   ```bash
   grep -r "anomalyco/opencode" .github/
   ```

2. Update to new repo name or remove check:
   ```yaml
   if: github.repository == 'anomalyco/openagent'
   ```

3. Or use environment variable:
   ```yaml
   env:
     REPO_NAME: anomalyco/openagent
   jobs:
     build:
       if: github.repository == env.REPO_NAME
   ```

---

### Pitfall 13: Package Manager Symlink Confusion

**What goes wrong:** Running `npm install <package>` from inside a workspace directory breaks Bun workspace symlinks.

**Why it happens:** Mixing package managers (npm vs bun) in a monorepo creates conflicting node_modules structures.

**Prevention:**
1. Always use `bun add` for Bun workspaces
2. Add `.npmrc` to prevent npm usage:
   ```
   # .npmrc
   engine-strict=true
   ```
3. Add `package.json` engine restriction:
   ```json
   "engines": {
     "bun": ">=1.3.5"
   }
   ```

**Sources:**
- [Monorepo package management pitfalls](https://github.com/palmerhq/monorepo-starter/blob/master/README.md)

---

### Pitfall 14: Turbo Cache Invalidation

**What goes wrong:** After package rename, Turbo cache contains stale artifacts built with old package names.

**Why it happens:** Turbo cache keys don't include package names, only file hashes.

**Prevention:**
```bash
# Clear Turbo cache after rename
rm -rf .turbo
bun run build  # Rebuild everything
```

---

### Pitfall 15: VS Code Extension ID Cannot Change

**What goes wrong:** VS Code extension ID is in `sdks/vscode/package.json` as `publisher.name`. If you change this, it becomes a NEW extension and users don't get updates.

**Current ID:** `sst-dev.opencode`

**Why it happens:** VS Code Marketplace uses publisher.name as primary key. Changing it breaks update mechanism.

**Prevention:**
1. **Keep extension ID unchanged:**
   ```json
   {
     "name": "opencode",  // Keep same
     "publisher": "sst-dev",  // Keep same
     "displayName": "OpenAgent for VS Code"  // Can change
   }
   ```

2. **Or publish as NEW extension with migration path:**
   - Publish `sst-dev.openagent` as new extension
   - Update old extension with deprecation notice
   - Point users to new extension in VS Code Marketplace

**Sources:**
- [VS Code extension publishing best practices](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Package.json renames | Missing workspace dependencies | Run `bun install` after EACH package.json change |
| Source code imports | Dynamic imports missed | Use TypeScript compiler to catch all imports |
| GitHub workflow updates | Hardcoded repo names | Search all `.github/` files for old org/repo |
| npm publishing | Old package not deprecated | Run `npm deprecate` immediately after new publish |
| Docker image migration | Production systems using old image | Dual-publish to both image names for 6 months |
| Config migration | User configs ignored | Auto-detect and migrate `~/.opencode` to `~/.openagent` |
| Environment variables | CI/CD pipelines fail silently | Support both old and new env vars with warnings |
| Binary name change | Global installs break | Ship both binary names during transition |

---

## Validation Checklist

Before considering rename complete, verify:

**Build & Type Safety:**
- [ ] `bun install` succeeds
- [ ] `bun run typecheck` passes in all workspaces
- [ ] `bun run build` succeeds
- [ ] No references to `@opencode-ai` in source code
- [ ] No references to `opencode` in package.json files
- [ ] New `bun.lock` generated and committed

**User Impact:**
- [ ] Old npm package deprecated with migration message
- [ ] Old Docker image tagged with deprecation notice
- [ ] GitHub redirect tested (clone from old URL works)
- [ ] Config auto-migration implemented (`~/.opencode` -> `~/.openagent`)
- [ ] Binary name transition plan documented
- [ ] Environment variable compatibility added

**Documentation:**
- [ ] README.md updated (all languages)
- [ ] MIGRATION.md created with checklist
- [ ] Error messages reference new name
- [ ] Schema URLs updated
- [ ] Examples and tutorials updated

**Infrastructure:**
- [ ] GitHub Actions workflows updated
- [ ] Docker images published to new location
- [ ] DNS/domains updated if applicable
- [ ] CI/CD secrets renamed
- [ ] Monitoring/alerting updated

**Deprecation Timeline:**
- [ ] 6-12 month notice given
- [ ] Sunset date communicated
- [ ] Support plan for old package documented
- [ ] Rollback plan if needed

---

## Research Confidence

| Area | Confidence | Verification Source |
|------|------------|---------------------|
| GitHub redirects | HIGH | GitHub official docs, community discussions |
| Workspace dependencies | HIGH | Actual codebase grep (849 occurrences found) |
| CLI binary renaming | HIGH | Multiple CLI projects' GitHub issues |
| npm deprecation | HIGH | npm official documentation |
| Docker image migration | MEDIUM | Docker docs + 2025 registry migrations |
| Bun workspace quirks | MEDIUM | Bun GitHub issues, reported bugs |
| Config migration | HIGH | Codebase analysis (.opencode/ directory exists) |
| TypeScript paths | MEDIUM | Nx blog, Turborepo discussions |

---

## Sources

**Official Documentation:**
- [npm package deprecation](https://docs.npmjs.com/deprecating-and-undeprecating-packages-or-package-versions/)
- [GitHub repository renaming](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
- [Docker image tagging](https://docs.docker.com/reference/cli/docker/image/tag/)
- [Bun workspaces](https://bun.com/docs/pm/workspaces)

**Community Knowledge (2025-2026):**
- [Lerna package renaming tale](https://medium.com/@dlacustodio/lerna-a-tale-of-renaming-npm-packages-4d3c534bc31)
- [GitHub redirect duration discussion](https://github.com/orgs/community/discussions/22669)
- [TypeScript workspace patterns](https://nx.dev/blog/managing-ts-packages-in-monorepos)
- [Package deprecation policy best practices](https://json-server.dev/deprecation-package-policy/)
- [Bun workspace issues](https://github.com/oven-sh/bun/issues/7547)
- [Docker registry migration 2025](https://dasroot.net/posts/2025/12/docker-registry-setup-and-image/)

**Codebase Analysis:**
- 849 occurrences of `@opencode-ai` across 228 files (verified via grep)
- Current binary name: `opencode` in packages/opencode/package.json
- Environment variables: `OPENCODE_*` in .github/workflows/publish.yml
- Config location: `.opencode/opencode.jsonc` with schema reference
- VS Code extension ID: `sst-dev.opencode` in sdks/vscode/package.json
