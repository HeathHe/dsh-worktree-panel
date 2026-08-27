// Render test: mounts the patched official WorkspaceBrowser (captured from the
// slot registration) with react-dom/server, feeding it a realistic
// workspaces/sessions store plus a worktree-tree fixture from the /tree API.
// This exercises the injected nested SessionTree code exactly as the browser
// would — any undefined identifier or bad prop throws here first.
import { createRequire } from "node:module"
import { readFileSync, writeFileSync, globSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { homedir } from "node:os"

// Resolve react/react-dom from the dsh CLI's npx-cache dependency tree
// (the same store that hosts @deepseek-ai/dsh-client-ui-workspace).
const reactPkg = globSync(join(homedir(), ".npm", "_npx", "*", "node_modules", "react", "package.json"))[0]
if (!reactPkg) throw new Error("cannot locate react in the npx cache")
const cliRequire = createRequire(reactPkg)
const React = cliRequire("react")
const ReactDOMServer = cliRequire("react-dom/server")
// Use the REAL jsx-runtime: its 3rd argument is the element KEY (React
// 18 createElement's 3rd argument is children — a naive stub corrupts keys
// into text children, which previously made the render "lose" everything).
const jsxRuntime = cliRequire("react/jsx-runtime")
// Real primitives import katex .css at module load (browser-only bundling), so
// render with a component stub: every primitives export renders as <dsh-stub>.
// The code under test is OUR injected SessionTree nesting, not the primitives.
const primitives = new Proxy(
  {},
  {
    get: (target, prop) => {
      if (prop === Symbol.toStringTag) return "Module"
      if (prop === "HoverCard") return ({ anchor }) => anchor
      if (prop === "Menu") {
        return ({ items = [] }) => React.createElement(
          "div",
          { "data-test-menu": "workspace-actions" },
          items.map((item) => React.createElement("span", { key: item.id }, item.label)),
        )
      }
      return "dsh-stub"
    },
  },
)

// ---- minimal DOM so module-level CSS injectors don't crash ----
const el = () => ({
  style: {}, dataset: {}, children: [], parentElement: null,
  setAttribute() {}, appendChild(c) { this.children.push(c); return c },
  addEventListener() {}, removeEventListener() {},
  querySelector() { return null }, matches() { return false },
})
const fakeDocument = {
  head: el(), body: el(),
  querySelector: () => null,
  createElement: () => el(),
  getElementById: () => null,
}
const fakeWindow = {
  document: fakeDocument,
  __wtpInitialTree: null, // seeded below once the fixture exists
  __ModuleLoader__: {
    load: ({ id, factory }) => {
      if (id !== "dsh-worktree-panel") throw new Error("unexpected id " + id)
      factoryRef = factory
    },
  },
}
let factoryRef

const code = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "client.js"), "utf8")
new Function("window", "document", code)(fakeWindow, fakeDocument)
if (!factoryRef) throw new Error("no factory")

const mod = factoryRef((name) => {
  if (name === "react") return React
  if (name === "react/jsx-runtime") return jsxRuntime
  if (name === "@deepseek-ai/dsh-client-runtime/client") {
    return {
      defineStore: (s) => ({ ...s }),
      indexSubagentDescendants: () => new Map(),
      abbreviateHomePath: (path, home) => home && path.startsWith(home) ? "~" + path.slice(home.length) : path,
    }
  }
  if (name === "@deepseek-ai/dsh-client-ui-primitives") return primitives
  throw new Error("unexpected require: " + name)
})

// capture the registered components
const registered = {}
const hostDescription = {
  getSnapshot: () => ({ home: "/Users/you" }),
  subscribe: () => () => {},
}
const ctx = {
  get: (name) => name === "connection" ? { hostDescription } : undefined,
  locale: { register: () => {}, bind: (ns) => (key, vars) => key },
  sessions: { search: async () => ({ ok: true, value: { items: [] } }), searchResultLimit: 50, binding: () => undefined },
  workspaces: {},
  slots: {
    entries: () => [], subscribe: () => () => {},
    inject: (name, cb) => { registered[name] = cb() },
    register: (opts, Component) => ({ opts, Component }),
  },
  effect: () => () => {},
}
mod.apply(ctx)
const WorkspaceBrowser = registered["sidebar.workspaces"]?.Component
if (!WorkspaceBrowser) throw new Error("WorkspaceBrowser not captured")

// ---- store fixtures ----
const now = Date.now()
const sess = (id, title, extra = {}) => ({ id, displayTitle: title, updatedAt: now - 1000, completed: true, running: false, blank: false, ...extra })
const byId = {
  s1: sess("s1", "主树上的会话"),
  s2: sess("s2", "feature-01 里的会话", { running: true }),
  s3: sess("s3", "feature-01 里另一个会话"),
  s4: sess("s4", "不应显示的子代理会话", { origin: "subagent" }),
}
const sessionsState = {
  phase: "ready",
  current: "s1",
  ids: ["s1", "s2", "s3", "s4"],
  byId,
}
const workspacesState = {
  phase: "ready",
  items: [
    { workspaceId: "ws-main", title: "myapp", createdAt: now, sessionIds: ["s1"] },
    { workspaceId: "ws-feature", title: "myapp/feature-01", createdAt: now, sessionIds: ["s2", "s3", "s4"] },
    { workspaceId: "ws-plain", title: "notes", cwd: "/Users/you/notes", sessionIds: [] },
  ],
  archivedSessionIds: [],
}
const viewState = {
  groupBy: "workspace",
  orderBy: "updated",
  groupExpansion: { "ws-main": true, "ws-feature": true, "ws-plain": true },
  sessionOrderByAccount: {},
  sessionUpdatedAtByAccount: {},
}

