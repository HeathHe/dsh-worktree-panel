// Generated from @deepseek-ai/dsh-client-ui-workspace@0.1.1-rc.2
window.__ModuleLoader__.load({
	id: "dsh-worktree-panel",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region lib/types/client/stores.js
		/**
		* The workspace browser's viewing store: the session-list grouping mode,
		* persisted across reloads. Module level exports the factory only (a
		* module-level handle would pin the store identity across plugin reloads);
		* register() receives the factory and the browser derives its PropsStore
		* share from the return type.
		*/
		/** Browser-local order account for the hierarchy-free flat Session list. */
		const FLAT_SESSION_ORDER_KEY = "__flat_session_order__";
		/**
		* Create the workspace browser viewing store handle.
		* @returns the store handle (spec + type + identity + factory in one).
		*/
		function createWorkspaceViewStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					groupBy: "workspace",
					orderBy: "updated",
					groupExpansion: {},
					sessionOrderByAccount: {},
					sessionUpdatedAtByAccount: {}
				}),
				persist: "dsh.workspace.view.v5",
				actions: {
					setGroupBy: (d, mode) => {
						d.groupBy = mode;
					},
					setOrderBy: (d, mode) => {
						d.orderBy = mode;
					},
					setGroupExpanded: (d, key, expanded) => {
						d.groupExpansion[key] = expanded;
					},
					retainAccountKeys: (d, workspaceKeys) => {
						const retained = new Set(workspaceKeys);
						d.groupExpansion = Object.fromEntries(Object.entries(d.groupExpansion).filter(([key]) => retained.has(key)));
						d.sessionOrderByAccount = Object.fromEntries(Object.entries(d.sessionOrderByAccount).filter(([key]) => retained.has(key)));
						d.sessionUpdatedAtByAccount = Object.fromEntries(Object.entries(d.sessionUpdatedAtByAccount).filter(([key]) => retained.has(key)));
					},
					syncSessionOrderAccount: (d, accountKey, order, updatedAt) => {
						d.sessionOrderByAccount[accountKey] = order;
						d.sessionUpdatedAtByAccount[accountKey] = updatedAt;
					},
					setSessionOrder: (d, accountKey, order) => {
						d.sessionOrderByAccount[accountKey] = order;
					}
				}
			});
		}
		//#endregion
		//#region ../../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
		function r(e) {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) e[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx() {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		/** Display label for the ungrouped bucket row. */
		const UNGROUPED_LABEL = "Ungrouped";
		/**
		* Directory display label: basename of the path (both separators accepted).
		* Ungrouped-bucket fallback for surfaces without a workspace title.
		* @param cwd - directory path, or undefined for the ungrouped bucket.
		* @returns basename, the raw cwd when it has no basename, or the ungrouped label.
		*/
		function workspaceLabel(cwd) {
			if (cwd === void 0 || cwd === "") return UNGROUPED_LABEL;
			const base = cwd.replace(/[/\\]+$/, "").split(/[/\\]/).pop();
			return base !== void 0 && base !== "" ? base : cwd;
		}
		/** Recency comparator: newest first, id as the deterministic tiebreak (ids are unique per group). */
		function byRecency(a, b) {
			if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
			return a.id < b.id ? -1 : 1;
		}
		/**
		* Ordinary sessions are visible; among blank sessions, only the current one
		* is visible. Subagent children use their parent header catalog; archived
		* sessions are visible nowhere, while their accounting slots remain so
		* unarchiving restores position.
		*/
		function sessionVisible(session, current, archived) {
			return session.origin !== "subagent" && !archived.has(session.id) && (!session.blank || session.id === current);
		}
		/**
		* A blank session is the selected Workspace's provisional New Session row;
		* its canonical title never enters search (blank rows are query-excluded)
		* and the renderer localizes its display label.
		*/
		function sessionTitle(session) {
			return session.blank ? "New Session" : session.displayTitle;
		}
		/** Build one group without projecting session lineage into presentation. */
		function buildGroup(key, workspaceId, cwd, createdAt, label, members, order) {
			const sessions = [...members];
			if (order === "recency") sessions.sort(byRecency);
			return {
				key,
				workspaceId,
				cwd,
				createdAt,
				label,
				sessions
			};
		}
		/** Apply a stored Ungrouped order and append newly loose Sessions by recency. */
		function orderedUngrouped(members, stored) {
			const byId = new Map(members.map((session) => [session.id, session]));
			const included = /* @__PURE__ */ new Set();
			const ordered = [];
			for (const key of stored) {
				const session = byId.get(key);
				if (session === void 0 || included.has(key)) continue;
				ordered.push(session);
				included.add(key);
			}
			for (const session of [...members].sort(byRecency)) {
				if (included.has(session.id)) continue;
				ordered.push(session);
			}
			return ordered;
		}
		/**
		* Group Sessions by Host Workspace: one group per entity in stable Host
		* order, with members resolved from sessionIds in their stored order. Sessions
		* outside every Workspace trail in the browser-local Ungrouped order, which
		* falls back to recency before that order is initialized.
		*/
		function groupByWorkspace(list, workspaces, archived, ungroupedOrder) {
			const groups = [];
			const accounted = /* @__PURE__ */ new Set();
			for (const workspace of workspaces) {
				const members = [];
				for (const id of workspace.sessionIds) {
					const summary = list.byId[id];
					if (summary === void 0) continue;
					accounted.add(id);
					if (!sessionVisible(summary, list.current, archived)) continue;
					members.push(summary);
				}
				groups.push(buildGroup(workspace.workspaceId, workspace.workspaceId, workspace.path, Date.parse(workspace.createdAt), workspace.title, members, "account"));
			}
			const stray = list.ids.map((id) => list.byId[id]).filter((s) => s !== void 0 && !accounted.has(s.id) && sessionVisible(s, list.current, archived));
			if (stray.length > 0) groups.push(buildGroup("", void 0, void 0, void 0, UNGROUPED_LABEL, ungroupedOrder === void 0 ? stray : orderedUngrouped(stray, ungroupedOrder), ungroupedOrder === void 0 ? "recency" : "account"));
			return groups;
		}
		function sessionNode(s, descendants) {
			return {
				id: s.id,
				title: sessionTitle(s),
				blank: s.blank,
				running: s.running,
				runningSubagentCount: descendants.get(s.id)?.runningCount ?? 0,
				completed: s.completed === true,
				updatedAt: s.updatedAt,
				...s.pendingInteraction === void 0 ? {} : { pendingInteraction: s.pendingInteraction }
			};
		}
		/**
		* Derive the workspace browser groups with every session as a top-level row.
		*
		* Every group shows; sessions populate under expanded groups in the selected
		* local order. Blank sessions are excluded except for the selected
		* provisional New Session row; archived sessions are excluded everywhere.
		* Content search lives outside this derivation
		* (see {@link deriveSearchResults}).
		* @param list - sessions list snapshot (`current` feeds containsCurrent).
		* @param workspaces - real workspaces in stable Host order.
		* @param archivedSessionIds - registry-global archive set.
		* @param view - local expansion arrays.
		* @returns group sections in render order.
		*/
		function deriveGroups(list, workspaces, archivedSessionIds, view) {
			const archived = new Set(archivedSessionIds);
			const expandedGroups = new Set(view.expandedGroups);
			const descendants = (0, _deepseek_ai_dsh_client_runtime_client.indexSubagentDescendants)(list.byId);
			const currentGroup = list.current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(list.current))?.workspaceId ?? "";
			const groups = [];
			for (const g of groupByWorkspace(list, workspaces, archived, view.ungroupedOrder)) {
				const expanded = expandedGroups.has(g.key);
				groups.push({
					key: g.key,
					workspaceId: g.workspaceId,
					cwd: g.cwd,
					createdAt: g.createdAt,
					label: g.label,
					sessionCount: g.sessions.length,
					expanded,
					containsCurrent: g.key === currentGroup,
					sessions: expanded ? g.sessions.map((session) => sessionNode(session, descendants)) : []
				});
			}
			return groups;
		}
		/**
		* Derive the flat session list ("In one list" mode): every session — fork
		* children included — as a top-level row, strictly newest-first. No grouping,
		* no parent/child adjacency. Content search lives outside this derivation
		* (see {@link deriveSearchResults}).
		* @param list - sessions list snapshot.
		* @param archivedSessionIds - registry-global archive set.
		* @returns flat rows in render order.
		*/
		function deriveFlat(list, archivedSessionIds) {
			const archived = new Set(archivedSessionIds);
			const descendants = (0, _deepseek_ai_dsh_client_runtime_client.indexSubagentDescendants)(list.byId);
			const rows = [];
			for (const id of list.ids) {
				const s = list.byId[id];
				if (s === void 0 || !sessionVisible(s, list.current, archived)) continue;
				rows.push(s);
			}
			rows.sort(byRecency);
			return rows.map((session) => sessionNode(session, descendants));
		}
		/**
		* Merge immediate title/Workspace substring matches with ranked Host content
		* matches. Local rows lead newest-first, content-only rows retain backend
		* order, and duplicate sessions receive the backend snippet in place.
		* @param list - session metadata authority.
		* @param workspaces - Workspace membership and display labels.
		* @param query - caller text; surrounding whitespace is ignored.
		* @param archivedSessionIds - registry-global archive set (members never match).
		* @param content - ranked Host content-search page.
		* @param limit - protocol-owned maximum merged row count.
		* @returns bounded deduplicated flat rows and a refine-query hint bit.
		*/
		function deriveSearchResults(list, workspaces, query, archivedSessionIds, content, limit) {
			const q = query.trim().toLowerCase();
			if (q === "") return {
				items: [],
				hasMore: false
			};
			const archived = new Set(archivedSessionIds);
			const descendants = (0, _deepseek_ai_dsh_client_runtime_client.indexSubagentDescendants)(list.byId);
			const workspaceBySession = /* @__PURE__ */ new Map();
			for (const workspace of workspaces) for (const sessionId of workspace.sessionIds) if (!workspaceBySession.has(sessionId)) workspaceBySession.set(sessionId, workspace.title);
			const labelOf = (summary) => workspaceBySession.get(summary.id) ?? workspaceLabel(summary.cwd);
			const contentBySession = /* @__PURE__ */ new Map();
			for (const item of content.items) if (!contentBySession.has(item.sessionId)) contentBySession.set(item.sessionId, item);
			const local = [];
			for (const id of list.ids) {
				const summary = list.byId[id];
				if (summary === void 0 || summary.blank || !sessionVisible(summary, list.current, archived)) continue;
				if (sessionTitle(summary).toLowerCase().includes(q) || labelOf(summary).toLowerCase().includes(q)) local.push(summary);
			}
			local.sort(byRecency);
			const ordered = [];
			const included = /* @__PURE__ */ new Set();
			const include = (summary) => {
				if (included.has(summary.id)) return;
				included.add(summary.id);
				ordered.push(summary);
			};
			for (const summary of local) include(summary);
			for (const item of content.items) {
				const summary = list.byId[item.sessionId];
				if (summary !== void 0 && !summary.blank && sessionVisible(summary, list.current, archived)) include(summary);
			}
			return {
				items: ordered.slice(0, limit).map((summary) => {
					const match = contentBySession.get(summary.id);
					return {
						id: summary.id,
						title: sessionTitle(summary),
						workspace: labelOf(summary),
						running: summary.running,
						runningSubagentCount: descendants.get(summary.id)?.runningCount ?? 0,
						...summary.pendingInteraction === void 0 ? {} : { pendingInteraction: summary.pendingInteraction },
						completed: summary.completed === true,
						...match === void 0 ? {} : { snippet: match.snippet }
					};
				}),
				hasMore: content.hasMore || ordered.length > limit
			};
		}
		/**
		* Compact relative time for session rows, as a structured bucket the
		* renderer localizes ("now"/"5min"/"3h"/"2d"/"4mo"/"1y" in en).
		* @param updatedAt - epoch ms of the session's last activity.
		* @param now - current epoch ms (injected for pure rendering).
		* @returns the row's trailing time bucket and magnitude.
		*/
		function relativeTime(updatedAt, now) {
			const MIN = 6e4;
			const HOUR = 36e5;
			const DAY = 864e5;
			const diff = Math.max(0, now - updatedAt);
			if (diff < MIN) return {
				unit: "now",
				n: 0
			};
			if (diff < HOUR) return {
				unit: "minutes",
				n: Math.floor(diff / MIN)
			};
			if (diff < DAY) return {
				unit: "hours",
				n: Math.floor(diff / HOUR)
			};
			if (diff < 30 * DAY) return {
				unit: "days",
				n: Math.floor(diff / DAY)
			};
			if (diff < 365 * DAY) return {
				unit: "months",
				n: Math.floor(diff / (30 * DAY))
			};
			return {
				unit: "years",
				n: Math.floor(diff / (365 * DAY))
			};
		}
		//#endregion
		//#region \0dsh-css:/home/runner/work/deepseek-harness/deepseek-harness/packages/client/ui-workspace/src/client/rows/Rows.module.css.mjs
		const css$2 = ".YDXeBa_projectRow,.YDXeBa_sessionRow{cursor:pointer;user-select:none;color:var(--dsw-alias-label-primary);border-radius:8px;align-items:center;gap:6px;padding:0 8px;display:flex}.YDXeBa_projectRow:hover,.YDXeBa_sessionRow:hover,.YDXeBa_sessionRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultRow{box-sizing:border-box;cursor:pointer;text-align:left;width:100%;min-height:48px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:8px;flex-direction:column;align-items:stretch;padding:4px 8px;display:flex}.YDXeBa_searchResultRow:hover,.YDXeBa_searchResultRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultHeading{align-items:center;min-width:0;display:flex}.YDXeBa_searchResultTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;margin-left:4px;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_searchResultMeta{align-items:center;gap:6px;min-width:0;margin-left:20px;display:flex}.YDXeBa_searchResultWorkspace,.YDXeBa_searchResultSnippet{text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:17px;overflow:hidden}.YDXeBa_searchResultWorkspace{max-width:40%;color:var(--dsw-alias-label-tertiary);flex:none}.YDXeBa_searchResultSnippet{min-width:0;color:var(--dsw-alias-label-secondary);flex:1}.YDXeBa_projectRow{box-sizing:border-box;align-items:center;height:34px}.YDXeBa_projectRow .YDXeBa_rowActions{height:20px}.YDXeBa_sessionRow{height:32px;animation:YDXeBa_row-in .15s var(--ds-ease-in-out);gap:0}.YDXeBa_sessionRow .YDXeBa_title{margin:0 6px 0 4px}.YDXeBa_flatSessionRowWithoutStatus .YDXeBa_title{margin-left:0}@keyframes YDXeBa_row-in{0%{opacity:0}}.YDXeBa_slot{width:16px;height:20px;color:var(--dsw-alias-label-tertiary);flex:none;justify-content:center;align-items:center;display:inline-flex}.YDXeBa_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.YDXeBa_folderActive{color:var(--dsw-alias-state-business-primary)}.YDXeBa_projectRow .YDXeBa_chevron{display:none}.YDXeBa_projectRow:hover .YDXeBa_chevron{display:inline-flex}.YDXeBa_projectRow:hover .YDXeBa_folder{display:none}.YDXeBa_arrow{transition:transform .15s var(--ds-ease-in-out)}.YDXeBa_arrowOpen{transform:rotate(90deg)}.YDXeBa_projectText{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.YDXeBa_title{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_renameInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);min-width:0;color:inherit;border-radius:4px;outline:none;padding:0 2px;font-size:14px;line-height:20px}.YDXeBa_sessionRow .YDXeBa_title{flex:1}.YDXeBa_meta{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px;overflow:hidden}.YDXeBa_time{color:var(--dsw-alias-label-tertiary);flex:none;font-size:12px;line-height:20px}.YDXeBa_dot{flex:none}.YDXeBa_rowActions{flex:none;align-items:center;gap:12px;display:none}.YDXeBa_projectRow:hover .YDXeBa_rowActions,.YDXeBa_sessionRow:hover .YDXeBa_rowActions,.YDXeBa_projectRow.YDXeBa_menuOpen .YDXeBa_rowActions,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_rowActions{display:inline-flex}.YDXeBa_sessionRow:hover .YDXeBa_time,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_time{display:none}.YDXeBa_projectRow.YDXeBa_menuOpen,.YDXeBa_sessionRow.YDXeBa_menuOpen{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_sessionRow.YDXeBa_dropBefore,.YDXeBa_sessionRow.YDXeBa_dropAfter{position:relative}.YDXeBa_sessionRow.YDXeBa_dropBefore:before,.YDXeBa_sessionRow.YDXeBa_dropAfter:after{content:\"\";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:4px}.YDXeBa_sessionRow.YDXeBa_dropBefore:before{top:-7px}.YDXeBa_sessionRow.YDXeBa_dropAfter:after{bottom:-7px}.YDXeBa_hoverContent{flex-direction:column;gap:8px;display:flex}.YDXeBa_hoverTitle{color:#fff;overflow-wrap:break-word;font-size:14px;line-height:20px}.YDXeBa_hoverPath{color:#cfd3d6;word-break:break-all;font-size:12px;line-height:16px}.YDXeBa_hoverTime{color:#cfd3d6;font-size:12px;line-height:16px}.YDXeBa_hoverStatus{color:#adb2b8;align-items:center;gap:8px;font-size:12px;line-height:20px;display:flex}.YDXeBa_iconButton{cursor:pointer;width:16px;height:16px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:4px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.YDXeBa_iconButton:hover{color:var(--dsw-alias-label-primary)}.YDXeBa_chevron{color:var(--dsw-alias-label-caption)}@media (prefers-reduced-motion:reduce){.YDXeBa_sessionRow,.YDXeBa_arrow{transition:none;animation:none}}";
		const tagId$2 = "@deepseek-ai/dsh-client-ui-workspace/Rows.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-workspace";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var Rows_module_css_default = {
			"arrow": "YDXeBa_arrow",
			"arrowOpen": "YDXeBa_arrowOpen",
			"chevron": "YDXeBa_chevron",
			"dot": "YDXeBa_dot",
			"dropAfter": "YDXeBa_dropAfter",
			"dropBefore": "YDXeBa_dropBefore",
			"flatSessionRowWithoutStatus": "YDXeBa_flatSessionRowWithoutStatus",
			"folder": "YDXeBa_folder",
			"folderActive": "YDXeBa_folderActive",
			"hoverContent": "YDXeBa_hoverContent",
			"hoverPath": "YDXeBa_hoverPath",
			"hoverStatus": "YDXeBa_hoverStatus",
			"hoverTime": "YDXeBa_hoverTime",
			"hoverTitle": "YDXeBa_hoverTitle",
			"iconButton": "YDXeBa_iconButton",
			"menuOpen": "YDXeBa_menuOpen",
			"meta": "YDXeBa_meta",
			"projectRow": "YDXeBa_projectRow",
			"projectText": "YDXeBa_projectText",
			"renameInput": "YDXeBa_renameInput",
			"row-in": "YDXeBa_row-in",
			"rowActions": "YDXeBa_rowActions",
			"searchResultHeading": "YDXeBa_searchResultHeading",
			"searchResultMeta": "YDXeBa_searchResultMeta",
			"searchResultRow": "YDXeBa_searchResultRow",
			"searchResultSnippet": "YDXeBa_searchResultSnippet",
			"searchResultTitle": "YDXeBa_searchResultTitle",
			"searchResultWorkspace": "YDXeBa_searchResultWorkspace",
			"selected": "YDXeBa_selected",
			"sessionRow": "YDXeBa_sessionRow",
			"slot": "YDXeBa_slot",
			"time": "YDXeBa_time",
			"title": "YDXeBa_title",
			"visuallyHidden": "YDXeBa_visuallyHidden"
		};
		//#endregion
		//#region lib/types/client/rows/Rows.js
		/**
		* Workspace browser tree row components (figma Cell set 14:3080): pure presentational —
		* all data and callbacks arrive via props. Hover swaps (folder->chevron,
		* time->ellipsis, action buttons) are CSS-only. Row ... menus are visual-only
		* except workspace Rename/Delete and session Rename/Fork/Archive; the session
		* and workspace hover cards are suppressed while a menu is open.
		*/
		/** Row display title: blank rows show the localized New Session label. */
		function displayTitle(node, t) {
			return node.blank ? t("session.new") : node.title;
		}
		/** Localized compact relative time ("刚刚"/"5分钟" in zh, "now"/"5min" in en). */
		function timeLabel(updatedAt, now, t) {
			const { unit, n } = relativeTime(updatedAt, now);
			return unit === "now" ? t("time.now") : t(`time.${unit}`, { n });
		}
		/** Hover-card variant: distances wrap in the ago template; the now bucket stays bare (no "now ago"). */
		function hoverTimeLabel(updatedAt, now, t) {
			const { unit, n } = relativeTime(updatedAt, now);
			return unit === "now" ? t("time.now") : t("time.ago", { t: t(`time.${unit}`, { n }) });
		}
		/**
		* Absolute creation time through the dictionary's date template (the message
		* clock pattern): `toLocaleString` would follow the browser language, not the
		* app locale, and produce mixed-language text after a switch.
		*/
		function createdLabel(createdAt, t) {
			const d = new Date(createdAt);
			const pad2 = (v) => String(v).padStart(2, "0");
			return t("hover.created", { time: `${t("date.ymd", {
				y: d.getFullYear(),
				m: d.getMonth() + 1,
				d: d.getDate()
			})} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` });
		}
		/** Hover-card body: workspace title, display directory path, absolute creation time. */
		function WorkspaceHoverContent({ label, cwd, createdAt, t }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: Rows_module_css_default.hoverContent,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: Rows_module_css_default.hoverTitle,
						children: label
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: Rows_module_css_default.hoverPath,
						children: cwd
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: Rows_module_css_default.hoverTime,
						children: createdLabel(createdAt, t)
					})
				]
			});
		}
		/** Pointer-position half of a row (insert line above or below). */
		function rowHalf(e) {
			const rect = e.currentTarget.getBoundingClientRect();
			return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
		}
		/**
		* Project (workspace) header row: folder + title;
		* hover reveals the chevron and create button, and dwelling on a real
		* Workspace shows its hover card (the ungrouped bucket has none).
		* `containsCurrent` arrives on the node (derivation fact, no renderer scan).
		* @param props.group - derived group node.
		* @param props.onToggle - expand/collapse the group.
		* @param props.onCreate - start a frontend Session inside this Workspace.
		* @param props.drag - optional workspace-row drag wiring.
		* @param props.home - host account home for POSIX hover-path abbreviation.
		* @param props.t - the browser root's locale seat.
		* @returns the row element.
		*/
		function ProjectRowItem({ group, onToggle, onCreate, actions, drag, home, t }) {
			const row = group;
			const label = row.workspaceId === void 0 ? t("group.ungrouped") : row.label;
			const active = group.expanded && group.containsCurrent;
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
			const workspaceMenuItems = [
				...(actions?.initializeGit === void 0 ? [] : [{
					id: "initialize-git",
					label: t("wtp.initGitMenu"),
					icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {})
				}]),
				{
					id: "rename",
				label: t("rename"),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {})
			}, {
				id: "delete",
				label: t("delete.workspace"),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
				danger: true
			}];
			const ownRow = (0, react_jsx_runtime.jsxs)("div", {
				className: clsx(Rows_module_css_default.projectRow, menuOpen && Rows_module_css_default.menuOpen),
				role: "treeitem",
				"aria-expanded": row.expanded,
				onClick: onToggle,
				draggable: drag !== void 0,
				onDragStart: drag === void 0 ? void 0 : (e) => {
					e.dataTransfer.effectAllowed = "move";
					e.dataTransfer.setData("text/plain", row.key);
					drag.start();
				},
				onDragEnd: drag?.end,
				children: [
					(0, react_jsx_runtime.jsx)("span", {
						className: clsx(Rows_module_css_default.slot, Rows_module_css_default.folder, active && Rows_module_css_default.folderActive),
						children: row.expanded ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpen16, {}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, {})
					}),
					(0, react_jsx_runtime.jsx)("span", {
						className: clsx(Rows_module_css_default.slot, Rows_module_css_default.chevron),
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTriangleRightFill14, { className: clsx(Rows_module_css_default.arrow, row.expanded && Rows_module_css_default.arrowOpen) })
					}),
					(0, react_jsx_runtime.jsx)("span", {
						className: Rows_module_css_default.projectText,
						children: (0, react_jsx_runtime.jsx)("span", {
							className: Rows_module_css_default.title,
							children: label
						})
					}),
					(0, react_jsx_runtime.jsxs)("span", {
						className: Rows_module_css_default.rowActions,
						children: [actions !== void 0 && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
							open: menuOpen,
							onClose: () => {
								setMenuOpen(false);
							},
							items: workspaceMenuItems,
							onSelect: (id) => {
								setMenuOpen(false);
								/* worktree-panel: optional non-Git initialization action */
							if (id === "initialize-git") actions.initializeGit?.();
							else if (id === "rename") actions.rename();
							else if (id === "delete") actions.delete();
							},
							portal: true,
							closeOnPointerLeave: true,
							anchor: (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: Rows_module_css_default.iconButton,
								"aria-label": t("actions.workspace.aria", { name: label }),
								onClick: (e) => {
									e.stopPropagation();
									setMenuOpen((v) => !v);
								},
								children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
							})
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: Rows_module_css_default.iconButton,
							"aria-label": t("actions.newSession.aria", { name: label }),
							onClick: (e) => {
								e.stopPropagation();
								onCreate();
							},
							children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {})
						})]
					})
				]
			});
			if (row.createdAt === void 0) return ownRow;
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
				anchor: ownRow,
				content: (0, react_jsx_runtime.jsx)(WorkspaceHoverContent, {
					label: row.label,
					cwd: row.cwd === void 0 ? void 0 : (0, _deepseek_ai_dsh_client_runtime_client.abbreviateHomePath)(row.cwd, home),
					createdAt: row.createdAt,
					t
				}),
				disabled: menuOpen,
				copyText: row.cwd,
				copyLabel: t("copy"),
				copiedLabel: t("hover.copied")
			});
		}
		/* v8 ignore next 3 -- closed-union backstop; only reached if the status is forged */
		function assertNever(value) {
			throw new Error(`unknown pending interaction: ${String(value)}`);
		}
		/**
		* Session status presentation; pending interaction is primary and live activity
		* outranks completion reminders.
		*/
		function sessionStatuses(node, t) {
			const subagents = node.runningSubagentCount === 0 ? void 0 : {
				state: "ongoing",
				label: t(node.runningSubagentCount === 1 ? "status.subagentsRunning.one" : "status.subagentsRunning.other", { n: node.runningSubagentCount })
			};
			let pending;
			switch (node.pendingInteraction) {
				case "approval":
					pending = {
						state: "warning",
						label: t("status.waitingApproval")
					};
					break;
				case "plan-review":
					pending = {
						state: "warning",
						label: t("status.planReview")
					};
					break;
				case "question":
					pending = {
						state: "warning",
						label: t("status.waitingAnswer")
					};
					break;
				case void 0: break;
				/* v8 ignore next -- closed PendingInteractionStatus union */
				default: return assertNever(node.pendingInteraction);
			}
			if (pending !== void 0) return subagents === void 0 ? [pending] : [pending, subagents];
			if (node.running) {
				const primary = {
					state: "ongoing",
					label: t("status.running")
				};
				return subagents === void 0 ? [primary] : [primary, subagents];
			}
			if (subagents !== void 0) return [subagents];
			if (node.completed) return [{
				state: "done",
				label: t("status.completed")
			}];
			return [{
				state: "done",
				label: t("status.idle")
			}];
		}
		/** Primary status dot plus every status's screen-reader label, shared by the search and session rows. */
		function SessionStatusDots({ statuses }) {
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: statuses[0].state }), statuses.map((status) => (0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.visuallyHidden,
				children: status.label
			}, status.label))] });
		}
		/** Hover-card body: full title, relative time, and every relevant live status. */
		function SessionHoverContent({ node, now, t }) {
			const statuses = sessionStatuses(node, t);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: Rows_module_css_default.hoverContent,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: Rows_module_css_default.hoverTitle,
						children: displayTitle(node, t)
					}),
					!node.blank && (0, react_jsx_runtime.jsx)("div", {
						className: Rows_module_css_default.hoverTime,
						children: hoverTimeLabel(node.updatedAt, now, t)
					}),
					statuses.map((status) => (0, react_jsx_runtime.jsxs)("div", {
						className: Rows_module_css_default.hoverStatus,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: status.state }), (0, react_jsx_runtime.jsx)("span", { children: status.label })]
					}, status.label))
				]
			});
		}
		/**
		* One flat search result: title, Workspace context, and optional content
		* excerpt. Search navigation opens the session only; it does not address an
		* event inside the conversation.
		* @param props.result - merged local/content search row.
		* @param props.currentId - selected session id.
		* @param props.onOpen - open the selected session.
		* @param props.t - Workspace-browser translation seat.
		* @returns the result button.
		*/
		function SearchResultItem({ result, currentId, onOpen, t }) {
			const selected = result.id === currentId;
			const statuses = sessionStatuses(result, t);
			const primaryStatus = statuses[0];
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: clsx(Rows_module_css_default.searchResultRow, selected && Rows_module_css_default.selected),
				role: "treeitem",
				"aria-selected": selected,
				onClick: () => {
					onOpen(result.id);
				},
				children: [(0, react_jsx_runtime.jsxs)("span", {
					className: Rows_module_css_default.searchResultHeading,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: Rows_module_css_default.slot,
						children: (primaryStatus.state !== "done" || result.completed) && (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
					}), (0, react_jsx_runtime.jsx)("span", {
						className: Rows_module_css_default.searchResultTitle,
						children: result.title
					})]
				}), (0, react_jsx_runtime.jsxs)("span", {
					className: Rows_module_css_default.searchResultMeta,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: Rows_module_css_default.searchResultWorkspace,
						children: result.workspace
					}), result.snippet !== void 0 && (0, react_jsx_runtime.jsx)("span", {
						className: Rows_module_css_default.searchResultSnippet,
						children: result.snippet
					})]
				})]
			});
		}
		/**
		* One top-level 34px session row: status dot (pending user interaction outranks
		* own or descendant activity), title, relative time, and the row actions menu.
		* @param props.node - derived session node.
		* @param props.currentId - selected session id (row highlight).
		* @param props.now - epoch ms for relative-time formatting.
		* @param props.onOpen - open a session by id.
		* @param props.onRename - open the session rename dialog (id + current title).
		* @param props.onFork - fork a session at its last completed turn.
		* @param props.onArchive - archive a session by id.
		* @param props.drag - optional draggable-row wiring.
		* @param props.flat - omit the empty status slot in the hierarchy-free flat list.
		* @param props.t - the browser root's locale seat.
		* @returns the session row.
		*/
		function SessionNodeItem({ node, currentId, now, onOpen, onRename, onFork, onArchive, drag, flat = false, t }) {
			const row = node;
			const title = displayTitle(node, t);
			const selected = node.id === currentId;
			const statuses = sessionStatuses(node, t);
			const showStatus = statuses[0].state !== "done" || row.completed;
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
			const sessionMenuItems = [
				{
					id: "rename",
					label: t("rename"),
					icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {})
				},
				{
					id: "fork",
					label: t("menu.fork"),
					icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {})
				},
				{
					id: "archive",
					label: t("menu.archiveSession"),
					icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 })
				}
			];
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
				anchor: (0, react_jsx_runtime.jsxs)("div", {
					className: clsx(Rows_module_css_default.sessionRow, selected && Rows_module_css_default.selected, menuOpen && Rows_module_css_default.menuOpen, flat && !showStatus && Rows_module_css_default.flatSessionRowWithoutStatus, drag?.marker === "before" && Rows_module_css_default.dropBefore, drag?.marker === "after" && Rows_module_css_default.dropAfter),
					role: "treeitem",
					"aria-selected": selected,
					onClick: () => {
						onOpen(node.id);
					},
					draggable: drag !== void 0,
					onDragStart: drag === void 0 ? void 0 : (e) => {
						e.dataTransfer.effectAllowed = "move";
						e.dataTransfer.setData("text/plain", node.id);
						drag.start();
					},
					onDragEnd: drag?.end,
					onDragOver: drag === void 0 ? void 0 : (e) => {
						if (!drag.active) return;
						e.preventDefault();
						e.dataTransfer.dropEffect = "move";
						drag.hover(rowHalf(e));
					},
					onDrop: drag === void 0 ? void 0 : (e) => {
						if (!drag.active) return;
						e.preventDefault();
						drag.drop(rowHalf(e));
					},
					children: [
						(!flat || showStatus) && (0, react_jsx_runtime.jsx)("span", {
							className: Rows_module_css_default.slot,
							children: showStatus && (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: Rows_module_css_default.title,
							children: title
						}),
						!row.blank && (0, react_jsx_runtime.jsx)("span", {
							className: Rows_module_css_default.time,
							children: timeLabel(row.updatedAt, now, t)
						}),
						!row.blank && (0, react_jsx_runtime.jsx)("span", {
							className: Rows_module_css_default.rowActions,
							children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
								open: menuOpen,
								onClose: () => {
									setMenuOpen(false);
								},
								items: sessionMenuItems,
								onSelect: (id) => {
									setMenuOpen(false);
									if (id === "rename") onRename(node.id, row.title);
									if (id === "fork") onFork(node.id);
									if (id === "archive") onArchive(node.id);
								},
								portal: true,
								closeOnPointerLeave: true,
								anchor: (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: Rows_module_css_default.iconButton,
									"aria-label": t("actions.session.aria", { name: title }),
									onClick: (e) => {
										e.stopPropagation();
										setMenuOpen((v) => !v);
									},
									children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
								})
							})
						})
					]
				}),
				content: (0, react_jsx_runtime.jsx)(SessionHoverContent, {
					node,
					now,
					t
				}),
				disabled: menuOpen || drag?.active === true,
				copyText: row.blank ? void 0 : row.title,
				copyLabel: t("copy"),
				copiedLabel: t("hover.copied")
			});
		}
		//#endregion
		//#region \0dsh-css:/home/runner/work/deepseek-harness/deepseek-harness/packages/client/ui-workspace/src/client/WorkspacePicker.module.css.mjs
		const css$1 = "._G5b-a_modalAction{min-width:72px}._G5b-a_modalError,._G5b-a_menuStatus{margin-top:8px;font-size:12px;line-height:18px}._G5b-a_modalError{color:var(--dsw-alias-state-error-primary)}._G5b-a_menuStatus{color:var(--dsw-alias-label-secondary)}";
		const tagId$1 = "@deepseek-ai/dsh-client-ui-workspace/WorkspacePicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-workspace";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var WorkspacePicker_module_css_default = {
			"menuStatus": "_G5b-a_menuStatus",
			"modalAction": "_G5b-a_modalAction",
			"modalError": "_G5b-a_modalError"
		};
		//#endregion
		//#region lib/types/client/WorkspacePicker.js
		const ADD_WORKSPACE = "::add-workspace";
		/**
		* Render the pick menu plus the adoption error dialog.
		* @param props - owner-controlled flow props.
		* @returns menu + dialog elements.
		*/
		function WorkspacePickFlow({ t, open, anchorRef, useWorkspaces, createWorkspace, useDirectoryFlow, renderDirectoryFlow, onPick, onClose, addOnly = false, side = "bottom", selectedId }) {
			const workspaceSnapshot = useWorkspaces((state) => state);
			const workspaces = workspaceSnapshot.items;
			const getAnchorRect = (0, react.useCallback)(() => anchorRef?.current?.getBoundingClientRect() ?? null, [anchorRef]);
			const [errorOpen, setErrorOpen] = (0, react.useState)(false);
			const [modalError, setModalError] = (0, react.useState)(null);
			const [flowOpen, setFlowOpen] = (0, react.useState)(false);
			const [pickingFolder, setPickingFolder] = (0, react.useState)(false);
			const flowBusy = flowOpen || pickingFolder;
			const flowAvailable = useDirectoryFlow((occupied) => occupied);
			(0, react.useEffect)(() => {
				if (flowOpen && !flowAvailable) setFlowOpen(false);
			}, [flowOpen, flowAvailable]);
			const addEntries = flowAvailable ? [{
				id: ADD_WORKSPACE,
				label: t("menu.addWorkspace"),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, { size: 16 }),
				disabled: flowBusy
			}] : [];
			const pinAdd = !addOnly && workspaces.length > 0;
			const items = pinAdd ? workspaces.map((workspace) => ({
				id: workspace.workspaceId,
				label: workspace.title,
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, { size: 16 }),
				disabled: flowBusy
			})) : addEntries;
			const menuIsEmpty = items.length === 0;
			const closeModal = () => {
				setErrorOpen(false);
				setModalError(null);
			};
			/** Adopt a picked directory; failures land in the folder-error dialog (Choose again reopens the flow). */
			const adoptDirectory = (path) => createWorkspace({ path }).then((workspace) => {
				setFlowOpen(false);
				onPick(workspace.workspaceId);
			}).catch((reason) => {
				setModalError(reason instanceof Error ? reason.message : String(reason));
				setFlowOpen(false);
				setErrorOpen(true);
			});
			const openDirectoryFlow = (0, react.useCallback)(() => {
				onClose();
				setErrorOpen(false);
				setModalError(null);
				setFlowOpen(true);
			}, [onClose]);
			const listSettled = addOnly || workspaceSnapshot.phase === "ready";
			const addIsTheOnlyEntry = !pinAdd && listSettled && addEntries.length === 1;
			(0, react.useEffect)(() => {
				if (open && addIsTheOnlyEntry && !flowBusy) openDirectoryFlow();
			}, [
				open,
				addIsTheOnlyEntry,
				flowBusy,
				openDirectoryFlow
			]);
			/** Owner side of the flow conversation: adopt keeps the flow open (busy) until the Host answers. */
			const flowOwner = {
				open: flowOpen,
				busy: pickingFolder,
				onPicked: (path) => {
					setPickingFolder(true);
					adoptDirectory(path).finally(() => {
						setPickingFolder(false);
					});
				},
				onCancel: () => {
					setFlowOpen(false);
				},
				onError: (message) => {
					setFlowOpen(false);
					setModalError(message);
					setErrorOpen(true);
				}
			};
			const handleSelect = (id) => {
				if (id === ADD_WORKSPACE) {
					openDirectoryFlow();
					return;
				}
				onPick(id);
			};
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
					open: open && !addIsTheOnlyEntry && !menuIsEmpty,
					anchor: null,
					items,
					...pinAdd ? { footer: addEntries } : {},
					selectedId,
					onSelect: handleSelect,
					onClose,
					side,
					portal: true,
					getAnchorRect
				}),
				open && !addIsTheOnlyEntry && !menuIsEmpty && workspaceSnapshot.phase === "pending" && (0, react_jsx_runtime.jsx)("div", {
					className: WorkspacePicker_module_css_default.menuStatus,
					role: "status",
					children: t("picker.loading")
				}),
				renderDirectoryFlow(flowOwner),
				(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
					open: errorOpen,
					onClose: closeModal,
					closeLabel: t("close"),
					title: t("folderError.title"),
					footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						className: WorkspacePicker_module_css_default.modalAction,
						onClick: closeModal,
						children: t("cancel")
					}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "primary",
						className: WorkspacePicker_module_css_default.modalAction,
						disabled: !flowAvailable,
						onClick: openDirectoryFlow,
						children: t("folderError.retry")
					})] }),
					children: (0, react_jsx_runtime.jsx)("div", {
						className: WorkspacePicker_module_css_default.modalError,
						role: "alert",
						children: modalError
					})
				})
			] });
		}
		/**
		* The conversation empty-state registration: adapts the owner share to the
		* core flow (all state and semantics live in the flow / the owner).
		* @param props - empty-state slot props (owner share + injected creation callback).
		* @returns the flow element.
		*/
		function WorkspacePicker({ open, anchorRef, useWorkspaces, selectedId, onPick, onClose, createWorkspace, useDirectoryFlow, renderSlot, t }) {
			return (0, react_jsx_runtime.jsx)(WorkspacePickFlow, {
				t,
				open,
				anchorRef,
				useWorkspaces,
				createWorkspace,
				useDirectoryFlow,
				renderDirectoryFlow: (owner) => renderSlot("conversation.hero.workspace.directoryFlow", owner),
				selectedId,
				onPick,
				onClose
			});
		}
		//#endregion
		//#region \0dsh-css:/home/runner/work/deepseek-harness/deepseek-harness/packages/client/ui-workspace/src/client/WorkspaceBrowser.module.css.mjs
		const css = ".qDHVXG_root{--dsh-session-list-edge-inset:var(--dsh-sidebar-inline-padding);--dsh-session-list-scrollbar-width:8px;--dsh-session-list-scrollbar-offset:2px;box-sizing:border-box;min-height:0;padding-right:var(--dsh-session-list-edge-inset);flex-direction:column;flex:1;display:flex}.qDHVXG_root.qDHVXG_rail{padding-right:0}.qDHVXG_iconButton{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_sectionHeader{box-sizing:border-box;height:36px;color:var(--dsw-alias-label-tertiary);border-radius:12px;flex:none;justify-content:flex-end;align-items:center;gap:4px;margin-bottom:4px;padding-left:4px;display:flex;overflow:hidden}.qDHVXG_root:not(.qDHVXG_rail) .qDHVXG_sectionHeader{margin-top:2px;margin-right:-4px}.qDHVXG_sectionLabel{white-space:nowrap;opacity:1;visibility:visible;min-width:0;max-width:45%;transition:max-width .18s var(--ds-ease-in-out), margin-right .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;line-height:20px;overflow:hidden}.qDHVXG_sectionLabelHidden{opacity:0;visibility:hidden;max-width:0;margin-right:-4px;transition-delay:0s,0s,0s,0s,.18s;transform:translate(-4px)}.qDHVXG_searchSlot{box-sizing:border-box;min-width:0;max-width:28px;transition:max-width .18s var(--ds-ease-in-out), padding-left .18s var(--ds-ease-in-out);flex:1;align-items:center;margin-left:auto;padding-left:0;display:flex}.qDHVXG_searchSlotExpanded{max-width:100%;padding-left:0}.qDHVXG_headerActions{opacity:1;visibility:visible;max-width:60px;transition:max-width .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;align-items:center;gap:4px;display:flex;overflow:hidden}.qDHVXG_headerActionsHidden{opacity:0;visibility:hidden;pointer-events:none;max-width:0;transition-delay:0s,0s,0s,.18s;transform:translate(4px)}.qDHVXG_search{box-sizing:border-box;cursor:text;width:100%;height:28px;color:var(--dsw-alias-label-secondary);transition:width .18s var(--ds-ease-in-out), padding .18s var(--ds-ease-in-out), border-color .18s var(--ds-ease-in-out), background-color .18s var(--ds-ease-in-out);background:0 0;border:none;border-radius:50%;flex:none;align-items:center;gap:0;margin:0;padding:0;display:flex;overflow:hidden}.qDHVXG_searchExpanded{border:1px solid var(--dsw-alias-border-l2);width:calc(100% + 4px);height:30px;color:var(--dsw-alias-label-caption);background:0 0;border-radius:10px;margin-inline:-2px;padding:0 4px 0 0}.qDHVXG_searchButton{cursor:pointer;width:28px;height:28px;color:inherit;background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_searchExpanded .qDHVXG_searchButton{width:28px;height:30px}.qDHVXG_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_searchExpanded .qDHVXG_searchButton:hover{background:0 0}.qDHVXG_searchInput{opacity:0;pointer-events:none;width:0;min-width:0;color:var(--dsw-alias-label-primary);transition:opacity .12s var(--ds-ease-in-out);background:0 0;border:none;outline:none;flex:1;font-size:13px;line-height:18px}.qDHVXG_searchExpanded .qDHVXG_searchInput{opacity:1;pointer-events:auto;margin-left:-2px}.qDHVXG_searchInput::placeholder{color:var(--dsw-alias-label-tertiary)}.qDHVXG_clearButton{cursor:pointer;width:24px;height:24px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_clearButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_rail .qDHVXG_sectionHeader{justify-content:flex-start;gap:0;margin-bottom:12px;padding-left:0}.qDHVXG_rail .qDHVXG_headerActions{max-width:none}.qDHVXG_rail .qDHVXG_iconButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.qDHVXG_rail .qDHVXG_search{background:0 0;border-color:#0000;gap:0;width:36px;height:36px;margin:0 0 12px;padding:0}.qDHVXG_rail .qDHVXG_searchButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.qDHVXG_rail .qDHVXG_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_listArea{min-height:0;margin-left:-4px;margin-right:calc(-1 * var(--dsh-session-list-edge-inset));flex-direction:column;flex:1;padding-left:4px;display:flex;overflow:visible}.qDHVXG_rail .qDHVXG_listArea{margin-left:0;margin-right:0;padding-left:0}.qDHVXG_treeBody{flex-direction:column;flex:1;min-height:0;display:flex;position:relative}.qDHVXG_fade{left:0;right:var(--dsh-session-list-edge-inset);background:linear-gradient(to bottom, transparent, var(--dsw-specific-sidebar-fill));pointer-events:none;height:24px;position:absolute;bottom:0}.qDHVXG_wide{animation:qDHVXG_wide-in .2s var(--ds-ease-in-out)}@keyframes qDHVXG_wide-in{0%{opacity:0}}.qDHVXG_list{min-height:0;margin-left:-4px;margin-right:var(--dsh-session-list-scrollbar-offset);padding-left:4px;padding-right:calc(var(--dsh-session-list-edge-inset) - var(--dsh-session-list-scrollbar-width) - var(--dsh-session-list-scrollbar-offset));scrollbar-gutter:stable;flex:1;padding-bottom:16px;overflow-y:auto}.qDHVXG_flatList>*+*,.qDHVXG_searchTree>[role=treeitem]+[role=treeitem],.qDHVXG_groupSection>*+*{margin-top:2px}.qDHVXG_searchStatus,.qDHVXG_searchWarning{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:12px;line-height:18px}.qDHVXG_searchWarning{color:var(--dsw-alias-label-secondary)}.qDHVXG_groupSection{position:relative}.qDHVXG_groupSection+.qDHVXG_groupSection{margin-top:4px}.qDHVXG_listTopDropIndicator,.qDHVXG_workspaceDropBefore:before,.qDHVXG_workspaceDropAfter:after{content:\"\";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:0}.qDHVXG_listTopDropIndicator{top:-8px;left:0;right:var(--dsh-session-list-edge-inset)}.qDHVXG_listTopDropActive>.qDHVXG_workspaceDropBefore:first-child:before{display:none}.qDHVXG_workspaceDropBefore:before{top:-8px}.qDHVXG_workspaceDropAfter:after{bottom:-8px}.qDHVXG_sessionOverflowButton{cursor:pointer;text-align:left;width:100%;height:28px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:8px;padding:0 12px 0 28px;font-size:12px}.qDHVXG_groupSection>.qDHVXG_sessionOverflowButton{margin-top:0}.qDHVXG_sessionOverflowButton:hover{color:var(--dsw-alias-label-secondary);background:0 0}.qDHVXG_empty{color:var(--dsw-alias-label-tertiary);padding:16px 12px;font-size:13px}.qDHVXG_renameInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;height:44px;color:var(--dsw-alias-label-primary);background:0 0;border-radius:22px;outline:none;padding:7px 14px;font-size:14px;font-weight:400;line-height:22px}.qDHVXG_renameInput:disabled{color:var(--dsw-alias-label-dimmed)}.qDHVXG_renameError{color:var(--dsw-alias-state-error-primary);margin-top:8px;font-size:12px;line-height:18px}.qDHVXG_deleteAction:not(:disabled){color:var(--dsw-alias-state-error-primary)}.qDHVXG_deleteStatus{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}@media (prefers-reduced-motion:reduce){.qDHVXG_wide{animation:none}.qDHVXG_search,.qDHVXG_sectionLabel,.qDHVXG_searchSlot,.qDHVXG_searchInput,.qDHVXG_headerActions{transition:none}}";
		const tagId = "@deepseek-ai/dsh-client-ui-workspace/WorkspaceBrowser.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-workspace";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var WorkspaceBrowser_module_css_default = {
			"clearButton": "qDHVXG_clearButton",
			"deleteAction": "qDHVXG_deleteAction",
			"deleteStatus": "qDHVXG_deleteStatus",
			"empty": "qDHVXG_empty",
			"fade": "qDHVXG_fade",
			"flatList": "qDHVXG_flatList",
			"groupSection": "qDHVXG_groupSection",
			"headerActions": "qDHVXG_headerActions",
			"headerActionsHidden": "qDHVXG_headerActionsHidden",
			"iconButton": "qDHVXG_iconButton",
			"list": "qDHVXG_list",
			"listArea": "qDHVXG_listArea",
			"listTopDropActive": "qDHVXG_listTopDropActive",
			"listTopDropIndicator": "qDHVXG_listTopDropIndicator",
			"rail": "qDHVXG_rail",
			"renameError": "qDHVXG_renameError",
			"renameInput": "qDHVXG_renameInput",
			"root": "qDHVXG_root",
			"search": "qDHVXG_search",
			"searchButton": "qDHVXG_searchButton",
			"searchExpanded": "qDHVXG_searchExpanded",
			"searchInput": "qDHVXG_searchInput",
			"searchSlot": "qDHVXG_searchSlot",
			"searchSlotExpanded": "qDHVXG_searchSlotExpanded",
			"searchStatus": "qDHVXG_searchStatus",
			"searchTree": "qDHVXG_searchTree",
			"searchWarning": "qDHVXG_searchWarning",
			"sectionHeader": "qDHVXG_sectionHeader",
			"sectionLabel": "qDHVXG_sectionLabel",
			"sectionLabelHidden": "qDHVXG_sectionLabelHidden",
			"sessionOverflowButton": "qDHVXG_sessionOverflowButton",
			"treeBody": "qDHVXG_treeBody",
			"wide": "qDHVXG_wide",
			"wide-in": "qDHVXG_wide-in",
			"workspaceDropAfter": "qDHVXG_workspaceDropAfter",
			"workspaceDropBefore": "qDHVXG_workspaceDropBefore"
		};
		//#endregion
		//#region lib/types/client/WorkspaceBrowser.js
		/**
		* The workspace/session browsing region filling the sidebar shell's
		* `sidebar.workspaces` hole: section header (title + view options + add
		* workspace), search, the grouped tree or flat list, and the workspace
		* dialogs. Wide state renders the full browser; rail state renders the two
		* region icons (search / add workspace) as 36px controls on the shell's shared
		* rail entry path, each requesting expansion through the owner share. Adding
		* is the header button's one action, so it raises the directory flow with no
		* menu in between; the flow and its error dialog live in WorkspacePicker
		* (same package — direct composition, no slot between them).
		*/
		/**
		* Column slide length (--ds-transition-duration-slow): rail-search focus waits it out —
		* focus() forces a synchronous layout and would jank the slide.
		*/
		const EXPAND_SLIDE_MS = 300;
		/** Pause between the latest keystroke and a Host content-search request. */
		const SEARCH_DEBOUNCE_MS = 250;
		/** `session.search` wire bound, measured in JavaScript UTF-16 code units. */
		const SEARCH_QUERY_MAX_CODE_UNITS = 500;
		/** Session rows visible per Workspace before the local overflow control. */
		const COLLAPSED_SESSION_LIMIT = 5;
		/** Keep controlled input and RPC payload inside the session.search wire contract. */
		function sanitizeSearchQuery(value) {
			const withoutNul = value.replaceAll("\0", "");
			if (withoutNul.length <= SEARCH_QUERY_MAX_CODE_UNITS) return withoutNul;
			let end = SEARCH_QUERY_MAX_CODE_UNITS;
			const last = withoutNul.charCodeAt(end - 1);
			const next = withoutNul.charCodeAt(end);
			if (last >= 55296 && last <= 56319 && next >= 56320 && next <= 57343) end--;
			return withoutNul.slice(0, end);
		}
		/** Immutable membership toggle for the local expand-all array. */
		function toggled(list, key) {
			return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
		}
		/**
		* Accept the native drag at document level while a row drag is active: row
		* hover still owns the insertion marker, and releasing outside the list must
		* not be rendered as a rejected drop before dragend commits that last marker.
		*/
		function useNativeDragAcceptance(active) {
			(0, react.useEffect)(() => {
				if (!active) return;
				const acceptDrag = (event) => {
					event.preventDefault();
					if (event.dataTransfer !== null) event.dataTransfer.dropEffect = "move";
				};
				const acceptDrop = (event) => {
					event.preventDefault();
				};
				document.addEventListener("dragover", acceptDrag);
				document.addEventListener("drop", acceptDrop);
				return () => {
					document.removeEventListener("dragover", acceptDrag);
					document.removeEventListener("drop", acceptDrop);
				};
			}, [active]);
		}
		/** Reconcile a stored view order with the Workspace's current session account. */
		function reconciledSessionOrder(sessionIds, stored) {
			if (stored === void 0) return [...sessionIds];
			const byId = new Map(sessionIds.map((id) => [id, id]));
			const ordered = [];
			const included = /* @__PURE__ */ new Set();
			for (const key of stored) {
				const id = byId.get(key);
				if (id === void 0 || included.has(key)) continue;
				ordered.push(id);
				included.add(key);
			}
			for (const id of sessionIds) {
				if (included.has(id)) continue;
				ordered.push(id);
			}
			return ordered;
		}
		/** Newest update first with stable Session identity as the tie-break. */
		function compareSessionRecency(a, b, byId) {
			const aUpdatedAt = byId[a]?.updatedAt ?? Number.NEGATIVE_INFINITY;
			const bUpdatedAt = byId[b]?.updatedAt ?? Number.NEGATIVE_INFINITY;
			if (aUpdatedAt !== bUpdatedAt) return bUpdatedAt - aUpdatedAt;
			return a < b ? -1 : 1;
		}
		/** Reconcile one editable order account and apply its activity-promotion policy. */
		function nextSessionOrderAccount({ sessionIds, previousOrder, previousUpdatedAt, list, orderBy, sortByRecency }) {
			let order = reconciledSessionOrder(sessionIds, previousOrder);
			if (sortByRecency) order.sort((a, b) => compareSessionRecency(a, b, list.byId));
			else if (orderBy === "updated") {
				const promoted = sessionIds.filter((id) => {
					const session = list.byId[id];
					return session !== void 0 && (previousUpdatedAt[id] === void 0 || session.updatedAt > previousUpdatedAt[id]);
				}).sort((a, b) => compareSessionRecency(a, b, list.byId));
				if (promoted.length > 0) {
					const promotedIds = new Set(promoted);
					order = [...promoted, ...order.filter((id) => !promotedIds.has(id))];
				}
			}
			const updatedAt = {};
			for (const id of sessionIds) {
				const session = list.byId[id];
				if (session !== void 0) updatedAt[id] = session.updatedAt;
			}
			const orderChanged = previousOrder === void 0 || order.length !== previousOrder.length || order.some((id, index) => id !== previousOrder[index]);
			const timestampsChanged = Object.keys(updatedAt).length !== Object.keys(previousUpdatedAt).length || Object.entries(updatedAt).some(([id, timestamp]) => previousUpdatedAt[id] !== timestamp);
			return {
				order,
				updatedAt,
				changed: orderChanged || timestampsChanged
			};
		}
		/** Grouping and ordering menu; own open state so it resets with the wide chrome. */
		function ViewOptionsMenu({ groupBy, orderBy, onGroupPick, onOrderPick, t }) {
			const [open, setOpen] = (0, react.useState)(false);
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				onClose: () => {
					setOpen(false);
				},
				items: [
					{
						type: "label",
						id: "group-by",
						text: t("groupBy.label")
					},
					{
						id: "workspace",
						label: t("groupBy.workspace")
					},
					{
						id: "flat",
						label: t("groupBy.flat")
					},
					{
						type: "separator",
						id: "order-by-separator"
					},
					{
						type: "label",
						id: "order-by",
						text: t("orderBy.label")
					},
					{
						id: "manual",
						label: t("orderBy.manual")
					},
					{
						id: "updated",
						label: t("orderBy.updated")
					}
				],
				selectedIds: [groupBy, orderBy],
				onSelect: (id) => {
					if (id === "workspace" || id === "flat") onGroupPick(id);
					else if (id === "manual" || id === "updated") onOrderPick(id);
					setOpen(false);
				},
				align: "end",
				dense: true,
				portal: true,
				anchor: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
					label: t("viewOptions.label"),
					side: "bottom",
					delayMs: 500,
					children: (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: clsx(WorkspaceBrowser_module_css_default.iconButton, WorkspaceBrowser_module_css_default.wide),
						"aria-label": t("viewOptions.label"),
						onClick: () => {
							setOpen((v) => !v);
						},
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPersonalizationOutline16, {})
					})
				})
			});
		}
		/** Resolve an insertion side from the full rendered workspace group. */
		function workspaceGroupHalf(e) {
			const rect = e.currentTarget.getBoundingClientRect();
			return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
		}
		/** The scrolling session tree; unmounting drops the sessions subscription and expand-all state. */

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
			].join("\n");
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
		function SessionTree({ useSessions, startSession, open, forkSession, workspaces, archivedSessionIds, onRenameRequest, onDeleteRequest, onSessionRename, onSessionArchive, insertWorkspaceBefore, insertSessionBefore, orderBy, groupExpansion, setGroupExpanded, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, home, t }) {
			const list = useSessions((s) => s);
			const current = list.current;
			const [expandedSessionGroups, setExpandedSessionGroups] = (0, react.useState)([]);
			const [drag, setDrag] = (0, react.useState)(null);
			const sessionDropCommitted = (0, react.useRef)(false);
			const [workspaceDrag, setWorkspaceDrag] = (0, react.useState)(null);
			const workspaceDropCommitted = (0, react.useRef)(false);
			const previousOrderBy = (0, react.useRef)(orderBy);
			useNativeDragAcceptance(drag !== null || workspaceDrag !== null);
			const wtp = __wtpUseTopology();
			const [wtpExpanded, setWtpExpanded] = (0, react.useState)({});
			// 官方添加/删除工作区后刷新 worktree 拓扑（新注册的 git 仓库自动出现）。
			(0, react.useEffect)(() => { wtp.reloadDebounced(); }, [workspaces.length]);
			const currentGroup = current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(current))?.workspaceId ?? "";
			(0, react.useEffect)(() => {
				if (current === void 0 || currentGroup === void 0 || Object.hasOwn(groupExpansion, currentGroup)) return;
				setGroupExpanded(currentGroup, true);
			}, [
				current,
				currentGroup,
				setGroupExpanded,
				groupExpansion
			]);
			const expandedGroups = (0, react.useMemo)(() => Object.entries(groupExpansion).filter(([, expanded]) => expanded).map(([key]) => key), [groupExpansion]);
			const ungroupedSessionIds = (0, react.useMemo)(() => {
				const accounted = new Set(workspaces.flatMap((workspace) => workspace.sessionIds));
				return list.ids.filter((id) => list.byId[id] !== void 0 && !accounted.has(id));
			}, [list, workspaces]);
			(0, react.useEffect)(() => {
				if (list.phase !== "ready") return;
				const switchedToUpdated = previousOrderBy.current !== "updated" && orderBy === "updated";
				previousOrderBy.current = orderBy;
				const accounts = [...workspaces.map((workspace) => ({
					key: workspace.workspaceId,
					sessionIds: workspace.sessionIds.filter((id) => list.byId[id] !== void 0)
				})), {
					key: "",
					sessionIds: ungroupedSessionIds
				}];
				for (const { key, sessionIds } of accounts) {
					const previousOrder = sessionOrderByAccount[key];
					const next = nextSessionOrderAccount({
						sessionIds,
						previousOrder,
						previousUpdatedAt: sessionUpdatedAtByAccount[key] ?? {},
						list,
						orderBy,
						sortByRecency: orderBy === "updated" && (previousOrder === void 0 || switchedToUpdated)
					});
					if (next.changed) syncSessionOrderAccount(key, next.order.map((id) => id), next.updatedAt);
				}
			}, [
				list,
				orderBy,
				sessionOrderByAccount,
				sessionUpdatedAtByAccount,
				syncSessionOrderAccount,
				ungroupedSessionIds,
				workspaces
			]);
			const orderedWorkspaces = (0, react.useMemo)(() => {
				return workspaces.map((workspace) => {
					const stored = sessionOrderByAccount[workspace.workspaceId];
					const sessionIds = reconciledSessionOrder(workspace.sessionIds, stored);
					return {
						...workspace,
						sessionIds
					};
				});
			}, [sessionOrderByAccount, workspaces]);
			const orderedUngroupedSessionIds = (0, react.useMemo)(() => reconciledSessionOrder(ungroupedSessionIds, sessionOrderByAccount[""]), [sessionOrderByAccount, ungroupedSessionIds]);
			const groups = (0, react.useMemo)(() => deriveGroups(list, orderedWorkspaces, archivedSessionIds, {
				expandedGroups,
				...sessionOrderByAccount[""] === void 0 ? {} : { ungroupedOrder: sessionOrderByAccount[""] }
			}), [
				list,
				orderedWorkspaces,
				archivedSessionIds,
				expandedGroups,
				sessionOrderByAccount
			]);
			const now = Date.now();
			const commitSessionDrag = (activeDrag, over) => {
				if (sessionDropCommitted.current) return;
				sessionDropCommitted.current = true;
				setDrag(null);
				const group = groups.find((candidate) => candidate.key === activeDrag.accountKey);
				if (group === void 0) return;
				const targetIndex = group.sessions.findIndex((session) => session.id === over.id);
				if (targetIndex === -1) return;
				const anchor = over.half === "before" ? over.id : group.sessions[targetIndex + 1]?.id;
				if (anchor === activeDrag.sessionId) return;
				const sourceIndex = group.sessions.findIndex((session) => session.id === activeDrag.sessionId);
				const anchorIndex = anchor === void 0 ? group.sessions.length : group.sessions.findIndex((session) => session.id === anchor);
				if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
				const accountSessionIds = activeDrag.accountKey === "" ? orderedUngroupedSessionIds : orderedWorkspaces.find((workspace) => workspace.workspaceId === activeDrag.accountKey)?.sessionIds;
				if (accountSessionIds === void 0) return;
				const nextOrder = accountSessionIds.filter((id) => id !== activeDrag.sessionId);
				const insertAt = anchor === void 0 ? nextOrder.length : nextOrder.indexOf(anchor);
				nextOrder.splice(insertAt === -1 ? nextOrder.length : insertAt, 0, activeDrag.sessionId);
				setSessionOrder(activeDrag.accountKey, nextOrder.map((id) => id));
				if (orderBy === "updated" || activeDrag.accountKey === "") return;
				insertSessionBefore(activeDrag.accountKey, activeDrag.sessionId, anchor).catch((reason) => {
					console.warn("session reorder rejected:", reason);
				});
			};
			const commitWorkspaceDrag = (activeDrag, over) => {
				if (workspaceDropCommitted.current) return;
				workspaceDropCommitted.current = true;
				setWorkspaceDrag(null);
				const rowIndex = workspaces.findIndex((workspace) => workspace.workspaceId === over.id);
				if (rowIndex === -1) return;
				const anchor = over.half === "before" ? over.id : workspaces[rowIndex + 1]?.workspaceId;
				if (anchor === activeDrag.workspaceId) return;
				const sourceIndex = workspaces.findIndex((workspace) => workspace.workspaceId === activeDrag.workspaceId);
				const anchorIndex = anchor === void 0 ? workspaces.length : workspaces.findIndex((workspace) => workspace.workspaceId === anchor);
				if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
				insertWorkspaceBefore(activeDrag.workspaceId, anchor).catch((reason) => {
					console.warn("workspace reorder rejected:", reason);
				});
			};
			const wtpRepoByWorkspace = new Map();
			for (const repo of wtp.tree.repos) if (repo.workspaceId != null) wtpRepoByWorkspace.set(repo.workspaceId, repo);
			const wtpHidden = new Set();
			for (const repo of wtp.tree.repos) {
				if (repo.workspaceId == null) continue;
				for (const wt of (repo.worktrees || [])) if (wt.workspaceId != null) wtpHidden.add(wt.workspaceId);
			}
			const wtpWorkspaceById = new Map(workspaces.map((workspace) => [workspace.workspaceId, workspace]));
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
										// 各 linked worktree：合并官方 workspace sessionIds 与 /tree 目录快照，
										// 避免新建或 cold session 因刷新时序而暂时消失。
										repo !== void 0 && group.expanded && (repo.worktrees || []).map((wt) => {
											const wtKey = repo.name + "/" + wt.name;
											const expandedWt = wtpExpanded[wtKey] !== false;
											// 空白「新会话」行与已归档会话都不展示（正在对话的除外）。
											const workspaceSessionIds = wt.workspaceId == null
														? []
														: (wtpWorkspaceById.get(wt.workspaceId)?.sessionIds || []);
													const wtSessionIds = [...new Set([
														...workspaceSessionIds,
														...(wt.sessions || []).map((session) => session.id)
													])];
													const wtNodes = wtSessionIds
														.map((id) => list.byId[id])
														.filter((n) => n !== void 0 && n.origin !== "subagent" && !(n.blank === true && n.id !== current) && !archivedSessionIds.includes(n.id))
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

		/** The flat "In one list" body: every session is one draggable top-level row. */
		function FlatList({ useSessions, open, forkSession, onSessionRename, onSessionArchive, archivedSessionIds, orderBy, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t }) {
			const list = useSessions((s) => s);
			const baseRows = (0, react.useMemo)(() => deriveFlat(list, archivedSessionIds), [list, archivedSessionIds]);
			const sessionIds = (0, react.useMemo)(() => baseRows.map((row) => row.id), [baseRows]);
			const previousOrderBy = (0, react.useRef)(orderBy);
			(0, react.useEffect)(() => {
				if (list.phase !== "ready") return;
				const previousOrder = sessionOrderByAccount[FLAT_SESSION_ORDER_KEY];
				const previousUpdatedAt = sessionUpdatedAtByAccount["__flat_session_order__"] ?? {};
				const switchedToUpdated = previousOrderBy.current !== "updated" && orderBy === "updated";
				previousOrderBy.current = orderBy;
				const next = nextSessionOrderAccount({
					sessionIds,
					previousOrder,
					previousUpdatedAt,
					list,
					orderBy,
					sortByRecency: orderBy === "updated" && (previousOrder === void 0 || switchedToUpdated)
				});
				if (next.changed) syncSessionOrderAccount(FLAT_SESSION_ORDER_KEY, next.order.map((id) => id), next.updatedAt);
			}, [
				list,
				orderBy,
				sessionOrderByAccount,
				sessionUpdatedAtByAccount,
				sessionIds,
				syncSessionOrderAccount
			]);
			const rows = (0, react.useMemo)(() => {
				const byId = new Map(baseRows.map((row) => [row.id, row]));
				return reconciledSessionOrder(sessionIds, sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).flatMap((id) => {
					const row = byId.get(id);
					return row === void 0 ? [] : [row];
				});
			}, [
				baseRows,
				sessionOrderByAccount,
				sessionIds
			]);
			const [drag, setDrag] = (0, react.useState)(null);
			const dropCommitted = (0, react.useRef)(false);
			useNativeDragAcceptance(drag !== null);
			const commitDrag = (activeDrag, over) => {
				if (dropCommitted.current) return;
				dropCommitted.current = true;
				setDrag(null);
				const targetIndex = rows.findIndex((row) => row.id === over.id);
				if (targetIndex === -1) return;
				const anchor = over.half === "before" ? over.id : rows[targetIndex + 1]?.id;
				if (anchor === activeDrag.sessionId) return;
				const sourceIndex = rows.findIndex((row) => row.id === activeDrag.sessionId);
				const anchorIndex = anchor === void 0 ? rows.length : rows.findIndex((row) => row.id === anchor);
				if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
				const nextOrder = rows.map((row) => row.id).filter((id) => id !== activeDrag.sessionId);
				const insertAt = anchor === void 0 ? nextOrder.length : nextOrder.indexOf(anchor);
				nextOrder.splice(insertAt === -1 ? nextOrder.length : insertAt, 0, activeDrag.sessionId);
				setSessionOrder(FLAT_SESSION_ORDER_KEY, nextOrder.map((id) => id));
			};
			const now = Date.now();
			return (0, react_jsx_runtime.jsxs)("div", {
				className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: clsx(WorkspaceBrowser_module_css_default.list, WorkspaceBrowser_module_css_default.flatList),
					role: "tree",
					"aria-label": t("section.sessions"),
					children: [rows.length === 0 && (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceBrowser_module_css_default.empty,
						children: t("empty.none")
					}), rows.map((node) => {
						const active = drag !== null;
						return (0, react_jsx_runtime.jsx)(SessionNodeItem, {
							node,
							currentId: list.current,
							now,
							onOpen: open,
							onRename: onSessionRename,
							onFork: forkSession,
							onArchive: onSessionArchive,
							flat: true,
							drag: {
								start: () => {
									dropCommitted.current = false;
									setDrag({
										accountKey: FLAT_SESSION_ORDER_KEY,
										sessionId: node.id,
										over: null
									});
								},
								active,
								marker: active && drag.over?.id === node.id ? drag.over.half : null,
								hover: (half) => {
									setDrag((current) => current === null ? current : {
										...current,
										over: {
											id: node.id,
											half
										}
									});
								},
								drop: (half) => {
									if (drag !== null) commitDrag(drag, {
										id: node.id,
										half
									});
								},
								end: () => {
									if (drag?.over !== null && drag?.over !== void 0) commitDrag(drag, drag.over);
									else setDrag(null);
									dropCommitted.current = false;
								}
							},
							t
						}, node.id);
					})]
				}), (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })]
			});
		}
		/** Flat search body: local metadata matches plus the current Host result page. */
		function SearchResults({ useSessions, open, workspaces, archivedSessionIds, query, remote, resultLimit, t }) {
			const list = useSessions((s) => s);
			const currentRemote = remote.query === query ? remote : {
				query,
				status: "loading",
				items: [],
				hasMore: false
			};
			const results = (0, react.useMemo)(() => deriveSearchResults(list, workspaces, query, archivedSessionIds, currentRemote, resultLimit), [
				list,
				workspaces,
				query,
				archivedSessionIds,
				currentRemote,
				resultLimit
			]);
			const pending = currentRemote.status === "loading";
			const failed = currentRemote.status === "error";
			return (0, react_jsx_runtime.jsxs)("div", {
				className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: WorkspaceBrowser_module_css_default.list,
					children: [
						(0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceBrowser_module_css_default.searchTree,
							role: "tree",
							"aria-label": t("search.results.aria"),
							children: results.items.map((result) => (0, react_jsx_runtime.jsx)(SearchResultItem, {
								result,
								currentId: list.current,
								onOpen: open,
								t
							}, result.id))
						}),
						pending && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceBrowser_module_css_default.searchStatus,
							role: "status",
							children: t("search.pending")
						}),
						failed && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceBrowser_module_css_default.searchWarning,
							role: "status",
							children: t("search.unavailable")
						}),
						!pending && results.items.length === 0 && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceBrowser_module_css_default.empty,
							children: t("search.noMatches")
						}),
						results.hasMore && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceBrowser_module_css_default.searchStatus,
							children: t("search.hasMore", { n: resultLimit })
						})
					]
				}), (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })]
			});
		}
		/**
		* Render the browsing region.
		* @param props - composed slot props (shell owner share + store + injected actions).
		* @returns the region element tree.
		*/
		function WorkspaceBrowser({ wide, expandSidebar, useSessions, useWorkspaces, useStore, actions, startSession, open, renameSession, forkSession, renameWorkspace, deleteWorkspace, insertWorkspaceBefore, archiveSession, insertSessionBefore, createWorkspace, searchSessions, searchResultLimit, useDirectoryFlow, useHostDescription, renderSlot, t }) {
			const home = useHostDescription((description) => description?.home);
			const workspaces = useWorkspaces((state) => state.items);
			const workspacePhase = useWorkspaces((state) => state.phase);
			const archivedSessionIds = useWorkspaces((state) => state.archivedSessionIds);
			const directoryFlowAvailable = useDirectoryFlow((occupied) => occupied);
			const groupBy = useStore((s) => s.groupBy);
			const orderBy = useStore((s) => s.orderBy);
			const groupExpansion = useStore((s) => s.groupExpansion);
			const sessionOrderByAccount = useStore((s) => s.sessionOrderByAccount);
			const sessionUpdatedAtByAccount = useStore((s) => s.sessionUpdatedAtByAccount);
			const currentBlankSessionId = useSessions((state) => {
				const current = state.current;
				return current !== void 0 && state.byId[current]?.blank === true ? current : void 0;
			});
			const currentBlankAccount = currentBlankSessionId === void 0 ? void 0 : workspaces.find((workspace) => workspace.sessionIds.includes(currentBlankSessionId))?.workspaceId ?? "";
			const promotedBlank = (0, react.useRef)(void 0);
			(0, react.useEffect)(() => {
				if (currentBlankSessionId === void 0 || currentBlankAccount === void 0) {
					promotedBlank.current = void 0;
					return;
				}
				if (promotedBlank.current?.sessionId === currentBlankSessionId && promotedBlank.current.accountKey === currentBlankAccount) return;
				promotedBlank.current = {
					sessionId: currentBlankSessionId,
					accountKey: currentBlankAccount
				};
				for (const accountKey of new Set([currentBlankAccount, FLAT_SESSION_ORDER_KEY])) {
					const previous = sessionOrderByAccount[accountKey] ?? [];
					actions.setSessionOrder(accountKey, [currentBlankSessionId, ...previous.filter((id) => id !== currentBlankSessionId)]);
				}
			}, [
				actions.setSessionOrder,
				currentBlankAccount,
				currentBlankSessionId,
				sessionOrderByAccount
			]);
			(0, react.useEffect)(() => {
				if (workspacePhase !== "ready") return;
				actions.retainAccountKeys([
					"",
					FLAT_SESSION_ORDER_KEY,
					...workspaces.map((workspace) => workspace.workspaceId)
				]);
			}, [
				actions.retainAccountKeys,
				workspacePhase,
				workspaces
			]);
			const [query, setQuery] = (0, react.useState)("");
			const [searchExpanded, setSearchExpanded] = (0, react.useState)(false);
			const normalizedQuery = sanitizeSearchQuery(query).trim();
			const [remoteSearch, setRemoteSearch] = (0, react.useState)({
				query: "",
				status: "idle",
				items: [],
				hasMore: false
			});
			const searchRoot = (0, react.useRef)(null);
			const searchInput = (0, react.useRef)(null);
			const [wsPickerOpen, setWsPickerOpen] = (0, react.useState)(false);
			const wsPlusRef = (0, react.useRef)(null);
			const composingRef = (0, react.useRef)(false);
			const [searchOnExpand, setSearchOnExpand] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (wide && searchOnExpand) {
					const timer = window.setTimeout(() => {
						searchInput.current?.focus({ preventScroll: true });
						setSearchOnExpand(false);
					}, EXPAND_SLIDE_MS);
					return () => {
						window.clearTimeout(timer);
					};
				}
			}, [wide, searchOnExpand]);
			(0, react.useEffect)(() => {
				if (!wide || !searchExpanded || searchOnExpand) return;
				searchInput.current?.focus({ preventScroll: true });
			}, [
				wide,
				searchExpanded,
				searchOnExpand
			]);
			(0, react.useEffect)(() => {
				if (!wide || !searchExpanded || searchOnExpand) return;
				const onClick = (event) => {
					if (!(event.target instanceof Node) || searchRoot.current?.contains(event.target) === true) return;
					searchInput.current?.blur();
					if (normalizedQuery !== "") return;
					setSearchExpanded(false);
				};
				document.addEventListener("click", onClick);
				return () => {
					document.removeEventListener("click", onClick);
				};
			}, [
				normalizedQuery,
				wide,
				searchExpanded,
				searchOnExpand
			]);
			(0, react.useEffect)(() => {
				if (normalizedQuery === "") {
					setRemoteSearch({
						query: "",
						status: "idle",
						items: [],
						hasMore: false
					});
					return;
				}
				const controller = new AbortController();
				setRemoteSearch({
					query: normalizedQuery,
					status: "loading",
					items: [],
					hasMore: false
				});
				const timer = window.setTimeout(() => {
					searchSessions(normalizedQuery, controller.signal).then((result) => {
						if (controller.signal.aborted) return;
						setRemoteSearch({
							query: normalizedQuery,
							status: "ready",
							items: result.items,
							hasMore: result.hasMore
						});
					}).catch(() => {
						if (controller.signal.aborted) return;
						setRemoteSearch({
							query: normalizedQuery,
							status: "error",
							items: [],
							hasMore: false
						});
					});
				}, SEARCH_DEBOUNCE_MS);
				return () => {
					window.clearTimeout(timer);
					controller.abort();
				};
			}, [normalizedQuery, searchSessions]);
			const [renameTarget, setRenameTarget] = (0, react.useState)(null);
			const [renameDraft, setRenameDraft] = (0, react.useState)("");
			const [renaming, setRenaming] = (0, react.useState)(false);
			const [renameError, setRenameError] = (0, react.useState)(null);
			const renameTrimmed = renameDraft.trim();
			const renameDuplicate = renameTarget !== null && renameTrimmed !== "" && renameTrimmed !== renameTarget.currentTitle && workspaces.some((w) => w.title === renameTrimmed);
			const renameBlocked = renaming || renameTrimmed === "" || renameTarget === null || renameTrimmed === renameTarget.currentTitle || renameDuplicate;
			const closeRename = () => {
				if (renaming) return;
				setRenameTarget(null);
				setRenameError(null);
			};
			const confirmRename = () => {
				if (renameBlocked) return;
				setRenaming(true);
				setRenameError(null);
				renameWorkspace(renameTarget.workspaceId, renameTrimmed).then(() => {
					setRenaming(false);
					setRenameTarget(null);
				}).catch((reason) => {
					setRenaming(false);
					setRenameError(reason instanceof Error ? reason.message : String(reason));
				});
			};
			const [sessionRenameTarget, setSessionRenameTarget] = (0, react.useState)(null);
			const [sessionRenameDraft, setSessionRenameDraft] = (0, react.useState)("");
			const [sessionRenaming, setSessionRenaming] = (0, react.useState)(false);
			const [sessionRenameError, setSessionRenameError] = (0, react.useState)(null);
			const sessionRenameTrimmed = sessionRenameDraft.trim();
			const sessionRenameBlocked = sessionRenaming || sessionRenameTrimmed === "" || sessionRenameTarget === null;
			const closeSessionRename = () => {
				if (sessionRenaming) return;
				setSessionRenameTarget(null);
				setSessionRenameError(null);
			};
			const confirmSessionRename = () => {
				if (sessionRenameBlocked) return;
				setSessionRenaming(true);
				setSessionRenameError(null);
				renameSession(sessionRenameTarget.sessionId, sessionRenameTrimmed).then(() => {
					setSessionRenaming(false);
					setSessionRenameTarget(null);
				}).catch((reason) => {
					setSessionRenaming(false);
					setSessionRenameError(reason instanceof Error ? reason.message : String(reason));
				});
			};
			const onSessionRename = (sessionId, currentTitle) => {
				setSessionRenameTarget({
					sessionId,
					currentTitle
				});
				setSessionRenameDraft(currentTitle);
				setSessionRenameError(null);
			};
			const onSessionArchive = (sessionId) => {
				archiveSession(sessionId).catch((reason) => {
					console.warn("session archive rejected:", reason);
				});
			};
			const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
			const [deleting, setDeleting] = (0, react.useState)(false);
			const [deleteCommittedId, setDeleteCommittedId] = (0, react.useState)(null);
			const [deleteError, setDeleteError] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (deleteCommittedId === null || workspaces.some((workspace) => workspace.workspaceId === deleteCommittedId)) return;
				setDeleting(false);
				setDeleteCommittedId(null);
				setDeleteTarget(null);
			}, [deleteCommittedId, workspaces]);
			const closeDelete = () => {
				if (deleting) return;
				setDeleteTarget(null);
				setDeleteError(null);
			};
			const confirmDelete = () => {
				/* v8 ignore next -- the Modal is absent without a target and its button is disabled while deleting. */
				if (deleting || deleteTarget === null) return;
				setDeleting(true);
				setDeleteCommittedId(null);
				setDeleteError(null);
				deleteWorkspace(deleteTarget.workspaceId).then(() => {
					setDeleteCommittedId(deleteTarget.workspaceId);
				}).catch((reason) => {
					setDeleting(false);
					setDeleteError(reason instanceof Error ? reason.message : String(reason));
				});
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: clsx(WorkspaceBrowser_module_css_default.root, !wide && WorkspaceBrowser_module_css_default.rail),
				"data-dsh-workspace-drop-target": "",
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: WorkspaceBrowser_module_css_default.sectionHeader,
						children: [
							wide && (0, react_jsx_runtime.jsx)("span", {
								className: clsx(WorkspaceBrowser_module_css_default.sectionLabel, WorkspaceBrowser_module_css_default.wide, searchExpanded && WorkspaceBrowser_module_css_default.sectionLabelHidden),
								children: groupBy === "flat" ? t("section.sessions") : t("section.workspaces")
							}),
							wide && (0, react_jsx_runtime.jsx)("div", {
								className: clsx(WorkspaceBrowser_module_css_default.searchSlot, searchExpanded && WorkspaceBrowser_module_css_default.searchSlotExpanded),
								children: (0, react_jsx_runtime.jsxs)("div", {
									ref: searchRoot,
									className: clsx(WorkspaceBrowser_module_css_default.search, searchExpanded && WorkspaceBrowser_module_css_default.searchExpanded),
									onClick: () => {
										setWsPickerOpen(false);
										setSearchExpanded(true);
										searchInput.current?.focus();
									},
									children: [
										(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
											label: t("search"),
											side: "bottom",
											delayMs: 500,
											disabled: searchExpanded,
											children: (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: WorkspaceBrowser_module_css_default.searchButton,
												"aria-label": t("search.sessions.aria"),
												"aria-expanded": searchExpanded,
												onClick: () => {
													setWsPickerOpen(false);
													setSearchExpanded(true);
												},
												children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { size: searchExpanded ? 11 : 14 })
											})
										}),
										(0, react_jsx_runtime.jsx)("input", {
											ref: searchInput,
											className: WorkspaceBrowser_module_css_default.searchInput,
											type: "text",
											placeholder: t("search.placeholder"),
											maxLength: SEARCH_QUERY_MAX_CODE_UNITS,
											value: query,
											tabIndex: searchExpanded ? 0 : -1,
											onChange: (e) => {
												setQuery(sanitizeSearchQuery(e.target.value));
											},
											onKeyDown: (e) => {
												if (e.key !== "Escape") return;
												setQuery("");
												setSearchExpanded(false);
											}
										}),
										searchExpanded && (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: WorkspaceBrowser_module_css_default.clearButton,
											"aria-label": t("search.clear"),
											onClick: (e) => {
												e.stopPropagation();
												setQuery("");
												setSearchExpanded(false);
											},
											children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseFill14, {})
										})
									]
								})
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: clsx(WorkspaceBrowser_module_css_default.headerActions, wide && searchExpanded && WorkspaceBrowser_module_css_default.headerActionsHidden),
								children: [wide && (0, react_jsx_runtime.jsx)(ViewOptionsMenu, {
									groupBy,
									orderBy,
									onGroupPick: (mode) => {
										actions.setGroupBy(mode);
									},
									onOrderPick: (mode) => {
										actions.setOrderBy(mode);
									},
									t
								}), directoryFlowAvailable && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
									label: t("workspace.add"),
									side: "bottom",
									delayMs: 500,
									children: (0, react_jsx_runtime.jsx)("button", {
										ref: wsPlusRef,
										type: "button",
										className: WorkspaceBrowser_module_css_default.iconButton,
										"aria-label": t("workspace.add"),
										onClick: () => {
											setWsPickerOpen((v) => !v);
										},
										children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconProjectAddOutline16, { size: wide ? 16 : 18 })
									})
								})]
							}),
							(0, react_jsx_runtime.jsx)(WorkspacePickFlow, {
								t,
								open: wsPickerOpen,
								anchorRef: wsPlusRef,
								useWorkspaces,
								createWorkspace,
								useDirectoryFlow,
								renderDirectoryFlow: (owner) => renderSlot("sidebar.workspaces.directoryFlow", owner),
								addOnly: true,
								side: "right",
								onPick: (workspaceId) => {
									setWsPickerOpen(false);
									startSession(workspaceId);
								},
								onClose: () => {
									setWsPickerOpen(false);
								}
							})
						]
					}),
					!wide && (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceBrowser_module_css_default.search,
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
							label: t("search"),
							children: (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorkspaceBrowser_module_css_default.searchButton,
								"aria-label": t("search.sessions.aria"),
								onClick: () => {
									setSearchExpanded(true);
									setSearchOnExpand(true);
									expandSidebar();
								},
								children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { size: 18 })
							})
						})
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceBrowser_module_css_default.listArea,
						children: wide && (normalizedQuery !== "" ? (0, react_jsx_runtime.jsx)(SearchResults, {
							useSessions,
							open,
							workspaces,
							archivedSessionIds,
							query: normalizedQuery,
							remote: remoteSearch,
							resultLimit: searchResultLimit,
							t
						}) : groupBy === "flat" ? (0, react_jsx_runtime.jsx)(FlatList, {
							useSessions,
							open,
							forkSession,
							onSessionRename,
							onSessionArchive,
							archivedSessionIds,
							orderBy,
							sessionOrderByAccount,
							sessionUpdatedAtByAccount,
							syncSessionOrderAccount: actions.syncSessionOrderAccount,
							setSessionOrder: actions.setSessionOrder,
							t
						}) : (0, react_jsx_runtime.jsx)(SessionTree, {
							useSessions,
							onSessionRename,
							onSessionArchive,
							forkSession,
							workspaces,
							groupExpansion,
							setGroupExpanded: actions.setGroupExpanded,
							sessionOrderByAccount,
							sessionUpdatedAtByAccount,
							syncSessionOrderAccount: actions.syncSessionOrderAccount,
							setSessionOrder: actions.setSessionOrder,
							archivedSessionIds,
							startSession,
							open,
							insertWorkspaceBefore,
							insertSessionBefore,
							orderBy,
							home,
							t,
							onRenameRequest: (workspaceId, currentTitle) => {
								setRenameTarget({
									workspaceId,
									currentTitle
								});
								setRenameDraft(currentTitle);
								setRenameError(null);
							},
							onDeleteRequest: (workspaceId, title) => {
								setDeleteTarget({
									workspaceId,
									title
								});
								setDeleteError(null);
							}
						}))
					}),
					(0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: renameTarget !== null,
						onClose: closeRename,
						closeLabel: t("close"),
						title: t("rename.workspace.title"),
						footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							disabled: renaming,
							onClick: closeRename,
							children: t("cancel")
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							disabled: renameBlocked,
							onClick: confirmRename,
							children: t("rename")
						})] }),
						children: [
							(0, react_jsx_runtime.jsx)("input", {
								className: WorkspaceBrowser_module_css_default.renameInput,
								value: renameDraft,
								"aria-label": t("field.workspaceName"),
								autoFocus: true,
								disabled: renaming,
								onFocus: (e) => {
									e.target.select();
								},
								onChange: (e) => {
									setRenameDraft(e.target.value);
									setRenameError(null);
								},
								onCompositionStart: () => {
									composingRef.current = true;
								},
								onCompositionEnd: () => {
									composingRef.current = false;
								},
								onKeyDown: (e) => {
									if (e.key === "Enter" && !composingRef.current) {
										e.preventDefault();
										confirmRename();
									}
								}
							}),
							renameDuplicate && (0, react_jsx_runtime.jsx)("div", {
								className: WorkspaceBrowser_module_css_default.renameError,
								role: "alert",
								children: t("conflict.named", { name: renameTrimmed })
							}),
							renameError !== null && (0, react_jsx_runtime.jsx)("div", {
								className: WorkspaceBrowser_module_css_default.renameError,
								role: "alert",
								children: renameError
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: sessionRenameTarget !== null,
						onClose: closeSessionRename,
						closeLabel: t("close"),
						title: t("rename.session.title"),
						footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							disabled: sessionRenaming,
							onClick: closeSessionRename,
							children: t("cancel")
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							disabled: sessionRenameBlocked,
							onClick: confirmSessionRename,
							children: t("rename")
						})] }),
						children: [(0, react_jsx_runtime.jsx)("input", {
							className: WorkspaceBrowser_module_css_default.renameInput,
							value: sessionRenameDraft,
							"aria-label": t("field.sessionName"),
							autoFocus: true,
							disabled: sessionRenaming,
							onFocus: (e) => {
								e.target.select();
							},
							onChange: (e) => {
								setSessionRenameDraft(e.target.value);
								setSessionRenameError(null);
							},
							onCompositionStart: () => {
								composingRef.current = true;
							},
							onCompositionEnd: () => {
								composingRef.current = false;
							},
							onKeyDown: (e) => {
								if (e.key === "Enter" && !composingRef.current) {
									e.preventDefault();
									confirmSessionRename();
								}
							}
						}), sessionRenameError !== null && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceBrowser_module_css_default.renameError,
							role: "alert",
							children: sessionRenameError
						})]
					}),
					(0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: deleteTarget !== null,
						onClose: closeDelete,
						closeLabel: t("close"),
						title: t("delete.workspace"),
						...deleteTarget === null ? {} : { description: t("delete.desc", { name: deleteTarget.title }) },
						footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							disabled: deleting,
							onClick: closeDelete,
							children: t("cancel")
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							className: WorkspaceBrowser_module_css_default.deleteAction,
							disabled: deleting,
							onClick: confirmDelete,
							children: t("delete.workspace")
						})] }),
						children: [deleting && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceBrowser_module_css_default.deleteStatus,
							role: "status",
							children: t("delete.pending")
						}), deleteError !== null && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceBrowser_module_css_default.renameError,
							role: "alert",
							children: deleteError
						})]
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/locales.js
		/**
		* `workspace` namespace dictionaries: the browsing region (section header,
		* search, tree rows, dialogs) and the pick/add flow. Runtime failure
		* messages (wire error strings) pass through untranslated by policy.
		*/
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"group.ungrouped": "未分组",
			"session.new": "新会话",
			"section.workspaces": "工作区",
			"section.sessions": "会话",
			"viewOptions.label": "视图选项",
			"groupBy.label": "分组方式",
			"groupBy.workspace": "按工作区",
			"groupBy.flat": "单列表",
			"orderBy.label": "排序方式",
			"orderBy.manual": "手动排序",
			"orderBy.updated": "最近更新",
			"sessions.expand": "展开其余 {n} 个会话",
			"sessions.collapse": "收起",
			"empty.none": "暂无会话",
			"empty.noMatches": "无匹配结果",
			"workspace.add": "添加工作区",
			"search.sessions.aria": "搜索会话",
			"search.placeholder": "搜索会话…",
			"search.clear": "清除搜索",
			"search.results.aria": "搜索结果",
			"search.pending": "正在搜索会话历史…",
			"search.unavailable": "内容搜索暂不可用，仅显示名称匹配。",
			"search.noMatches": "无匹配会话",
			"search.hasMore": "仅显示前 {n} 条结果，请缩小搜索范围。",
			"menu.addWorkspace": "添加工作区…",
			"picker.loading": "正在加载工作区…",
			"conflict.named": "已存在名为“{name}”的工作区。",
			"folderError.title": "无法打开文件夹",
			"folderError.retry": "重新选择",
			"rename": "重命名",
			"rename.workspace.title": "重命名工作区",
			"rename.session.title": "重命名会话",
			"field.workspaceName": "工作区名称",
			"field.sessionName": "会话名称",
			"delete.workspace": "删除工作区",
			"delete.desc": "将把“{name}”从工作区列表中移除。文件夹与会话记录会保留，其会话将显示在“未分组”下。",
			"delete.pending": "正在删除工作区…",
			"menu.fork": "分叉会话",
			"menu.archiveSession": "归档会话",
			"sessions.count.one": "{n} 个会话",
			"sessions.count.other": "{n} 个会话",
			"actions.workspace.aria": "工作区“{name}”的操作",
			"actions.session.aria": "会话“{name}”的操作",
			"actions.newSession.aria": "在“{name}”中新建会话",
			"status.running": "进行中",
			"status.subagentsRunning.one": "{n} 个子代理运行中",
			"status.subagentsRunning.other": "{n} 个子代理运行中",
			"status.idle": "空闲",
			"status.waitingApproval": "等待审批",
			"status.planReview": "计划待审",
			"status.waitingAnswer": "等待回答",
			"status.completed": "已完成",
			"hover.created": "创建于 {time}",
			"hover.copied": "已复制",
			"date.ymd": "{y}年{m}月{d}日",
			"time.now": "刚刚",
			"time.minutes": "{n}分钟",
			"time.hours": "{n}小时",
			"time.days": "{n}天",
			"time.months": "{n}个月",
			"time.years": "{n}年",
			"time.ago": "{t}前",
			"wtp.main": "主工作树",
			"wtp.currentBranch": "当前分支",
			"wtp.clean": "干净",
			"wtp.dirty": "有改动",
			"wtp.open": "打开",
			"wtp.collapse": "收起",
			"wtp.newSession": "+ 新会话",
			"wtp.removeWorktree": "删除该 worktree",
			"wtp.removeConfirm": "确定删除 worktree「{name}」？未提交的改动会丢失。",
			"wtp.pickerOpen": "＋ 分支 → 创建 worktree",
			"wtp.pickerClose": "－ 收起分支列表",
			"wtp.noPendingBranches": "所有分支都已有 worktree",
			"wtp.createWorktree": "创建 worktree",
			"wtp.newBranchPlaceholder": "新分支名",
			"wtp.failed": "操作失败：{msg}",
			"wtp.addRepo": "＋ 添加 git 仓库",
			"wtp.addRepoPrompt": "输入 git 仓库路径（将自动注册为工作区）",
			"wtp.dialogBranchTitle": "创建 worktree —— {name}",
			"wtp.dialogPickBranch": "选择已有分支：",
			"wtp.dialogInitTitle": "初始化 Git —— {name}",
			"wtp.initGitMenu": "初始化 Git 并启用 Worktree",
			"wtp.initGit": "初始化 Git 仓库",
			"wtp.switchTitle": "切换主工作树分支 —— {name}",
			"wtp.switchHint": "选择分支（已在 worktree 中检出的分支不可切）：",
			"wtp.switchTo": "切换分支",
			"wtp.switchNewBranchHint": "或新建分支并切换（不创建 worktree）：",
			"wtp.createBranchSwitch": "创建分支",
			"wtp.switchMain": "点击切换主工作树分支",
			"wtp.close": "关闭",
			"wtp.cancel": "取消",
			"wtp.busyCreating": "创建中…",
			"wtp.busyInit": "初始化中…",
			"wtp.busySwitching": "切换中…",
			"wtp.dirtyWarn": "主工作树有未提交改动，切换可能失败或被拒绝。",
			"wtp.noSwitchTarget": "没有可切换的分支——其它分支都已在 worktree 中检出。",
			"wtp.branchNameInvalid": "分支名不合法：不能含空格或 ..，请以字母或数字开头。",
			"wtp.createBranchWorktree": "创建分支并开 worktree",
			"wtp.newBranchHint": "或新建分支：",
			"wtp.initDialogHint": "该操作会在当前目录初始化 Git 仓库。完成后可从项目的「＋」创建分支 worktree。",
			"wtp.initGitDesc": "会写入 .git 元数据，并启用该项目的分支/worktree 管理。",
			"wtp.configTitle": "工作树位置",
			"wtp.configPickMode": "选择 worktree 存放位置：",
			"wtp.configModeProject": "项目内（默认）",
			"wtp.configModeGlobal": "自定义目录",
			"wtp.configModeProjectHint": "每个 worktree 建在各自项目仓库内",
			"wtp.configModeGlobalHint": "所有项目集中到一个路径下",
			"wtp.configModeProjectDesc": "每个 worktree 建在各自项目主仓库内的 .dsh/workspaces 下，随项目走（建议把 .dsh/ 加入 .gitignore）。",
			"wtp.configModeGlobalDesc": "所有项目的 worktree 集中放到一个绝对路径下（如 ~/orca/workspaces）。",
			"wtp.configPathPlaceholder": "绝对路径，例如 /Users/you/orca/workspaces",
			"wtp.configPathRequired": "请填写全局目录的绝对路径",
			"wtp.configSave": "保存",
			"wtp.busySaving": "保存中…",
			"wtp.configOpen": "更改存放位置",
			"wtp.configLocProject": "存放位置：项目内 .dsh/workspaces",
			"wtp.configLocGlobal": "存放位置：{path}/<项目>",
			"wtp.settingsNav": "Worktree",
			"wtp.migrateTitle": "检测到 {n} 个已有 worktree 需要迁移：",
			"wtp.migrateConfirm": "确认迁移",
			"wtp.migrateRunning": "迁移中…",
			"wtp.migrateDone": "迁移完成（{ok}/{n}）",
			"wtp.migrateSkip": "跳过（{reason}）",
			"wtp.migrateActive": "有活跃会话"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"group.ungrouped": "Ungrouped",
			"session.new": "New Session",
			"section.workspaces": "Workspaces",
			"section.sessions": "Sessions",
			"viewOptions.label": "View options",
			"groupBy.label": "Group by",
			"groupBy.workspace": "WorkSpace",
			"groupBy.flat": "In one list",
			"orderBy.label": "Order by",
			"orderBy.manual": "Manual",
			"orderBy.updated": "Last updated",
			"sessions.expand": "Show {n} more sessions",
			"sessions.collapse": "Show less",
			"empty.none": "No sessions yet",
			"empty.noMatches": "No matches",
			"workspace.add": "Add workspace",
			"search.sessions.aria": "Search sessions",
			"search.placeholder": "Search sessions...",
			"search.clear": "Clear search",
			"search.results.aria": "Search results",
			"search.pending": "Searching session history…",
			"search.unavailable": "Content search is temporarily unavailable. Showing name matches.",
			"search.noMatches": "No matching sessions",
			"search.hasMore": "Showing the first {n} results. Narrow your search.",
			"menu.addWorkspace": "Add workspace…",
			"picker.loading": "Loading workspaces…",
			"conflict.named": "A workspace named “{name}” already exists.",
			"folderError.title": "Couldn’t open folder",
			"folderError.retry": "Choose again",
			"rename": "Rename",
			"rename.workspace.title": "Rename workspace",
			"rename.session.title": "Rename session",
			"field.workspaceName": "Workspace name",
			"field.sessionName": "Session name",
			"delete.workspace": "Delete workspace",
			"delete.desc": "This removes “{name}” from the workspace list. The folder and session logs will be kept. Its sessions will appear under Ungrouped.",
			"delete.pending": "Deleting workspace…",
			"menu.fork": "Fork session",
			"menu.archiveSession": "Archive session",
			"sessions.count.one": "{n} session",
			"sessions.count.other": "{n} sessions",
			"actions.workspace.aria": "Workspace actions for {name}",
			"actions.session.aria": "Session actions for {name}",
			"actions.newSession.aria": "New session in {name}",
			"status.running": "Running",
			"status.subagentsRunning.one": "{n} subagent running",
			"status.subagentsRunning.other": "{n} subagents running",
			"status.idle": "Idle",
			"status.waitingApproval": "Waiting for approval",
			"status.planReview": "Plan awaiting review",
			"status.waitingAnswer": "Waiting for answer",
			"status.completed": "Completed",
			"hover.created": "Created {time}",
			"hover.copied": "Copied",
			"date.ymd": "{y}-{m}-{d}",
			"time.now": "now",
			"time.minutes": "{n}min",
			"time.hours": "{n}h",
			"time.days": "{n}d",
			"time.months": "{n}mo",
			"time.years": "{n}y",
			"time.ago": "{t} ago",
			"wtp.main": "Main worktree",
			"wtp.currentBranch": "Current branch",
			"wtp.clean": "Clean",
			"wtp.dirty": "Modified",
			"wtp.open": "Open",
			"wtp.collapse": "Collapse",
			"wtp.newSession": "+ New session",
			"wtp.removeWorktree": "Remove worktree",
			"wtp.removeConfirm": "Remove worktree \"{name}\"? Uncommitted changes will be lost.",
			"wtp.pickerOpen": "+ Branch -> Create worktree",
			"wtp.pickerClose": "- Collapse branch list",
			"wtp.noPendingBranches": "Every branch already has a worktree",
			"wtp.createWorktree": "Create worktree",
			"wtp.newBranchPlaceholder": "New branch name",
			"wtp.failed": "Operation failed: {msg}",
			"wtp.addRepo": "+ Add git repo",
			"wtp.addRepoPrompt": "Enter a git repo path (will be registered as a workspace)",
			"wtp.dialogBranchTitle": "Create worktree — {name}",
			"wtp.dialogPickBranch": "Pick an existing branch:",
			"wtp.dialogInitTitle": "Initialize Git — {name}",
			"wtp.initGitMenu": "Initialize Git and enable worktrees",
			"wtp.initGit": "Initialize Git repository",
			"wtp.switchTitle": "Switch main-worktree branch — {name}",
			"wtp.switchHint": "Pick a branch (branches checked out in a worktree cannot be switched):",
			"wtp.switchTo": "Switch",
			"wtp.switchNewBranchHint": "Or create & switch to a new branch (no worktree):",
			"wtp.createBranchSwitch": "Create branch",
			"wtp.switchMain": "Click to switch the main-worktree branch",
			"wtp.close": "Close",
			"wtp.cancel": "Cancel",
			"wtp.busyCreating": "Creating…",
			"wtp.busyInit": "Initializing…",
			"wtp.busySwitching": "Switching…",
			"wtp.dirtyWarn": "The main worktree has uncommitted changes; switching may fail or be rejected.",
			"wtp.noSwitchTarget": "No switchable branches — every other branch is checked out in a worktree.",
			"wtp.branchNameInvalid": "Invalid branch name: no spaces or .., must start with a letter or digit.",
			"wtp.createBranchWorktree": "Create branch + worktree",
			"wtp.newBranchHint": "Or new branch:",
			"wtp.initDialogHint": "This writes Git metadata into the current directory. Afterward, use the project plus button to create branch worktrees.",
			"wtp.initGitDesc": "Writes .git metadata and enables branch/worktree management for this project.",
			"wtp.configTitle": "Worktree directory",
			"wtp.configPickMode": "Choose where worktrees live:",
			"wtp.configModeProject": "Inside project (default)",
			"wtp.configModeGlobal": "Custom folder",
			"wtp.configModeProjectHint": "Each worktree lives inside its own project repo",
			"wtp.configModeGlobalHint": "All worktrees grouped under one path",
			"wtp.configModeProjectDesc": "Worktrees live under .dsh/workspaces inside each project's main repo (consider adding .dsh/ to .gitignore).",
			"wtp.configModeGlobalDesc": "All projects' worktrees are grouped under one absolute path (e.g. ~/orca/workspaces).",
			"wtp.configPathPlaceholder": "Absolute path, e.g. /Users/you/orca/workspaces",
			"wtp.configPathRequired": "Enter an absolute path for the global folder",
			"wtp.configSave": "Save",
			"wtp.busySaving": "Saving…",
			"wtp.configOpen": "Change location",
			"wtp.configLocProject": "Location: inside project (.dsh/workspaces)",
			"wtp.configLocGlobal": "Location: {path}/<project>",
			"wtp.settingsNav": "Worktree",
			"wtp.migrateTitle": "{n} worktree(s) need to be moved:",
			"wtp.migrateConfirm": "Migrate",
			"wtp.migrateRunning": "Migrating…",
			"wtp.migrateDone": "Done ({ok}/{n})",
			"wtp.migrateSkip": "Skipped ({reason})",
			"wtp.migrateActive": "active session"
		};
		//#endregion
		//#region lib/types/client/index.js
		/** Dictionary namespace owned by this plugin. */
		const NS = "workspace";
		/**
		* Required services (cordis fiber inject). The target slots are declared by
		* the ui-sidebar / ui-conversation applies, whose activation order relative
		* to this one is NOT constrained: dsh.client.inject edges are informational
		* (loading/prefetch metadata, never apply sequencing) and neither owner
		* provides a waitable service. apply therefore depends on each slot
		* declaration through `slots.inject()` instead of assuming order.
		*/
		const inject = [
			"slots",
			"sessions",
			"workspaces",
			"locale",
			"connection"
		];
		/**
		* Register the browser and picker once their slot declarations are on the
		* ledger. Inject factories return plain callbacks; data reads use the
		* framework's global hooks.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const hostDescription = ctx.get("connection").hostDescription;
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-workspace: dictionaries");
			const searchSessions = async (query, signal) => {
				const result = await ctx.sessions.search(query, signal);
				if (!result.ok) throw new Error(result.error.message);
				return result.value;
			};
			const flowSource = (hole) => ({
				getSnapshot: () => ctx.slots.entries(hole).length > 0,
				subscribe: (listener) => ctx.slots.subscribe(hole, listener)
			});
			const browserFlowSource = flowSource("sidebar.workspaces.directoryFlow");
			const pickerFlowSource = flowSource("conversation.hero.workspace.directoryFlow");
			const browserInjected = () => ({
				startSession: (workspaceId) => {
					ctx.workspaces.startSession(workspaceId);
				},
				open: (sessionId) => {
					ctx.sessions.open(sessionId);
				},
				searchSessions,
				searchResultLimit: ctx.sessions.searchResultLimit,
				renameSession: async (sessionId, title) => {
					const session = ctx.sessions.binding(sessionId)?.session;
					if (session === void 0) throw new Error(`unknown session "${sessionId}"`);
					const result = await session.rename(title);
					if (!result.ok) throw new Error(result.error.message);
				},
				forkSession: (sessionId) => {
					ctx.sessions.fork({
						sessionId,
						increaseTitle: true
					}).then((childId) => {
						ctx.sessions.open(childId);
					}).catch(() => {});
				},
				renameWorkspace: async (workspaceId, title) => {
					await ctx.workspaces.rename(workspaceId, title);
				},
				deleteWorkspace: async (workspaceId) => {
					await ctx.workspaces.delete(workspaceId);
				},
				insertWorkspaceBefore: async (workspaceId, beforeWorkspaceId) => {
					await ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId);
				},
				archiveSession: async (sessionId) => {
					await ctx.workspaces.archiveSession(sessionId);
				},
				insertSessionBefore: async (workspaceId, sessionId, beforeSessionId) => {
					await ctx.workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId);
				},
				createWorkspace: (input) => ctx.workspaces.create(input),
				hooks: {
					directoryFlow: browserFlowSource,
					hostDescription
				}
			});
			const pickerInjected = () => ({
				createWorkspace: (input) => ctx.workspaces.create(input),
				hooks: { directoryFlow: pickerFlowSource }
			});
			ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({
				name: "sidebar.workspaces",
				children: { "sidebar.workspaces.directoryFlow": {
					kind: "single",
					scope: "root"
				} },
				store: createWorkspaceViewStore(),
				inject: browserInjected,
				locale: NS
			}, WorkspaceBrowser));
			ctx.slots.inject("conversation.hero.workspace", () => ctx.slots.register({
				name: "conversation.hero.workspace",
				children: { "conversation.hero.workspace.directoryFlow": {
					kind: "single",
					scope: "root"
				} },
				inject: pickerInjected,
				locale: NS
			}, WorkspacePicker));
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
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map