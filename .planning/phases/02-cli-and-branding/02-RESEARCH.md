# Phase 02: CLI and Branding - Research

**Researched:** 2026-01-31
**Domain:** Node.js CLI binary naming, npm package.json configuration, ASCII art branding
**Confidence:** HIGH

## Summary

This phase involves renaming a Node.js CLI binary from "opencode" to "openagent" and updating ASCII art branding. The task is straightforward but requires precision across multiple touch points: the bin file itself, package.json bin field registration, internal references (environment variables, error messages), and ASCII art banner generation.

The standard approach for CLI binary renaming in Node.js/npm ecosystems involves:
1. Rename the physical bin file
2. Update package.json bin field mapping
3. Update internal references (env vars, binary name lookups, error messages)
4. Regenerate ASCII art to match new branding
5. Update README documentation

This is a well-understood operation with clear npm documentation and established patterns. The main risk is missing internal references that aren't immediately visible during testing.

**Primary recommendation:** Follow systematic search-and-replace across all identified touch points, test with `npm link` locally before committing, verify environment variables and error messages display correct binary name.

## Standard Stack

The established tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| npm | 7+ | Package manager with bin field support | Native package.json bin symlink creation |
| Node.js | 18+ | Runtime for CLI scripts | Standard shebang `#!/usr/bin/env node` |
| figlet | Online tools | ASCII art generation | Industry standard for CLI banners (FIGlet fonts) |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| npm link | Local testing | Test bin symlinks before publishing |
| online ASCII generators | Banner creation | Generate custom ASCII art (patorjk.com/software/taag, manytools.org) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Online generators | figlet CLI | CLI requires local install, online is zero-setup |
| Manual ASCII art | Generator tools | Hand-crafted is error-prone, generators ensure consistency |

**Installation:**
No special dependencies needed - this is standard npm configuration.

## Architecture Patterns

### Recommended File Structure
Current structure (verified in codebase):
```
packages/opencode/
├── bin/
│   └── opencode              # Binary wrapper script
├── package.json              # Contains bin field
└── src/
    └── cli/
        ├── logo.ts           # ASCII art data structure
        └── cmd/tui/component/
            └── logo.tsx      # Logo rendering component
```

### Pattern 1: Binary Wrapper Script
**What:** Node.js wrapper that locates and executes platform-specific binary
**When to use:** Multi-platform CLI with native binaries
**Example:**
```javascript
// Source: Verified in bin/opencode
#!/usr/bin/env node

const childProcess = require("child_process")
const fs = require("fs")
const path = require("path")

// Check environment variable override first
const envPath = process.env.OPENCODE_BIN_PATH
if (envPath) {
  run(envPath)
}

// Construct platform-specific binary name
const base = "opencode-" + platform + "-" + arch
const binary = platform === "windows" ? "opencode.exe" : "opencode"

// Search node_modules for platform binary
function findBinary(startDir) {
  // Walk up from bin directory looking for node_modules/opencode-{platform}-{arch}/bin/opencode
}
```

**Key aspects:**
- Shebang `#!/usr/bin/env node` is REQUIRED for npm to make file executable
- Environment variable override (`OPENCODE_BIN_PATH`) provides escape hatch
- Platform detection (darwin/linux/windows) + arch detection (x64/arm64)
- Binary name construction: `{app}-{platform}-{arch}` pattern
- Error message references app name when binary not found

### Pattern 2: package.json Bin Field
**What:** Map command name to executable file path
**When to use:** Always, for any installable CLI
**Example:**
```json
// Source: https://docs.npmjs.com/cli/v7/configuring-npm/package-json/
{
  "name": "my-cli",
  "bin": {
    "my-command": "./bin/my-command"
  }
}
```

**For single binary:**
```json
{
  "name": "my-cli",
  "bin": "./bin/my-cli"
}
```

**How it works:**
- On global install: npm creates symlink in global bin directory
- On local install: available via `npm exec` or in npm scripts
- Symlinks created BEFORE postinstall scripts run
- npm automatically makes files executable (requires shebang)

### Pattern 3: ASCII Art Logo Data Structure
**What:** Separate data (logo.ts) from rendering logic (logo.tsx)
**When to use:** CLI branding with terminal UI framework
**Example:**
```typescript
// Source: Verified in packages/opencode/src/cli/logo.ts
export const logo = {
  left: ["                   ", "█▀▀█ █▀▀█ █▀▀█ █▀▀▄", "█__█ █__█ █^^^ █__█", "▀▀▀▀ █▀▀▀ ▀▀▀▀ ▀~~▀"],
  right: ["             ▄     ", "█▀▀▀ █▀▀█ █▀▀█ █▀▀█", "█___ █__█ █__█ █^^^", "▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀"]
}

export const marks = "_^~"  // Shadow markers for rendering
```

