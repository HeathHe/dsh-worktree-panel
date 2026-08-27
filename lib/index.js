// dsh-worktree-panel — host half.
// The official workspace/session browser (ui-workspace) is disabled in
// cordis.patch.yml; this plugin's client half (generated from that exact
// component by lib/build.mjs) owns the sidebar slot and adds the
// project -> worktree dimension while preserving every official interaction.
// This host half serves the worktree topology: real git worktrees at
// <worktreeRoot>/<repoName>/<branch>/, registered as DSH workspaces, plus a
// per-directory session map so the tree can render 项目 → worktree → 会话.
// Node builtins only; no runtime dependencies.
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile, readdir, realpath } from "node:fs/promises"
import { join, basename, dirname, isAbsolute } from "node:path"
import { homedir } from "node:os"

const execFileAsync = promisify(execFile)
const MANIFEST_PATH = join(homedir(), ".dsh", "worktree-panel.json")
const API_PREFIX = "/api/dsh-worktree"
const SECTION_ORDER = 210

const inject = ["webServer", "sessions", "workspaceRegistry", "systemPrompt"]

const GUIDANCE = "本机已安装 dsh-worktree-panel 插件（DSH Web GUI 的 worktree 分支管理面板）：为 git 项目增加 worktree 维度——项目组内展示主工作树与各分支 worktree，可创建/删除 worktree、切换主分支。worktree 默认存于 <项目>/.dsh/workspaces/，可在设置中改为全局路径。用户提到「worktree 面板 / 分支管理」时即指本插件。"

// ---------------------------------------------------------------------------
// git helpers
// ---------------------------------------------------------------------------
async function git(args, cwd) {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      timeout: 30000,
      maxBuffer: 8 * 1024 * 1024,
    })
    return { ok: true, out: String(stdout).trim() }
  } catch (error) {
    const detail = (error.stderr ? String(error.stderr) : String(error.message ?? error)).trim()
    return { ok: false, error: detail }
  }
}

/** Main repo root of a checkout (main tree or linked worktree), or null. */
async function gitCommonRoot(path) {
  const r = await git(["rev-parse", "--path-format=absolute", "--git-common-dir"], path)
  if (!r.ok) return null
  const common = r.out
  return common.endsWith(".git") ? dirname(common) : common
}

async function canonical(path) {
  try {
    return await realpath(path)
  } catch {
    return path
  }
}

async function listBranches(repoRoot) {
  const r = await git(["for-each-ref", "refs/heads", "--format=%(refname:short)"], repoRoot)
  if (!r.ok) return []
  return r.out.split("\n").filter(Boolean)
}

/** All linked worktrees of a repo via `git worktree list --porcelain` —
 *  covers BOTH the orca layout (<root>/<project>/<branch>) and git's own
 *  relative worktrees (<repo>/.worktrees/<branch>). Broken/orphaned worktree
 *  checkouts are not registered by git and are skipped automatically. */
async function listWorktrees(repoRoot) {
  const r = await git(["worktree", "list", "--porcelain"], repoRoot)
  if (!r.ok) return []
  const result = []
  let cur = null
  for (const line of r.out.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (cur !== null) result.push(cur)
      cur = { path: line.slice("worktree ".length) }
    } else if (line.startsWith("branch ") && cur !== null) {
      cur.branch = line.slice("branch ".length).replace(/^refs\/heads\//, "")
    } else if (line === "detached" && cur !== null) {
      cur.detached = true
    }
  }
  if (cur !== null) result.push(cur)
  return result.filter((w) => w.path !== repoRoot)
}

async function currentBranchRef(repoRoot) {
  const r = await git(["symbolic-ref", "-q", "--short", "HEAD"], repoRoot)
  if (r.ok && r.out) return { branch: r.out, detached: false }
  const h = await git(["rev-parse", "--short", "HEAD"], repoRoot)
  return h.ok ? { branch: `(detached ${h.out})`, detached: true } : { branch: "unknown", detached: false }
}

