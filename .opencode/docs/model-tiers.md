# Model Tier Assignment

Tiers describe **how much judgement a role needs**, not which vendor's model
runs it. opencode resolves models per agent in `opencode.json` or in the agent's
own frontmatter, so the tier table below is a mapping guide: assign your
provider's model to each tier once, then the studio keeps its shape.

| Tier | Intended work | Studio roles |
|------|---------------|--------------|
| **Haiku-class** (fast, cheap) | Read-only status checks, formatting, simple lookups | `/help`, `/onboard`, `/project-stage-detect`, `/scope-check`, `/sprint-status` |
| **Sonnet-class** (default) | Implementation, design authoring, analysis of individual systems | Every skill and agent not named in another row |
| **Opus-class** (deep) | Multi-document synthesis, high-stakes phase gates, cross-system review | `/architecture-review`, `/gate-check`, `/review-all-gdds`; agents `creative-director`, `producer`, `technical-director` |

`/patch-notes` and `/changelog` are Sonnet-class, not Haiku-class: both produce
**player-facing** copy and need judgement the cheapest tier is defined as not
doing. `/settings` is Sonnet-class for the same reason: it resolves every leaf
with provenance and compares the configured rigor against observable practice,
which is synthesis rather than lookup.

## How opencode applies a tier

- **Agents.** `model:` in `.opencode/agents/<name>.md`, or
  `agent.<name>.model` in `opencode.json`, pins the model for that subagent. An
  agent with no `model` inherits the session model. This port ships agents with
  no pin so the studio works on whatever provider you already use; add pins for
  the three directors and `lead-programmer` if you want the original split.
- **Skills.** opencode has no per-skill `model:`; a skill runs on the model of
  the agent handling the turn. To give a skill a different model, run it with a
  command that sets one (`.opencode/commands/<name>.md` accepts `model:`), or
  switch the session model for that turn.
- **Commands.** Each skill also ships as a slash command. Add `model:` to
  `.opencode/commands/<name>.md` frontmatter to pin the tier for that command.

Example — pin the deep tier to a provider model:

```json
{
  "agent": {
    "creative-director": { "model": "anthropic/claude-opus-4-1" },
    "technical-director": { "model": "anthropic/claude-opus-4-1" },
    "producer": { "model": "anthropic/claude-opus-4-1" }
  }
}
```

Model IDs always carry their provider prefix. Use the IDs your
`~/.config/opencode/opencode.json` providers expose; this template names none.

## Agent tiers in this port

- **Deep (Opus-class, 3):** `creative-director`, `producer`, `technical-director`.
- **Standard (Sonnet-class, 19):** `lead-programmer`, `prototyper`,
  `devops-engineer`, `community-manager` and the 12 engine sub-specialists:
  `godot-csharp-specialist`, `godot-gdextension-specialist`,
  `godot-gdscript-specialist`, `godot-shader-specialist`, `ue-blueprint-specialist`,
  `ue-gas-specialist`, `ue-replication-specialist`, `ue-umg-specialist`,
  `unity-addressables-specialist`, `unity-dots-specialist`, `unity-shader-specialist`,
  `unity-ui-specialist`.
- **Inherit (27):** every other agent; it runs on the session model.

`/dev-story` and `/code-review` spawn the sub-specialists named in
`project.yaml`'s `specialists` block (written by `/setup-engine`); `/team-ui`
spawns `unity-ui-specialist` and `ue-umg-specialist`; `/team-release` spawns
`devops-engineer` and `community-manager`; `/team-live-ops` spawns
`community-manager`.

A pinned subagent gets that model's context window. A subagent starts from the
brief it is given, not the parent's conversation, so this only matters when a
brief is very large. If a pinned agent overflows, remove its `model:` pin and it
inherits the session model again.
