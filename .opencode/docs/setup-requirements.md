# Setup Requirements

This template requires a few tools to be installed for full functionality.
Hooks carry on without an optional tool and lose only the check it powers. The
required ones are required: without Python 3 every setting falls back to its
default and a commit that stages data JSON is blocked, and without Bash no hook
runs at all.

## Required

| Tool | Purpose | Install |
| ---- | ---- | ---- |
| **Git** | Version control, branch management | [git-scm.com](https://git-scm.com/) |
| **opencode** | AI agent CLI | Native installer: `curl -fsSL https://opencode.ai/install.sh \| bash` (macOS, Linux, WSL) or `irm https://opencode.ai/install.ps1 \| iex` (Windows PowerShell). npm also works: `npm install -g opencode-ai` (Node.js 22+). See [code.opencode.com/docs/en/setup](https://opencode.ai/docs) |
| **Python 3** | Reads `project.yaml` for every skill and hook | [python.org](https://www.python.org/). Without it every setting silently falls back to its default, and a commit that stages data JSON is blocked because it cannot be validated |
| **Bash** | Runs every hook | Built into macOS and Linux. On Windows, install [Git for Windows](https://git-scm.com/downloads/win) — opencode runs without it, but no CCGS hook does |

## Recommended

| Tool | Used By | Purpose | Install |
| ---- | ---- | ---- | ---- |
| **jq** | Hooks (8 of 12) | JSON parsing in commit/push/asset/agent hooks | See below |

### Installing jq

**Windows** (any of these):
```
winget install jqlang.jq
choco install jq
scoop install jq
```

**macOS**:
```
brew install jq
```

**Linux**:
```
sudo apt install jq     # Debian/Ubuntu
sudo dnf install jq     # Fedora
sudo pacman -S jq       # Arch
```

## Platform Notes

### Windows
- Git for Windows includes **Git Bash**, which provides the `bash` command used
  by the hook bridge and the helper scripts
- If opencode can't find `bash.exe`, set `shell` in `opencode.json` to the full
  path (for example `"C:\\\\Program Files\\\\Git\\\\bin\\\\bash.exe"`) or add Git's
  `bin` folder to `PATH`
- Hooks run through the plugin in `.opencode/plugins/game-studios.ts`, which
  invokes `bash .opencode/hooks/[name].sh` — this works on Windows because the
  plugin resolves Git Bash from `PATH` or the configured shell

### macOS / Linux
- Bash is available natively
- Install `jq` via your package manager for full hook support

## Verifying Your Setup

Run these commands to check prerequisites:

```bash
git --version          # Should show git version
bash --version         # Should show bash version
jq --version           # Should show jq version (optional)
python --version       # Required: Python 3 (python3 or py also work)
```

## What Happens Without Optional Tools

| Missing Tool | Effect |
| ---- | ---- |
| **jq** | Nothing is lost: every hook falls back to `grep` to read its JSON input. jq is only more robust with unusual input. |
| **Python 3** | Not optional (see Required). Every setting falls back to its default, because `project.yaml` is read through Python; the asset hook skips JSON validation and says so; a commit that stages data JSON is blocked. |
| **Both** | As without Python. |

## Optional Performance Settings

The shipped `opencode.json` sets only what the studio needs to work: the
instruction files, the skill path, and a permission block. Everything else is
left at opencode's defaults on purpose — a value committed here would be a guess
every user inherits without noticing.

Change what you need in your **global** config
(`~/.config/opencode/opencode.json`) or in a personal file named by
`OPENCODE_CONFIG`. Project settings win over global ones, so a personal config
cannot loosen a project `deny` rule; it can add allows, models and instructions.
See `.opencode/docs/settings-local-template.md`.

`compaction` controls when the session context is compacted; raise or lower
`compaction.tail_turns` to keep more or less history. The `pre-compact.sh` hook
runs at that moment and writes the session checkpoint.

## The permission block the studio ships

`permission.bash` in `opencode.json` is deliberate: the framework's own helpers
(`.opencode/hooks/**`, `.opencode/scripts/**`) run without a prompt, read-only
git commands are allowed, and dangerous operations are denied — force pushes,
hard resets, `rm -rf`, `sudo`, reads and writes of `.env` files.

What it does **not** guarantee:

- **Starting in a subfolder.** opencode walks up to the project root to load
  config, but the plugin and helper scripts resolve paths from the repo root.
  Start sessions at the root.
- **A tool opencode adds later.** A new tool is governed by the defaults until
  you add a rule; the deny list names the dangerous patterns that exist today.
- **Edit acceptance.** In any mode that accepts edits without asking, the
  framework's "May I write?" is an instruction to the model, not a hard stop.
  The hook checks in `validate-write.sh` still run.

To see the resolved rules, run `opencode debug config` and read `permission`.
## Recommended IDE

opencode works with any editor, but the template is optimized for:
- **VS Code** with the opencode extension
- **Cursor** (opencode compatible)
- Terminal-based opencode CLI
