import type { Plugin } from "@opencode-ai/plugin"
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"

type HookResult = { code: number; stdout: string; stderr: string }

function resolveBash(): string {
  if (process.env.OPENCODE_BASH) return process.env.OPENCODE_BASH
  if (process.platform === "win32") {
    for (const candidate of [
      "C:\\Program Files\\Git\\bin\\bash.exe",
      "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
    ]) {
      if (existsSync(candidate)) return candidate
    }
  }
  return "bash"
}

const BASH = resolveBash()
const HOOK_TIMEOUT_MS = 15000

function runHook(
  root: string,
  script: string,
  payload: unknown,
  timeoutMs = HOOK_TIMEOUT_MS,
): Promise<HookResult> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result: HookResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }
    let child
    try {
      child = spawn(BASH, [path.join(root, ".opencode", "hooks", script)], {
        cwd: root,
        env: {
          ...process.env,
          OPENCODE_PROJECT_DIR: root,
          CLAUDE_PROJECT_DIR: root,
        },
        windowsHide: true,
      })
    } catch (error) {
      finish({ code: 0, stdout: "", stderr: String(error) })
      return
    }

    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => {
      try {
        child.kill()
      } catch {}
      finish({ code: 0, stdout, stderr })
    }, timeoutMs)

    child.stdout?.on("data", (chunk) => (stdout += chunk.toString()))
    child.stderr?.on("data", (chunk) => (stderr += chunk.toString()))
    child.on("error", (error) => {
      clearTimeout(timer)
      finish({ code: 0, stdout, stderr: stderr + String(error) })
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      finish({ code: code ?? 0, stdout, stderr })
    })

    try {
      child.stdin?.end(JSON.stringify(payload ?? {}))
    } catch {}
  })
}

function claudePayload(toolName: string, toolInput: Record<string, unknown>, sessionID?: string) {
  return {
    tool_name: toolName,
    tool_input: toolInput,
    session_id: sessionID ?? "",
    hook_event_name: "PreToolUse",
  }
}

function hookText(stdout: string): string {
  const raw = stdout.trim()
  if (!raw) return ""
  for (const line of raw.split(/\r?\n/)) {
    const candidate = line.trim()
    if (!candidate.startsWith("{")) continue
    try {
      const parsed = JSON.parse(candidate)
      const text =
        parsed?.hookSpecificOutput?.additionalContext ??
        parsed?.systemMessage ??
        parsed?.permissionDecisionReason ??
        parsed?.reason
      if (typeof text === "string" && text.trim()) return text.trim()
    } catch {}
  }
  return raw
}

