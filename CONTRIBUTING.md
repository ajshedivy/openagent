# Contributing to openagent

We want to make it easy for you to contribute to openagent. Here are the most common type of changes that get merged:

- Bug fixes
- Additional LSPs / Formatters
- Improvements to LLM performance
- Support for new providers
- Fixes for environment-specific quirks
- Missing standard behavior
- Documentation improvements

However, any UI or core product feature must go through a design review with the core team before implementation.

If you are unsure if a PR would be accepted, feel free to ask a maintainer or look for issues with any of the following labels:

- [`help wanted`](https://github.com/ajshedivy/openagent/issues?q=is%3Aissue%20state%3Aopen%20label%3Ahelp-wanted)
- [`good first issue`](https://github.com/ajshedivy/openagent/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22)
- [`bug`](https://github.com/ajshedivy/openagent/issues?q=is%3Aissue%20state%3Aopen%20label%3Abug)
- [`perf`](https://github.com/ajshedivy/openagent/issues?q=is%3Aopen%20is%3Aissue%20label%3A%22perf%22)

> [!NOTE]
> PRs that ignore these guardrails will likely be closed.

Want to take on an issue? Leave a comment and a maintainer may assign it to you unless it is something we are already working on.

## Development Setup

- Requirements: [Bun](https://bun.sh) and [Git](https://git-scm.com)
- Clone the repo, install dependencies, and start the dev server:

  ```bash
  git clone https://github.com/ajshedivy/openagent.git
  cd openagent
  bun install
  bun dev
  ```

### Running against a different directory

By default, `bun dev` runs openagent in the `packages/opencode` directory. To run it against a different directory or repository:

```bash
bun dev <directory>
```

To run openagent in the repo root itself:

```bash
bun dev .
```

### Building a local binary

The easiest way to build and install a standalone binary:

```bash
./install.sh
```

This builds from source and installs to `~/.openagent/bin/openagent`. See `./install.sh --help` for options.

To build manually without installing:

```bash
cd packages/opencode
bun run build --single
```

The binary will be at `packages/opencode/dist/@worksofadam/openagent-<platform>/bin/openagent` (e.g., `darwin-arm64`, `linux-x64`).

### Project Structure

openagent is a fork of [opencode](https://github.com/sst/opencode). The repo contains many packages inherited from the upstream project. **Contributions should focus on the core openagent package:**

- `packages/opencode` — Core business logic, CLI, server, and TUI (this is where openagent lives)
- `packages/opencode/src/cli/cmd/tui/` — TUI code, written in SolidJS with [opentui](https://github.com/sst/opentui)
- `packages/plugin` — Plugin system (`@opencode-ai/plugin`)

> [!NOTE]
> Other packages (`app`, `desktop`, `web`, `console`, `slack`, `enterprise`, etc.) are inherited from the opencode fork and are **out of scope** for openagent contributions.

### Understanding bun dev vs openagent

During development, `bun dev` is the local equivalent of the installed `openagent` command. Both run the same CLI interface:

```bash
# Development (from project root)
bun dev --help           # Show all available commands
bun dev serve            # Start headless API server
bun dev web              # Start server + open web interface
bun dev <directory>      # Start TUI in specific directory

# Installed binary
openagent --help         # Show all available commands
openagent serve          # Start headless API server
openagent web            # Start server + open web interface
openagent <directory>    # Start TUI in specific directory
```

### Running the API Server

To start the openagent headless API server:

```bash
bun dev serve
```

This starts the headless server on port 4096 by default. You can specify a different port:

```bash
bun dev serve --port 8080
```

> [!NOTE]
> If you make changes to the API or SDK (e.g. `packages/opencode/src/server/server.ts`), run `./script/generate.ts` to regenerate the SDK and related files.

Please try to follow the [style guide](./AGENTS.md)

### Setting up a Debugger

Bun debugging is currently rough around the edges. We hope this guide helps you get set up and avoid some pain points.

The most reliable way to debug openagent is to run it manually in a terminal via `bun run --inspect=<url> dev ...` and attach
your debugger via that URL. Other methods can result in breakpoints being mapped incorrectly, at least in VSCode (YMMV).

Caveats:

- `bun dev` runs the server in a worker thread, so breakpoints may not trigger in server code. To debug the server separately:
  - Debug server: `bun run --inspect=ws://localhost:6499/ --cwd packages/opencode ./src/index.ts serve --port 4096`,
    then attach TUI with `openagent attach http://localhost:4096`
  - Debug TUI: `bun run --inspect=ws://localhost:6499/ --cwd packages/opencode --conditions=browser ./src/index.ts`

Other tips and tricks:

- You might want to use `--inspect-wait` or `--inspect-brk` instead of `--inspect`, depending on your workflow
- Specifying `--inspect=ws://localhost:6499/` on every invocation can be tiresome, you may want to `export BUN_OPTIONS=--inspect=ws://localhost:6499/` instead

#### VSCode Setup

If you use VSCode, you can use our example configurations [.vscode/settings.example.json](.vscode/settings.example.json) and [.vscode/launch.example.json](.vscode/launch.example.json).

Some debug methods that can be problematic:

- Debug configurations with `"request": "launch"` can have breakpoints incorrectly mapped and thus unusable
- The same problem arises when running openagent in the VSCode `JavaScript Debug Terminal`

With that said, you may want to try these methods, as they might work for you.

## Pull Request Expectations

### Issue First Policy

**All PRs must reference an existing issue.** Before opening a PR, open an issue describing the bug or feature. This helps maintainers triage and prevents duplicate work. PRs without a linked issue may be closed without review.

- Use `Fixes #123` or `Closes #123` in your PR description to link the issue
- For small fixes, a brief issue is fine - just enough context for maintainers to understand the problem

### General Requirements

- Keep pull requests small and focused
- Explain the issue and why your change fixes it
- Before adding new functionality, ensure it doesn't already exist elsewhere in the codebase

### UI Changes

If your PR includes UI changes, please include screenshots or videos showing the before and after. This helps maintainers review faster and gives you quicker feedback.

### Logic Changes

For non-UI changes (bug fixes, new features, refactors), explain **how you verified it works**:

- What did you test?
- How can a reviewer reproduce/confirm the fix?

### No AI-Generated Walls of Text

Long, AI-generated PR descriptions and issues are not acceptable and may be ignored. Respect the maintainers' time:

- Write short, focused descriptions
- Explain what changed and why in your own words
- If you can't explain it briefly, your PR might be too large

### PR Titles

PR titles should follow conventional commit standards:

- `feat:` new feature or functionality
- `fix:` bug fix
- `docs:` documentation or README changes
- `chore:` maintenance tasks, dependency updates, etc.
- `refactor:` code refactoring without changing behavior
- `test:` adding or updating tests

You can optionally include a scope to indicate which package is affected:

- `feat(app):` feature in the app package
- `fix(desktop):` bug fix in the desktop package
- `chore(opencode):` maintenance in the opencode package

Examples:

- `docs: update contributing guidelines`
- `fix: resolve crash on startup`
- `feat: add dark mode support`
- `feat(app): add dark mode support`
- `fix(desktop): resolve crash on startup`
- `chore: bump dependency versions`

### Style Preferences

These are not strictly enforced, they are just general guidelines:

- **Functions:** Keep logic within a single function unless breaking it out adds clear reuse or composition benefits.
- **Destructuring:** Do not do unnecessary destructuring of variables.
- **Control flow:** Avoid `else` statements.
- **Error handling:** Prefer `.catch(...)` instead of `try`/`catch` when possible.
- **Types:** Reach for precise types and avoid `any`.
- **Variables:** Stick to immutable patterns and avoid `let`.
- **Naming:** Choose concise single-word identifiers when they remain descriptive.
- **Runtime APIs:** Use Bun helpers such as `Bun.file()` when they fit the use case.

## Feature Requests

For net-new functionality, start with a design conversation. Open an issue describing the problem, your proposed approach (optional), and why it belongs in openagent. The core team will help decide whether it should move forward; please wait for that approval instead of opening a feature PR directly.