/** Dirty file count plus ahead/behind parsed from `git status -sb --porcelain`. */
async function porcelainState(path) {
  const r = await git(["status", "--porcelain", "-b"], path)
  if (!r.ok) return { dirty: null, ahead: null, behind: null, upstream: null }
  const lines = r.out.split("\n").filter(Boolean)
  const head = lines[0] ?? ""
  const dirty = Math.max(0, lines.length - 1)
  let ahead = null
  let behind = null
  let upstream = null
  if (head.includes("...")) {
    upstream = "tracking"
    const m = head.match(/\[(ahead (\d+))?(, )?(behind (\d+))?|\[gone\]/)
    if (head.includes("[gone]")) {
      upstream = "gone"
    } else if (m) {
      ahead = m[2] ? Number(m[2]) : 0
      behind = m[5] ? Number(m[5]) : 0
    }
  }
  return { dirty, ahead, behind, upstream }
}

// ---------------------------------------------------------------------------
// manifest (durable repo list + worktree location config)
// ---------------------------------------------------------------------------
function defaultManifest() {
  return {
    version: 1,
    root: join(homedir(), "orca", "workspaces"), // 兼容旧布局；worktreeRoot 为空时不再使用
    worktreeRoot: "", // 空 = 项目内 .dsh/workspaces；绝对路径 = 全局 <root>/<项目>/<分支>
    repos: [],
  }
}

/**
 * worktree 落盘基准目录：
 * - worktreeRoot 为空 → `<项目主仓库>/.dsh/workspaces`（项目内，默认）
 * - worktreeRoot 为绝对路径 → `<worktreeRoot>/<项目名>`（全局布局）
 */
function worktreeBase(manifest, repo) {
  const root = manifest.worktreeRoot
  if (typeof root === "string" && root.trim() !== "") return join(root.trim(), repo.name)
  return join(repo.path, ".dsh", "workspaces")
}

async function loadManifest() {
  try {
    const raw = JSON.parse(await readFile(MANIFEST_PATH, "utf8"))
    return { ...defaultManifest(), ...raw }
  } catch {
    return defaultManifest()
  }
}

async function saveManifest(manifest) {
  await mkdir(dirname(MANIFEST_PATH), { recursive: true })
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n")
}

/** Auto-discover git repos from the DSH workspace list (read-only seeding). */
async function seedRepos(ctx, manifest) {
  const existingRoots = new Set()
  for (const r of manifest.repos) {
    const root = await gitCommonRoot(r.path)
    if (root !== null) existingRoots.add(await canonical(root))
  }
  const candidates = []
  try {
    for (const ws of ctx.workspaceRegistry.list()) {
      if (typeof ws.path === "string") candidates.push(ws.path)
    }
  } catch {
    /* registry unavailable */
  }
  for (const path of candidates) {
    const root = await gitCommonRoot(path)
    if (root === null) continue
    const key = await canonical(root)
    // Worktree directories resolve to the same common root: only one repo entry.
    if (existingRoots.has(key)) continue
    existingRoots.add(key)
    let name = basename(root)
    const taken = new Set(manifest.repos.map((r) => r.name))
    if (taken.has(name)) {
      let i = 2
      while (taken.has(`${name}-${i}`)) i++
      name = `${name}-${i}`
    }
    manifest.repos.push({ name, path: root })
  }
}

/** Collapse manifest entries whose canonical git root is already covered. */
async function dedupeManifest(manifest) {
  const byRoot = new Map()
  const kept = []
  for (const r of manifest.repos) {
    const root = await gitCommonRoot(r.path)
    if (root === null) continue
    const key = await canonical(root)
    if (byRoot.has(key)) continue
    byRoot.set(key, r.name)
    kept.push({ ...r, path: root })
  }
  if (kept.length !== manifest.repos.length) {
    manifest.repos = kept
    await saveManifest(manifest)
  }
}

/** Load the manifest, seed it from the workspace registry, persist new repos. */
async function loadManifestSeeded(ctx) {
  const manifest = await loadManifest()
  const before = manifest.repos.length
  await seedRepos(ctx, manifest)
  if (manifest.repos.length !== before) await saveManifest(manifest)
  await dedupeManifest(manifest)
  await pruneOrphanWorkspaces(ctx, manifest)
  return manifest
}

/**
 * Self-heal: unregister DSH workspaces that point at a deleted worktree
 * directory under <root>/<repo>/<branch> and have no running sessions.
 */
async function pruneOrphanWorkspaces(ctx, manifest) {
  const orphanPrefixes = manifest.repos.map((r) => worktreeBase(manifest, r) + "/")
  if (orphanPrefixes.length === 0) return
  let workspaces = []
  try {
    workspaces = ctx.workspaceRegistry.list()
  } catch {
    return
  }
  const sessions = await sessionMap(ctx)
  for (const ws of workspaces) {
    const path = typeof ws.path === "string" ? ws.path : ""
    if (!orphanPrefixes.some((prefix) => path.startsWith(prefix))) continue
    if (existsSync(path)) continue
    if (sessionsUnder(sessions.byCwd, await canonical(path)).some((s) => s.running)) continue
    try {
      await ctx.workspaceRegistry.delete(ws.id)
    } catch {
      /* keep the entry if cleanup fails */
    }
  }
}

// ---------------------------------------------------------------------------
// sessions per canonical directory + id index
// ---------------------------------------------------------------------------
async function sessionMap(ctx) {
  const byCwd = new Map()
  const byId = new Map()
  let sessions = []
  try {
    sessions = ctx.sessions.list()
  } catch {
    sessions = []
  }
  const agents = ctx.get("agents")
  for (const s of sessions) {
    if ((s.header?.origin ?? s.origin) === "subagent") continue
    let cwd = s.cwd ?? s.header?.cwd
    if (!cwd && s.workspaceId) {
      try {
        const ws = ctx.workspaceRegistry.get(s.workspaceId)
        if (ws) cwd = ws.path
      } catch {
        /* keep cwd undefined */
      }
    }
    let running = false
    try {
      running = agents?.get(s.id)?.status === "running"
    } catch {
      /* not running */
    }
    const summary = { id: s.id, title: s.title || s.id, running }
    byId.set(s.id, summary)
    if (!cwd) continue
    const key = await canonical(cwd)
    const arr = byCwd.get(key) ?? []
    arr.push(summary)
    byCwd.set(key, arr)
  }
  // ctx.sessions.list() reports ATTACHED sessions only, so a cold session is
  // missing from both maps: buildTree drops it from a registered worktree
  // (no byId entry for its workspace sessionId) and from the sessionsUnder
  // fallback. Persisted headers cover every stored session — a lightweight
  // metadata listing, no full-log parse. A cold header carries no title, the
  // same state the official session list shows before a session is opened.
  // Read through ctx.get rather than `inject`: an injected dependency is a
  // wait, not a conditional mount, so injecting it would park this row on any
  // composition without persistence.
  try {
    const persisted = ctx.get("sessionPersistence")
    for (const header of (await persisted?.list()) ?? []) {
      if (header.origin === "subagent") continue
      const id = header.id ?? header.sessionId
      if (id === undefined || byId.has(id)) continue
      const summary = { id, title: header.title || id, running: false }
      byId.set(id, summary)
      if (!header.cwd) continue
      const key = await canonical(header.cwd)
      const arr = byCwd.get(key) ?? []
      arr.push(summary)
      byCwd.set(key, arr)
    }
  } catch {
    /* persistence unavailable */
  }
  return { byCwd, byId }
}

/** 某目录下的会话：cwd 精确 + 前缀（会话可能在子目录里）。 */
function sessionsUnder(byCwd, key) {
  const out = []
  for (const [cwd, arr] of byCwd) {
    if (cwd === key || cwd.startsWith(key + "/")) out.push(...arr)
  }
  return out
}

/** 按路径解析工作区：先 canonical（realpath）再原路径。
 *  macOS 上 /Users 是 /private/Users 的符号链接，注册表存的可能是任一种写法。 */
async function resolveWorkspaceByPath(ctx, path) {
  try {
    const ws = await ctx.workspaceRegistry.resolveByPath(await canonical(path))
    if (ws) return ws
  } catch {
    /* fall through */
  }
  try {
    return await ctx.workspaceRegistry.resolveByPath(path)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// tree
// ---------------------------------------------------------------------------
async function buildTree(ctx) {
  const manifest = await loadManifestSeeded(ctx)
  const sessions = await sessionMap(ctx)
  const repos = []
  for (const repo of manifest.repos) {
    const root = await gitCommonRoot(repo.path)
    if (root === null) continue
    const head = await currentBranchRef(root)
    const main = await porcelainState(root)
    const branches = await listBranches(root)
    const worktrees = []
    // 用 `git worktree list` 精确枚举（覆盖 orca 布局与 <repo>/.worktrees 布局；
    // 损坏的 worktree 不在 git 注册表里，自动跳过）。
    const wtList = await listWorktrees(root)
    for (const wt of wtList) {
      if (!existsSync(wt.path)) continue
      const path = wt.path
      const ref = await currentBranchRef(path)
      const state = await porcelainState(path)
      const key = await canonical(path)
      let workspaceId = null
      try {
        // 只解析已有注册，不自动注册子目录（注册由用户显式操作触发）。
        const ws = await resolveWorkspaceByPath(ctx, key)
        workspaceId = ws?.id ?? null
      } catch {
        /* not registered */
      }
      // 会话：已注册的 worktree 用工作区的 sessionIds（权威，含子目录会话）；
      // 未注册的按 cwd 前缀匹配。
      let wtSessions = []
      if (workspaceId !== null) {
        try {
          const ws = await ctx.workspaceRegistry.get(workspaceId)
          for (const id of ws?.sessionIds ?? []) {
            const summary = sessions.byId.get(id)
            if (summary !== undefined) wtSessions.push(summary)
          }
        } catch {
          /* registry unavailable */
        }
      }
      if (wtSessions.length === 0) wtSessions = sessionsUnder(sessions.byCwd, key)
      worktrees.push({
        name: wt.branch ?? basename(path),
        path,
        branch: ref.branch,
        dirty: state.dirty,
        ahead: state.ahead,
        behind: state.behind,
        upstream: state.upstream,
        sessions: wtSessions,
        workspaceId,
      })
    }
    const mainKey = await canonical(root)
    let mainWorkspaceId = null
    try {
      const ws = await resolveWorkspaceByPath(ctx, mainKey)
      if (ws) mainWorkspaceId = ws.id
      else {
        // 旧清单条目可能缺主工作区注册：补注册一次，让项目组出现在官方列表。
        const created = await ctx.workspaceRegistry.create(root, repo.name)
        mainWorkspaceId = created.id
      }
    } catch {
      /* not registered */
    }
    repos.push({
      name: repo.name,
      path: root,
      branch: head.branch,
      dirty: main.dirty,
      ahead: main.ahead,
      behind: main.behind,
      branches,
      worktrees,
      sessions: sessionsUnder(sessions.byCwd, mainKey),
      workspaceId: mainWorkspaceId,
    })
  }
  // 基础项目：DSH 工作区里不落在任何仓库/工作树目录下的节点（非 git 项目），
  // 它们的会话原样复用挂进来，与 worktree 维度合并展示。
  const covered = new Set()
  for (const repo of repos) {
    covered.add(await canonical(repo.path))
    for (const wt of repo.worktrees) covered.add(await canonical(wt.path))
  }
  const workspaces = []
  try {
    for (const ws of ctx.workspaceRegistry.list()) {
      const path = typeof ws.path === "string" ? ws.path : undefined
      if (!path) continue
      const key = await canonical(path)
      if (covered.has(key)) continue
      workspaces.push({
        id: ws.id,
        name: (typeof ws.title === "string" && ws.title) || basename(path),
        path,
        sessions: sessionsUnder(sessions.byCwd, key),
      })
    }
  } catch {
    /* registry unavailable */
  }
  return { root: manifest.root, worktreeRoot: manifest.worktreeRoot ?? "", repos, workspaces }
}

// ---------------------------------------------------------------------------
// mutations
// ---------------------------------------------------------------------------
const BRANCH_NAME_RE = /^[A-Za-z0-9._/-]+$/

async function handleAddRepo(body, ctx) {
  const path = String(body.path ?? "").trim()
  if (!path) return [400, { error: "请提供仓库路径" }]
  const root = await gitCommonRoot(path)
  if (root === null) return [400, { error: `该路径不是 git 仓库：${path}` }]
  const manifest = await loadManifestSeeded(ctx)
  let name = basename(root)
  const taken = new Set(manifest.repos.map((r) => r.name))
  if (taken.has(name)) {
    let i = 2
    while (taken.has(`${name}-${i}`)) i++
    name = `${name}-${i}`
  }
  manifest.repos.push({ name, path: root })
  await saveManifest(manifest)
  // 注册主工作区（若尚未注册），这样项目组会出现在官方工作区列表里，
  // worktree 维度也才有挂载点。
  let workspaceId = null
  try {
    const key = await canonical(root)
    const existing = await resolveWorkspaceByPath(ctx, key)
    if (existing) workspaceId = existing.id
    else {
      const ws = await ctx.workspaceRegistry.create(root, name)
      workspaceId = ws.id
    }
  } catch (error) {
    console.warn("dsh-worktree-panel: main workspace registration failed:", String(error))
  }
  return [200, { ok: true, name, path: root, workspaceId }]
}

/** 把非 git 目录初始化为 git 仓库（含首次提交），并收录为项目。 */
async function handleInitRepo(body, ctx) {
  const path = String(body.path ?? "").trim()
  if (!path) return [400, { error: "请提供目录路径" }]
  if (!existsSync(path)) return [404, { error: `目录不存在：${path}` }]
  const existingRoot = await gitCommonRoot(path)
  if (existingRoot !== null) {
    // 已是 git 仓库：直接收录为项目（等价于 add）。
    return handleAddRepo({ path }, ctx)
  }
  const init = await git(["init", "-b", "main"], path)
  if (!init.ok) return [400, { error: `git init 失败：${init.error}` }]
  // 首次提交：目录为空时补一个占位文件保证提交成功。
  const hasFiles = (await readdir(path)).length > 0
  if (!hasFiles) {
    try {
      await writeFile(join(path, ".gitkeep"), "")
    } catch {
      /* best effort */
    }
  }
  await git(["add", "-A"], path)
  const commit = await git(["commit", "-m", "init"], path)
  if (!commit.ok && hasFiles) {
    return [200, { ok: true, warning: `git 已初始化，但首次提交失败：${commit.error}` }]
  }
  // 收录为项目（manifest 条目 + 主工作区注册）。
  const manifest = await loadManifestSeeded(ctx)
  let name = basename(path)
  const taken = new Set(manifest.repos.map((r) => r.name))
  if (taken.has(name)) {
    let i = 2
    while (taken.has(`${name}-${i}`)) i++
    name = `${name}-${i}`
  }
  manifest.repos.push({ name, path })
  await saveManifest(manifest)
  let workspaceId = null
  try {
    const key = await canonical(path)
    const existing = await resolveWorkspaceByPath(ctx, key)
    if (existing) workspaceId = existing.id
    else {
      const ws = await ctx.workspaceRegistry.create(path, name)
      workspaceId = ws.id
    }
  } catch (error) {
    console.warn("dsh-worktree-panel: main workspace registration failed:", String(error))
  }
  return [200, { ok: true, name, path, workspaceId }]
}

async function handleRemoveRepo(body, ctx) {
  const manifest = await loadManifestSeeded(ctx)
  const repo = manifest.repos.find((r) => r.name === String(body.name ?? ""))
  if (!repo) return [404, { error: `未找到项目：${body.name}` }]
  // 一并清理该项目下的所有 linked worktree（受运行中会话保护，除非 force）。
  const root = await gitCommonRoot(repo.path)
  if (root !== null) {
    const wts = await listWorktrees(root)
    for (const wt of wts) {
      const path = wt.path
      if (!existsSync(path)) continue
      const label = wt.branch ?? basename(path)
      if (!body.force) {
        const running = sessionsUnder((await sessionMap(ctx)).byCwd, await canonical(path)).filter((s) => s.running)
        if (running.length > 0) {
          return [409, { error: `worktree「${label}」有 ${running.length} 个会话正在运行，请先结束会话或改用 force` }]
        }
      }
      // 目录删除前解析注册（删除后 resolveByPath 可能失配）。
      let ws = null
      try {
        ws = await resolveWorkspaceByPath(ctx, path)
      } catch {
        /* not registered */
      }
      const removed = await git(
        ["worktree", "remove", path, ...(body.force ? ["--force"] : [])],
        root,
      )
      if (removed.ok && ws !== null) {
        try {
          await ctx.workspaceRegistry.delete(ws.id)
        } catch {
          /* keep the registry entry if cleanup fails */
        }
      }
    }
    await git(["worktree", "prune"], root)
  }
  manifest.repos = manifest.repos.filter((r) => r.name !== repo.name)
  await saveManifest(manifest)
  // 注销主工作区（磁盘目录与会话记录保留；无会话引用时才删除注册）。
  if (root !== null) {
    const remaining = sessionsUnder((await sessionMap(ctx)).byCwd, await canonical(root))
    if (remaining.length === 0) {
      try {
        const ws = await resolveWorkspaceByPath(ctx, root)
        if (ws) await ctx.workspaceRegistry.delete(ws.id)
      } catch {
        /* keep the registry entry if cleanup fails */
      }
    }
  }
  return [200, { ok: true }]
}

async function handleCreateWorktree(ctx, body) {
  const manifest = await loadManifestSeeded(ctx)
  const repo = manifest.repos.find((r) => r.name === body.repo)
  if (!repo) return [404, { error: `未找到项目：${body.repo}` }]
  const branch = String(body.branch ?? "").trim()
  if (!BRANCH_NAME_RE.test(branch)) return [400, { error: `非法分支名：${branch}` }]
  const root = await gitCommonRoot(repo.path)
  if (root === null) return [400, { error: `项目不是有效的 git 仓库：${repo.path}` }]
  const base = worktreeBase(manifest, repo)
  const target = join(base, branch)
  if (existsSync(target)) return [409, { error: `该分支的 worktree 已存在：${target}` }]
  const hasBranch = (await git(["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`], root)).ok
  if (!hasBranch) {
    const b = body.base ? String(body.base) : undefined
    const args = ["branch", branch]
    if (b) args.push(b)
    const created = await git(args, root)
    if (!created.ok) return [400, { error: `创建分支失败：${created.error}` }]
  }
  await mkdir(base, { recursive: true })
  const added = await git(["worktree", "add", target, branch], root)
  if (!added.ok) return [400, { error: `创建 worktree 失败：${added.error}` }]
  // 不自动注册子目录为工作区（注册由用户在 worktree 上显式操作触发）。
  return [200, { ok: true, path: target, workspaceId: null }]
}

async function handleRemoveWorktree(ctx, body) {
  const manifest = await loadManifestSeeded(ctx)
  const repo = manifest.repos.find((r) => r.name === body.repo)
  if (!repo) return [404, { error: `未找到项目：${body.repo}` }]
  const branch = String(body.branch ?? "")
  if (!BRANCH_NAME_RE.test(branch)) return [400, { error: `非法分支名：${branch}` }]
  const root = await gitCommonRoot(repo.path)
  if (root === null) return [400, { error: `项目不是有效的 git 仓库：${repo.path}` }]
  // 按分支名在 git 注册表里定位 worktree（覆盖 orca 与 .worktrees 两种布局）。
  const wts = await listWorktrees(root)
  const wt = wts.find((w) => w.branch === branch || basename(w.path) === branch)
  if (!wt || !existsSync(wt.path)) return [404, { error: `未找到 worktree：${branch}` }]
  const target = wt.path
  if (!body.force) {
    const sessions = await sessionMap(ctx)
    const inside = sessionsUnder(sessions.byCwd, await canonical(target)).filter((s) => s.running)
    if (inside.length > 0) {
      return [409, { error: `有 ${inside.length} 个会话正在该 worktree 中运行，请先结束会话或改用 force` }]
    }
  }
  // 解析目标工作区（在目录删除前解析：resolveByPath 对不存在的目录可能失配）。
  let targetWorkspace = null
  try {
    const key = await canonical(target)
    targetWorkspace = await resolveWorkspaceByPath(ctx, target)
  } catch {
    /* not registered */
  }
  const removed = await git(
    ["worktree", "remove", target, ...(body.force ? ["--force"] : [])],
    root,
  )
  if (!removed.ok) return [400, { error: `删除失败：${removed.error}` }]
  await git(["worktree", "prune"], root)
  // Unregister the workspace only when no session references the directory.
  const remaining = sessionsUnder((await sessionMap(ctx)).byCwd, await canonical(target))
  if (remaining.length === 0 && targetWorkspace !== null) {
    try {
      await ctx.workspaceRegistry.delete(targetWorkspace.id)
    } catch {
      /* keep the registry entry if cleanup fails */
    }
  }
  return [200, { ok: true }]
}

/**
 * 切换主工作树的分支（在主仓库执行 git checkout）。
 * 已在其他 worktree 检出的分支不可切（git 限制）。
 */
async function handleSwitchMain(ctx, body) {
  const manifest = await loadManifestSeeded(ctx)
  const repo = manifest.repos.find((r) => r.name === body.repo)
  if (!repo) return [404, { error: `未找到项目：${body.repo}` }]
  const branch = String(body.branch ?? "").trim()
  if (!BRANCH_NAME_RE.test(branch)) return [400, { error: `非法分支名：${branch}` }]
  const root = await gitCommonRoot(repo.path)
  if (root === null) return [400, { error: `项目不是有效的 git 仓库：${repo.path}` }]
  // create：新建分支并切换（不建 worktree），让新分支直接成为主工作树的当前分支。
  if (body.create === true) {
    const exists = (await git(["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`], root)).ok
    if (exists) return [409, { error: `分支已存在：${branch}` }]
    const r = await git(["checkout", "-b", branch], root)
    if (!r.ok) return [400, { error: `创建分支失败：${r.error}` }]
    return [200, { ok: true, branch }]
  }
  const wts = await listWorktrees(root)
  if (wts.some((w) => w.branch === branch)) {
    return [409, { error: `分支「${branch}」已在 worktree 中检出，无法在主工作树切换` }]
  }
  const r = await git(["checkout", branch], root)
  if (!r.ok) return [400, { error: `切换分支失败：${r.error}` }]
  return [200, { ok: true, branch }]
}

/**
 * 按需注册一个 worktree 为 DSH 工作区（用户显式触发：在该 worktree 上点
 * 「+ 新会话」）。注册后该目录可开新会话、会话归类到其下。
 */
async function handleRegisterWorktree(ctx, body) {
  const manifest = await loadManifestSeeded(ctx)
  const repo = manifest.repos.find((r) => r.name === body.repo)
  if (!repo) return [404, { error: `未找到项目：${body.repo}` }]
  const branch = String(body.branch ?? "").trim()
  if (!BRANCH_NAME_RE.test(branch)) return [400, { error: `非法分支名：${branch}` }]
  const root = await gitCommonRoot(repo.path)
  if (root === null) return [400, { error: `项目不是有效的 git 仓库：${repo.path}` }]
  const wts = await listWorktrees(root)
  const wt = wts.find((w) => w.branch === branch || basename(w.path) === branch)
  if (!wt || !existsSync(wt.path)) return [404, { error: `未找到 worktree：${branch}` }]
  try {
    const key = await canonical(wt.path)
    const existing = await resolveWorkspaceByPath(ctx, wt.path)
    if (existing) return [200, { ok: true, workspaceId: existing.id }]
    const ws = await ctx.workspaceRegistry.create(wt.path, `${repo.name}/${branch}`)
    return [200, { ok: true, workspaceId: ws.id }]
  } catch (error) {
    return [500, { error: `注册失败：${String(error)}` }]
  }
}

// ---------------------------------------------------------------------------
// config (worktree 落盘位置)
// ---------------------------------------------------------------------------

/** 读取 worktree 落盘配置：空 worktreeRoot = 项目内 .dsh/workspaces。 */
async function handleGetConfig(ctx) {
  const manifest = await loadManifest()
  const worktreeRoot = typeof manifest.worktreeRoot === "string" ? manifest.worktreeRoot : ""
  return { worktreeRoot, mode: worktreeRoot.trim() === "" ? "project" : "global" }
}

/** 更新 worktree 落盘位置：空字符串 = 恢复项目内 .dsh/workspaces。 */
async function handleSetConfig(ctx, body) {
  const value = body?.worktreeRoot
  if (value !== undefined && typeof value !== "string") {
    return [400, { error: "worktreeRoot 必须是字符串" }]
  }
  const worktreeRoot = String(value ?? "").trim()
  if (worktreeRoot !== "") {
    if (!isAbsolute(worktreeRoot)) {
      return [400, { error: `worktreeRoot 必须是绝对路径：${worktreeRoot}` }]
    }
    await mkdir(worktreeRoot, { recursive: true })
  }
  const manifest = await loadManifest()
  manifest.worktreeRoot = worktreeRoot
  await saveManifest(manifest)
  return [200, { ok: true, worktreeRoot, mode: worktreeRoot === "" ? "project" : "global" }]
}

// ---------------------------------------------------------------------------
// migration（worktree 存放位置变更时的批量搬运）
// ---------------------------------------------------------------------------

/** 生成迁移计划：遍历每个项目，找到旧 base 下的 worktree 并计算新路径。 */
async function buildMigrationPlan(ctx, oldWorktreeRoot, newWorktreeRoot) {
  const manifest = await loadManifest()
  const oldRoot = String(oldWorktreeRoot ?? manifest.worktreeRoot ?? "").trim()
  const newRoot = String(newWorktreeRoot ?? "").trim()
  if (oldRoot === newRoot) return { same: true, oldRoot, newRoot, items: [] }

  const items = []
  const sessions = await sessionMap(ctx)

  for (const repo of manifest.repos) {
    const oldBase = worktreeBase({ ...manifest, worktreeRoot: oldRoot }, repo)
    const newBase = worktreeBase({ ...manifest, worktreeRoot: newRoot }, repo)
    if (oldBase === newBase) continue

    const root = await gitCommonRoot(repo.path)
    if (!root) continue

    const wts = await listWorktrees(root)
    for (const wt of wts) {
      if (!existsSync(wt.path)) continue
      if (!wt.path.startsWith(oldBase + "/")) continue

      const rel = wt.path.slice(oldBase.length + 1)
      const newPath = join(newBase, rel)
      const state = await porcelainState(wt.path)
      const dirty = state.dirty != null && state.dirty > 0
      const key = await canonical(wt.path)
      const active = sessionsUnder(sessions.byCwd, key).some((s) => s.running)
      const ws = await resolveWorkspaceByPath(ctx, wt.path)

      items.push({
        repo: repo.name,
        branch: wt.branch || basename(wt.path),
        oldPath: wt.path,
        newPath,
        dirty,
        active,
        detached: !!wt.detached,
        workspaceId: ws?.id || null,
        skipped: dirty || active,
        skipReason: dirty ? "dirty" : active ? "active" : null,
      })
    }
  }

  return { same: false, oldRoot, newRoot, items }
}

/** 执行迁移：逐项 git worktree move + 更新 DSH 工作区注册。 */
async function executeMigration(ctx, plan) {
  const manifest = await loadManifest()
  const results = []

  for (const item of plan.items) {
    if (item.skipped) {
      results.push({ ...item, migrated: false })
      continue
    }

    try {
      const repo = manifest.repos.find((r) => r.name === item.repo)
      if (!repo) {
        results.push({ ...item, migrated: false, error: "项目不在清单中" })
        continue
      }

      await mkdir(dirname(item.newPath), { recursive: true })
      const root = await gitCommonRoot(repo.path)
      const r = await git(["worktree", "move", item.oldPath, item.newPath], root)
      if (!r.ok) {
        results.push({ ...item, migrated: false, error: r.error })
        continue
      }

      let newWorkspaceId = null
      if (item.workspaceId) {
        try { await ctx.workspaceRegistry.delete(item.workspaceId) } catch { /* gone already */ }
        try {
          const ws = await ctx.workspaceRegistry.create(item.newPath, `${item.repo}/${item.branch}`)
          newWorkspaceId = ws.id
        } catch (e) {
          results.push({ ...item, migrated: true, newWorkspaceId: null, workspaceError: String(e?.message ?? e) })
          continue
        }
      }

      results.push({ ...item, migrated: true, newWorkspaceId })
    } catch (e) {
      results.push({ ...item, migrated: false, error: String(e?.message ?? e) })
    }
  }

  return results
}

async function handleMigrate(ctx, body) {
  const oldRoot = body.oldWorktreeRoot !== undefined ? String(body.oldWorktreeRoot) : undefined
  const newRoot = String(body.worktreeRoot ?? "")
  const execute = body.execute === true

  // oldWorktreeRoot 缺省时会退化为 manifest 当前值；若 config 刚保存完，
  // 两者相等会导致迁移静默跳过。显式提醒调用方传旧值。
  if (oldRoot === undefined) {
    const manifest = await loadManifest()
    if (String(manifest.worktreeRoot ?? "").trim() === newRoot.trim()) {
      console.warn(
        "dsh-worktree-panel: /migrate 未传 oldWorktreeRoot，且 manifest 已等于目标值，" +
          "迁移会被判定为 no-op。调用方（设置页）应始终携带保存前的旧路径。"
      )
    }
  }

  const plan = await buildMigrationPlan(ctx, oldRoot, newRoot)
  if (plan.same) return [200, { same: true, oldRoot: plan.oldRoot, newRoot: plan.newRoot, items: [] }]
  if (!execute) return [200, { ...plan, dryRun: true }]

  const results = await executeMigration(ctx, plan)
  return [200, { ...plan, items: results, executed: true }]
}

// ---------------------------------------------------------------------------
// http plumbing
// ---------------------------------------------------------------------------
function isLoopback(req) {
  const addr = req.socket?.remoteAddress ?? ""
  return addr === "127.0.0.1" || addr === "::1" || addr === "::ffff:127.0.0.1"
}

function readJson(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk
      if (body.length > limit) {
        reject(new Error("请求体过大"))
        req.destroy()
      }
    })
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"))
      } catch (error) {
        reject(error)
      }
    })
    req.on("error", reject)
  })
}

function sendJson(res, code, payload) {
  const text = JSON.stringify(payload)
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" })
  res.end(text)
}

/** Wrap a (body, req) => [code, payload] handler into a Node http handler. */
function routeHandler(fn, { mutate = false } = {}) {
  return async (req, res) => {
    if (req.method === "OPTIONS") {
      sendJson(res, 204, {})
      return
    }
    if (mutate && req.method === "POST" && !isLoopback(req)) {
      sendJson(res, 403, { error: "变更操作仅限本机（127.0.0.1）调用" })
      return
    }
    try {
      const body = req.method === "POST" ? await readJson(req) : {}
      const [code, payload] = await fn(body, req)
      sendJson(res, code, payload)
    } catch (error) {
      sendJson(res, 500, { error: String(error?.message ?? error) })
    }
  }
}

// ---------------------------------------------------------------------------
// plugin
// ---------------------------------------------------------------------------
export function apply(ctx, config) {
  const cfg = config ?? {}
  if (cfg.enabled === false) return

  ctx.systemPrompt.section({
    name: "plugin:worktree-panel",
    order: SECTION_ORDER,
    text: GUIDANCE,
  })

  const routes = [
    {
      kind: "exact",
      path: `${API_PREFIX}/tree`,
      handler: routeHandler(async () => [200, await buildTree(ctx)]),
    },
    {
      kind: "exact",
      path: `${API_PREFIX}/config`,
      handler: routeHandler(async (body, req) => {
        if (req.method === "POST") return handleSetConfig(ctx, body)
        return [200, await handleGetConfig(ctx)]
      }, { mutate: true }),
    },
    {
      kind: "exact",
      path: `${API_PREFIX}/repos`,
      handler: routeHandler(async (body) => handleAddRepo(body, ctx), { mutate: true }),
    },
    {
      kind: "exact",
      path: `${API_PREFIX}/repos/remove`,
      handler: routeHandler(async (body) => handleRemoveRepo(body, ctx), { mutate: true }),
    },
    {
      kind: "exact",
      path: `${API_PREFIX}/repos/init`,
      handler: routeHandler(async (body) => handleInitRepo(body, ctx), { mutate: true }),
    },
    {
      kind: "exact",
      path: `${API_PREFIX}/worktrees`,
      handler: routeHandler(async (body) => handleCreateWorktree(ctx, body), { mutate: true }),
    },
    {
      kind: "exact",
      path: `${API_PREFIX}/worktrees/remove`,
      handler: routeHandler(async (body) => handleRemoveWorktree(ctx, body), { mutate: true }),
    },
    {
      kind: "exact",
      path: `${API_PREFIX}/worktrees/register`,
      handler: routeHandler(async (body) => handleRegisterWorktree(ctx, body), { mutate: true }),
    },
    {
      kind: "exact",
      path: `${API_PREFIX}/worktrees/switch`,
      handler: routeHandler(async (body) => handleSwitchMain(ctx, body), { mutate: true }),
    },
    {
      kind: "exact",
      path: `${API_PREFIX}/migrate`,
      handler: routeHandler(async (body) => handleMigrate(ctx, body), { mutate: true }),
    },
  ]

  ctx.effect(() => {
    const disposers = routes.map((route) => ctx.webServer.register(route))
    return () => {
      for (const dispose of disposers) dispose()
    }
  })
}

export { API_PREFIX, BRANCH_NAME_RE, GUIDANCE, buildTree, inject, MANIFEST_PATH }
