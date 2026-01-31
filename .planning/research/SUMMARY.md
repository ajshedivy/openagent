# Project Research Summary

**Project:** OpenCode to OpenAgent Fork and Rename
**Domain:** TypeScript Monorepo Rebranding and Repository Divergence
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

This project involves forking the "opencode-agno" TypeScript monorepo into a new independent repository called "openagent" while performing a comprehensive rename operation. The research reveals this is fundamentally a **controlled divergence operation** requiring coordination across four dimensions: technical stack (Bun workspaces, TypeScript compilation), feature scope (586 occurrences of "opencode" across 228 files), git architecture (squashed history recommended for clean identity), and critical pitfalls (workspace dependency resolution, NPM deprecation, user migration paths).

The recommended approach is **squashed history with comprehensive rename automation**. Create a single initial commit that establishes openagent as a distinct product while preserving attribution to opencode, then execute a phased rename operation starting with critical package infrastructure (package.json files, workspace dependencies) before moving to user-facing elements (CLI binary, config paths, documentation). The monorepo uses Bun's `workspace:*` protocol extensively, meaning all package renames must complete before dependency reinstallation.

Key risks center on **user experience continuity**: the CLI binary name changes from `opencode` to `openagent`, config directory moves from `~/.opencode/` to `~/.openagent/`, and environment variables change from `OPENCODE_*` to `OPENAGENT_*`. Mitigation requires supporting dual naming during a transition period (6-12 months), implementing auto-migration for config files, and publishing comprehensive deprecation notices to NPM and Docker registries.

## Key Findings

### Recommended Stack

The codebase is a mature TypeScript monorepo using modern tooling optimized for rapid iteration. Research confirms the existing stack is production-ready and should be preserved during rename.

**Core technologies:**
- **Bun 1.3.5**: Package manager and runtime — provides workspace protocol (`workspace:*`) for internal dependencies, critical for rename operation as lockfile must be regenerated after all package.json updates
- **TypeScript 5.8.2**: Type system — monorepo has 20+ tsconfig files with path mappings that need verification after rename but should auto-resolve through workspace protocol
- **Turbo 2.5.6**: Build orchestration — task dependency graph references package names in turbo.json (e.g., `opencode#test`), requires update to `openagent#test`
- **Tauri 2.x**: Desktop app framework — configuration includes deep linking scheme (`opencode://`), product name, bundle identifier, and sidecar binary names, all must change

**Critical file locations documented:**
- 19 package.json files requiring name/scope updates
- 849 occurrences of `@opencode-ai` scope across codebase
- 2 main directories requiring rename: `/packages/opencode/` and `/.opencode/`
- 15+ environment variables following `OPENCODE_*` pattern

### Expected Features

Research identified all 586 occurrences of "opencode" categorized by impact level and priority. This is not a "feature landscape" in the traditional sense but rather a **comprehensive rename scope** with clear criticality tiers.

**Must rename (critical - breaks functionality):**
- Package scope `@opencode-ai/*` → `@openagent/*` across 200 files (NPM publishing, import resolution)
- CLI binary `opencode` → `openagent` in 20 files (user-facing command, PATH references)
- Config directory `.opencode/` → `.openagent/` in 50 files (feature discovery, user config)
- Environment variables `OPENCODE_*` → `OPENAGENT_*` in 15 files (runtime configuration)
- Repository URL `github.com/anomalyco/opencode` → new repo URL in 30 files
- Domain references `opencode.ai` → `openagent.ai` in 100 files (API endpoints, schemas)

**Should rename (branding/consistency):**
- Documentation references across 80 files (15 language README variants, docs site)
- UI display names in 50 files (i18n, package.json displayName fields)
- Image assets and visual branding (10 files)
- GitHub Actions workflow names (5 files)
- VSCode extension metadata (sdks/vscode/package.json)

**Can defer (internal/no impact):**
- Git history commit messages (historical record)
- Archived documentation sections (reference material)
- Internal variable names not exposed to users

