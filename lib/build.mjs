// Build script: generates lib/client.js from the OFFICIAL
// @deepseek-ai/dsh-client-ui-workspace browser bundle, patched to add the
// project -> worktree dimension while keeping every official interaction
// (search, view options, rename/delete/archive, drag reorder, overflow
// collapse, dialogs). The official ui-workspace row is disabled in
// cordis.patch.yml and this plugin owns the same slots with the same deps.
//
// Patch points (all anchored on unique, version-checked substrings):
//   1. module id renamed to "dsh-worktree-panel"
//   2. worktree helper components + api client + topology hook injected
//      before SessionTree
//   3. SessionTree gains the topology hook + worktree expansion state
//   4. SessionTree's return block replaced: git-project groups render nested
//      worktree sub-rows (status, open/collapse, + 新会话, delete) and a
//      [+ 分支 -> 创建 worktree] picker; worktree workspaces are hidden from
//      the top level so sessions appear nested instead of duplicated
//   5. zh/en dictionaries gain the wtp.* keys
//
// Run: node lib/build.mjs  (writes lib/client.js)
import { readFileSync, writeFileSync, globSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { homedir } from "node:os"

const here = dirname(fileURLToPath(import.meta.url))
const OUT = join(here, "client.js")

// Locate the official bundle: DSH Desktop app (macOS) first, then profile
// node_modules, then the global npx store that hosts the dsh CLI's dependency
// tree. Paths derive from the user's home so the build is portable across
// machines and profiles.
const explicitBundle = process.env.DSH_WORKSPACE_BUNDLE?.trim()
const candidates = [
  ...(explicitBundle ? [explicitBundle] : []),
  join("/Applications", "DSH Desktop.app", "Contents", "Resources", "app.asar.unpacked", "node_modules", "@deepseek-ai", "dsh-client-ui-workspace", "lib", "client.js"),
  join(homedir(), ".dsh", "profiles", "web", "node_modules", "@deepseek-ai", "dsh-client-ui-workspace", "lib", "client.js"),
  ...globSync(join(homedir(), ".npm", "_npx", "*", "node_modules", "@deepseek-ai", "dsh-client-ui-workspace", "lib", "client.js")),
]
const SRC = candidates.find((p) => {
  try {
    readFileSync(p, "utf8")
    return true
  } catch {
    return false
  }
})
if (!SRC) throw new Error("cannot locate @deepseek-ai/dsh-client-ui-workspace/lib/client.js")

const SRC_PACKAGE = join(dirname(dirname(SRC)), "package.json")
const upstreamPackage = JSON.parse(readFileSync(SRC_PACKAGE, "utf8"))
const UPSTREAM_VERSION = String(upstreamPackage.version ?? "")
function parseSupportedVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-rc\.(\d+))?$/.exec(value)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? Number.POSITIVE_INFINITY : Number(match[4])]
}
function compareVersion(left, right) {
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1
  }
  return 0
}
const parsedUpstream = parseSupportedVersion(UPSTREAM_VERSION)
const minimumUpstream = parseSupportedVersion("0.1.1-rc.2")
const maximumUpstream = parseSupportedVersion("0.2.0")
if (parsedUpstream === null || compareVersion(parsedUpstream, minimumUpstream) < 0 || compareVersion(parsedUpstream, maximumUpstream) >= 0) {
  throw new Error(`unsupported @deepseek-ai/dsh-client-ui-workspace version: ${UPSTREAM_VERSION || "unknown"}; expected >=0.1.1-rc.2 <0.2.0`)
}

let src = readFileSync(SRC, "utf8")

const expect = (haystack, needle, label) => {
  if (!haystack.includes(needle)) throw new Error(`patch anchor not found: ${label}`)
}

// ---------------------------------------------------------------------------
// 1. module id
// ---------------------------------------------------------------------------
const OLD_ID = `id: "@deepseek-ai/dsh-client-ui-workspace",`
expect(src, OLD_ID, "module id")
src = src.replace(OLD_ID, `id: "dsh-worktree-panel",`)

// Non-git workspaces keep the official plus-button behavior (start a session)
// and expose Git initialization as an additional project-row menu action.
const PROJECT_MENU_ANCHOR = `\t\t\tconst workspaceMenuItems = [{
\t\t\t\tid: "rename",`
expect(src, PROJECT_MENU_ANCHOR, "ProjectRowItem menu items")
src = src.replace(PROJECT_MENU_ANCHOR, `\t\t\tconst workspaceMenuItems = [
\t\t\t\t...(actions?.initializeGit === void 0 ? [] : [{
\t\t\t\t\tid: "initialize-git",
\t\t\t\t\tlabel: t("wtp.initGitMenu"),
\t\t\t\t\ticon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {})
\t\t\t\t}]),
\t\t\t\t{
\t\t\t\t\tid: "rename",`)

const PROJECT_MENU_SELECT_RE = /\/\* v8 ignore next -- workspaceMenuItems carries exactly these two rows today\. \*\/\s*if \(id !== "rename" && id !== "delete"\) return;\s*if \(id === "rename"\) actions\.rename\(\);\s*else actions\.delete\(\);/
if (!PROJECT_MENU_SELECT_RE.test(src)) throw new Error("patch anchor not found: ProjectRowItem menu selection")
src = src.replace(PROJECT_MENU_SELECT_RE, `/* worktree-panel: optional non-Git initialization action */
\t\t\t\t\t\t\tif (id === "initialize-git") actions.initializeGit?.();
\t\t\t\t\t\t\telse if (id === "rename") actions.rename();
\t\t\t\t\t\t\telse if (id === "delete") actions.delete();`)