**Key aspects:**
- Logo split into left (muted) and right (bold) sections
- Special characters (`_`, `^`, `~`) mark shadow positions for 3D effect
- Each array element is one line of the banner
- Lines must align properly (same character width accounting for Unicode)

### Anti-Patterns to Avoid
- **Don't forget shebang:** Files in bin field MUST start with `#!/usr/bin/env node` or they won't execute
- **Don't hardcode absolute paths:** Use relative paths in bin field (e.g., `./bin/cmd` not `/usr/local/bin/cmd`)
- **Don't forget environment variables:** Update any env var checks that reference old binary name
- **Don't mix tabs/spaces in ASCII art:** Use consistent spacing for proper alignment

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ASCII art generation | Manual block character layout | Online FIGlet generators | Ensures proper character width, Unicode consistency, professional appearance |
| Binary symlink creation | Custom install scripts | npm's native bin field | npm handles platform differences, permissions, PATH updates automatically |
| Platform detection | Custom OS/arch logic | Existing pattern in bin/opencode | Already handles Rosetta translation, Windows variants, arch mapping edge cases |

**Key insight:** npm's bin field mechanism is battle-tested across millions of packages. Custom installation logic adds complexity and platform-specific bugs.

## Common Pitfalls

### Pitfall 1: Forgetting Environment Variable References
**What goes wrong:** Binary renamed but `OPENCODE_BIN_PATH` env var still references old name, causing confusion
**Why it happens:** Environment variables are scattered across documentation, code, and user configs
**How to avoid:**
- Search entire codebase for `OPENCODE_` prefix (all env vars follow this pattern)
- Update variable names AND their documentation
- Consider: out-of-scope for Phase 2 per requirements, but document in code comments
**Warning signs:** Error messages about "opencode" after rename, users reporting old command still works

### Pitfall 2: ASCII Art Alignment Issues
**What goes wrong:** Generated ASCII art has misaligned characters, breaks TUI layout
**Why it happens:** Unicode box-drawing characters have different widths, invisible trailing spaces
**How to avoid:**
- Use online generator with preview
- Test in actual terminal (not just code editor)
- Ensure each line has consistent character count
- Preserve shadow markers (`_^~`) in same positions as original
**Warning signs:** Logo appears jagged or cut off in terminal

### Pitfall 3: Incomplete bin File Updates
**What goes wrong:** Renamed bin file but internal string references still say "opencode"
**Why it happens:** Binary name appears in multiple contexts (env var name, constructed binary path, error messages)
**How to avoid:**
- Line 20: `process.env.OPENCODE_BIN_PATH` - may need rename (out of scope per requirements)
- Line 47: `const base = "opencode-" + platform + "-" + arch` - MUST change to "openagent-"
- Line 48: `const binary = ... "opencode.exe" : "opencode"` - MUST change to "openagent"/"openagent.exe"
- Lines 77-79: Error message mentioning "opencode" - MUST update
**Warning signs:** Error messages display old name, binary not found after install

### Pitfall 4: README Install Instructions Mismatch
**What goes wrong:** README shows old command name in examples
**Why it happens:** Install instructions scattered throughout README in code blocks
**How to avoid:**
- Search for all code blocks with command invocations
- Update command name in all examples: `opencode run` → `openagent run`
- Verify local install instructions still work (npm link test)
**Warning signs:** Copy-paste instructions from README fail

### Pitfall 5: npm link Cache Issues
**What goes wrong:** `npm link` creates symlink with old name, rename doesn't propagate
**Why it happens:** npm caches symlinks, doesn't automatically update on package.json changes
**How to avoid:**
- Run `npm unlink` before making changes
- After renaming, run `npm link` fresh to create new symlinks
- Test in clean terminal session (source ~/.zshrc to pick up PATH changes)
**Warning signs:** Old command still works after rename, new command not found

## Code Examples

Verified patterns from official sources and codebase:

### Binary Rename Pattern
```bash
# Source: Verified approach combining npm docs + codebase analysis

# 1. Rename physical file
mv packages/opencode/bin/opencode packages/opencode/bin/openagent

# 2. Update package.json bin field
# Before:
{
  "bin": {
    "opencode": "./bin/opencode"
  }
}

# After:
{
  "bin": {
    "openagent": "./bin/openagent"
  }
}

# 3. Update binary wrapper script internal references
# In bin/openagent:
- const base = "opencode-" + platform + "-" + arch
+ const base = "openagent-" + platform + "-" + arch

- const binary = platform === "windows" ? "opencode.exe" : "opencode"
+ const binary = platform === "windows" ? "openagent.exe" : "openagent"

- console.error('...the opencode CLI...')
+ console.error('...the openagent CLI...')
```

