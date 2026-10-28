# Active Hooks

Hooks are implemented as an opencode plugin: `.opencode/plugins/game-studios.ts`
is auto-discovered at startup, and it runs the shell scripts in
`.opencode/hooks/` at the matching moment. The scripts are unchanged in
behaviour; the plugin only translates opencode tool calls into the payload
shape the scripts already read (see `hooks-reference/hook-input-schemas.md`).

The plugin sets `OPENCODE_PROJECT_DIR` (and `CLAUDE_PROJECT_DIR`, for scripts
copied from older versions) to the project root before it invokes a script.

| Script | opencode hook | Trigger | Action |
| ---- | ----- | ------- | ------ |
| `validate-commit.sh` | `tool.execute.before` (bash) | `git commit` commands | Blocks the commit when design-doc sections, JSON data files, hardcoded values or the TODO format violate the rules; its warnings are appended to the command output |
| `validate-push.sh` | `tool.execute.before` (bash) | `git push`, `git tag`, `git merge` and release commands | Warns on pushes to protected branches (`main`, `master` and `release/*`), and on the steps that ask first: `git tag` (not a listing), `git merge` (not `--abort`), `gh release`, `butler push` and `steamcmd` with `+run_app_build`. Which commands count is `bash .opencode/scripts/write-guard.sh git` |
| `validate-registry.sh` | `tool.execute.before` (write, edit) | Writes and edits of `design/registry/entities.yaml` and `docs/architecture/tr-registry.yaml` | Warns, and never blocks, when the change would delete or renumber an entry or set a status outside the values the file's header lists. The check is `bash .opencode/scripts/registry.sh compare`. Skills that write a registry also run `registry.sh validate` after writing |
| `validate-write.sh` | `tool.execute.before` (write, edit) | Writes and edits the rules below name | Warns, and never blocks, when a write would replace a file skills never overwrite (an existing `EPIC.md`, `project.godot`, `tests/helpers/*`, the tech-debt register, an engine reference doc, the files `/test-setup` creates), set a config value outside its list or a key `project.local.yaml` cannot hold, set the review mode, leave a prototype file without its `PROTOTYPE` or `VERTICAL SLICE` header, or reach between `prototypes/` and the code root. The check is `bash .opencode/scripts/write-guard.sh check` |
| `validate-read.sh` | `tool.execute.before` (read) | A read with no offset and no limit under `design/`, `docs/architecture/` or `production/session-state/` | Blocks a whole-file read of a doc over 40 KB (`features.read_guard_kb`) and answers with the doc's headings by line, so the retry reads one section; a ranged read always passes. `features.read_guard: off` turns it off. The check is `bash .opencode/scripts/read-guard.sh check` |
| `validate-assets.sh` | `tool.execute.after` (write, edit) | Asset file changes | Checks data-file JSON under `assets/`, `Assets/` or `Content/`, and asset naming in Godot's `assets/` only. Warnings are appended to the tool output |
| `validate-skill-change.sh` | `tool.execute.after` (write, edit) | Skill file changes | Advises running `/skill-test` after any `.opencode/skills/` file is written or edited |
| `session-start.sh` | `experimental.chat.system.transform` | First model call of a session | Loads sprint context, milestone, git activity; detects and previews the active session-state file for recovery, with one line when its checkpoint names a different branch; one line when a newer release is out |
| `detect-gaps.sh` | `experimental.chat.system.transform` | First model call of a session | Detects fresh projects (suggests `/start`) and missing documentation when code/prototypes exist, suggests `/reverse-document` or `/project-stage-detect` |
| `pre-compact.sh` | `experimental.session.compacting` | Context compression | Appends one line to `production/session-logs/compaction-log.txt`. The plugin also adds the script's output to the compaction context |

`session-start.sh` and `detect-gaps.sh` run once per session; their output is
appended to the system prompt, so a long session does not pay for them on every
turn.

Blocking is real: when a script exits 2, the plugin throws with the script's
stderr, opencode aborts the tool call, and the model sees the message.
Advisory output is appended to the tool result, where both the user and the
model see it.

## Scripts with no opencode event

These scripts are kept because skills and CI call them directly, but opencode
has no equivalent event to wire them to:

| Script | What it did | What to use instead |
| ---- | ------- | ------ |
| `notify.sh` | Desktop toast on a permission prompt or idle time | opencode's TUI notifications; run the script from a keybinding if you want the toast |
| `session-stop.sh` | Wrote the session log and the subagent spawn tally at the end of every response | Run `bash .opencode/scripts/session-state.sh` when you checkpoint; the audit trail is optional |
| `log-agent.sh`, `log-agent-stop.sh` | Subagent audit trail | Not available: opencode's plugin events do not expose subagent start/stop |
| `validate-agent-artifact.sh` | Warned when a subagent's promised output file was missing | Skills already check their own artifacts in the gate steps |
| `update-check.sh` | Refreshed the release-check cache once a day | Run it manually, or drop it |

## Events considered and deliberately not added

| opencode hook | Why not |
| ---- | ---- |
| `chat.message` | Would re-inject session state on **every prompt**. `config-resolution.md` rejects that: it "would cost tokens on every session whether or not any skill needs config, and it would go stale mid-session". |
| `event` (`file.watcher.updated`) on `project.yaml` | Config is resolved per skill invocation, in the skill body, precisely so each run reads fresh values. |
| `tool.execute.before` rewriting the user's command | Silently editing the user's input contradicts the collaboration protocol: this project blocks and explains rather than acting unasked. |
| `tool.execute.after` failure logging | Would add another log with no reader. |
| `permission.ask` auto-approval | The permission block in `opencode.json` is where approvals belong; a plugin that answers for the user hides the decision. |

Hook reference documentation: `.opencode/docs/hooks-reference/`
Hook input schema documentation: `.opencode/docs/hooks-reference/hook-input-schemas.md`