export default (async ({ client, directory, worktree }) => {
  const root = worktree || directory
  const contextBySession = new Set<string>()
  const advisoryByCall = new Map<string, string>()
  const argsByCall = new Map<string, Record<string, any>>()

  const log = async (message: string, level: "debug" | "info" | "warn" | "error" = "debug") => {
    try {
      await client.app.log({ body: { service: "game-studios", level, message } })
    } catch {}
  }

  const block = (stderr: string, fallback: string) => {
    const message = stderr.trim() || fallback
    throw new Error(message)
  }

  return {
    "experimental.chat.system.transform": async (input, output) => {
      const sessionID = input.sessionID ?? "default"
      if (contextBySession.has(sessionID)) return
      contextBySession.add(sessionID)

      const start = await runHook(root, "session-start.sh", {})
      const startText = start.code === 0 ? hookText(start.stdout) : ""
      if (startText) output.system.push(startText)

      const gaps = await runHook(root, "detect-gaps.sh", {})
      const gapsText = gaps.code === 0 ? hookText(gaps.stdout) : ""
      if (gapsText) output.system.push(gapsText)
    },

    "tool.execute.before": async (input, output) => {
      const tool = input.tool
      const args = (output.args ?? {}) as Record<string, any>
      argsByCall.set(input.callID, args)

      if (tool === "bash") {
        const command = String(args.command ?? "")
        const payload = claudePayload("Bash", { command }, input.sessionID)

        const commit = await runHook(root, "validate-commit.sh", payload)
        if (commit.code === 2) block(commit.stderr, "Commit blocked by the studio's pre-commit rules.")
        const commitText = hookText(commit.stdout)
        if (commitText) advisoryByCall.set(input.callID, commitText)

        const push = await runHook(root, "validate-push.sh", payload)
        if (push.code === 2) block(push.stderr, "Push blocked by the studio's release rules.")
        const pushText = hookText(push.stdout)
        if (pushText) {
          const prior = advisoryByCall.get(input.callID) ?? ""
          advisoryByCall.set(input.callID, [prior, pushText].filter(Boolean).join("\n"))
        }
        return
      }

      if (tool === "write") {
        const payload = claudePayload(
          "Write",
          { file_path: String(args.filePath ?? ""), content: String(args.content ?? "") },
          input.sessionID,
        )
        const registry = await runHook(root, "validate-registry.sh", payload)
        if (registry.code === 2) block(registry.stderr, "Write blocked by the registry guard.")
        const write = await runHook(root, "validate-write.sh", payload)
        if (write.code === 2) block(write.stderr, "Write blocked by the studio's write rules.")
        return
      }

      if (tool === "edit") {
        const payload = claudePayload(
          "Edit",
          {
            file_path: String(args.filePath ?? ""),
            old_string: String(args.oldString ?? ""),
            new_string: String(args.newString ?? ""),
            replace_all: Boolean(args.replaceAll),
          },
          input.sessionID,
        )
        const registry = await runHook(root, "validate-registry.sh", payload)
        if (registry.code === 2) block(registry.stderr, "Edit blocked by the registry guard.")
        const write = await runHook(root, "validate-write.sh", payload)
        if (write.code === 2) block(write.stderr, "Edit blocked by the studio's write rules.")
        return
      }

      if (tool === "read") {
        const payload = claudePayload(
          "Read",
          {
            file_path: String(args.filePath ?? ""),
            offset: args.offset,
            limit: args.limit,
          },
          input.sessionID,
        )
        const read = await runHook(root, "validate-read.sh", payload)
        if (read.code === 2) block(read.stderr, "Read blocked by the read guard. Read a section instead.")
      }
    },

    "tool.execute.after": async (input, output) => {
      const tool = input.tool
      const advisory = advisoryByCall.get(input.callID)
      if (advisory) {
        advisoryByCall.delete(input.callID)
        output.output = [output.output, "", advisory].filter(Boolean).join("\n")
      }

      if (tool === "write" || tool === "edit") {
        const args = (argsByCall.get(input.callID) ?? {}) as Record<string, any>
        argsByCall.delete(input.callID)
        const payload = claudePayload(
          tool === "write" ? "Write" : "Edit",
          {
            file_path: String(args.filePath ?? ""),
            content: args.content,
            old_string: args.oldString,
            new_string: args.newString,
          },
          input.sessionID,
        )
        const assets = await runHook(root, "validate-assets.sh", payload)
        const assetText = [assets.stderr, hookText(assets.stdout)].filter(Boolean).join("\n").trim()
        if (assetText) {
          output.output = [output.output, "", assetText].filter(Boolean).join("\n")
        }
        await runHook(root, "validate-skill-change.sh", payload, 5000)
      }
    },

    "experimental.session.compacting": async (input, output) => {
      const payload = {
        hook_event_name: "PreCompact",
        session_id: input.sessionID,
        cwd: root,
      }
      const result = await runHook(root, "pre-compact.sh", payload)
      const text = [hookText(result.stdout), result.stderr].filter(Boolean).join("\n").trim()
      if (text) output.context?.push(text)
      await log("compaction checkpoint written", "info")
    },
  }
}) satisfies Plugin
