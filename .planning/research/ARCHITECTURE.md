# Architecture: Git Workflow for Fork Divergence

**Domain:** Repository forking and divergence
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

Creating "openagent" as a clean divergence from "opencode-agno" requires establishing a new independent repository with a strategic approach to git history. The key architectural decision is whether to preserve upstream history, squash it into a clean initial commit, or start completely fresh. Given the context of creating a distinct product identity while maintaining traceability to the original codebase, the recommended approach is **squashed history with attribution** - creating a single initial commit that preserves the current codebase state while clearly marking the divergence point.

## Current State Analysis

**Repository:** opencode-agno
- Total commits: 8,461
- Current remotes:
  - origin: https://github.com/ajshedivy/opencode.git
  - upstream: https://github.com/sst/opencode.git
- Recent divergence: AgentOS integration commits (last 3 commits)

**Goal:** Create "openagent" as independent GitHub repository with clean identity

## Recommended Architecture: Option 2 (Squashed History)

### Rationale

1. **Clean Identity:** Single initial commit clearly marks the divergence point
2. **Lightweight History:** New repository starts fresh without 8,461+ commits of opencode baggage
3. **Attribution Preserved:** Initial commit message can credit opencode as the foundation
4. **Future Independence:** No confusion about which commits belong to which project
5. **Simplicity:** New contributors don't need to understand opencode's entire history

### Trade-offs Accepted