// ---------------------------------------------------------------------------
// 2. helper chunk injected before SessionTree
// ---------------------------------------------------------------------------
const HELPERS = `
		// ==================== dsh-worktree-panel augmentation ====================
		var __wtpCssDone = false;
		function __wtpEnsureCss() {
			if (__wtpCssDone || typeof document === "undefined") return;
			__wtpCssDone = true;
			if (document.querySelector("style[data-dsh-wtp]") !== null) return;
			var tag = document.createElement("style");
			tag.dataset.dshWtp = "";
			tag.textContent = [
				".dsh-wtp-worktree-row{display:flex;align-items:center;gap:6px;margin-left:14px;padding:0 8px;height:26px;border-radius:8px;cursor:pointer;font-size:13px;color:var(--dsw-alias-label-primary,#222831);line-height:1}",
				".dsh-wtp-worktree-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
				".dsh-wtp-branch-icon{flex:none;width:12px;height:12px;color:var(--dsw-alias-label-tertiary,#8a919e);transition:transform .16s cubic-bezier(.4,0,.2,1),color .16s ease}",
				".dsh-wtp-branch-icon-open{transform:rotate(90deg)}",
				".dsh-wtp-worktree-row:hover .dsh-wtp-branch-icon{color:var(--dsw-alias-state-business-primary,#2f7cf6)}",
				".dsh-wtp-worktree-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}",
				".dsh-wtp-worktree-name-main{font-weight:650}",
				".dsh-wtp-row-actions{display:none;align-items:center;gap:2px;flex:none;margin-left:auto}",
				".dsh-wtp-worktree-row:hover .dsh-wtp-row-actions{display:inline-flex}",
				".dsh-wtp-dot{flex:none;width:7px;height:7px;border-radius:50%}",
				".dsh-wtp-dot-dirty{background:#f5a623}",
				".dsh-wtp-dot-clean{background:var(--dsw-alias-state-business-primary,#2f7cf6)}",
				".dsh-wtp-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border:none;background:transparent;border-radius:50%;color:var(--dsw-alias-label-secondary,#5f6672);cursor:pointer;font-size:12px;line-height:1}",
				".dsh-wtp-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.16));color:var(--dsw-alias-label-primary,#222831)}",
				".dsh-wtp-icon-btn-danger:hover{background:rgba(214,69,69,.12);color:#d64545}",
				".dsh-wtp-dialog-overlay{position:fixed;inset:0;background:rgba(15,20,30,.34);backdrop-filter:blur(2px);z-index:1200;display:flex;align-items:center;justify-content:center}",
				".dsh-wtp-dialog{box-sizing:border-box;width:min(380px,calc(100vw - 48px));max-height:78vh;overflow-y:auto;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:20px;box-shadow:0 12px 40px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08);color:var(--dsw-alias-label-primary,#222831);animation:dsh-wtp-dialog-in .16s cubic-bezier(.2,.8,.3,1)}",
				"@keyframes dsh-wtp-dialog-in{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}",
				".dsh-wtp-dialog-title{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;margin-bottom:12px;color:var(--dsw-alias-label-primary,#222831)}",
				".dsh-wtp-dialog-title-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
				".dsh-wtp-spinner{flex:none;width:12px;height:12px;border-radius:50%;border:2px solid var(--dsw-alias-border-l2,rgba(0,0,0,.15));border-top-color:var(--dsw-alias-state-business-primary,#2f7cf6);animation:dsh-wtp-spin .7s linear infinite;display:inline-block}",
				"@keyframes dsh-wtp-spin{to{transform:rotate(360deg)}}",
				".dsh-wtp-disabled{opacity:.5;pointer-events:none}",
				".dsh-wtp-dirty-warn{font-size:11px;line-height:1.5;color:#b8791a;background:rgba(245,166,35,.12);border-radius:6px;padding:6px 10px;margin:4px 0 10px}",
				".dsh-wtp-dialog-action-desc{display:block;font-size:11px;line-height:1.5;font-weight:400;color:var(--dsw-alias-label-tertiary,#8a919e);margin-top:3px}",
				".dsh-wtp-btn-primary:disabled{background:var(--dsw-alias-fill-l2,#e5e7eb);color:var(--dsw-alias-label-tertiary,#9aa0a6);cursor:not-allowed}",
				".dsh-wtp-dialog-action:disabled{opacity:.5;cursor:default}",
				".dsh-wtp-dialog .dsh-wtp-error{padding:0 0 4px;margin-bottom:8px}",
				".dsh-wtp-dialog-section{font-size:11px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#8a919e);margin:4px 0 10px}",
				".dsh-wtp-dialog-actions-col{display:flex;flex-direction:column;gap:10px}",
				".dsh-wtp-dialog-action{width:100%;text-align:left;padding:9px 12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:10px;background:transparent;color:var(--dsw-alias-label-primary,#222831);font-size:12.5px;line-height:1.4;cursor:pointer}",
				".dsh-wtp-dialog-action:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
				".dsh-wtp-dialog-action-title{display:block;font-size:12.5px;font-weight:600;line-height:1.4}",
				".dsh-wtp-dialog-action-primary{width:100%;text-align:left;padding:10px 12px;border:1px solid transparent;border-radius:10px;background:var(--dsw-alias-state-business-primary,#2f7cf6);color:#fff;font-size:12.5px;line-height:1.4;cursor:pointer;display:flex;flex-direction:column;gap:3px}",
				".dsh-wtp-dialog-action-primary:hover{background:var(--dsw-alias-state-business-hover,#245ec4)}",
				".dsh-wtp-dialog-action-primary:disabled{opacity:.6;cursor:default}",
				".dsh-wtp-dialog-action-primary .dsh-wtp-dialog-action-desc{color:rgba(255,255,255,.82)}",
				".dsh-wtp-btn-primary{flex:none;height:30px;padding:0 16px;border:none;border-radius:8px;background:var(--dsw-alias-state-business-primary,#2f7cf6);color:#fff;font-size:12.5px;font-weight:500;line-height:1;cursor:pointer}",
				".dsh-wtp-btn-primary:hover{background:var(--dsw-alias-state-business-hover,#245ec4)}",
				".dsh-wtp-btn-primary:disabled:hover{background:var(--dsw-alias-fill-l2,#e5e7eb)}",
				".dsh-wtp-btn-ghost{flex:none;height:30px;padding:0 14px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary,#222831);font-size:12.5px;font-weight:500;line-height:1;cursor:pointer}",
				".dsh-wtp-btn-ghost:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
				".dsh-wtp-pill{flex:none;font-size:11px;font-weight:500;padding:1px 7px;border-radius:8px;background:var(--dsw-alias-fill-l2,rgba(127,127,127,.16));color:var(--dsw-alias-label-secondary,#5f6672);max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
				".dsh-wtp-pill-btn{border:1px solid transparent;cursor:pointer;transition:border-color .15s ease,color .15s ease,background .15s ease}",
				".dsh-wtp-pill-btn:hover{border-color:var(--dsw-alias-state-business-primary,#2f7cf6);color:var(--dsw-alias-state-business-primary,#2f7cf6)}",
				".dsh-wtp-select-box{width:100%;box-sizing:border-box;height:32px;padding:0 28px 0 10px;cursor:pointer;appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--dsw-alias-label-secondary,#5f6672) 50%),linear-gradient(135deg,var(--dsw-alias-label-secondary,#5f6672) 50%,transparent 50%);background-position:calc(100% - 16px) 50%,calc(100% - 11px) 50%;background-size:5px 5px,5px 5px;background-repeat:no-repeat}",
				".dsh-wtp-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px;flex-wrap:wrap}",
				".dsh-wtp-branch-item-current{cursor:default;opacity:.85}",
				".dsh-wtp-status{flex:none;font-size:10.5px;color:var(--dsw-alias-label-tertiary,#8a919e)}",
				".dsh-wtp-status-dirty{color:#d98a1d}",
				".dsh-wtp-status-clean{color:var(--dsw-alias-state-business-primary,#2f7cf6)}",
				".dsh-wtp-nested{margin-left:18px;padding-left:8px;border-left:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));animation:dsh-wtp-nested-in .14s ease}",
				"@keyframes dsh-wtp-nested-in{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:none}}",
				".dsh-wtp-picker-row{display:flex;align-items:center;gap:6px;margin-left:14px;padding:4px 8px;border-radius:8px;cursor:pointer;font-size:12px;color:var(--dsw-alias-label-tertiary,#8a919e)}",
				".dsh-wtp-picker-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-state-business-primary,#2f7cf6)}",
				".dsh-wtp-picker-open{margin-left:14px;padding:2px 8px 8px}",
				".dsh-wtp-branch-list{max-height:224px;overflow-y:auto;margin:0 -4px 2px;padding-right:2px}",
				".dsh-wtp-branch-item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;font-size:12.5px;color:var(--dsw-alias-label-primary,#222831);cursor:pointer;transition:background .12s ease}",
				".dsh-wtp-branch-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
				".dsh-wtp-branch-item-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
				".dsh-wtp-tag{flex:none;font-size:10.5px;font-weight:500;padding:1px 7px;border-radius:999px;border:1px solid var(--dsw-alias-state-business-primary,#2f7cf6);color:var(--dsw-alias-state-business-primary,#2f7cf6);white-space:nowrap}",
				".dsh-wtp-branch-plus{flex:none;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:var(--dsw-alias-label-secondary,#5f6672);font-size:14px;line-height:1;transition:background .12s ease,color .12s ease}",
				".dsh-wtp-branch-item:hover .dsh-wtp-branch-plus{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.18));color:var(--dsw-alias-state-business-primary,#2f7cf6)}",
				".dsh-wtp-dialog-divider{border-top:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));margin:16px 0 14px}",
				".dsh-wtp-newbranch-row{display:flex;align-items:center;gap:8px}",
				".dsh-wtp-empty{padding:18px 6px;text-align:center;color:var(--dsw-alias-label-tertiary,#8a919e);font-size:12px;line-height:1.6}",
				".dsh-wtp-input{display:block;width:100%;box-sizing:border-box;height:32px;background:var(--dsw-alias-bg-layer-1,#f3f4f6);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));color:var(--dsw-alias-label-primary,#222831);border-radius:8px;padding:0 10px;font-size:12.5px;outline:none}",
				".dsh-wtp-input:focus{border-color:var(--dsw-alias-state-business-primary,#2f7cf6)}",
				".dsh-wtp-btn-block{width:100%;justify-content:center;margin-top:12px}",
				".dsh-wtp-error{color:var(--dsw-alias-state-error-primary,#d64545);font-size:11.5px;padding:4px 8px 0 22px;white-space:pre-wrap}",
				".dsh-wtp-config-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08))}",
				".dsh-wtp-config-loc{font-size:11px;color:var(--dsw-alias-label-tertiary,#8a919e);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
				".dsh-wtp-config-gear{border:none;background:none;cursor:pointer;font-size:14px;line-height:1;padding:2px 4px;border-radius:6px;color:var(--dsw-alias-label-tertiary,#8a919e);flex:none}",
				".dsh-wtp-config-gear:hover{color:var(--dsw-alias-label-primary,#222831);background:var(--dsw-alias-bg-layer-1,#f3f4f6)}",
				".dsh-wtp-config-desc{margin-top:10px;font-size:11px;color:var(--dsw-alias-label-tertiary,#8a919e);line-height:1.6}",
				".dsh-wtp-settings-row{padding:16px 0;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));display:flex;flex-direction:column;gap:10px}",
				".dsh-wtp-settings-title{color:var(--dsw-alias-label-primary,#222831);font-size:14px;line-height:22px}",
				".dsh-wtp-settings-radio{display:flex;align-items:center;gap:6px;cursor:pointer;padding:2px 0}",
				".dsh-wtp-settings-radio input[type=radio]{accent-color:var(--dsw-alias-state-business-primary,#2f7cf6);margin:0}",
				".dsh-wtp-settings-radio-label{font-size:13px;color:var(--dsw-alias-label-primary,#222831)}",
				".dsh-wtp-settings-radio-hint{font-size:11px;color:var(--dsw-alias-label-tertiary,#8a919e);margin-left:2px}",
				".dsh-wtp-settings-path{margin-top:2px;margin-left:22px;max-width:420px}",
				".dsh-wtp-settings-saving{font-size:11px;color:var(--dsw-alias-label-tertiary,#8a919e);margin-top:2px;margin-left:22px}",
				".dsh-wtp-migrate-box{margin-top:4px;padding:12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:8px;background:var(--dsw-alias-bg-layer-1,#f3f4f6)}",
				".dsh-wtp-migrate-title{font-size:12.5px;color:var(--dsw-alias-label-primary,#222831);font-weight:500;margin-bottom:8px}",
				".dsh-wtp-migrate-list{list-style:none;margin:0;padding:0;max-height:180px;overflow-y:auto}",
				".dsh-wtp-migrate-item{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:4px 0;font-size:12px;line-height:1.5}",
				".dsh-wtp-migrate-item:not(:last-child){border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.05))}",
				".dsh-wtp-migrate-item-name{color:var(--dsw-alias-label-primary,#222831);font-weight:500;flex:none}",
				".dsh-wtp-migrate-item-path{color:var(--dsw-alias-label-tertiary,#8a919e);text-align:right;word-break:break-all;min-width:0}",
				".dsh-wtp-migrate-item-skip .dsh-wtp-migrate-item-path{color:var(--dsw-alias-state-warning-primary,#d97706)}",
				".dsh-wtp-migrate-done{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px;font-size:12px;color:var(--dsw-alias-label-primary,#222831)}",
				".dsh-wtp-settings-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}"
			].join("\\n");
			document.head.appendChild(tag);
		}
		function __wtpApi() {
			var prefix = "/api/dsh-worktree";
			// 非 2xx 一律抛错（否则 404 等会被当成成功、静默失败）。
			var jsonOrThrow = (r) => r.json().then((d) => {
				if (!r.ok) throw new Error(d.error || d.message || ("HTTP " + r.status));
				return d;
			}).catch((e) => { throw e; });
			var post = (path, body) => fetch(prefix + path, {
				method: "POST",
				credentials: "same-origin",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body ?? {})
			}).then(jsonOrThrow);
			return {
				tree: () => fetch(prefix + "/tree", { credentials: "same-origin" }).then(jsonOrThrow),
				addRepo: (path) => post("/repos", { path }),
				initRepo: (path) => post("/repos/init", { path }),
				createWorktree: (repo, branch) => post("/worktrees", { repo, branch }),
				removeWorktree: (repo, branch) => post("/worktrees/remove", { repo, branch }),
				registerWorktree: (repo, branch) => post("/worktrees/register", { repo, branch }),
				switchMain: (repo, branch, create) => post("/worktrees/switch", { repo, branch, create: create === true }),
				getConfig: () => fetch(prefix + "/config", { credentials: "same-origin" }).then(jsonOrThrow),
				setConfig: (worktreeRoot) => post("/config", { worktreeRoot }),
				migrate: (body) => post("/migrate", body)
			};
		}
		/** Worktree topology + actions state for the browser tree. */
		function __wtpUseTopology() {
			__wtpEnsureCss();
			var api = (0, react.useMemo)(() => __wtpApi(), []);
			// Test seam (browser never sets it): SSR/render tests seed the initial tree.
			var initialTree = typeof window !== "undefined" && window.__wtpInitialTree ? window.__wtpInitialTree : null;
			var [tree, setTree] = (0, react.useState)(initialTree ? { repos: initialTree.repos || [], workspaces: initialTree.workspaces || [] } : { repos: [], workspaces: [] });
			var [config, setConfigState] = (0, react.useState)({ worktreeRoot: "" });
			var [actionError, setActionError] = (0, react.useState)(null);
			var [branchPickerOpen, setBranchPickerOpen] = (0, react.useState)(null);
			var [newBranch, setNewBranch] = (0, react.useState)("");
			var [dialog, setDialog] = (0, react.useState)(null);
			// 防抖 + 在途守卫：避免一次操作触发多个 /tree 拉取造成闪烁。
			var loadingRef = (0, react.useRef)(false);
			var debounceRef = (0, react.useRef)(null);
			var reload = (0, react.useCallback)(() => {
				if (loadingRef.current) return;
				loadingRef.current = true;
				api.tree().then((t) => {
					setTree(t || { repos: [], workspaces: [] });
					setConfigState({ worktreeRoot: t && typeof t.worktreeRoot === "string" ? t.worktreeRoot : "" });
					setActionError(null);
				}).catch((e) => {
					setActionError(String((e && e.message) || e));
				}).finally(() => {
					loadingRef.current = false;
				});
			}, [api]);
			var reloadDebounced = (0, react.useCallback)(() => {
				if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
				debounceRef.current = window.setTimeout(() => { debounceRef.current = null; reload(); }, 250);
			}, [reload]);
			(0, react.useEffect)(() => { reload(); }, [reload]);
			return { api, tree, setTree, reload, reloadDebounced, actionError, setActionError, branchPickerOpen, setBranchPickerOpen, newBranch, setNewBranch, dialog, setDialog, config };
		}
		/** Worktree 状态小圆点（默认隐藏，悬停浮现）。 */
		function __wtpStatus({ dirty, t }) {
			if (dirty == null) return null;
			return (0, react_jsx_runtime.jsx)("span", {
				className: "dsh-wtp-dot" + (dirty > 0 ? " dsh-wtp-dot-dirty" : " dsh-wtp-dot-clean"),
				title: dirty > 0 ? t("wtp.dirty") : t("wtp.clean")
			});
		}
		/** 项目级「＋」弹出的对话框壳：遮罩 + 面板 + Esc/× 关闭 + 就地错误显示。 */
		function __wtpDialog({ title, onClose, error, t, children }) {
			(0, react.useEffect)(() => {
				var onKey = (e) => { if (e.key === "Escape") onClose(); };
				document.addEventListener("keydown", onKey);
				return () => document.removeEventListener("keydown", onKey);
			}, [onClose]);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-wtp-dialog-overlay",
				onMouseDown: (e) => { if (e.target === e.currentTarget) onClose(); },
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: "dsh-wtp-dialog",
						role: "dialog",
						"aria-modal": "true",
						children: (0, react_jsx_runtime.jsxs)("div", { children: [
							(0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-dialog-title", children: [
								(0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-dialog-title-text", children: title }),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsh-wtp-icon-btn",
									"aria-label": t("wtp.close"),
									onClick: onClose,
									children: "✕"
								})
							] }),
							error != null && (0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-error", children: error }),
							children
						] })
					})
				]
			});
		}
		/** 创建分支/工作树弹窗：下拉选择框选已有分支 + 输入框建新分支。 */
		function __wtpBranchDialog({ repo, onClose, wtp, t }) {
			var worktrees = new Set((repo.worktrees || []).map((w) => w.name));
			var pending = (repo.branches || []).filter((b) => !worktrees.has(b));
			var current = repo.branch != null && !worktrees.has(repo.branch) ? repo.branch : null;
			if (current !== null) pending = [current, ...pending.filter((b) => b !== current)];
			var [busy, setBusy] = (0, react.useState)(null);
			var [error, setError] = (0, react.useState)(null);
			var [name, setName] = (0, react.useState)("");
			var [selected, setSelected] = (0, react.useState)(current ?? pending[0] ?? "");
			var nameValid = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(name) && !name.includes("..");
			var creating = name.trim() !== "";
			var create = (branch) => {
				var n = String(branch || "").trim();
				if (!n || busy !== null) return;
				if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(n) || n.includes("..")) {
					setError(t("wtp.branchNameInvalid"));
					return;
				}
				setBusy(n);
				setError(null);
				wtp.api.createWorktree(repo.name, n).then(() => {
					wtp.reload();
					onClose();
				}).catch((err) => {
					setError(String((err && err.message) || err));
					setBusy(null);
				});
			};
			var createBranchSwitch = () => {
				var n = name.trim();
				if (!n || busy !== null) return;
				if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(n) || n.includes("..")) {
					setError(t("wtp.branchNameInvalid"));
					return;
				}
				setBusy(n);
				setError(null);
				wtp.api.switchMain(repo.name, n, true).then(() => {
					wtp.reload();
					onClose();
				}).catch((err) => {
					setError(String((err && err.message) || err));
					setBusy(null);
				});
			};
			// 输入框有值 → 用它建新分支；否则用选择框里的已有分支。
			var submit = () => {
				var n = name.trim();
				create(n !== "" ? n : selected);
			};
			return (0, react_jsx_runtime.jsx)(__wtpDialog, {
				title: t("wtp.dialogBranchTitle", { name: repo.name }),
				onClose,
				error,
				t,
				children: (0, react_jsx_runtime.jsxs)("div", { children: [
					pending.length > 0 && (0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-dialog-section", children: t("wtp.dialogPickBranch") }),
					pending.length > 0 && (0, react_jsx_runtime.jsx)("select", {
						className: "dsh-wtp-input dsh-wtp-select-box",
						value: selected,
						onChange: (e) => setSelected(e.target.value),
						children: pending.map((b) => (0, react_jsx_runtime.jsx)("option", {
							value: b,
							children: b === current ? b + "（" + t("wtp.currentBranch") + "）" : b
						}, b))
					}),
					pending.length === 0 && (0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-empty", children: t("wtp.noPendingBranches") }),
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-dialog-divider" }),
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-dialog-section", children: t("wtp.newBranchHint") }),
					(0, react_jsx_runtime.jsx)("input", {
						className: "dsh-wtp-input",
						placeholder: t("wtp.newBranchPlaceholder"),
						value: name,
						onChange: (e) => setName(e.target.value),
						onKeyDown: (e) => { if (e.key === "Enter") submit(); }
					}),
					(0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-dialog-actions", children: [
						(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-wtp-btn-ghost", onClick: onClose, children: t("wtp.cancel") }),
						creating
							? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsh-wtp-btn-ghost",
									disabled: busy !== null || !nameValid,
									onClick: createBranchSwitch,
									children: busy !== null ? t("wtp.busyCreating") : t("wtp.createBranchSwitch")
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsh-wtp-btn-primary",
									disabled: busy !== null || !nameValid,
									onClick: submit,
									children: busy !== null ? t("wtp.busyCreating") : t("wtp.createWorktree")
								})
							] })
							: (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-wtp-btn-primary",
								disabled: busy !== null || !selected,
								onClick: submit,
								children: busy !== null ? t("wtp.busyCreating") : t("wtp.createWorktree")
							})
					] }),
					(0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-config-row", children: [
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-config-loc", children: (wtp.config.worktreeRoot && wtp.config.worktreeRoot.trim() !== "") ? t("wtp.configLocGlobal", { path: wtp.config.worktreeRoot }) : t("wtp.configLocProject") }),
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsh-wtp-config-gear",
							title: t("wtp.configOpen"),
							onClick: () => wtp.setDialog({ type: "config" }),
							children: "⚙"
						})
					] })
				] })
			});
		}
		/** 从项目行更多操作打开的 Git 初始化确认框。 */
		function __wtpInitDialog({ workspace, onClose, wtp, t }) {
			var [busy, setBusy] = (0, react.useState)(false);
			var [error, setError] = (0, react.useState)(null);
			var initGit = () => {
				if (busy) return;
				setBusy(true);
				setError(null);
				wtp.api.initRepo(workspace.path).then(() => {
					wtp.reload();
					onClose();
				}).catch((err) => {
					setError(String((err && err.message) || err));
					setBusy(false);
				});
			};
			return (0, react_jsx_runtime.jsx)(__wtpDialog, {
				title: t("wtp.dialogInitTitle", { name: workspace.label }),
				onClose,
				error,
				t,
				children: (0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-dialog-actions-col", children: [
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-dialog-section", children: t("wtp.initDialogHint") }),
					(0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "dsh-wtp-dialog-action-primary",
						disabled: busy,
						onClick: initGit,
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-dialog-action-title", children: busy ? t("wtp.busyInit") : t("wtp.initGit") }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-dialog-action-desc", children: t("wtp.initGitDesc") })
						]
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dsh-wtp-btn-ghost",
						disabled: busy,
						onClick: onClose,
						children: t("wtp.cancel")
					})
				] })
			});
		}
		/** 切换主工作树分支弹窗：下拉选择框 + 确认/取消 + dirty 预警 + 空态。 */
		function __wtpSwitchDialog({ repo, onClose, wtp, t }) {
			var worktrees = new Set((repo.worktrees || []).map((w) => w.name));
			// 可切换的已有分支：排除当前分支和已在 worktree 检出的分支。
			var candidates = (repo.branches || []).filter((b) => !worktrees.has(b) && b !== repo.branch);
			var current = repo.branch;
			var [selected, setSelected] = (0, react.useState)(candidates[0] ?? "");
			var [newBranch, setNewBranch] = (0, react.useState)("");
			var [busy, setBusy] = (0, react.useState)(false);
			var [error, setError] = (0, react.useState)(null);
			var hasTarget = candidates.length > 0;
			var name = newBranch.trim();
			var creating = name !== "";
			var nameValid = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(name) && !name.includes("..");
			var switchTo = () => {
				if (busy || selected === "" || selected === current) return;
				setBusy(true);
				setError(null);
				wtp.api.switchMain(repo.name, selected).then(() => {
					wtp.reload();
					onClose();
				}).catch((err) => {
					setError(String((err && err.message) || err));
					setBusy(false);
				});
			};
			var createSwitch = () => {
				if (busy || !nameValid) return;
				setBusy(true);
				setError(null);
				wtp.api.switchMain(repo.name, name, true).then(() => {
					wtp.reload();
					onClose();
				}).catch((err) => {
					setError(String((err && err.message) || err));
					setBusy(false);
				});
			};
			var onEnter = () => { if (creating) createSwitch(); else switchTo(); };
			return (0, react_jsx_runtime.jsx)(__wtpDialog, {
				title: t("wtp.switchTitle", { name: repo.name }),
				onClose,
				error,
				t,
				children: (0, react_jsx_runtime.jsxs)("div", { children: [
					hasTarget
						? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							(0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-dialog-section", children: t("wtp.switchHint") }),
							(repo.dirty != null && repo.dirty > 0) && (0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-dirty-warn", children: t("wtp.dirtyWarn") }),
							(0, react_jsx_runtime.jsx)("select", {
								className: "dsh-wtp-input dsh-wtp-select-box",
								value: selected,
								autoFocus: true,
								onChange: (e) => setSelected(e.target.value),
								onKeyDown: (e) => { if (e.key === "Enter") switchTo(); },
								children: candidates.map((b) => (0, react_jsx_runtime.jsx)("option", { value: b, children: b }, b))
							})
						] })
						: (0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-status", children: t("wtp.noSwitchTarget") }),
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-dialog-section", children: t("wtp.switchNewBranchHint") }),
					(0, react_jsx_runtime.jsx)("input", {
						className: "dsh-wtp-input",
						placeholder: t("wtp.newBranchPlaceholder"),
						value: newBranch,
						disabled: busy,
						autoFocus: !hasTarget,
						onChange: (e) => setNewBranch(e.target.value),
						onKeyDown: (e) => { if (e.key === "Enter") onEnter(); }
					}),
					(0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-dialog-actions", children: [
						(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-wtp-btn-ghost", onClick: onClose, children: t("wtp.cancel") }),
						creating
							? (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-wtp-btn-primary",
								disabled: busy || !nameValid,
								onClick: createSwitch,
								children: busy ? t("wtp.busyCreating") : t("wtp.createBranchSwitch")
							})
							: (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-wtp-btn-primary",
								disabled: busy || selected === "" || selected === current,
								onClick: switchTo,
								children: busy ? t("wtp.busySwitching") : t("wtp.switchTo")
							})
					] })
				] })
			});
		}
		/** 配置 worktree 落盘位置：项目内（默认）或全局目录。 */
		function __wtpConfigDialog({ config, onClose, wtp, t }) {
			var [mode, setMode] = (0, react.useState)(config.worktreeRoot && config.worktreeRoot.trim() !== "" ? "global" : "project");
			var [path, setPath] = (0, react.useState)(config.worktreeRoot || "");
			var [busy, setBusy] = (0, react.useState)(false);
			var [error, setError] = (0, react.useState)(null);
			var save = () => {
				var root = mode === "global" ? path.trim() : "";
				if (busy) return;
				if (mode === "global" && root === "") {
					setError(t("wtp.configPathRequired"));
					return;
				}
				setBusy(true);
				setError(null);
				wtp.api.setConfig(root).then(() => {
					wtp.reload();
					onClose();
				}).catch((err) => {
					setError(String((err && err.message) || err));
					setBusy(false);
				});
			};
			return (0, react_jsx_runtime.jsx)(__wtpDialog, {
				title: t("wtp.configTitle"),
				onClose,
				error,
				t,
				children: (0, react_jsx_runtime.jsxs)("div", { children: [
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-dialog-section", children: t("wtp.configPickMode") }),
					(0, react_jsx_runtime.jsx)("select", {
						className: "dsh-wtp-input dsh-wtp-select-box",
						value: mode,
						onChange: (e) => setMode(e.target.value),
						children: [
							(0, react_jsx_runtime.jsx)("option", { value: "project", children: t("wtp.configModeProject") }),
							(0, react_jsx_runtime.jsx)("option", { value: "global", children: t("wtp.configModeGlobal") })
						]
					}),
					mode === "project"
						? (0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-config-desc", children: t("wtp.configModeProjectDesc") })
						: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							(0, react_jsx_runtime.jsx)("input", {
								className: "dsh-wtp-input",
								style: { marginTop: 10 },
								placeholder: t("wtp.configPathPlaceholder"),
								value: path,
								onChange: (e) => setPath(e.target.value)
							}),
							(0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-config-desc", children: t("wtp.configModeGlobalDesc") })
						] }),
					(0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-dialog-actions", children: [
						(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-wtp-btn-ghost", onClick: onClose, children: t("wtp.cancel") }),
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsh-wtp-btn-primary",
							disabled: busy || (mode === "global" && path.trim() === ""),
							onClick: save,
							children: busy ? t("wtp.busySaving") : t("wtp.configSave")
						})
					] })
				] })
			});
		}
		/** git-branch 图标：展开时旋转 90°。 */
		function __wtpBranchIcon({ expanded }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				className: "dsh-wtp-branch-icon" + (expanded ? " dsh-wtp-branch-icon-open" : ""),
				viewBox: "0 0 16 16",
				width: "12",
				height: "12",
				"aria-hidden": "true",
				children: (0, react_jsx_runtime.jsx)("path", {
					d: "M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0z"
				})
			});
		}
		/** One worktree line: 默认只显示分支图标 + 名称（+ 分支 pill）；
		 *  悬停时浮现状态点 / 「＋」新会话 / 「✕」删除。固定行高，悬停不撑高。
		 *  点击行 = 展开/收起；按钮点击均 stopPropagation。 */
		function __wtpWorktreeRow({ name, pill, dirty, expanded, onToggle, sessions, overflow, currentId, now, onOpen, onRename, onFork, onArchive, dragFactory, accountKey, onNewSession, onDelete, main, onPillClick, t }) {
			return (0, react_jsx_runtime.jsxs)("div", { children: [
				(0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-worktree-row" + (main ? " dsh-wtp-worktree-row-main" : ""), onClick: onToggle, children: [
					(0, react_jsx_runtime.jsx)(__wtpBranchIcon, { expanded }),
					(0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-worktree-name" + (main ? " dsh-wtp-worktree-name-main" : ""), children: name }),
					pill != null && (onPillClick != null
						? (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsh-wtp-pill dsh-wtp-pill-btn",
							title: t("wtp.switchMain"),
							onClick: (e) => {
								e.stopPropagation();
								onPillClick();
							},
							children: pill
						})
						: (0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-pill", children: pill })),
					(0, react_jsx_runtime.jsxs)("span", { className: "dsh-wtp-row-actions", children: [
						(0, react_jsx_runtime.jsx)(__wtpStatus, { dirty, t }),
						onNewSession != null && (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsh-wtp-icon-btn",
							title: t("wtp.newSession"),
							onClick: (e) => {
								e.stopPropagation();
								onNewSession();
							},
							children: "+"
						}),
						onDelete != null && (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsh-wtp-icon-btn dsh-wtp-icon-btn-danger",
							title: t("wtp.removeWorktree"),
							onClick: (e) => {
								e.stopPropagation();
								onDelete();
							},
							children: "✕"
						})
					] })
				] }),
				expanded && (0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-nested", children: [
					(sessions || []).map((node) => (0, react_jsx_runtime.jsx)(SessionNodeItem, {
						node,
						currentId,
						now,
						onOpen,
						onRename,
						onFork,
						onArchive,
						drag: accountKey != null ? dragFactory(accountKey, node) : void 0,
						t
					}, node.id)),
					overflow != null && (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: WorkspaceBrowser_module_css_default.sessionOverflowButton,
						"aria-expanded": overflow.expanded,
						onClick: overflow.onToggle,
						children: overflow.expanded ? t("sessions.collapse") : t("sessions.expand", { n: overflow.n })
					})
				] })
			] });
		}
		/** 迁移确认/结果块：从 LocationRow 抽出，减少嵌套层级。 */
		function __wtpMigrationBox({ migrate, t, onConfirm, onCancel, onClose }) {
			if (migrate === null) return null;
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				!migrate.executed && (0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-migrate-box", children: [
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-migrate-title", children: t("wtp.migrateTitle", { n: migrate.items.length }) }),
					(0, react_jsx_runtime.jsx)("ul", { className: "dsh-wtp-migrate-list", children: migrate.items.map((item) => (0, react_jsx_runtime.jsxs)("li", {
						className: "dsh-wtp-migrate-item" + (item.skipped ? " dsh-wtp-migrate-item-skip" : ""),
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-migrate-item-name", children: item.repo + "/" + item.branch }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-migrate-item-path", children: item.skipped ? t("wtp.migrateSkip", { reason: item.skipReason === "dirty" ? t("wtp.dirty") : t("wtp.migrateActive") }) : "→ " + item.newPath })
						]
					}, item.repo + "/" + item.branch)) })
				] }),
				!migrate.executed && !migrate.busy && (0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-settings-actions", children: [
					(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-wtp-btn-ghost", onClick: onCancel, children: t("wtp.cancel") }),
					(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-wtp-btn-primary", onClick: onConfirm, children: t("wtp.migrateConfirm") })
				] }),
				migrate.busy && (0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-settings-saving", children: t("wtp.migrateRunning") }),
				migrate.executed && (0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-migrate-done", children: [
					(0, react_jsx_runtime.jsx)("span", { children: t("wtp.migrateDone", { ok: migrate.items.filter((i) => i.migrated).length, n: migrate.items.length }) }),
					(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-wtp-btn-ghost", onClick: onClose, children: t("wtp.close") })
				] }),
				migrate.error && (0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-error", children: migrate.error })
			] });
		}
		/** 通用设置里的「工作树位置」：radio 双模式 + 自动保存 + 迁移确认。 */
		function __wtpLocationRow({ t }) {
			var api = (0, react.useMemo)(() => __wtpApi(), []);
			var [state, setState] = (0, react.useState)({ loaded: false, mode: "project", path: "", initialRoot: "", saving: false, error: null });
			var [migrate, setMigrate] = (0, react.useState)(null); // null | { dryRun: true, items } | { executed: true, items }
			var timerRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				api.getConfig().then((c) => {
					var root = c && typeof c.worktreeRoot === "string" ? c.worktreeRoot : "";
					setState({ loaded: true, mode: root.trim() !== "" ? "global" : "project", path: root, initialRoot: root, saving: false, error: null });
				}).catch((e) => setState({ loaded: true, mode: "project", path: "", initialRoot: "", saving: false, error: String((e && e.message) || e) }));
				return () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); };
			}, [api]);
			var doSave = (root) => {
				setState((s) => ({ ...s, saving: true, error: null }));
				api.setConfig(root).then((c) => {
					var next = c && typeof c.worktreeRoot === "string" ? c.worktreeRoot : "";
					var oldRoot = state.initialRoot;
					setState((s) => ({ ...s, saving: false, mode: next.trim() !== "" ? "global" : "project", path: next, initialRoot: next }));
					// 路径变更 → 拉取迁移计划
					if (oldRoot !== next) {
						api.migrate({ worktreeRoot: next, oldWorktreeRoot: oldRoot }).then((plan) => {
							if (plan && !plan.same && plan.items.length > 0) setMigrate(plan);
						}).catch(() => {});
					}
				}).catch((e) => {
					var msg = String((e && e.message) || e);
					setState((s) => ({ ...s, saving: false, error: msg }));
					if (timerRef.current !== null) window.clearTimeout(timerRef.current);
					timerRef.current = window.setTimeout(() => setState((s) => s.error === msg ? ({ ...s, error: null }) : s), 4000);
				});
			};
			var onModeChange = (mode) => {
				if (mode === "project") {
					setState((s) => ({ ...s, mode: "project", error: null }));
					doSave("");
				} else {
					setState((s) => ({ ...s, mode: "global", error: null }));
				}
			};
			var onPathBlur = () => {
				var root = state.path.trim();
				if (root === "") {
					setState((s) => ({ ...s, error: t("wtp.configPathRequired") }));
					return;
				}
				doSave(root);
			};
			var execMigrate = () => {
				var plan = migrate;
				if (!plan || plan.executed) return;
				setMigrate((m) => m ? ({ ...m, busy: true }) : null);
				api.migrate({ worktreeRoot: plan.newRoot, oldWorktreeRoot: plan.oldRoot, execute: true }).then((r) => {
					setMigrate(r && r.executed ? r : ({ ...plan, executed: true, items: (r && r.items) || plan.items, error: "迁移返回异常" }));
				}).catch((e) => {
					setMigrate((m) => m ? ({ ...m, error: String((e && e.message) || e), busy: false }) : null);
				});
			};
			if (!state.loaded) return null;
			return (0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-settings-row", children: [
				(0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-settings-title", children: t("wtp.configTitle") }),
				(0, react_jsx_runtime.jsxs)("label", { className: "dsh-wtp-settings-radio", children: [
					(0, react_jsx_runtime.jsx)("input", { type: "radio", name: "wtp-location-mode", checked: state.mode === "project", onChange: () => onModeChange("project"), disabled: state.saving }),
					(0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-settings-radio-label", children: t("wtp.configModeProject") }),
					(0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-settings-radio-hint", children: t("wtp.configModeProjectHint") })
				] }),
				(0, react_jsx_runtime.jsxs)("label", { className: "dsh-wtp-settings-radio", children: [
					(0, react_jsx_runtime.jsx)("input", { type: "radio", name: "wtp-location-mode", checked: state.mode === "global", onChange: () => onModeChange("global"), disabled: state.saving }),
					(0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-settings-radio-label", children: t("wtp.configModeGlobal") }),
					(0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-settings-radio-hint", children: t("wtp.configModeGlobalHint") })
				] }),
				state.mode === "global" && (0, react_jsx_runtime.jsx)("input", {
					className: "dsh-wtp-input dsh-wtp-settings-path",
					placeholder: t("wtp.configPathPlaceholder"),
					value: state.path,
					disabled: state.saving,
					onChange: (e) => setState((s) => ({ ...s, path: e.target.value, error: null })),
					onBlur: onPathBlur,
					onKeyDown: (e) => { if (e.key === "Enter") onPathBlur(); }
				}),
				state.error != null && (0, react_jsx_runtime.jsx)("div", { className: "dsh-wtp-error", children: state.error }),
				state.saving && (0, react_jsx_runtime.jsx)("span", { className: "dsh-wtp-settings-saving", children: t("wtp.busySaving") }),
				(0, react_jsx_runtime.jsx)(__wtpMigrationBox, {
					migrate,
					t,
					onConfirm: execMigrate,
					onCancel: () => setMigrate(null),
					onClose: () => setMigrate(null)
				})
			] });
		}
`
const SESSION_TREE_SIG = `		function SessionTree({ useSessions,`
expect(src, SESSION_TREE_SIG, "SessionTree signature")
src = src.replace(SESSION_TREE_SIG, HELPERS + SESSION_TREE_SIG)

