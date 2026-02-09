# Phase 16 Plan 01 Summary: Publishing Pipeline

## Objective
Create GitHub Actions workflows for npm publishing and PR quality gates.

## Tasks Completed

### Task 1: Create publish-openagent.yml workflow
- **File**: `.github/workflows/publish-openagent.yml`
- **What**: New workflow triggered by `v*` tag pushes that runs typecheck, build, then publishes `@worksofadam/openagent` to npm
- **Key details**: Uses `.github/actions/setup-bun` composite action, `actions/setup-node@v4` for npm auth, `NPM_TOKEN` secret via `NODE_AUTH_TOKEN` env var, `npm publish --access public` for scoped package
- **Commit**: `fabfec313`

### Task 2: Create ci.yml PR quality gate workflow
- **File**: `.github/workflows/ci.yml`
- **What**: New workflow triggered on PRs to `main` that runs typecheck and build as quality gate
- **Key details**: Uses `.github/actions/setup-bun`, single job on `ubuntu-latest`, no secrets required
- **Commit**: `cc19fb444`

### Task 3: Remove private flag from package.json
- **File**: `packages/opencode/package.json`
- **What**: Removed `"private": true` and added `"files"` field to control npm publish contents
- **Files included**: `bin/`, `dist/`, `src/`, `package.json`, `README.md`, `LICENSE`
- **Commit**: `58a147d09`

## Verification Results
- All three task verification checks passed
- Both YAML files have valid structure
- `npm pack --dry-run` confirms package is publishable (no longer blocked by private flag)
- Both workflows correctly reference `.github/actions/setup-bun`

## Success Criteria
- [x] `.github/workflows/publish-openagent.yml` exists and triggers on `v*` tag pushes
- [x] Publish workflow runs typecheck, build, and `npm publish --access public`
- [x] Publish workflow uses `NPM_TOKEN` secret via `NODE_AUTH_TOKEN` env var
- [x] `.github/workflows/ci.yml` exists and triggers on PRs to `main`
- [x] CI workflow runs typecheck and build as quality gate
- [x] Both workflows use `.github/actions/setup-bun` composite action
- [x] Both workflows use `ubuntu-latest` runner
- [x] `packages/opencode/package.json` does not contain `"private": true`
- [x] `packages/opencode/package.json` has `"files"` field limiting published contents
- [x] Workflows are minimal — no Docker, Tauri, AUR, platform matrix, or other complexity

## Notes
- `NPM_TOKEN` must be added as a repository secret before first publish
- First publish requires `--access public` for scoped packages
- Package includes `src/` because exports map to `./src/*.ts`