// fetch mock returning the worktree topology
const treeFixture = {
  root: "/Users/you/orca/workspaces",
  repos: [
    {
      name: "myapp",
      path: "/wt/myapp/main",
      branch: "main",
      dirty: 0,
      ahead: 0,
      behind: 0,
      branches: ["main", "feature-01", "feature-02"],
      worktrees: [
        {
          name: "feature-01",
          path: "/wt/myapp/feature-01",
          branch: "feature-01",
          dirty: 2,
          ahead: 1,
          behind: 0,
          upstream: "tracking",
          workspaceId: "ws-feature",
          // Simulate a stale /tree response: s3 remains authoritative in
          // the workspace sessionIds and must still render under the worktree.
          sessions: [{ id: "s2" }],
        },
      ],
      sessions: [],
      workspaceId: "ws-main",
    },
  ],
  workspaces: [],
}
globalThis.fetch = async () => ({ ok: true, json: async () => treeFixture })
fakeWindow.__wtpInitialTree = treeFixture

// ---- hooks ----
const selectorHook = (state) => (selector) => selector(state)
const useStore = selectorHook(viewState)
const useWorkspaces = (selector) => selector(workspacesState)
const useSessions = (selector) => selector(sessionsState)
const useDirectoryFlow = (selector) => selector(false)
const useHostDescription = (selector) => selector({ home: "/Users/you" })

const actions = {
  retainAccountKeys: () => {},
  setGroupBy: () => {}, setOrderBy: () => {}, setGroupExpanded: () => {},
  syncSessionOrderAccount: () => {}, setSessionOrder: () => {},
}
const t = (key, params) => {
  const zh = {
    "wtp.main": "主工作树",
    "wtp.currentBranch": "当前分支",
    "wtp.dirty": "有改动",
    "wtp.clean": "干净",
    "wtp.pickerOpen": "＋ 分支 → 创建 worktree",
    "wtp.pickerClose": "－ 收起分支列表",
    "wtp.open": "打开",
    "wtp.collapse": "收起",
    "wtp.newSession": "+ 新会话",
    "wtp.initGitMenu": "初始化 Git 并启用 Worktree",
    "wtp.noPendingBranches": "所有分支都已有 worktree",
    "wtp.newBranchPlaceholder": "新分支名（创建分支并开 worktree）",
    "wtp.createWorktree": "为此分支创建 worktree",
    "wtp.removeWorktree": "删除该 worktree",
    "wtp.removeConfirm": "确定删除 worktree「{name}」？未提交的改动会丢失。",
    "wtp.failed": "操作失败：{msg}",
    "group.ungrouped": "未分组",
    "empty.none": "暂无会话",
    "section.sessions": "会话",
    "section.workspaces": "工作区",
    "sessions.expand": "展开其余 {n} 个会话",
    "sessions.collapse": "收起",
  }
  if (params) return (zh[key] ?? key) + ":" + JSON.stringify(params)
  return zh[key] ?? key
}

// SessionTree needs `useSessions` as a hook returning the full state via selector
const props = {
  wide: true,
  expandSidebar: () => {},
  useSessions,
  useWorkspaces,
  useStore,
  actions,
  startSession: () => {},
  open: () => {},
  renameSession: async () => {},
  forkSession: () => {},
  renameWorkspace: async () => {},
  deleteWorkspace: async () => {},
  insertWorkspaceBefore: async () => {},
  archiveSession: async () => {},
  insertSessionBefore: async () => {},
  createWorkspace: async () => ({}),
  searchSessions: async () => ({ items: [] }),
  searchResultLimit: 50,
  useDirectoryFlow,
  useHostDescription,
  renderSlot: () => null,
  t,
}

// SessionTree actually receives useSessions/useWorkspaces/useStore/useDirectoryFlow
// as slot-provided hooks — but the WorkspaceBrowser component signature we read
// destructures exactly these; render and catch any runtime error.
let html = ""
try {
  html = ReactDOMServer.renderToString(React.createElement(WorkspaceBrowser, props))
} catch (err) {
  console.error("RENDER FAILED:", err && err.stack ? err.stack : err)
  process.exit(1)
}
writeFileSync("/tmp/wtp-full.html", html)

const checks = [
  ["nested worktree row", html.includes("feature-01")],
  ["worktree dirty status text", html.includes("有改动") || html.includes("Modified")],
  ["main worktree row", html.includes("主工作树") || html.includes("Main worktree")],
  ["main session under main worktree", html.includes("主树上的会话")],
  ["nested session under worktree", html.includes("feature-01 里的会话")],
  ["stale topology recovered from workspace", html.includes("feature-01 里另一个会话")],
  ["worktree sessions rendered once", (html.match(/feature-01 里的会话/g) || []).length === 1 && (html.match(/feature-01 里另一个会话/g) || []).length === 1],
  ["subagent session remains hidden", !html.includes("不应显示的子代理会话")],
  ["worktree row plus button", (html.match(/<button[^>]*class="dsh-wtp-icon-btn"/g) || []).length >= 2],
  ["non-git initialization in more menu", html.includes("初始化 Git 并启用 Worktree")],
  ["no duplicate new-session row", !/>\+ 新会话</.test(html)],
  ["dialog closed by default", !html.includes("创建分支") && !html.includes("Create branch")],
]
let failed = 0
if (process.env.DUMP_HTML) console.log("--- html head ---\n" + html.slice(0, 2000) + "\n---")
for (const [name, ok] of checks) {
  console.log((ok ? "ok  " : "FAIL") + " " + name)
  if (!ok) failed++
}
if (failed) process.exit(1)
console.log("render test OK: patched WorkspaceBrowser rendered with nested worktree dimension")