// ---------------------------------------------------------------------------
// 3. topology hook + expansion state inside SessionTree
// ---------------------------------------------------------------------------
const HOOK_ANCHOR = `			useNativeDragAcceptance(drag !== null || workspaceDrag !== null);`
expect(src, HOOK_ANCHOR, "SessionTree hooks anchor")
src = src.replace(HOOK_ANCHOR, HOOK_ANCHOR + `
			const wtp = __wtpUseTopology();
			const [wtpExpanded, setWtpExpanded] = (0, react.useState)({});
			// 官方添加/删除工作区后刷新 worktree 拓扑（新注册的 git 仓库自动出现）。
			(0, react.useEffect)(() => { wtp.reloadDebounced(); }, [workspaces.length]);`)

// ---------------------------------------------------------------------------
// 4. SessionTree return block replacement
// ---------------------------------------------------------------------------
const RETURN_START = `			const workspaceDropAtListStart = groups[0]?.workspaceId !== void 0 && workspaceDrag?.over?.id === groups[0].workspaceId && workspaceDrag.over.half === "before";`
const RETURN_END = `		/** The flat "In one list" body: every session is one draggable top-level row. */`
expect(src, RETURN_START, "SessionTree return start")
expect(src, RETURN_END, "SessionTree return end")
const startIdx = src.indexOf(RETURN_START)
const endIdx = src.indexOf(RETURN_END, startIdx)
if (endIdx === -1) throw new Error("patch anchor not found: SessionTree return end (after start)")

