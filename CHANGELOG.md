# Changelog

What's new in OpenCode Game Studios, written for the people using it.

This fork ports the upstream **Claude Code Game Studios** template to
[opencode](https://opencode.ai). Upstream history before the port lives at
https://github.com/thekingoffamily/Open-Code-Game-Studios/commits/main — this
file records the port and what changed here.

---

## [2.0.0] — 2026-10-28

**The studio now runs on opencode: 49 subagents, 74 skills and 74 slash
commands, with the validation hooks moved into a plugin.**

### Added

- A Russian `README.md`; the English version is now `README.en.md`, with a
  language switcher between them.
- `opencode.json` — loads `AGENTS.md`, the coordination/coding docs and all 14
  rules through `instructions`, registers `.opencode/skills` and the permission
  block.
- `.opencode/commands/` — 74 slash commands, one per skill. Each one loads its
  skill and forwards `$ARGUMENTS`.
- `.opencode/plugins/game-studios.ts` — the hook bridge. It maps opencode's
  `tool.execute.before/after`, `experimental.chat.system.transform` and
  `experimental.session.compacting` onto the existing shell hooks, sets
  `OPENCODE_PROJECT_DIR`, and appends hook warnings to the tool output.
- `AGENTS.local.md` guidance in `.opencode/docs/settings-local-template.md`.

### Changed

- `.claude/` → `.opencode/`; `CLAUDE.md` → `AGENTS.md` (root and every
  subdirectory).
- Agent frontmatter converted to opencode: `mode: subagent`, `steps`,
  `permission` (from `tools` / `disallowedTools`), `maxTurns` → `steps`.
- Skill frontmatter reduced to `name` + `description`; the ported
  `allowed-tools`, `argument-hint`, `user-invocable` and `model` keys were
  removed.
- Skill bodies ask the model to run helpers (`.opencode/hooks/...`,
  `.opencode/scripts/...`) instead of relying on Claude's `!`cmd`` injection.
- Tools renamed in prose: `AskUserQuestion` → `question`, `TodoWrite` →
  `todowrite`, `Task`/`Agent` tool → `task`.
- `settings.json` permissions became `permission` in `opencode.json`; the
  `statusline.sh` helper was removed (opencode has no status line hook).
- `model-tiers.md` rewritten for opencode model ids; agents ship unpinned.
- `hooks-reference.md` rewritten around the plugin; scripts with no opencode
  event are documented as callable helpers.

### Removed

- `.opencode/settings.json`, `.opencode/statusline.sh`.
- The audit-trail hooks (`log-agent.sh`, `log-agent-stop.sh`,
  `validate-agent-artifact.sh`) are no longer wired; opencode does not expose
  subagent start/stop to plugins.
