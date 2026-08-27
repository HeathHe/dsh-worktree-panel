import assert from "node:assert/strict"
import { mkdtemp, mkdir, realpath, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { __testing } from "../lib/index.js"

const { assignSessionsToRoots, sessionMap } = __testing
const root = await mkdtemp(join(tmpdir(), "dsh-wtp-routing-"))
const main = join(root, "repo")
const nested = join(main, ".dsh", "workspaces", "feature")
const globalWt = join(root, "global", "repo", "bugfix")
await mkdir(nested, { recursive: true })
await mkdir(globalWt, { recursive: true })

try {
  const routed = assignSessionsToRoots(new Map([
    [join(main, "src"), [{ id: "main" }]],
    [nested, [{ id: "nested" }]],
    [join(nested, "src"), [{ id: "nested-child" }]],
    [join(globalWt, "src"), [{ id: "global" }]],
  ]), [
    { id: "main", key: main },
    { id: "nested", key: nested },
    { id: "global", key: globalWt },
  ])
  assert.deepEqual(routed.get("main").map((s) => s.id), ["main"])
  assert.deepEqual(routed.get("nested").map((s) => s.id), ["nested", "nested-child"])
  assert.deepEqual(routed.get("global").map((s) => s.id), ["global"])

  const ctx = {
    sessions: {
      list: () => [
        { id: "live", header: { cwd: nested } },
        { id: "live-subagent", header: { cwd: nested, origin: "subagent" } },
      ],
    },
    workspaceRegistry: { get: () => undefined },
    get: (name) => {
      if (name === "agents") return { get: (id) => id === "live" ? { status: "running" } : undefined }
      if (name === "sessionPersistence") return {
        list: async () => [
          { id: "live", cwd: nested },
          { id: "cold", cwd: nested },
          { id: "cold-subagent", cwd: nested, origin: "subagent" },
        ],
      }
      return undefined
    },
  }
  const mapped = await sessionMap(ctx)
  assert.equal(mapped.byId.get("live")?.running, true)
  assert.equal(mapped.byId.has("cold"), true)
  assert.equal(mapped.byId.has("live-subagent"), false)
  assert.equal(mapped.byId.has("cold-subagent"), false)
  const nestedKey = await realpath(nested)
  assert.deepEqual((mapped.byCwd.get(nestedKey) ?? []).map((s) => s.id), ["live", "cold"])
} finally {
  await rm(root, { recursive: true, force: true })
}

console.log("host session routing test OK: cold sessions survive and nested worktrees own their sessions")