const NEW_RETURN = `			const wtpRepoByWorkspace = new Map();
			for (const repo of wtp.tree.repos) if (repo.workspaceId != null) wtpRepoByWorkspace.set(repo.workspaceId, repo);
			const wtpHidden = new Set();
			for (const repo of wtp.tree.repos) {
				if (repo.workspaceId == null) continue;
				for (const wt of (repo.worktrees || [])) if (wt.workspaceId != null) wtpHidden.add(wt.workspaceId);
			}
			const wtpGroupByWorkspace = new Map(groups.filter((g) => g.workspaceId !== void 0).map((g) => [g.workspaceId, g]));
			const visibleGroups = groups.filter((g) => g.workspaceId === void 0 || !wtpHidden.has(g.workspaceId));
			const wtpDescendants = (0, react.useMemo)(() => _deepseek_ai_dsh_client_runtime_client.indexSubagentDescendants(list.byId), [list]);
			const workspaceDropAtListStart = visibleGroups[0]?.workspaceId !== void 0 && workspaceDrag?.over?.id === visibleGroups[0].workspaceId && workspaceDrag.over.half === "before";
			return (0, react_jsx_runtime.jsxs)("div", {
				className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
				children: [
					workspaceDropAtListStart && (0, react_jsx_runtime.jsx)("span", {
						className: WorkspaceBrowser_module_css_default.listTopDropIndicator,
						"aria-hidden": "true"
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: clsx(WorkspaceBrowser_module_css_default.list, workspaceDropAtListStart && WorkspaceBrowser_module_css_default.listTopDropActive),
						role: "tree",
						"aria-label": t("section.sessions"),
						children: [
							visibleGroups.length === 0 && (0, react_jsx_runtime.jsx)("div", {
								className: WorkspaceBrowser_module_css_default.empty,
								children: t("empty.none")
							}),
							wtp.actionError != null && (0, react_jsx_runtime.jsx)("div", {
								className: "dsh-wtp-error",
								children: t("wtp.failed", { msg: wtp.actionError })
							}),
							visibleGroups.map((group) => {
								const workspaceId = group.workspaceId;
								const repo = workspaceId === void 0 ? void 0 : wtpRepoByWorkspace.get(workspaceId);
								const workspaceMarker = workspaceId !== void 0 && workspaceDrag?.over?.id === workspaceId ? workspaceDrag.over.half : null;
								const workspaceDragProps = workspaceId === void 0 ? void 0 : {
									start: () => {
										workspaceDropCommitted.current = false;
										setWorkspaceDrag({
											workspaceId,
											over: null
										});
									},
									end: () => {
										if (workspaceDrag?.over !== null && workspaceDrag?.over !== void 0) commitWorkspaceDrag(workspaceDrag, workspaceDrag.over);
										else setWorkspaceDrag(null);
										workspaceDropCommitted.current = false;
									}
								};
								const hoverWorkspace = workspaceId === void 0 ? void 0 : (half) => {
									setWorkspaceDrag((active) => active === null ? active : {
										...active,
										over: {
											id: workspaceId,
											half
										}
									});
								};
								const dropWorkspace = workspaceId === void 0 ? void 0 : (half) => {
									if (workspaceDrag === null) return;
									commitWorkspaceDrag(workspaceDrag, {
										id: workspaceId,
										half
									});
								};
								const sessionDrag = (accountKey, node) => ({
									start: () => {
										sessionDropCommitted.current = false;
										setDrag({
											accountKey,
											sessionId: node.id,
											over: null
										});
									},
									active: drag !== null && drag.accountKey === accountKey,
									marker: drag !== null && drag.accountKey === accountKey && drag.over?.id === node.id ? drag.over.half : null,
									hover: (half) => {
										setDrag((d) => d === null ? d : {
											...d,
											over: {
												id: node.id,
												half
											}
										});
									},
									drop: (half) => {
										if (drag === null) return;
										commitSessionDrag(drag, {
											id: node.id,
											half
										});
									},
									end: () => {
										if (drag?.over !== null && drag?.over !== void 0) commitSessionDrag(drag, drag.over);
										else setDrag(null);
										sessionDropCommitted.current = false;
									}
								});
								return (0, react_jsx_runtime.jsxs)("div", {
									className: clsx(WorkspaceBrowser_module_css_default.groupSection, workspaceMarker === "before" && WorkspaceBrowser_module_css_default.workspaceDropBefore, workspaceMarker === "after" && WorkspaceBrowser_module_css_default.workspaceDropAfter),
									onDragOver: workspaceDrag === null || hoverWorkspace === void 0 ? void 0 : (e) => {
										e.preventDefault();
										e.dataTransfer.dropEffect = "move";
										hoverWorkspace(workspaceGroupHalf(e));
									},
									onDrop: workspaceDrag === null || dropWorkspace === void 0 ? void 0 : (e) => {
										e.preventDefault();
										dropWorkspace(workspaceGroupHalf(e));
									},
									children: [
										(0, react_jsx_runtime.jsx)(ProjectRowItem, {
											group,
											home,
											t,
											onToggle: () => {
												if (group.expanded) setExpandedSessionGroups((keys) => keys.filter((key) => key !== group.key));
												setGroupExpanded(group.key, !group.expanded);
											},
											onCreate: () => {
												setGroupExpanded(group.key, true);
												// Git 项目：打开分支/worktree 创建器；非 Git：保持官方默认，直接开会话。
											if (repo !== void 0) wtp.setDialog({ type: "branch", repo });
											else if (group.workspaceId !== void 0) startSession(group.workspaceId);
											},
											drag: workspaceDragProps,
											actions: group.workspaceId === void 0 ? void 0 : {
												initializeGit: repo !== void 0 ? void 0 : () => {
													wtp.setDialog({
														type: "init",
														workspace: { workspaceId: group.workspaceId, label: group.label, path: group.cwd }
													});
												},
												rename: () => {
													if (group.workspaceId !== void 0) onRenameRequest(group.workspaceId, group.label);
												},
												delete: () => {
													if (group.workspaceId !== void 0) onDeleteRequest(group.workspaceId, group.label);
												}
											}
										}),
										// 主工作树 (main)：仅 git 项目显示（用户按主目录选择）。
										// 会话 = 官方工作区会话 ∪ /tree 主目录 cwd 匹配会话（保证注册丢失时仍显示）。
										repo !== void 0 && group.expanded && (function () {
											// 空白「新会话」行与已归档会话不展示（正在对话的除外）。
											const blankOk = (n) => n !== void 0 && !(n.blank === true && n.id !== current) && !archivedSessionIds.includes(n.id);
											const official = group.sessions.filter(blankOk);
											const all = [];
											const seen = new Set();
											for (const n of official) {
												if (n !== void 0 && !seen.has(n.id)) { seen.add(n.id); all.push(n); }
											}
											for (const s of (repo.sessions || [])) {
												const live = list.byId[s.id];
												if (live !== void 0 && blankOk(live) && !seen.has(live.id)) { seen.add(live.id); all.push(sessionNode(live, wtpDescendants)); }
											}
											const overflow = all.length > COLLAPSED_SESSION_LIMIT ? {
												expanded: expandedSessionGroups.includes(group.key),
												n: all.length - COLLAPSED_SESSION_LIMIT,
												onToggle: () => setExpandedSessionGroups((keys) => toggled(keys, group.key))
											} : null;
											const shown = overflow !== null && !overflow.expanded ? all.slice(0, COLLAPSED_SESSION_LIMIT) : all;
											return (0, react_jsx_runtime.jsx)(__wtpWorktreeRow, {
												name: t("wtp.main"),
												pill: repo.branch,
												dirty: repo.dirty,
												main: true,
												onPillClick: () => wtp.setDialog({ type: "switch", repo }),
												expanded: wtpExpanded["main-" + group.key] !== false,
												onToggle: () => setWtpExpanded((v) => ({ ...v, ["main-" + group.key]: wtpExpanded["main-" + group.key] !== false ? false : true })),
												sessions: shown,
												overflow,
												currentId: current,
												now,
												onOpen: open,
												onRename: onSessionRename,
												onFork: forkSession,
												onArchive: onSessionArchive,
												dragFactory: sessionDrag,
												accountKey: group.workspaceId,
												onNewSession: () => {
													// 自动展开主工作树行，让新会话立即可见。
													setWtpExpanded((v) => ({ ...v, ["main-" + group.key]: true }));
													startSession(group.workspaceId);
												},
												t
											});
										})(),
										// 非 git 工作区/未分组：无 worktree UI，保持官方直挂渲染（空白新会话行隐藏）。
										repo === void 0 && group.expanded && (expandedSessionGroups.includes(group.key) ? group.sessions : group.sessions.slice(0, COLLAPSED_SESSION_LIMIT)).filter((node) => !(node.blank === true && node.id !== current)).map((node) => {
											const sameGroupDrag = drag !== null && drag.accountKey === group.key;
											return (0, react_jsx_runtime.jsx)(SessionNodeItem, {
												node,
												currentId: current,
												now,
												onOpen: open,
												onRename: onSessionRename,
												onFork: forkSession,
												onArchive: onSessionArchive,
												drag: {
													start: () => {
														sessionDropCommitted.current = false;
														setDrag({
															accountKey: group.key,
															sessionId: node.id,
															over: null
														});
													},
													active: sameGroupDrag,
													marker: sameGroupDrag && drag.over?.id === node.id ? drag.over.half : null,
													hover: (half) => {
														setDrag((d) => d === null ? d : {
															...d,
															over: {
																id: node.id,
																half
															}
														});
													},
													drop: (half) => {
														if (drag === null) return;
														commitSessionDrag(drag, {
															id: node.id,
															half
														});
													},
													end: () => {
														if (drag?.over !== null && drag?.over !== void 0) commitSessionDrag(drag, drag.over);
														else setDrag(null);
														sessionDropCommitted.current = false;
													}
												},
												t
											}, node.id);
										}),
										repo === void 0 && group.sessions.length > COLLAPSED_SESSION_LIMIT && (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: WorkspaceBrowser_module_css_default.sessionOverflowButton,
											"aria-expanded": expandedSessionGroups.includes(group.key),
											onClick: () => {
												setExpandedSessionGroups((keys) => toggled(keys, group.key));
											},
											children: expandedSessionGroups.includes(group.key) ? t("sessions.collapse") : t("sessions.expand", { n: group.sessions.length - COLLAPSED_SESSION_LIMIT })
										}),
										// 各 linked worktree：会话按 /tree 返回的目录会话 id 实时映射到官方 live 节点
										// （无需注册为工作区；注册由用户点「+ 新会话」时按需触发）。
										repo !== void 0 && group.expanded && (repo.worktrees || []).map((wt) => {
											const wtKey = repo.name + "/" + wt.name;
											const expandedWt = wtpExpanded[wtKey] !== false;
											// 空白「新会话」行与已归档会话都不展示（正在对话的除外）。
											const wtNodes = (wt.sessions || [])
												.map((s) => list.byId[s.id])
												.filter((n) => n !== void 0 && !(n.blank === true && n.id !== current) && !archivedSessionIds.includes(n.id))
												.map((n) => sessionNode(n, wtpDescendants));
											return (0, react_jsx_runtime.jsx)(__wtpWorktreeRow, {
												name: wt.name,
												pill: null,
												dirty: wt.dirty,
												expanded: expandedWt,
												onToggle: () => setWtpExpanded((v) => ({ ...v, [wtKey]: expandedWt === true ? false : true })),
												sessions: wtNodes,
												overflow: null,
												currentId: current,
												now,
												onOpen: open,
												onRename: onSessionRename,
												onFork: forkSession,
												onArchive: onSessionArchive,
												dragFactory: sessionDrag,
												accountKey: wt.workspaceId != null ? wt.workspaceId : null,
												onNewSession: () => {
													// 先自动展开该 worktree 行，让新会话立即可见；
													// 已注册 → 直接开新会话，随后防抖刷新；
													// 未注册 → 按需注册（用户显式操作），乐观更新本地 workspaceId 避免整树重载闪烁。
													const start = (wid) => startSession(wid);
													setWtpExpanded((v) => ({ ...v, [wtKey]: true }));
													if (wt.workspaceId != null) {
														start(wt.workspaceId);
														wtp.reloadDebounced();
														return;
													}
													wtp.setActionError(null);
													wtp.api.registerWorktree(repo.name, wt.name).then((r) => {
														if (r && r.error) throw new Error(r.error);
														// 乐观更新：本地把该 worktree 的 workspaceId 置上，不整树重载。
														wtp.setTree((prev) => ({
															...prev,
															repos: (prev.repos || []).map((rr) =>
																rr.name === repo.name
																	? {
																		...rr,
																		worktrees: (rr.worktrees || []).map((w) =>
																			w.name === wt.name ? { ...w, workspaceId: r.workspaceId } : w
																		),
																	}
																	: rr
															),
														}));
														start(r.workspaceId);
														wtp.reloadDebounced();
													}).catch((err) => wtp.setActionError(String((err && err.message) || err)));
												},
												onDelete: () => {
													if (window.confirm(t("wtp.removeConfirm", { name: wt.name }))) {
														wtp.setActionError(null);
														wtp.api.removeWorktree(repo.name, wt.name).then((r) => {
															if (r && r.error) throw new Error(r.error);
															wtp.reload();
														}).catch((err) => wtp.setActionError(String((err && err.message) || err)));
													}
												},
												t
											}, "wt-" + wtKey);
										})
									]
								}, group.key);
							})
						]
					}),
					wtp.dialog !== null && (wtp.dialog.type === "branch"
						? (0, react_jsx_runtime.jsx)(__wtpBranchDialog, {
							repo: wtp.dialog.repo,
							onClose: () => wtp.setDialog(null),
							wtp,
							t
						})
						: wtp.dialog.type === "switch"
							? (0, react_jsx_runtime.jsx)(__wtpSwitchDialog, {
								repo: wtp.dialog.repo,
								onClose: () => wtp.setDialog(null),
								wtp,
								t
							})
							: wtp.dialog.type === "config"
								? (0, react_jsx_runtime.jsx)(__wtpConfigDialog, {
									config: wtp.config,
									onClose: () => wtp.setDialog(null),
									wtp,
									t
								})
								: (0, react_jsx_runtime.jsx)(__wtpInitDialog, {
									workspace: wtp.dialog.workspace,
									onClose: () => wtp.setDialog(null),
									wtp,
									t
								})),
					(0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })
				]
			});
		}
`
src = src.slice(0, startIdx) + NEW_RETURN + "\n" + src.slice(endIdx)

