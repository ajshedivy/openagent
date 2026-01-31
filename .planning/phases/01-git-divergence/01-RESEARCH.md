# Phase 1: Git Divergence - Research

**Researched:** 2026-01-31
**Domain:** Git repository management, history rewriting, remote configuration
**Confidence:** HIGH

## Summary

Git divergence for repository forking requires squashing 8,464+ commits into a single initial commit while preserving attribution to the original opencode project. The standard approach uses an orphan branch to create a clean history root, followed by remote reconfiguration to point to the new repository.

The research confirms three key technical operations: (1) creating an orphan branch with `git checkout --orphan`, (2) preserving attribution using `Co-authored-by:` trailers in the commit message, and (3) changing the remote origin with `git remote set-url`. This is a well-established pattern for creating clean fork divergence points.

**Primary recommendation:** Use orphan branch approach rather than interactive rebase to avoid potential conflicts and ensure clean history reset with single root commit.

## Standard Stack

The established tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| git | 2.40+ | Version control system | Official Git client, all features available |
| git-remote | (built-in) | Remote repository management | Native Git command for remote operations |
| git-checkout | (built-in) | Branch and orphan creation | Standard method for orphan branches |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| GitHub CLI (gh) | 2.0+ | GitHub repository operations | If automating repository creation |
| git-interpret-trailers | (built-in) | Commit message trailer parsing | For advanced attribution parsing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Orphan branch | Interactive rebase (`git rebase -i --root`) | Rebase requires resolving all historical conflicts; orphan is cleaner |
| `git remote set-url` | Remove and re-add remote | Same result but set-url is atomic and safer |
| Manual squash | `git reset --soft` to root | Requires knowing exact root commit hash; orphan is more explicit |

**Installation:**
```bash
# Git is pre-installed on most systems
git --version

# If needed, install via package manager
# macOS: brew install git
# Ubuntu/Debian: apt-get install git
```

## Architecture Patterns

### Recommended Project Structure
```
.git/
├── config              # Remote configuration
├── refs/heads/         # Local branches
└── refs/remotes/       # Remote tracking branches
    └── origin/         # Will point to new repository
```

### Pattern 1: Orphan Branch Method (Recommended)
**What:** Create a new orphan branch with no parent commits, commit all files as single initial commit
**When to use:** Squashing entire repository history into single commit
**Example:**
```bash
# Source: https://git-scm.com/docs/git-checkout
# Create orphan branch
git checkout --orphan new-main

# All files are staged automatically from previous HEAD
# Verify staging
git status

# Create single initial commit with attribution
git commit -m "$(cat <<'EOF'
Initial commit: OpenAgent fork from OpenCode

This repository represents a clean divergence point from the OpenCode project.
All previous development history has been squashed into this initial commit.

Original project: https://github.com/sst/opencode
Fork date: 2026-01-31

Co-authored-by: OpenCode Contributors <noreply@github.com>
EOF
)"

# Delete old branch and rename
git branch -D main
git branch -m main
```

### Pattern 2: Git Reset --soft Method (Alternative)
**What:** Reset branch pointer to root while keeping all changes staged
**When to use:** When you want to preserve the original branch name throughout
**Example:**
```bash
# Source: https://dev.to/ncutixavier/how-to-squash-commit-using-git-reset-soft-4b9c
# Find the root commit hash
ROOT_COMMIT=$(git rev-list --max-parents=0 HEAD)

# Reset to root, keeping all changes staged
git reset --soft $ROOT_COMMIT

# Create single squashed commit
git commit --amend -m "Initial commit with attribution"
```

### Pattern 3: Remote Reconfiguration
**What:** Update remote origin URL to point to new repository
**When to use:** After squashing history, before first push
**Example:**
```bash
# Source: https://git-scm.com/docs/git-remote
# Verify current remotes
git remote -v

# Change origin to new repository
git remote set-url origin https://github.com/ajshedivy/openagent.git

# Verify change
git remote -v

# Push with upstream tracking
git push -u origin main
```

### Anti-Patterns to Avoid
- **Using `git push --force` on first push:** First push to empty repository doesn't need force; use `git push -u origin main`
- **Interactive rebase for full history:** `git rebase -i --root` with 8,464 commits will be error-prone and slow; orphan branch is cleaner
- **Forgetting attribution:** License compliance requires maintaining attribution to original project
- **Not verifying remote before push:** Always run `git remote -v` to verify URL before pushing

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Squashing commits | Custom script to replay commits | `git checkout --orphan` | Native Git command handles staging, working tree, and branch creation atomically |
| Attribution formatting | Manual commit message construction | `git commit --trailer` or heredoc | Git trailers are parseable by tools; heredoc prevents shell escaping issues |
| Remote management | Editing `.git/config` manually | `git remote set-url` | Git validates URLs and updates all related configuration automatically |
| Verifying remote URL | Parsing config file | `git remote -v` | Official command shows both fetch and push URLs |