### Architecture Approach

The optimal git architecture for this divergence is **Option 2: Squashed History**. This creates a clean fork identity while preserving attribution to the original opencode codebase.

**Rationale:**
- Clean starting point for new project (single initial commit marks divergence)
- Lightweight history (avoids carrying 8,461 commits of opencode baggage)
- Attribution preserved in comprehensive initial commit message
- Future independence (no confusion about which commits belong to which project)
- Simplifies contributor onboarding (new contributors don't need opencode context)

**Git workflow components:**
1. **GitHub Repository Creation** — create empty "openagent" repo without initializing README/license (prevents merge conflicts)
2. **History Squashing** — use `git reset --soft <root_commit>` to stage entire codebase, then create single initial commit with detailed attribution
3. **Upstream Removal** — completely remove upstream remote (`git remote remove upstream`) to establish complete divergence
4. **Force Push** — push to new origin with `--force` (safe on empty new repository)
5. **Verification** — confirm commit count is 1, remote shows only new origin, files all present

**Major post-divergence operations:**
1. Directory renames using `git mv` (preserves history within new repo)
2. Package.json updates in dependency order (root → leaf packages → top-level)
3. Import statement updates (automated via sed with TypeScript verification)
4. Configuration updates (Turbo, TypeScript, Tauri, Rust/Cargo)
5. Infrastructure updates (GitHub workflows, Nix, Docker)
6. Documentation and user-facing content updates

### Critical Pitfalls

Research identified 15 pitfalls across critical/moderate/minor severity. Top 5 requiring active prevention:

1. **GitHub redirect breaking when new repo created** — If someone claims the `anomalyco/opencode` name after fork, all redirects instantly break. **Prevention:** Reserve the old name with stub repo immediately, add clear "moved to openagent" README, archive the stub.

2. **Workspace dependencies not updated (849 occurrences)** — Missing even one `@opencode-ai` reference breaks build. **Prevention:** Update in strict order (root package.json → leaf packages → top-level → imports), delete and regenerate bun.lock after all package.json changes, run `bun run typecheck` to catch missing imports.

3. **CLI binary name breaking global installs** — Users with `opencode` in their PATH suddenly have wrong command. **Prevention:** Support both binary names during transition (6-12 months), publish deprecation warnings, update VSCode extension commands immediately.

4. **Environment variables breaking user configs** — CI/CD and user `.env` files reference `OPENCODE_*` variables. **Prevention:** Support both old and new env vars with deprecation warnings, document all renames in MIGRATION.md, update GitHub Actions secrets before merge.

5. **NPM package deprecation not communicating migration** — Users keep installing old `opencode-ai` package. **Prevention:** Run `npm deprecate opencode-ai "Package renamed to @openagent/cli"` immediately after publishing new package, publish final version of old package with migration notice in console output, maintain security fixes for 3-6 months.

**Phase-specific warnings:**
- Package.json renames: Run `bun install` after EACH package.json change
- Source code imports: Use TypeScript compiler to catch dynamic imports
- Docker migration: Dual-publish to both old and new image names for 6 months
- Config migration: Auto-detect and migrate `~/.opencode` → `~/.openagent` on first run

## Implications for Roadmap

Based on combined research, the rename operation should be structured as **6 sequential phases** due to tight technical dependencies (workspace resolution requires complete package.json updates before rebuilding).

### Phase 1: Git Divergence and Repository Setup
**Rationale:** Must establish new independent repository before any rename operations to create clean divergence point and prevent confusion with upstream.

**Delivers:**
- New GitHub repository "openagent" created (empty)
- Squashed history with single comprehensive initial commit
- Upstream remote removed (complete divergence from opencode)
- Verified independence (only new origin remote present)

**Critical dependencies:**
- No file renames yet (squashed commit captures current state)
- All AgentOS integration work committed and clean
- Backup of current repository created

**Avoids:** Pitfall #1 (GitHub redirect breaking) by reserving old name, Pitfall #6 (preserving full history creating identity confusion)

**Research flag:** Standard git workflow, well-documented — **skip research-phase**

---

### Phase 2: Core Package Infrastructure
**Rationale:** Workspace dependency resolution is the most fragile part of the monorepo. All package.json updates must complete atomically before any code changes or dependency reinstallation.

**Delivers:**
- All 19 package.json files updated (name, scope, dependencies)
- Root workspace dependencies pointing to `@openagent/*`
- Directory renames: `packages/opencode/` → `packages/openagent/`, `.opencode/` → `.openagent/`
- Regenerated bun.lock with new package names

**Addresses:**
- Critical feature: Package scope `@opencode-ai/*` → `@openagent/*` (200 files)
- Critical feature: Directory name changes
- Workspace protocol `workspace:*` verification

**Update order (dependencies):**
1. Root `/package.json` (workspace deps, repo URL)
2. Leaf packages with no workspace deps (util, script)
3. Mid-level packages (ui, sdk)
4. Top-level packages (app, openagent)
5. Delete bun.lock
6. `bun install` (regenerate lock)

**Avoids:** Pitfall #2 (workspace dependency desync), Pitfall #11 (bun.lock corruption)

**Research flag:** Well-documented Bun workspace patterns — **skip research-phase**

---

### Phase 3: Source Code and Type System
**Rationale:** With package infrastructure stable, update all import statements and type references. TypeScript compiler will catch any misses.

**Delivers:**
- All TypeScript imports updated (`@opencode-ai` → `@openagent`)
- Type-only imports and JSDoc references updated
- Dynamic imports and string literals updated
- Full typecheck passes across all packages

**Addresses:**
- Critical feature: Import statements (200 files with imports)
- Moderate feature: Comments and documentation strings

**Automation:**
```bash
# Automated replacement with verification
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/@opencode-ai/@openagent/g'
bun run typecheck  # Verify no broken imports
```

**Avoids:** Pitfall #7 (dynamic imports missed), Pitfall #8 (TypeScript path aliases breaking)

**Research flag:** Standard TypeScript monorepo patterns — **skip research-phase**

---

### Phase 4: Configuration and Build Tools
**Rationale:** With code imports stable, update build orchestration and configuration that references package names.

**Delivers:**
- Turbo config updated (task names: `opencode#test` → `openagent#test`)
- All 20+ TypeScript configs verified (path mappings auto-resolve)
- Tauri configs updated (product name, deep link scheme, bundle identifier)
- Cargo.toml updated (Rust package name, lib name)
- Nix configs updated (file renamed, pname updated)

**Addresses:**
- Stack element: Turbo 2.5.6 task orchestration
- Stack element: Tauri 2.x desktop app configuration
- Critical feature: Deep link scheme `opencode://` → `openagent://`

**Configuration files:**
- `/turbo.json`
- `/packages/desktop/src-tauri/tauri.conf.json`
- `/packages/desktop/src-tauri/tauri.prod.conf.json`
- `/packages/desktop/src-tauri/Cargo.toml`
- `/nix/opencode.nix` → `/nix/openagent.nix`
- `/flake.nix`

**Avoids:** Pitfall #14 (Turbo cache invalidation) by clearing cache after updates

**Research flag:** Standard config formats — **skip research-phase**

---

### Phase 5: Infrastructure and Deployment
**Rationale:** With local build working, update CI/CD, GitHub Actions, Docker, and deployment infrastructure.

**Delivers:**
- All GitHub workflows updated (repo checks, binary names, artifact names)
- Environment variables renamed (`OPENCODE_*` → `OPENAGENT_*`)
- Docker image names updated (dual-publish to old and new)
- Install script updated (binary path, installation directory)
- Build scripts updated (all `/script/*.ts` files)

**Addresses:**
- Critical feature: Environment variables (15 occurrences)
- Critical feature: Repository URL references (30 files)
- Critical feature: Binary name in install script

**Workflow files requiring updates:**
- `.github/workflows/publish.yml` (repo check, binary names, Docker tags)
- `.github/workflows/opencode.yml` → `.github/workflows/openagent.yml`
- All other workflows (search for `opencode` strings)

**Migration strategy:**
- Support both old and new env vars with deprecation warnings
- Dual-publish Docker images for 6-month transition
- Update GitHub secrets before merging

**Avoids:** Pitfall #4 (env vars breaking user configs), Pitfall #6 (Docker image breaking production), Pitfall #12 (hardcoded repo checks)

**Research flag:** Standard CI/CD patterns — **skip research-phase**

---

### Phase 6: Documentation and User Experience
**Rationale:** All technical infrastructure working, now update user-facing documentation and implement migration helpers.

**Delivers:**
- All 16 README files updated (15 language variants)
- Documentation site updated (`packages/web/src/content/docs/*.mdx`)
- Schema URLs updated (opencode.ai → openagent.ai)
- VSCode extension metadata updated
- Auto-migration script for user configs (`~/.opencode` → `~/.openagent`)
- NPM deprecation published
- GitHub stub repository created at old location

**Addresses:**
- Should-rename feature: Documentation references (80 files)
- Should-rename feature: UI display names (50 files)
- Critical feature: Config file paths

**User migration helpers:**
1. Config auto-migration on first CLI run
2. Binary name transition (support both `opencode` and `openagent`)
3. Deprecation notices (NPM, Docker, in-app warnings)
4. MIGRATION.md with complete checklist

**Avoids:** Pitfall #3 (CLI binary breaking), Pitfall #5 (NPM deprecation silent), Pitfall #10 (config paths breaking UX)

**Research flag:** User communication best practices — **skip research-phase**

---

### Phase Ordering Rationale

This sequence follows strict technical dependencies discovered in research:

1. **Git first** (Phase 1) — establishes independence before any changes
2. **Package infrastructure** (Phase 2) — workspace resolution blocks all build operations
3. **Source code** (Phase 3) — import resolution depends on package names being stable
4. **Config/build tools** (Phase 4) — build orchestration depends on valid imports
5. **Infrastructure** (Phase 5) — CI/CD depends on local build working
6. **Documentation** (Phase 6) — user-facing updates after technical changes proven

**Critical path:** Package.json → Imports → Build config → Verification → User communication

**Parallel-safe operations** (can do concurrently):
- README updates (independent of code)
- Schema URL updates (independent of code)
- Nix config updates (independent of workspace)
- GitHub workflow updates (except repo checks)

### Research Flags

All phases use well-documented, standard patterns:

**Phases with established patterns (skip research-phase):**
- **Phase 1:** Official Git and GitHub documentation covers squashing and divergence
- **Phase 2:** Bun workspace protocol well-documented, common pattern in monorepos
- **Phase 3:** Standard TypeScript import management
- **Phase 4:** Configuration file formats have official schemas
- **Phase 5:** GitHub Actions and Docker have comprehensive documentation
- **Phase 6:** User migration is well-established practice (NPM deprecation, auto-migration scripts)

**No phases require deeper research** — all operations have high-confidence sources and verified patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct codebase analysis, 19 package.json files verified, Bun 1.3.5 workspace protocol documented |
| Features | HIGH | Comprehensive grep analysis found exact counts (586 occurrences across 228 files), categorized by criticality |
| Architecture | HIGH | Git divergence pattern well-established, multiple official sources confirm squashed history approach |
| Pitfalls | HIGH | Verified with official npm docs, GitHub community discussions, and recent 2025-2026 sources on Bun workspace issues |

**Overall confidence:** HIGH

All four research dimensions have strong verification:
- Stack: Actual codebase files analyzed, version numbers confirmed
- Features: Automated grep with manual categorization and prioritization
- Architecture: Official Git/GitHub documentation plus established fork divergence patterns
- Pitfalls: Mix of official documentation (npm, Docker, GitHub) and community knowledge (Bun issues, migration case studies)

### Gaps to Address

Minor gaps requiring attention during execution:

1. **Schema URL hosting** — Domain `openagent.ai` must be configured to serve schema files at `https://openagent.ai/config.json` and `https://openagent.ai/theme.json`. During planning, decide: (a) acquire domain and host schemas, (b) use different domain, or (c) use relative/local schemas during transition.

2. **GitHub App reconfiguration** — The `opencode-agent[bot]` GitHub App must be recreated as `openagent-bot` or similar. This requires GitHub App creation flow and updating app references in workflows. Handle during Phase 5 (Infrastructure).

3. **VSCode extension publishing decision** — Must decide: (a) keep extension ID `sst-dev.opencode` unchanged (users get updates) but update display name only, or (b) publish new extension `openagent` (breaks update chain, requires deprecation notice). Recommend option (a) to preserve user experience. Handle during Phase 6 (Documentation).

4. **Transition period length** — Research suggests 6-12 months for dual naming support (binary, env vars, Docker images). During planning, establish exact timeline and sunset dates based on user adoption metrics.

5. **Tauri deep linking migration** — Changing scheme from `opencode://` to `openagent://` breaks existing OS-level registrations. Users will need to uninstall and reinstall desktop app. Document in MIGRATION.md during Phase 6.

All gaps have clear mitigation strategies and standard solutions. No blockers identified.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Git Documentation - git-init](https://git-scm.com/docs/git-init) — git divergence workflow
- [GitHub Docs - Fork a Repository](https://docs.github.com/articles/fork-a-repo) — fork and upstream management
- [GitHub Docs - Adding Locally Hosted Code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github) — new repo creation
- [Bun Workspaces Documentation](https://bun.com/docs/pm/workspaces) — workspace protocol behavior
- [npm Deprecation Docs](https://docs.npmjs.com/deprecating-and-undeprecating-packages-or-package-versions/) — package deprecation
- [Docker Image Tagging](https://docs.docker.com/reference/cli/docker/image/tag/) — image name migration

**Codebase Analysis:**
- Direct grep analysis: 849 occurrences of `@opencode-ai`, 586 occurrences of "opencode" across 228 files
- Package.json inventory: 19 files requiring updates
- Environment variables: 15+ `OPENCODE_*` variables identified
- Current git state: 8,461 commits, 2 remotes (origin: ajshedivy/opencode, upstream: sst/opencode)

### Secondary (MEDIUM confidence)

**Tutorials and Guides:**
- [Atlassian Git Tutorial - Forking Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow) — fork patterns
- [Git Tower - How to Squash Commits](https://www.git-tower.com/learn/git/faq/git-squash) — squashing techniques
- [FreeCodeCamp - Git Squash Commits](https://www.freecodecamp.org/news/git-squash-commits/) — squash verification
- [Managing TypeScript Packages in Monorepos - Nx Blog](https://nx.dev/blog/managing-ts-packages-in-monorepos) — TypeScript monorepo patterns
- [TypeScript in Monorepo - Graphite Guide](https://graphite.com/guides/typescript-in-monorepo) — path mappings

**Community Resources (2025-2026):**
- [Lerna Package Renaming Tale](https://medium.com/@dlacustodio/lerna-a-tale-of-renaming-npm-packages-4d3c534bc31) — package rename case study
- [GitHub Redirect Duration Discussion](https://github.com/orgs/community/discussions/22669) — redirect behavior
- [Bun Workspace Issues](https://github.com/oven-sh/bun/issues/10889) — workspace dependency resolution
- [Docker Registry Migration 2025](https://dasroot.net/posts/2025/12/docker-registry-setup-and-image/) — registry migration patterns

### Tertiary (LOW confidence)

None — all findings verified with official documentation or multiple sources.

---
*Research completed: 2026-01-31*
*Ready for roadmap: yes*