// ---------------------------------------------------------------------------
// 5. locale keys
// ---------------------------------------------------------------------------
const ZH_KEYS = [
  '"wtp.main": "主工作树"',
  '"wtp.currentBranch": "当前分支"',
  '"wtp.clean": "干净"',
  '"wtp.dirty": "有改动"',
  '"wtp.open": "打开"',
  '"wtp.collapse": "收起"',
  '"wtp.newSession": "+ 新会话"',
  '"wtp.removeWorktree": "删除该 worktree"',
  '"wtp.removeConfirm": "确定删除 worktree「{name}」？未提交的改动会丢失。"',
  '"wtp.pickerOpen": "＋ 分支 → 创建 worktree"',
  '"wtp.pickerClose": "－ 收起分支列表"',
  '"wtp.noPendingBranches": "所有分支都已有 worktree"',
  '"wtp.createWorktree": "创建 worktree"',
  '"wtp.newBranchPlaceholder": "新分支名"',
  '"wtp.failed": "操作失败：{msg}"',
  '"wtp.addRepo": "＋ 添加 git 仓库"',
  '"wtp.addRepoPrompt": "输入 git 仓库路径（将自动注册为工作区）"',
  '"wtp.dialogBranchTitle": "创建 worktree —— {name}"',
  '"wtp.dialogPickBranch": "选择已有分支："',
  '"wtp.dialogInitTitle": "初始化 Git —— {name}"',
  '"wtp.initGitMenu": "初始化 Git 并启用 Worktree"',
  '"wtp.initGit": "初始化 Git 仓库"',
  '"wtp.switchTitle": "切换主工作树分支 —— {name}"',
  '"wtp.switchHint": "选择分支（已在 worktree 中检出的分支不可切）："',
  '"wtp.switchTo": "切换分支"',
  '"wtp.switchNewBranchHint": "或新建分支并切换（不创建 worktree）："',
  '"wtp.createBranchSwitch": "创建分支"',
  '"wtp.switchMain": "点击切换主工作树分支"',
  '"wtp.close": "关闭"',
  '"wtp.cancel": "取消"',
  '"wtp.busyCreating": "创建中…"',
  '"wtp.busyInit": "初始化中…"',
  '"wtp.busySwitching": "切换中…"',
  '"wtp.dirtyWarn": "主工作树有未提交改动，切换可能失败或被拒绝。"',
  '"wtp.noSwitchTarget": "没有可切换的分支——其它分支都已在 worktree 中检出。"',
  '"wtp.branchNameInvalid": "分支名不合法：不能含空格或 ..，请以字母或数字开头。"',
  '"wtp.createBranchWorktree": "创建分支并开 worktree"',
  '"wtp.newBranchHint": "或新建分支："',
  '"wtp.initDialogHint": "该操作会在当前目录初始化 Git 仓库。完成后可从项目的「＋」创建分支 worktree。"',
  '"wtp.initGitDesc": "会写入 .git 元数据，并启用该项目的分支/worktree 管理。"',
  '"wtp.configTitle": "工作树位置"',
  '"wtp.configPickMode": "选择 worktree 存放位置："',
  '"wtp.configModeProject": "项目内（默认）"',
  '"wtp.configModeGlobal": "自定义目录"',
  '"wtp.configModeProjectHint": "每个 worktree 建在各自项目仓库内"',
  '"wtp.configModeGlobalHint": "所有项目集中到一个路径下"',
  '"wtp.configModeProjectDesc": "每个 worktree 建在各自项目主仓库内的 .dsh/workspaces 下，随项目走（建议把 .dsh/ 加入 .gitignore）。"',
  '"wtp.configModeGlobalDesc": "所有项目的 worktree 集中放到一个绝对路径下（如 ~/orca/workspaces）。"',
  '"wtp.configPathPlaceholder": "绝对路径，例如 /Users/you/orca/workspaces"',
  '"wtp.configPathRequired": "请填写全局目录的绝对路径"',
  '"wtp.configSave": "保存"',
  '"wtp.busySaving": "保存中…"',
  '"wtp.configOpen": "更改存放位置"',
  '"wtp.configLocProject": "存放位置：项目内 .dsh/workspaces"',
  '"wtp.configLocGlobal": "存放位置：{path}/<项目>"',
  '"wtp.settingsNav": "Worktree"',
  '"wtp.migrateTitle": "检测到 {n} 个已有 worktree 需要迁移："',
  '"wtp.migrateConfirm": "确认迁移"',
  '"wtp.migrateRunning": "迁移中…"',
  '"wtp.migrateDone": "迁移完成（{ok}/{n}）"',
  '"wtp.migrateSkip": "跳过（{reason}）"',
  '"wtp.migrateActive": "有活跃会话"',
]
const EN_KEYS = [
  '"wtp.main": "Main worktree"',
  '"wtp.currentBranch": "Current branch"',
  '"wtp.clean": "Clean"',
  '"wtp.dirty": "Modified"',
  '"wtp.open": "Open"',
  '"wtp.collapse": "Collapse"',
  '"wtp.newSession": "+ New session"',
  '"wtp.removeWorktree": "Remove worktree"',
  '"wtp.removeConfirm": "Remove worktree \\"{name}\\"? Uncommitted changes will be lost."',
  '"wtp.pickerOpen": "+ Branch -> Create worktree"',
  '"wtp.pickerClose": "- Collapse branch list"',
  '"wtp.noPendingBranches": "Every branch already has a worktree"',
  '"wtp.createWorktree": "Create worktree"',
  '"wtp.newBranchPlaceholder": "New branch name"',
  '"wtp.failed": "Operation failed: {msg}"',
  '"wtp.addRepo": "+ Add git repo"',
  '"wtp.addRepoPrompt": "Enter a git repo path (will be registered as a workspace)"',
  '"wtp.dialogBranchTitle": "Create worktree — {name}"',
  '"wtp.dialogPickBranch": "Pick an existing branch:"',
  '"wtp.dialogInitTitle": "Initialize Git — {name}"',
  '"wtp.initGitMenu": "Initialize Git and enable worktrees"',
  '"wtp.initGit": "Initialize Git repository"',
  '"wtp.switchTitle": "Switch main-worktree branch — {name}"',
  '"wtp.switchHint": "Pick a branch (branches checked out in a worktree cannot be switched):"',
  '"wtp.switchTo": "Switch"',
  '"wtp.switchNewBranchHint": "Or create & switch to a new branch (no worktree):"',
  '"wtp.createBranchSwitch": "Create branch"',
  '"wtp.switchMain": "Click to switch the main-worktree branch"',
  '"wtp.close": "Close"',
  '"wtp.cancel": "Cancel"',
  '"wtp.busyCreating": "Creating…"',
  '"wtp.busyInit": "Initializing…"',
  '"wtp.busySwitching": "Switching…"',
  '"wtp.dirtyWarn": "The main worktree has uncommitted changes; switching may fail or be rejected."',
  '"wtp.noSwitchTarget": "No switchable branches — every other branch is checked out in a worktree."',
  '"wtp.branchNameInvalid": "Invalid branch name: no spaces or .., must start with a letter or digit."',
  '"wtp.createBranchWorktree": "Create branch + worktree"',
  '"wtp.newBranchHint": "Or new branch:"',
  '"wtp.initDialogHint": "This writes Git metadata into the current directory. Afterward, use the project plus button to create branch worktrees."',
  '"wtp.initGitDesc": "Writes .git metadata and enables branch/worktree management for this project."',
  '"wtp.configTitle": "Worktree directory"',
  '"wtp.configPickMode": "Choose where worktrees live:"',
  '"wtp.configModeProject": "Inside project (default)"',
  '"wtp.configModeGlobal": "Custom folder"',
  '"wtp.configModeProjectHint": "Each worktree lives inside its own project repo"',
  '"wtp.configModeGlobalHint": "All worktrees grouped under one path"',
  '"wtp.configModeProjectDesc": "Worktrees live under .dsh/workspaces inside each project\'s main repo (consider adding .dsh/ to .gitignore)."',
  '"wtp.configModeGlobalDesc": "All projects\' worktrees are grouped under one absolute path (e.g. ~/orca/workspaces)."',
  '"wtp.configPathPlaceholder": "Absolute path, e.g. /Users/you/orca/workspaces"',
  '"wtp.configPathRequired": "Enter an absolute path for the global folder"',
  '"wtp.configSave": "Save"',
  '"wtp.busySaving": "Saving…"',
  '"wtp.configOpen": "Change location"',
  '"wtp.configLocProject": "Location: inside project (.dsh/workspaces)"',
  '"wtp.configLocGlobal": "Location: {path}/<project>"',
  '"wtp.settingsNav": "Worktree"',
  '"wtp.migrateTitle": "{n} worktree(s) need to be moved:"',
  '"wtp.migrateConfirm": "Migrate"',
  '"wtp.migrateRunning": "Migrating…"',
  '"wtp.migrateDone": "Done ({ok}/{n})"',
  '"wtp.migrateSkip": "Skipped ({reason})"',
  '"wtp.migrateActive": "active session"',
]
const ZH_ANCHOR = `			"time.ago": "{t}前"`
const EN_ANCHOR = `			"time.ago": "{t} ago"`
expect(src, ZH_ANCHOR, "zh time.ago")
expect(src, EN_ANCHOR, "en time.ago")
src = src.replace(ZH_ANCHOR, ZH_ANCHOR + ",\n" + ZH_KEYS.map((k) => "\t\t\t" + k).join(",\n"))
src = src.replace(EN_ANCHOR, EN_ANCHOR + ",\n" + EN_KEYS.map((k) => "\t\t\t" + k).join(",\n"))

