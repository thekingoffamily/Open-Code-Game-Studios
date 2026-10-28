# Upgrading

This repository is the opencode port of the **Claude Code Game Studios**
template. There are two upgrade paths.

## From the upstream Claude Code template

`.claude/` is now `.opencode/`, and `CLAUDE.md` is now `AGENTS.md`. If you have a
game project built on the upstream template:

1. **Commit your project work first.** The port replaces the framework files
   wholesale and keeps your game files (`src/`, `assets/`, `design/`, `docs/`,
   `tests/`, `production/`) where they are.
2. **Take the framework folders from this repo:** `opencode.json`, `AGENTS.md`,
   `.opencode/`, `studio-tests/`, `studio-tests/AGENTS.md`.
3. **Delete the Claude-era files** once you have diffed them:
   `.claude/`, `CLAUDE.md`, `CLAUDE.local.md`, `.claude/settings.local.json`.
4. **Carry over your settings.** Your `project.yaml` and `project.local.yaml`
   need no conversion. Permission rules that lived in
   `.claude/settings.local.json` move to your global
   `~/.config/opencode/opencode.json` (see
   `.opencode/docs/settings-local-template.md`).
5. **Restart opencode** — config, agents, skills, commands and the plugin are
   read at startup.
6. **Run `/start`** and check that it names the right stage, engine and next
   step.

Things that do not survive the move, by design:

- Claude's skill-shell injection (`!`cmd`` in a skill body) — skills now tell
  the model to run the helper instead. The scripts are unchanged.
- The status line (`statusline.sh`) — opencode has no equivalent hook.
- Subagent audit logging — opencode plugins cannot observe subagent start/stop.
- Model aliases (`opus`, `sonnet`, `haiku`) — use full `provider/model-id`
  values in agent frontmatter or `opencode.json`; see
  `.opencode/docs/model-tiers.md`.

## From an earlier version of this fork

The port is a single break (v2.0.0). Pull the repository and restart opencode;
`project.yaml`, your design docs and your game code need no changes.
`CHANGELOG.md` lists every structural change.
