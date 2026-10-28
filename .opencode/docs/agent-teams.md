# Parallel Agent Work

> On-demand reference. Demoted out of `coordination-rules.md` (an always-loaded
> AGENTS.md instruction) in v1.1 — read this when actually considering parallel
> work, not on every turn.

opencode can run several subagents at once from one session: the primary agent
dispatches them with the `task` tool, each in its own context window, and gets
one summary back per agent. There is no separate "team" runtime to enable — the
`/team-*` skills are the coordination layer, and they work with the standard
task tool.

## Use parallel subagents when

- Work spans multiple subsystems that will not touch the same files
- Each workstream would take >30 minutes and benefits from true parallelism
- A senior agent (technical-director, producer) needs to coordinate 3+ specialists
  working on different epics simultaneously

## Do not use parallel subagents when

- One workstream's output is required as input for another (run them sequentially)
- The task fits in a single session's context (do it inline)
- Cost is a concern — each subagent burns tokens independently

## How it works in opencode

- The primary agent calls `task` once per workstream, with `subagent_type` naming
  the studio role (`.opencode/agents/<name>.md`).
- Parallel calls are sent in one message; opencode runs them concurrently.
- Each subagent sees its brief only, not the parent conversation, so the brief
  must carry the context it needs (paths, acceptance criteria, gate rules).
- Results return as summaries; the coordinating skill folds them into one report
  and asks the user before writing shared files.

## Current status

Supported through the task tool. Document first real usage here when adopted.
