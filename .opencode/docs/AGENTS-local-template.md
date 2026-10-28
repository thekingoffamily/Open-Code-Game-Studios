# AGENTS.local.md Template

`AGENTS.local.md` is a place for personal notes that should not be committed.
opencode does **not** load it automatically — register it in your global config
so it is read alongside the project's `AGENTS.md`:

```json
{
  "instructions": ["~/Open-Code-Game-Studios-personal.md"]
}
```

Put the file outside the repo and list its absolute path (as above), or copy the
content into your notes. The studio's own instructions come from `AGENTS.md` and
the files registered in `opencode.json` -> `instructions`.

```markdown
# Personal Preferences

## Model Preferences
- Prefer the deep tier for complex design tasks
- Use the fast tier for quick lookups and simple edits

## Workflow Preferences
- Always run tests after code changes
- Compact context proactively at 60% usage
- Start a fresh session between unrelated tasks

## Local Environment
- Python command: python (or py / python3)
- Shell: Git Bash on Windows
- IDE: VS Code with the opencode extension

## Communication Style
- Keep responses concise
- Show file paths in all code references
- Explain architectural decisions briefly

## Personal Shortcuts
- When I say "review", run /code-review on the last changed files
- When I say "status", show git status + sprint progress
```