- Loss of granular commit history (acceptable for a fork becoming its own project)
- Cannot cherry-pick individual upstream commits (won't need to - this is a divergence, not ongoing sync)
- Git blame shows single commit (acceptable - new project identity)

## Git Workflow Options

### Option 1: Preserve Full History (NOT RECOMMENDED)

**What:** Push all 8,461 commits to new repository, maintaining complete lineage.

**Pros:**
- Complete historical record
- Git blame works for all original code
- Can trace every change back to source

**Cons:**
- New repository carries all opencode history baggage
- Confusing for contributors (which commits are openagent vs opencode?)
- Repository identity unclear
- Large git history (8,461 commits)

**When to use:** When maintaining ongoing sync with upstream or when audit trail is critical.

**Confidence:** HIGH (standard git workflow, well-documented)

**Commands:**
```bash
# Create new GitHub repo first (see GitHub Workflow section)
cd /Users/adamshedivy/Documents/IBM/sandbox/oss/ai/opencode-agno

# Remove upstream, update origin to new repo
git remote remove upstream
git remote set-url origin https://github.com/YOUR_USERNAME/openagent.git

# Push all history
git push -u origin dev
```

**Sources:**
- [Git Fork Workflow - Atlassian](https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow)
- [GitHub Fork Documentation](https://docs.github.com/articles/fork-a-repo)

---

### Option 2: Squashed History (RECOMMENDED)

**What:** Collapse all history into a single "Initial commit" that captures current codebase state.

**Pros:**
- Clean starting point for new project
- Clear divergence marker
- Lightweight git history
- New project identity established
- Attribution preserved in commit message

**Cons:**
- Loss of granular history (acceptable trade-off)
- Cannot git blame to original authors (document key attributions in README)
- One-way divergence (cannot easily sync upstream)

**When to use:** When creating a distinct product from a fork, establishing new identity, or when upstream history is not relevant to new project direction.

**Confidence:** HIGH (well-established pattern for project divergence)

**Commands:**

```bash
cd /Users/adamshedivy/Documents/IBM/sandbox/oss/ai/opencode-agno

# Method 1: Soft Reset (Most Reliable)
# -----------------------------------------
# Get the root commit hash
ROOT_COMMIT=$(git log --oneline | tail -1 | cut -d' ' -f1)

# Soft reset to root (stages all changes)
git reset --soft $ROOT_COMMIT

# Create new initial commit with all current state
git commit --amend -m "$(cat <<'EOF'
Initial commit: openagent - AgentOS Terminal Client

A terminal CLI client for Agno AgentOS, providing rich terminal experience
for connecting to and interacting with AgentOS agents, teams, workflows,
evals, sessions, and metrics via the AgentOS API.

Forked from opencode (https://github.com/sst/opencode) with significant
modifications for AgentOS integration:
- AgentOS authentication plugin and agent discovery
- AgentOS language model with SSE streaming
- Tool confirmation workflow with permission system
- Session management and persistence

Stack: TypeScript 5.8, Bun 1.3.5, SolidJS, Vercel AI SDK

This represents a clean divergence point from opencode, establishing
openagent as an independent project focused on AgentOS integration.

Original opencode commits: 8,461
Divergence date: 2026-01-31

Credits:
- opencode team (https://github.com/sst/opencode) for foundational TUI
- AgentOS team for API and platform
EOF
)"

# Create new GitHub repo (see GitHub Workflow section)
# Then update remote and force push
git remote remove upstream
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/openagent.git
git push -u origin dev --force

# Alternative Method 2: Interactive Rebase with --root
# -----------------------------------------------------
# (Use if Method 1 fails)
git rebase -i --root

# In editor that opens:
# - Keep FIRST commit as "pick"
# - Change ALL other commits to "squash" (or "s")
# - Save and exit
# - New editor opens for commit message - write comprehensive initial commit

# Then push
git remote remove upstream
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/openagent.git
git push -u origin dev --force
```

**Sources:**
- [Squash All Commits into One - Git Tower](https://www.git-tower.com/learn/git/faq/git-squash)
- [How to Squash All Git Commits Into One](https://www.codestudy.net/blog/how-to-squash-all-git-commits-into-one/)
- [Git Squash Commits Guide - FreeCodeCamp](https://www.freecodecamp.org/news/git-squash-commits/)

---

### Option 3: Fresh Start (ALTERNATIVE)

**What:** Create entirely new git repository, copy files, start from scratch.

**Pros:**
- Cleanest possible slate
- No git baggage whatsoever
- Complete independence
- Can restructure files during copy

**Cons:**
- Zero git history (even for new work)
- Manual file copying required
- No attribution trail in git
- Most labor-intensive

**When to use:** When repository has sensitive data to exclude, significant restructuring needed, or when git history itself is problematic.

**Confidence:** HIGH (simple workflow, no git complexity)

**Commands:**

```bash
# Create new directory
mkdir -p ~/Projects/openagent
cd ~/Projects/openagent

# Initialize fresh git repo
git init -b dev

# Copy files (excluding git history)
rsync -av --exclude='.git' \
  /Users/adamshedivy/Documents/IBM/sandbox/oss/ai/opencode-agno/ \
  ~/Projects/openagent/

# Stage and commit
git add .
git commit -m "Initial commit: openagent - AgentOS Terminal Client

[Same comprehensive message as Option 2]
"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/openagent.git
git push -u origin dev
```

**Sources:**
- [Git Init Documentation](https://git-scm.com/docs/git-init)
- [Adding Locally Hosted Code to GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)

---

## GitHub Repository Creation Workflow

Regardless of which option above, GitHub repository must be created first.

### Step 1: Create GitHub Repository

**Via GitHub Web Interface:**

1. Go to https://github.com/new
2. Repository name: `openagent`
3. Description: "Terminal CLI client for AgentOS - agent discovery and rich terminal interaction"
4. Visibility: Choose Public or Private
5. **CRITICAL:** Do NOT initialize with README, .gitignore, or license (your local repo already has these)
6. Click "Create repository"
7. Note the repository URL: `https://github.com/YOUR_USERNAME/openagent.git`

**Via GitHub CLI (Alternative):**

```bash
# Install GitHub CLI if not present
brew install gh

# Authenticate
gh auth login

# Create repository
gh repo create openagent \
  --public \
  --description "Terminal CLI client for AgentOS - agent discovery and rich terminal interaction" \
  --source=. \
  --remote=origin
```

**Confidence:** HIGH (official GitHub workflows)

**Sources:**
- [GitHub: Create a New Repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
- [GitHub CLI Documentation](https://cli.github.com/manual/gh_repo_create)

### Step 2: Configure Local Remote

After creating GitHub repository, update your local git configuration:

```bash
# Remove old remotes
git remote remove upstream  # Remove opencode upstream
git remote remove origin    # Remove old fork origin (if using squash/fresh)

# Add new remote (for new independent repo)
git remote add origin https://github.com/YOUR_USERNAME/openagent.git

# Verify
git remote -v
# Should show:
# origin  https://github.com/YOUR_USERNAME/openagent.git (fetch)
# origin  https://github.com/YOUR_USERNAME/openagent.git (push)
```

### Step 3: Push Initial Commit

```bash
# For Option 1 (preserve history)
git push -u origin dev

# For Option 2 & 3 (squashed/fresh)
git push -u origin dev --force
```

**Note:** The `--force` flag is safe here because this is a brand new repository with no collaborators yet.

### Step 4: Verify Divergence

After pushing, verify the new repository is properly independent:

```bash
# Check remotes (should only show new origin)
git remote -v

# Check commit count
git log --oneline | wc -l
# Option 1: Should show 8,461+
# Option 2/3: Should show 1

# Verify on GitHub
open https://github.com/YOUR_USERNAME/openagent
```

**Confidence:** HIGH (standard git operations)

---

## Handling Upstream Relationship

### Complete Divergence (Recommended)

Since openagent is a distinct product, completely remove upstream relationship:

```bash
# Remove upstream remote
git remote remove upstream

# Unset any branch tracking
git branch --unset-upstream dev

# Verify clean state
git remote -v
git branch -vv
```

**Rationale:** openagent is NOT maintaining sync with opencode. It's a one-time fork that becomes independent. Keeping upstream creates confusion and temptation to sync incompatible changes.

**Confidence:** HIGH (standard practice for project divergence)

**Sources:**
- [Git Remove Upstream Documentation](https://www.delftstack.com/howto/git/git-remove-upstream/)
- [Git Branch --unset-upstream Guide](https://copyprogramming.com/howto/why-call-git-branch-unset-upstream-to-fixup)

### Archive Original Fork (Optional)

If you want to preserve the original forked repository:

```bash
# On GitHub, go to original fork repository settings
# Scroll to "Danger Zone"
# Click "Archive this repository"
# Confirm archival
```

This keeps the history accessible but clearly marks it as no longer active.

---

## Migration Checklist

Use this checklist to ensure clean divergence:

### Pre-Migration
- [ ] Verify all AgentOS integration work is committed locally
- [ ] Ensure dev branch is up to date and clean (`git status`)
- [ ] Back up current repository: `cp -r opencode-agno opencode-agno.backup`
- [ ] Document any in-progress work or unstaged changes

### GitHub Repository Creation
- [ ] Create new GitHub repository "openagent"
- [ ] Do NOT initialize with README/license/.gitignore
- [ ] Note repository URL
- [ ] Set repository description and visibility

### Git History Decision
- [ ] Choose Option 1 (preserve), Option 2 (squash), or Option 3 (fresh)
- [ ] **Recommended: Option 2** for clean divergence with attribution

### Execute Migration (Option 2 - Squashed)
- [ ] Get root commit hash: `git log --oneline | tail -1`
- [ ] Soft reset: `git reset --soft <hash>`
- [ ] Create comprehensive initial commit with attribution
- [ ] Remove upstream remote: `git remote remove upstream`
- [ ] Update origin: `git remote set-url origin <new-repo-url>` or remove and re-add
- [ ] Force push: `git push -u origin dev --force`

### Verification
- [ ] Verify remote: `git remote -v` (should only show new origin)
- [ ] Verify commit count: `git log --oneline | wc -l`
- [ ] Check GitHub repository shows correct initial commit
- [ ] Verify all files present in repository
- [ ] Test clone: `git clone <new-repo-url> test-clone && cd test-clone`

### Post-Migration Updates
- [ ] Update README.md with openagent branding
- [ ] Update package.json name fields
- [ ] Update any hardcoded references to "opencode"
- [ ] Update repository URLs in documentation
- [ ] Consider archiving original fork repository

### Team Communication (if applicable)
- [ ] Notify team members of new repository
- [ ] Provide migration instructions for local clones
- [ ] Update CI/CD pipelines to point to new repository
- [ ] Update any external links or badges

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Keeping Upstream for "Future Sync"

**What:** Maintaining upstream remote "just in case" you want to pull updates later.

**Why bad:**
- Creates confusion about project direction
- Tempts pulling incompatible changes
- Implies ongoing relationship that doesn't exist
- Complicates git workflows

**Instead:**
- Completely remove upstream
- If needed, manually review upstream changes and port specific fixes
- Treat as separate projects

**Confidence:** HIGH

### Anti-Pattern 2: Preserving Full History When Forking to New Identity

**What:** Pushing all 8,461 commits to new "openagent" repository to "preserve history."

**Why bad:**
- Conflates opencode and openagent identities
- New contributors see irrelevant history
- Git blame shows opencode authors for unrelated code
- Repository feels like renamed fork, not new project

**Instead:**
- Use squashed history (Option 2) for clean identity
- Document opencode attribution in README and initial commit
- Focus git history on openagent's evolution

**Confidence:** HIGH

### Anti-Pattern 3: Force-Pushing to Shared Branches

**What:** Using `--force` after repository has collaborators.

**Why bad:**
- Overwrites collaborators' work
- Breaks their local clones
- Causes synchronization chaos

**Instead:**
- Only use `--force` on initial push to empty repository
- After collaborators join, never rewrite public history
- Use `--force-with-lease` if absolutely necessary (still risky)

**Confidence:** HIGH

**Sources:**
- [Git Best Practices 2026](https://copyprogramming.com/howto/git-your-branch-and-origin-master-have-diverged)
- [Why Rewriting Public History is Problematic](http://sethrobertson.github.io/GitBestPractices/)

### Anti-Pattern 4: Initializing GitHub Repo with Files

**What:** Checking "Add README" or "Add .gitignore" when creating GitHub repository.

**Why bad:**
- Creates initial commit on GitHub
- Conflicts with local repository you're pushing
- Requires merge or force push
- Adds unnecessary complexity

**Instead:**
- Create completely empty GitHub repository
- Push from local repository as source of truth
- GitHub will adopt your existing README, .gitignore, etc.

**Confidence:** HIGH

**Sources:**
- [Adding Locally Hosted Code to GitHub - Official Docs](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)

---

## Post-Divergence Architecture

### Repository Independence

After divergence, openagent and opencode are **completely independent**:

```
opencode (upstream: sst/opencode)
  ↓ [forked 2026-01-XX]
opencode-agno (origin: ajshedivy/opencode)
  ↓ [diverged 2026-01-31]
openagent (origin: YOUR_USERNAME/openagent)  ← No upstream relationship
```

**Key Properties:**
- No git remote relationship to opencode
- Independent commit history (squashed or fresh)
- Separate GitHub repository with own issues/PRs
- Own release cycle and versioning
- Own contributor base

### File Structure Continuity

Despite git divergence, project structure inherited from opencode:

```
openagent/
├── packages/
│   └── opencode/          # Will be renamed to packages/openagent
│       ├── src/
│       │   ├── plugin/agentos.ts      # AgentOS integration
│       │   ├── provider/sdk/agentos/  # AgentOS provider
│       │   └── cli/ui/                # Inherited TUI
├── package.json           # Update name to "openagent"
├── README.md              # Rebrand to openagent
└── .planning/             # Planning docs (keep or remove)
```

**Next Steps After Git Migration:**
1. Rename `packages/opencode` to `packages/openagent`
2. Update all package.json name fields
3. Update imports and references
4. Rebrand README and documentation

---

## Scalability Considerations

| Concern | Initial Divergence | After Team Joins | At Scale (100+ contributors) |
|---------|-------------------|------------------|------------------------------|
| **History Size** | Single commit (Option 2) keeps it minimal | Linear growth from divergence point | Standard git history, manageable |
| **Upstream Sync** | None (complete divergence) | None needed | Manual port of fixes if relevant |
| **Branch Strategy** | Single dev branch | Feature branches + dev | GitFlow or trunk-based development |
| **Remote Management** | Single origin remote | origin only, no upstream | origin + possibly personal forks |
| **Force Push Policy** | Allowed (initial setup) | Never on shared branches | Never (rewrite history forbidden) |

---

## Confidence Assessment

| Area | Confidence | Source Quality |
|------|------------|---------------|
| Git workflow options | HIGH | Official git docs, Atlassian tutorials |
| GitHub repo creation | HIGH | Official GitHub documentation |
| Squashing commits | HIGH | Multiple verified sources, tested pattern |
| Upstream removal | HIGH | Official git documentation |
| Anti-patterns | HIGH | Community best practices, git documentation |
| Overall recommendation | HIGH | Well-established pattern for project divergence |

---

## Sources

### Official Documentation
- [Git Documentation - git-init](https://git-scm.com/docs/git-init)
- [GitHub Docs - Fork a Repository](https://docs.github.com/articles/fork-a-repo)
- [GitHub Docs - Adding Locally Hosted Code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [Git Branch --unset-upstream](https://git-scm.com/docs/git-branch/2.31.0)

### Tutorials and Guides
- [Atlassian Git Tutorial - Forking Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow)
- [Git Tower - How to Squash Commits](https://www.git-tower.com/learn/git/faq/git-squash)
- [FreeCodeCamp - Git Squash Commits](https://www.freecodecamp.org/news/git-squash-commits/)
- [How to Squash All Git Commits Into One](https://www.codestudy.net/blog/how-to-squash-all-git-commits-into-one/)

### Best Practices
- [Git Best Practices - Seth Robertson](http://sethrobertson.github.io/GitBestPractices/)
- [Git Diverged Branches Guide 2026](https://copyprogramming.com/howto/git-your-branch-and-origin-master-have-diverged)
- [Git Branch --unset-upstream Guide 2026](https://copyprogramming.com/howto/why-call-git-branch-unset-upstream-to-fixup)

### Community Resources
- [GitHub Discussion - Disassociate a Fork](https://github.com/orgs/community/discussions/45251)
- [How to Remove Upstream Repository in Git](https://www.delftstack.com/howto/git/git-remove-upstream/)
- [Maintaining Clean Git History](https://mainmatter.com/blog/2021/05/26/keeping-a-clean-git-history/)

---

## Recommendation Summary

**For openagent divergence, use Option 2 (Squashed History):**

1. Create new GitHub repository "openagent" (empty, no initialization)
2. Squash all commits into single initial commit with comprehensive attribution
3. Remove upstream remote completely
4. Force push to new origin
5. Verify divergence complete
6. Proceed with rebranding (package names, README, etc.)

**Confidence:** HIGH - This is the standard pattern for establishing independent project identity from a fork while preserving attribution and starting with a clean slate.