// ---------------------------------------------------------------------------
// 6. settings.section: worktree 落盘位置（插件独立设置页）
// ---------------------------------------------------------------------------
const APPLY_END_ANCHOR = `			}, WorkspacePicker));
		}`
expect(src, APPLY_END_ANCHOR, "apply ending (WorkspacePicker registration)")
src = src.replace(APPLY_END_ANCHOR, `			}, WorkspacePicker));
			// 独立设置页「Worktree」：通过 settings.section 注册完整插件设置页。
			// 复用 /config API，与创建弹窗使用同一数据源。
			// settings.section 的 owner 只向下传 { close }，i18n 的 t 需经 inject
			// 工厂显式注入（与官方 ui-settings-models 的 ModelsSection 一致）。
			const wtpT = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "dsh-worktree-panel",
				order: 30,
				label: () => wtpT("wtp.settingsNav"),
				locale: NS,
				inject: () => ({ t: wtpT })
			}, __wtpLocationRow));
		}`)

src = `// Generated from @deepseek-ai/dsh-client-ui-workspace@${UPSTREAM_VERSION}\n` + src
writeFileSync(OUT, src)
console.log(`built ${OUT} from ${SRC} (@deepseek-ai/dsh-client-ui-workspace@${UPSTREAM_VERSION}, ${src.length} bytes)`)
