# Personal Overrides

opencode merges configuration from several scopes. Use this order when you want
settings that are yours and are not committed:

| Scope | File | Committed? |
| ---- | ---- | ---- |
| Project | `opencode.json` at the repo root | Yes — this is the studio's shared config |
| Global | `~/.config/opencode/opencode.json` | No — your personal defaults |
| Explicit extra | any file named by `OPENCODE_CONFIG` | No |

Project settings win over global ones when both set the same field. That means a
global config can **add** permissions and tools but cannot loosen a project
`deny` rule. To run a one-off config, start opencode with
`OPENCODE_CONFIG=C:\path\to\personal.json`.

## Example personal config

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "bash": {
      "*": "ask",
      "npm run *": "allow",
      "git add *": "allow",
      "git commit *": "allow",
      "git push *": "deny"
    }
  }
}
```

Rules are globs, and the last matching rule wins — put `"*"` first, then the
broad allows, then the narrow denies. Read-only commands such as `git status` and
`git log` are allowed by the shipped project config.

## Model preferences

A personal model choice belongs in the global config, not in the repo:

```json
{
  "agent": {
    "creative-director": { "model": "anthropic/claude-opus-4-1" }
  }
}
```

A project `agent` entry for the same name wins if it sets `model`, so leave the
shared `.opencode/agents/*.md` files unpinned unless the whole team agrees.

## Extra instructions

To add personal instructions without touching `AGENTS.md`, point the global
config at a file of your own:

```json
{
  "instructions": ["~/my-opencode-notes.md"]
}
```

Do not rely on `AGENTS.local.md`: opencode does not scan for that name. Either
list it under `instructions` or keep personal notes outside the repo.