### ASCII Art Generation Workflow
```bash
# Source: https://manytools.org/hacker-tools/ascii-banner/
# https://textarttools.com/Figletfontstool/

# 1. Use online generator (no local install needed)
# Visit: https://manytools.org/hacker-tools/ascii-banner/
# Input: "openagent"
# Font: Try "Standard", "Block", or "Banner" for block-style letters

# 2. Export as JavaScript array
# Copy generated ASCII, format as TypeScript:
export const logo = {
  left: [
    "line1",
    "line2",
    // ... ensure consistent line widths
  ],
  right: [
    "line1",
    "line2",
    // ... must have same number of lines as left
  ]
}

# 3. Preserve shadow markers
# Keep _^~ characters in same positions as original for 3D effect
```

### Local Testing with npm link
```bash
# Source: https://docs.npmjs.com/cli/v8/commands/npm-link/

# 1. Clean previous symlinks
cd packages/opencode
npm unlink -g opencode  # Remove old command

# 2. Link new binary
npm link  # Creates global symlink for "openagent" command

# 3. Test command availability
which openagent  # Should show path to global bin
openagent --version  # Should display version

# 4. Test in fresh shell
exec $SHELL  # Start new shell to ensure PATH updated
openagent --help  # Verify command works
```

### Verification Checklist
```bash
# After all changes, verify:

# 1. Binary exists with new name
ls -la packages/opencode/bin/openagent

# 2. Package.json references correct name
grep -n '"openagent"' packages/opencode/package.json

# 3. No old binary name in error messages
grep -n 'opencode' packages/opencode/bin/openagent
# (Should only match in comments or platform binary construction)

# 4. ASCII art renders correctly
cd packages/opencode
bun run --conditions=browser src/index.ts
# Launch TUI, verify logo displays "openagent"

# 5. README updated
grep -n '`openagent' README.md | head -5
# Should show examples using new command
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual symlink installation | npm bin field auto-symlinking | npm v1.0+ (2011) | Standardized CLI installation |
| Hand-drawn ASCII art | FIGlet font generators | 1990s (FIGlet created 1991) | Consistent, professional banners |
| Platform-specific installers | Universal Node.js wrapper script | Modern npm era | Single codebase for all platforms |

**Deprecated/outdated:**
- Custom install scripts for CLI binaries: npm's bin field handles this automatically
- Local figlet installations: Online generators provide same functionality with zero setup

## Open Questions

Things that couldn't be fully resolved:

1. **Environment Variable Renaming**
   - What we know: Current code checks `OPENCODE_BIN_PATH` as override
   - What's unclear: Requirements say "Update bin script internal references" but also defer "Environment variable rename (OPENCODE_* to OPENAGENT_*)" to v2
   - Recommendation: Leave `OPENCODE_BIN_PATH` unchanged in Phase 2, add code comment noting it will be renamed in v2. Update only the error message strings to say "openagent" instead of "opencode"

2. **Platform Binary Package Names**
   - What we know: Wrapper looks for `opencode-{platform}-{arch}` packages
   - What's unclear: Whether platform binary packages need renaming now or in v2
   - Recommendation: Platform binary renaming is likely out of scope (related to full package scope rename). Update wrapper to look for `openagent-{platform}-{arch}` but document that actual packages don't exist yet.

3. **ASCII Art Font Style**
   - What we know: Current logo uses block characters with shadow markers
   - What's unclear: Exact FIGlet font used for original "opencode" logo
   - Recommendation: Use visual matching - try "Standard", "Banner", or custom block characters to match existing style. Preserve shadow marker positions for 3D effect.

## Sources

### Primary (HIGH confidence)
- [npm package.json bin field documentation](https://docs.npmjs.com/cli/v7/configuring-npm/package-json/) - Official npm docs on bin configuration
- [npm link command documentation](https://docs.npmjs.com/cli/v8/commands/npm-link/) - Local testing workflow
- Verified codebase patterns in `/packages/opencode/bin/opencode`, `/packages/opencode/package.json`, `/packages/opencode/src/cli/logo.ts`

### Secondary (MEDIUM confidence)
- [Understanding NPM package.json bin field](https://codingshower.com/understanding-npm-package-json-bin-field/) - Bin field mechanics
- [package.json best practices](https://medium.com/deno-the-complete-reference/package-json-best-practices-in-node-js-6b5f4f8728e9) - Configuration patterns
- [npm-scripts lifecycle](https://docs.npmjs.com/misc/scripts) - Postinstall and bin symlink timing

### Tertiary (LOW confidence)
- [FIGlet ASCII Art Generator - 400+ fonts](https://textarttools.com/Figletfontstool/) - Online generator tool
- [ManyTools ASCII Banner](https://manytools.org/hacker-tools/ascii-banner/) - Alternative generator
- [ASCII Art Generator Complete Guide](https://orbit2x.com/blog/ascii-art-generator-complete-guide) - ASCII art best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - npm bin field is well-documented, established pattern
- Architecture: HIGH - Verified actual codebase structure and patterns
- Pitfalls: HIGH - Identified specific line numbers and touch points from real code

**Research date:** 2026-01-31
**Valid until:** 60 days (npm core functionality is stable, ASCII art tools are mature)