**Key insight:** Git's plumbing commands (checkout, remote, commit) handle edge cases like file permissions, git attributes, and configuration validation that manual approaches would miss.

## Common Pitfalls

### Pitfall 1: Orphan Branch Leaves Old Branch
**What goes wrong:** After creating orphan branch, old main branch still exists with full history
**Why it happens:** `git checkout --orphan` creates new branch but doesn't delete old one
**How to avoid:** Explicitly delete old branch with `git branch -D old-main` after committing to orphan branch
**Warning signs:** `git branch -a` shows multiple branches; repository size doesn't decrease

### Pitfall 2: Force Pushing to Empty Repository
**What goes wrong:** Using `git push --force` on first push to new repository
**Why it happens:** Assumption that divergent history requires force push
**How to avoid:** First push to empty repository succeeds normally; use `git push -u origin main`
**Warning signs:** Git returns "Everything up-to-date" or warns about force push

### Pitfall 3: Losing Attribution/License Information
**What goes wrong:** Squashed commit doesn't credit original project or maintain license compliance
**Why it happens:** Focus on technical squashing without considering legal requirements
**How to avoid:** Include attribution in commit message using `Co-authored-by:` trailer and license references
**Warning signs:** Commit message only describes new fork, doesn't mention original project

### Pitfall 4: Working Directory Not Clean
**What goes wrong:** Orphan branch includes uncommitted changes from before checkout
**Why it happens:** Files in working directory are staged into orphan branch automatically
**How to avoid:** Run `git status` before creating orphan branch; stash or commit all changes
**Warning signs:** More files staged than expected; unrelated changes in initial commit

### Pitfall 5: Remote Confusion After URL Change
**What goes wrong:** Pushing to wrong remote after changing URL
**Why it happens:** Git remote configuration cached in shell or IDE
**How to avoid:** Always verify with `git remote -v` after `set-url`; restart IDE if needed
**Warning signs:** Push succeeds to unexpected repository; GitHub shows activity on old repo

### Pitfall 6: Squashing Shared Branch
**What goes wrong:** Attempting to squash history on branch that others are using
**Why it happens:** Misunderstanding that history rewrite breaks collaborators
**How to avoid:** Only squash in private fork before sharing; communicate with team if branch is shared
**Warning signs:** Other developers report "diverged history" errors after your push

## Code Examples

Verified patterns from official sources:

### Complete Orphan Branch Workflow
```bash
# Source: https://git-scm.com/docs/git-checkout
# Verify clean working directory
git status

# Create orphan branch (files auto-staged from current HEAD)
git checkout --orphan new-main

# Verify all files are staged
git status

# Create initial commit with proper attribution
git commit -m "$(cat <<'EOF'
Initial commit: OpenAgent fork from OpenCode

This repository represents a clean divergence point from the OpenCode project.
All previous development history (8,464 commits) has been squashed into this
initial commit to establish repository independence.

Original project: https://github.com/sst/opencode
Original authors: SST and OpenCode contributors
Fork date: 2026-01-31
License: MIT (preserved from original project)

Co-authored-by: OpenCode Contributors <noreply@github.com>
EOF
)"

# Delete old main branch
git branch -D main

# Rename orphan branch to main
git branch -m main

# Verify single commit
git log --oneline
# Should show exactly one commit
```

### Remote Reconfiguration
```bash
# Source: https://docs.github.com/en/get-started/git-basics/managing-remote-repositories
# Check current remotes
git remote -v
# origin    https://github.com/ajshedivy/opencode.git (fetch)
# origin    https://github.com/ajshedivy/opencode.git (push)
# upstream  https://github.com/sst/opencode.git (fetch)
# upstream  https://github.com/sst/opencode.git (push)

# Change origin to new repository
git remote set-url origin https://github.com/ajshedivy/openagent.git

# Verify change applied
git remote -v
# origin    https://github.com/ajshedivy/openagent.git (fetch)
# origin    https://github.com/ajshedivy/openagent.git (push)
# upstream  https://github.com/sst/opencode.git (fetch)
# upstream  https://github.com/sst/opencode.git (push)

# Optional: Remove upstream if no longer tracking original
git remote remove upstream

# Verify final state
git remote -v
# origin    https://github.com/ajshedivy/openagent.git (fetch)
# origin    https://github.com/ajshedivy/openagent.git (push)
```

### First Push to New Repository
```bash
# Source: https://git-scm.com/docs/git-push
# Push to new repository with upstream tracking
git push -u origin main

# Verify push succeeded
git log --oneline
git remote show origin
```

### Attribution Using Git Trailers
```bash
# Source: https://git-scm.com/docs/git-commit
# Alternative: Using --trailer flag
git commit --trailer "Co-authored-by: OpenCode Contributors <noreply@github.com>" \
           --trailer "Based-on: https://github.com/sst/opencode" \
           -m "Initial commit: OpenAgent fork from OpenCode"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `git rebase -i --root` | `git checkout --orphan` | Git 1.7.2 (2010) | Orphan branch is simpler, avoids conflict resolution |
| `git push --force` | `git push --force-with-lease` | Git 1.8.5 (2013) | Safer force pushing, prevents overwriting others' work |
| Manual `.git/config` editing | `git remote set-url` | Git 1.5.0 (2007) | Atomic updates with validation |
| Manual trailer formatting | `git commit --trailer` | Git 2.13 (2017) | Standardized trailer parsing and formatting |
| Password authentication | Personal access tokens | GitHub 2021 | HTTPS authentication requires PAT, not password |

**Deprecated/outdated:**
- Password-based Git authentication over HTTPS (removed by GitHub in 2021)
- `git checkout` for switching branches (use `git switch` in Git 2.23+, though checkout still works)
- Editing `remote.origin.url` in config file manually (use `git remote set-url` instead)

## Open Questions

Things that couldn't be fully resolved:

1. **License file preservation**
   - What we know: MIT license requires attribution and license text preservation
   - What's unclear: Whether LICENSE file should be committed to orphan branch before initial commit
   - Recommendation: Keep LICENSE file in initial commit to maintain compliance; update copyright year and fork attribution

2. **Upstream tracking after divergence**
   - What we know: Current repo has both origin (fork) and upstream (original) remotes
   - What's unclear: Whether to maintain upstream remote for potential future syncing
   - Recommendation: Remove upstream remote after divergence since history is incompatible; re-add later if selective porting needed

3. **GitHub repository metadata**
   - What we know: New repository exists at https://github.com/ajshedivy/openagent.git
   - What's unclear: Whether GitHub preserves fork relationship metadata after force pushing new history
   - Recommendation: Manually update repository description and README to indicate fork source; GitHub won't show fork badge after history rewrite

## Sources

### Primary (HIGH confidence)
- [Git Official Documentation - git-commit](https://git-scm.com/docs/git-commit) - Commit message format, trailers, signing
- [Git Official Documentation - git-checkout](https://git-scm.com/docs/git-checkout) - Orphan branch creation
- [Git Official Documentation - git-remote](https://git-scm.com/docs/git-remote) - Remote repository management
- [GitHub Docs - Managing remote repositories](https://docs.github.com/en/get-started/git-basics/managing-remote-repositories) - GitHub-specific remote practices

### Secondary (MEDIUM confidence)
- [Git Tower - How to Squash Commits in Git](https://www.git-tower.com/learn/git/faq/git-squash)
- [Graphite - Understanding orphan branches in Git](https://graphite.com/guides/git-orphan-branches)
- [DEV Community - How to squash commit using git reset --soft](https://dev.to/ncutixavier/how-to-squash-commit-using-git-reset-soft-4b9c)
- [GitHub Blog - Improved attribution when squashing commits](https://github.blog/changelog/2019-12-19-improved-attribution-when-squashing-commits/)

### Tertiary (LOW confidence)
- [Medium - Squashing Commits: How to Maintain Git Commit History Like A Pro](https://medium.com/@kyledeguzmanx/squashing-commits-how-to-maintain-git-commit-history-like-a-pro-69a9ba27ca54)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) - For commit message formatting patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Git commands are stable, well-documented, official
- Architecture: HIGH - Official Git documentation and GitHub docs confirm patterns
- Pitfalls: MEDIUM - Based on community experience articles and best practices guides

**Research date:** 2026-01-31
**Valid until:** 2026-07-31 (6 months - Git fundamentals are stable, GitHub practices evolve slowly)

**Current repository state:**
- Total commits: 8,464
- Current remote: origin → https://github.com/ajshedivy/opencode.git
- Current branch: opencode-agno
- Target remote: origin → https://github.com/ajshedivy/openagent.git
