// Generated from @deepseek-ai/dsh-client-ui-workspace@0.2.1-rc.5
window.__ModuleLoader__.load({
	id: "dsh-worktree-panel",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let _deepseek_ai_cordis = require("@deepseek-ai/cordis");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		//#region lib/types/client/contract/slots.js
		/**
		* Bind the row's render occurrence into the entries' `useMenuOpenState` hook:
		* the owner supplies its open-state pair as the occurrence's `hookContext`,
		* and the hook hands that pair back.
		* @param _standard - framework standard props (unused).
		* @param state - the menu's open-state pair from the render occurrence.
		* @returns the hook the entry calls.
		*/
		const menuOpenStateFactory = (_standard, state) => () => state;
		//#endregion
		//#region lib/types/client/shortcuts.js
		/**
		* Create the private browser request source shared by commands and controls.
		* @returns observable state and its complete mutation callbacks.
		*/
		function createWorkspaceShortcutControls() {
			const state = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)({
				searchRequest: 0,
				addRequested: false,
				directoryBusy: false,
				renameTarget: null
			});
			return {
				state,
				search: () => {
					state.set({
						...state.getSnapshot(),
						searchRequest: state.getSnapshot().searchRequest + 1
					});
				},
				add: () => {
					state.set(state.getSnapshot().directoryBusy ? state.getSnapshot() : {
						...state.getSnapshot(),
						addRequested: true
					});
				},
				closeAdd: () => {
					state.set({
						...state.getSnapshot(),
						addRequested: false
					});
				},
				directoryBusy: (busy) => {
					state.set({
						...state.getSnapshot(),
						directoryBusy: busy
					});
				},
				rename: (sessionId, currentTitle) => {
					state.set({
						...state.getSnapshot(),
						renameTarget: {
							sessionId,
							currentTitle
						}
					});
				},
				closeRename: () => {
					state.set({
						...state.getSnapshot(),
						renameTarget: null
					});
				}
			};
		}
		/**
		* Register navigation commands against the existing workspace owner.
		* Rename requires a nonblank main Conversation with no modal obscuring it.
		* @param ctx - plugin context with the shortcut, locale, and model services.
		* @param navigation - session creation and forking from the pointer controls' navigation service.
		* @param controls - browser-owned opening requests.
		* @param archiveSession - shared archive action, including running-work confirmation and notices.
		* @param reportForkFailure - publish a classified failure through the frame-wide notice channel.
		*/
		function installWorkspaceShortcuts(ctx, navigation, controls, archiveSession, reportForkFailure) {
			const t = ctx.locale.bind("workspace");
			const current = () => Object.values(ctx.sessions.list.getSnapshot().byId).find((row) => (row.retainedBy.mainView ?? 0) > 0);
			const addReason = () => ctx.slots.entries("sidebar.workspaces.directoryFlow").length === 0 ? t("shortcut.noPicker") : controls.state.getSnapshot().directoryBusy ? t("shortcut.directoryBusy") : null;
			const register = (id, label, aliases, code, modifiers, webModifiers, resolve) => {
				ctx.effect(() => ctx.shortcuts.register({
					id,
					label,
					aliases,
					defaults: {
						"desktop:macos": {
							code,
							modifiers
						},
						"desktop:windows": {
							code,
							modifiers
						},
						"desktop:linux": {
							code,
							modifiers
						},
						"web:macos": {
							code,
							modifiers: webModifiers
						},
						"web:windows": {
							code,
							modifiers: webModifiers
						}
					},
					regions: ["page", "editable"],
					modals: [],
					resolve
				}), `ui-workspace: ${id}`);
			};
			register("session.new", () => t("session.new"), ["new session", "new chat"], "KeyN", ["primary"], ["primary", "alt"], () => ({
				status: "handled",
				run: () => {
					navigation.startSession();
				}
			}));
			register("session.search", () => t("search.sessions.aria"), ["search sessions"], "KeyK", ["primary"], ["primary", "alt"], () => ({
				status: "handled",
				run: controls.search
			}));
			register("workspace.add", () => t("workspace.add"), ["add workspace", "open folder"], "KeyO", ["primary"], ["primary", "alt"], () => {
				const reason = addReason();
				return reason === null ? {
					status: "handled",
					run: controls.add
				} : {
					status: "blocked",
					reason
				};
			});
			register("session.rename", () => t("rename.session.title"), ["rename session"], "KeyG", ["primary", "alt"], ["primary", "alt"], (context) => {
				const target = current();
				return target === void 0 || target.blank || context.modal !== null || ctx.layout.panelInfo.getSnapshot().activePanelId !== null ? {
					status: "blocked",
					reason: t("shortcut.noSession")
				} : {
					status: "handled",
					run: () => {
						controls.rename(target.id, target.title?.trim() ?? "");
					}
				};
			});
			register("session.fork", () => t("menu.fork"), ["fork session"], "KeyF", ["primary", "alt"], ["primary", "shift"], () => {
				const target = current();
				if (target === void 0) return {
					status: "blocked",
					reason: t("shortcut.noSession")
				};
				if (target.blank) return {
					status: "blocked",
					reason: t("shortcut.noCompletedTurn")
				};
				return {
					status: "handled",
					run: () => {
						navigation.forkSession(target.id).catch((error) => {
							const unavailable = error instanceof Error && error.name === "SessionForkError" && error.rpcError.code === "session/fork-unavailable";
							reportForkFailure(unavailable ? "unavailable" : "failed");
							if (!unavailable) console.warn("session fork rejected:", error);
						});
					}
				};
			});
			register("session.archive", () => t("menu.archiveSession"), ["archive session"], "KeyA", ["primary", "shift"], ["primary", "alt"], () => {
				const target = current();
				return target === void 0 ? {
					status: "blocked",
					reason: t("shortcut.noSession")
				} : {
					status: "handled",
					run: () => {
						archiveSession(target.id);
					}
				};
			});
		}
		//#endregion
		//#region ../../util/values/src/partial-json.ts
		/**
		* Lazily scanned view of one JSON object's top-level fields, built from text
		* that may still be streaming or from an already parsed object. Nothing is
		* scanned until a reader asks; the view remembers every question it answered
		* and reports changed answers when the owner refreshes for publication.
		* Used for model tool-call arguments: a row reads the fields it
		* cares about at whatever granularity it displays, at every stage of the call.
		* @module @deepseek-ai/dsh-util-values/src/partial-json
		*/
		const SIMPLE_ESCAPES = {
			"\"": "\"",
			"\\": "\\",
			"/": "/",
			b: "\b",
			f: "\f",
			n: "\n",
			r: "\r",
			t: "	"
		};
		const CONTENT_ESCAPE = /[\\\u0000-\u001f]/u;
		function isWhitespace(c) {
			return c === " " || c === "\n" || c === "\r" || c === "	";
		}
		function isHex(c) {
			return c >= "0" && c <= "9" || c >= "a" && c <= "f" || c >= "A" && c <= "F";
		}
		(class PartialArguments {
			/** The view of a call with no arguments available. */
			static EMPTY = PartialArguments.fromObject({});
			/**
			* View finished argument text without scanning it until a reader asks.
			* @param text - the complete argument JSON text.
			* @returns a sealed view.
			*/
			static fromText(text) {
				const view = new PartialArguments();
				view.append(text);
				view.sealed = true;
				return view;
			}
			/**
			* View an already parsed argument payload, such as a PTC dispatch object.
			* @param value - the parsed argument value.
			* @returns a sealed view; a non-object payload has no fields.
			*/
			static fromObject(value) {
				const view = new PartialArguments();
				view.object = typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
				view.sealed = true;
				return view;
			}
			/**
			* The source: text so far or a parsed object, plus whether it can still grow.
			* These are the only enumerable fields, so two views over the same source
			* compare equal structurally however far each has been read.
			*/
			chunks = [];
			object;
			sealed = false;
			#ends = [];
			#size = 0;
			#consumed = 0;
			#mode = "root";
			#escape = false;
			#keyStart = 0;
			#keyEscaped = false;
			#key = "";
			#current = null;
			#nestedEnds = [];
			#nestedInString = false;
			#invalidAt;
			#invalidValue = false;
			#entries = /* @__PURE__ */ new Map();
			#order = [];
			#reads = /* @__PURE__ */ new Map();
			/** Whether this view rejects further appends; does not scan text or register reads. */
			get isSealed() {
				return this.sealed;
			}
			/** Whether indexing or a content read found invalid JSON; unread value contents are not validated. */
			get invalid() {
				this.scan();
				return this.#mode === "invalid" || this.#invalidValue;
			}
			/**
			* Retain streamed argument text without scanning or comparing observed answers.
			* @param fragment - the text following every fragment appended before.
			*/
			append(fragment) {
				if (this.sealed) throw new Error("PartialArguments: cannot append to a sealed view");
				if (fragment.length === 0) return;
				this.chunks.push(fragment);
				this.#size += fragment.length;
				this.#ends.push(this.#size);
			}
			/**
			* Reconcile a streamed prefix with authoritative complete text without joining the fragments.
			* @param text - the final argument text, which replaces missing or conflicting deltas.
			* @returns this view sealed with its caches retained when every character matches; otherwise a new sealed view.
			*/
			settle(text) {
				if (this.object !== void 0 || text.length !== this.#size) return PartialArguments.fromText(text);
				let offset = 0;
				for (const chunk of this.chunks) {
					if (!text.startsWith(chunk, offset)) return PartialArguments.fromText(text);
					offset += chunk.length;
				}
				this.chunks = text.length === 0 ? [] : [text];
				this.#ends = text.length === 0 ? [] : [text.length];
				this.sealed = true;
				return this;
			}
			/**
			* Compare observed answers and advance their publication baseline. Unread views remain unscanned.
			* @returns whether any observed answer changed since its first read or the preceding refresh.
			*/
			refresh() {
				if (this.#reads.size === 0) return false;
				this.scan();
				let changed = false;
				let completions = false;
				for (const read of this.#reads.values()) {
					if (read.completion) {
						completions = true;
						continue;
					}
					changed = this.refreshRead(read) || changed;
				}
				if (completions) {
					for (const read of this.#reads.values()) if (read.completion) changed = this.refreshRead(read) || changed;
				}
				if (this.sealed) this.#reads.clear();
				return changed;
			}
			refreshRead(read) {
				const now = read.answer();
				if (Object.is(now, read.last)) return false;
				read.last = now;
				return true;
			}
			/**
			* Check whether no further fields can arrive.
			* @returns whether the outer object closed, indexing failed, or the view is sealed; unread values are not validated.
			*/
			closed() {
				return this.remember("closed", "", () => this.closedNow());
			}
			/**
			* List discovered fields in first-appearance order.
			* @returns top-level keys seen so far, in first-appearance order.
			*/
			keys() {
				return this.remember("keys", "", () => this.keysNow(), (keys) => keys.length);
			}
			/**
			* Check whether a top-level field has appeared.
			* @param key - argument name.
			* @returns whether the field has appeared (a string opened or another value began).
			*/
			has(key) {
				return this.remember("has", key, () => this.hasNow(key));
			}
			/**
			* Check whether a field's closing delimiter has arrived, without validating its contents.
			* @param key - argument name.
			* @returns whether its delimiter arrived and no content reader has reported an error for this value.
			*/
			complete(key) {
				return this.remember("complete", key, () => this.completeNow(key));
			}
			/**
			* Read string length without materializing its text.
			* @param key - argument name.
			* @param options - change granularity for a streaming string.
			* @returns decoded UTF-16 length of the string field so far; undefined when absent or not a string.
			*/
			stringLength(key, options) {
				const step = Math.max(1, Math.floor(options?.step ?? 1));
				const offset = options?.offset ?? 0;
				return this.remember(`length:${step}:${offset}`, key, () => this.lengthNow(key), (length) => length === void 0 ? void 0 : Math.ceil((length + offset) / step));
			}
			/**
			* Check a string against a decoded UTF-16 length limit without materializing it.
			* @param key - argument name.
			* @param maxLength - decoded UTF-16 limit, floored to at least zero.
			* @returns whether the string is longer than the limit; false when absent or not a string.
			*/
			stringExceeds(key, maxLength) {
				const limit = Math.max(0, Math.floor(maxLength));
				return this.remember(`exceeds:${limit}`, key, () => (this.lengthNow(key, limit + 1) ?? 0) > limit);
			}
			/**
			* Read a decoded string, including a streaming prefix.
			* @param key - argument name.
			* @returns the string field's decoded text so far; undefined when absent or not a string.
			*/
			text(key) {
				return this.remember("text", key, () => this.textNow(key));
			}
			/**
			* Read at most the first decoded UTF-16 units of a string.
			* @param key - argument name.
			* @param maxLength - maximum decoded UTF-16 length, floored to at least one.
			* @returns the bounded string prefix; undefined when absent or not a string.
			*/
			textPrefix(key, maxLength) {
				const limit = Math.max(1, Math.floor(maxLength));
				return this.remember(`prefix:${limit}`, key, () => this.textPrefixNow(key, limit));
			}
			/**
			* Read a completed non-string argument.
			* @param key - argument name.
			* @returns the parsed non-string value once it closed; undefined while open, absent, or a string.
			*/
			value(key) {
				return this.remember("value", key, () => this.valueNow(key));
			}
			/** Answer a question and, on a streaming view, remember it for change detection. */
			remember(kind, key, read, comparison) {
				this.scan();
				const result = read();
				if (!this.sealed) {
					const id = `${kind}/${key}`;
					if (!this.#reads.has(id)) this.#reads.set(id, {
						completion: kind === "complete",
						answer: comparison === void 0 ? read : () => comparison(read()),
						last: comparison === void 0 ? result : comparison(result)
					});
				}
				return result;
			}
			closedNow() {
				return this.sealed || this.#mode === "closed" || this.#mode === "invalid";
			}
			keysNow() {
				return this.object === void 0 ? this.#order : Object.keys(this.object);
			}
			hasNow(key) {
				return this.object === void 0 ? this.#entries.has(key) : Object.hasOwn(this.object, key);
			}
			completeNow(key) {
				if (this.object !== void 0) return Object.hasOwn(this.object, key);
				const entry = this.#entries.get(key);
				return entry !== void 0 && entry.end >= 0 && (entry.kind === "string" ? entry.invalidAt === void 0 : !entry.invalid);
			}
			lengthNow(key, limit = Number.POSITIVE_INFINITY) {
				if (this.object !== void 0) {
					const field = Object.hasOwn(this.object, key) ? this.object[key] : void 0;
					return typeof field === "string" ? field.length : void 0;
				}
				const entry = this.#entries.get(key);
				if (entry?.kind !== "string") return void 0;
				if (entry.text !== void 0 && entry.text.at === entry.end) return entry.text.length;
				const read = entry.length ??= {
					at: entry.start,
					length: 0,
					text: ""
				};
				this.readString(entry, read, limit, false);
				return read.length;
			}
			textNow(key) {
				if (this.object !== void 0) {
					const field = Object.hasOwn(this.object, key) ? this.object[key] : void 0;
					return typeof field === "string" ? field : void 0;
				}
				const entry = this.#entries.get(key);
				if (entry?.kind !== "string") return void 0;
				if (entry.text === void 0 && entry.end >= 0 && entry.needsDecoding && entry.invalidAt === void 0) {
					let text;
					try {
						text = JSON.parse(`"${this.slice(entry.start, entry.end)}"`);
					} catch (_error) {}
					if (text !== void 0) entry.text = {
						at: entry.end,
						length: text.length,
						text
					};
				}
				const read = entry.text ??= {
					at: entry.start,
					length: 0,
					text: ""
				};
				this.readString(entry, read, Number.POSITIVE_INFINITY, true);
				return read.text;
			}
			textPrefixNow(key, maxLength) {
				if (this.object !== void 0) {
					const field = Object.hasOwn(this.object, key) ? this.object[key] : void 0;
					return typeof field === "string" ? field.slice(0, maxLength) : void 0;
				}
				const entry = this.#entries.get(key);
				if (entry?.kind !== "string") return void 0;
				const prefixes = entry.prefixes ??= /* @__PURE__ */ new Map();
				let read = prefixes.get(maxLength);
				if (read === void 0) {
					read = {
						at: entry.start,
						length: 0,
						text: ""
					};
					prefixes.set(maxLength, read);
				}
				this.readString(entry, read, maxLength, true);
				return read.text;
			}
			valueNow(key) {
				if (this.object !== void 0) {
					if (!Object.hasOwn(this.object, key)) return void 0;
					const field = this.object[key];
					return typeof field === "string" ? void 0 : field;
				}
				const entry = this.#entries.get(key);
				if (entry?.kind !== "value" || entry.end < 0 || entry.invalid) return void 0;
				if (entry.parsed === void 0) try {
					entry.parsed = JSON.parse(this.slice(entry.start, entry.end));
				} catch (_error) {
					entry.invalid = true;
					this.#invalidValue = true;
				}
				return entry.parsed;
			}
			chunkAt(at) {
				let low = 0;
				let high = this.#ends.length;
				while (low < high) {
					const mid = low + high >>> 1;
					if (this.#ends[mid] <= at) low = mid + 1;
					else high = mid;
				}
				return low;
			}
			/** Materialize only a requested range, never the cumulative source. */
			slice(start, end) {
				if (start >= end) return "";
				const first = this.chunkAt(start);
				const last = this.chunkAt(end - 1);
				const base = first === 0 ? 0 : this.#ends[first - 1];
				if (first === last) return this.chunks[first].slice(start - base, end - base);
				const parts = [this.chunks[first].slice(start - base)];
				for (let i = first + 1; i < last; i++) parts.push(this.chunks[i]);
				parts.push(this.chunks[last].slice(0, end - this.#ends[last - 1]));
				return parts.join("");
			}
			readString(entry, read, limit, materialize) {
				const end = Math.min(entry.end < 0 ? this.#consumed : entry.end, entry.invalidAt ?? Number.POSITIVE_INFINITY, this.#invalidAt ?? Number.POSITIVE_INFINITY);
				if (!entry.needsDecoding) {
					const length = Math.min(end - read.at, limit - read.length);
					if (length <= 0) return;
					if (materialize) read.text += this.slice(read.at, read.at + length);
					read.at += length;
					read.length += length;
					return;
				}
				let chunkIndex = this.chunkAt(read.at);
				while (read.at < end && read.length < limit) {
					const base = chunkIndex === 0 ? 0 : this.#ends[chunkIndex - 1];
					const chunk = this.chunks[chunkIndex];
					const remaining = chunk.slice(read.at - base, Math.min(chunk.length, end - base));
					const boundary = remaining.search(CONTENT_ESCAPE);
					const length = Math.min(boundary < 0 ? remaining.length : boundary, limit - read.length);
					if (length > 0) {
						if (materialize) read.text += remaining.slice(0, length);
						read.at += length;
						read.length += length;
						if (read.at === base + chunk.length) chunkIndex++;
						continue;
					}
					const type = remaining.length > 1 ? remaining[1] : read.at + 1 < end ? this.chunks[chunkIndex + 1][0] : void 0;
					let decoded;
					let width = 2;
					if (remaining[0] === "\\" && type === void 0 && entry.end < 0) return;
					if (remaining[0] === "\\" && type === "u") {
						const hex = this.slice(read.at + 2, Math.min(end, read.at + 6));
						let valid = true;
						for (let i = 0; i < hex.length; i++) if (!isHex(hex[i])) valid = false;
						if (valid) {
							if (hex.length < 4 && entry.end < 0) return;
							if (hex.length === 4) decoded = String.fromCharCode(Number.parseInt(hex, 16));
						}
						width = 6;
					} else if (remaining[0] === "\\" && type !== void 0) decoded = SIMPLE_ESCAPES[type];
					if (decoded === void 0) {
						entry.invalidAt = read.at;
						this.#invalidValue = true;
						return;
					}
					if (materialize) read.text += decoded;
					read.length++;
					read.at += width;
					while (chunkIndex < this.chunks.length && read.at >= this.#ends[chunkIndex]) chunkIndex++;
				}
			}
			/** Locate new field ranges without decoding or parsing their contents. */
			scan() {
				if (this.object !== void 0 || this.#consumed === this.#size) return;
				for (let i = this.chunkAt(this.#consumed); i < this.chunks.length && this.#invalidAt === void 0; i++) {
					const pending = this.chunks[i];
					const base = i === 0 ? 0 : this.#ends[i - 1];
					for (let index = this.#consumed - base; index < pending.length && this.#mode !== "invalid"; index++) {
						if (this.#mode === "string" || this.#mode === "nested" && this.#nestedInString) {
							const end = this.stringBoundary(pending, index);
							this.#consumed += end - index;
							index = end;
							if (index === pending.length) break;
						}
						this.step(pending[index], this.#consumed);
						this.#consumed++;
					}
				}
			}
			/** Only raw quotes and their preceding backslash runs can terminate a string. */
			stringBoundary(fragment, start) {
				let at = start;
				while (true) {
					const quote = fragment.indexOf("\"", at);
					const end = quote < 0 ? fragment.length : quote;
					if (this.#mode === "string") {
						const entry = this.#current;
						if (!entry.needsDecoding && CONTENT_ESCAPE.test(fragment.slice(at, end))) entry.needsDecoding = true;
					}
					let slashStart = end;
					while (slashStart > at && fragment[slashStart - 1] === "\\") slashStart--;
					const escaped = (end - slashStart) % 2 === 1 !== (slashStart === at && this.#escape);
					this.#escape = quote < 0 && escaped;
					if (quote < 0 || !escaped) return end;
					at = quote + 1;
				}
			}
			step(c, at) {
				switch (this.#mode) {
					case "root":
						if (isWhitespace(c)) return;
						if (c === "{") {
							this.#mode = "key-or-end";
							return;
						}
						this.fail();
						return;
					case "key-or-end":
						if (isWhitespace(c)) return;
						if (c === "}") {
							this.#mode = "closed";
							return;
						}
						if (c === "\"") {
							this.beginKey(at);
							return;
						}
						this.fail();
						return;
					case "key-only":
						if (isWhitespace(c)) return;
						if (c === "\"") {
							this.beginKey(at);
							return;
						}
						this.fail();
						return;
					case "key":
						this.stepKey(c, at);
						return;
					case "colon":
						if (isWhitespace(c)) return;
						if (c === ":") {
							this.#mode = "value";
							return;
						}
						this.fail();
						return;
					case "value":
						this.beginValue(c, at);
						return;
					case "string": {
						const entry = this.#current;
						entry.end = at;
						this.#current = null;
						this.#mode = "comma-or-end";
						return;
					}
					case "scalar":
						this.stepScalar(c, at);
						return;
					case "nested":
						this.stepNested(c, at);
						return;
					case "comma-or-end":
						if (isWhitespace(c)) return;
						if (c === ",") {
							this.#mode = "key-only";
							return;
						}
						if (c === "}") {
							this.#mode = "closed";
							return;
						}
						this.fail();
						return;
					case "closed":
						if (isWhitespace(c)) return;
						this.fail();
						return;
					/* v8 ignore next 2 -- scan() stops stepping once the view is invalid. */
					case "invalid": return;
					/* v8 ignore next 2 -- Every scanner mode has a handler above. */
					default: assertNever$1(this.#mode);
				}
			}
			fail() {
				this.#invalidAt = this.#consumed;
				this.#mode = "invalid";
				this.#current = null;
			}
			beginKey(at) {
				this.#mode = "key";
				this.#keyStart = at + 1;
				this.#keyEscaped = false;
				this.#escape = false;
			}
			stepKey(c, at) {
				if (c < " ") {
					this.fail();
					return;
				}
				if (this.#escape) {
					this.#escape = false;
					return;
				}
				if (c === "\\") {
					this.#escape = true;
					this.#keyEscaped = true;
					return;
				}
				if (c !== "\"") return;
				const raw = this.slice(this.#keyStart, at);
				if (this.#keyEscaped) try {
					this.#key = JSON.parse(`"${raw}"`);
				} catch (_error) {
					this.fail();
					return;
				}
				else this.#key = raw;
				this.#mode = "colon";
			}
			open(entry) {
				if (!this.#entries.has(this.#key)) this.#order.push(this.#key);
				this.#entries.set(this.#key, entry);
				this.#current = entry;
			}
			beginValue(c, at) {
				if (isWhitespace(c)) return;
				if (c === "\"") {
					this.open({
						kind: "string",
						start: at + 1,
						end: -1,
						needsDecoding: false,
						invalidAt: void 0,
						length: void 0,
						text: void 0,
						prefixes: void 0
					});
					this.#escape = false;
					this.#mode = "string";
					return;
				}
				if (c === "}" || c === "," || c === ":" || c === "]") {
					this.fail();
					return;
				}
				this.open({
					kind: "value",
					start: at,
					end: -1,
					parsed: void 0,
					invalid: false
				});
				if (c === "{" || c === "[") {
					this.#mode = "nested";
					this.#nestedEnds = [c === "{" ? "}" : "]"];
					this.#nestedInString = false;
					this.#escape = false;
					return;
				}
				this.#mode = "scalar";
			}
			stepScalar(c, at) {
				if (c !== "," && c !== "}" && !isWhitespace(c)) return;
				this.closeValue(at);
				this.#mode = c === "," ? "key-only" : c === "}" ? "closed" : "comma-or-end";
			}
			stepNested(c, at) {
				if (this.#nestedInString) {
					this.#nestedInString = false;
					return;
				}
				if (c === "\"") {
					this.#nestedInString = true;
					return;
				}
				if (c === "{" || c === "[") {
					this.#nestedEnds.push(c === "{" ? "}" : "]");
					return;
				}
				if (c === "}" || c === "]") {
					if (this.#nestedEnds.pop() !== c) {
						this.fail();
						return;
					}
					if (this.#nestedEnds.length === 0) {
						this.closeValue(at + 1);
						this.#mode = "comma-or-end";
					}
				}
			}
			closeValue(end) {
				const entry = this.#current;
				entry.end = end;
				this.#current = null;
			}
		});
		//#endregion
		//#region ../../util/values/src/index.ts
		/**
		* Mark an unreachable closed-union branch.
		* @param value - impossible value; an unhandled typed variant fails at the call site.
		* @param context - optional switch-site label included in the failure message.
		* @returns never; a runtime value that escaped its type always throws.
		*/
		function assertNever$1(value, context) {
			const rendered = JSON.stringify(value) ?? String(value);
			throw new Error(`unreachable variant${context ? ` in ${context}` : ""}: ${rendered}`);
		}
		//#endregion
		//#region ../../util/workspace-path/src/index.ts
		/** Whether a path uses a Windows drive or UNC prefix. */
		function isWindowsStylePath(value) {
			return /^[A-Za-z]:[/\\]/.test(value) || value.startsWith("\\\\");
		}
		/**
		* Abbreviate a POSIX home directory for display.
		* @param path - Absolute or already-short display path.
		* @param home - Host account home; absent skips abbreviation.
		* @returns `~` or `~/…` for the POSIX home and its descendants, otherwise `path`.
		*/
		function abbreviateHomePath(path, home) {
			if (home === void 0 || home === "") return path;
			if (isWindowsStylePath(path) || isWindowsStylePath(home)) return path;
			const root = home.replace(/\/+$/, "");
			if (root === "" || root === "/") return path;
			if (path.replace(/\/+$/, "") === root) return "~";
			if (path.startsWith(`${root}/`)) return `~${path.slice(root.length)}`;
			return path;
		}
		/**
		* Read the final non-empty segment of a Workspace path for display.
		* Workspace-label surfaces use this helper instead of deriving another basename.
		* @param path - Workspace directory path using POSIX or Windows separators.
		* @returns the final segment, or an empty string for a separator-only path.
		*/
		function workspaceTitleOf(path) {
			const trimmed = path.replace(/[/\\]+$/, "");
			const separator = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
			return trimmed.slice(separator + 1);
		}
		/**
		* Resolve the Workspace browser group that owns one Session.
		* @param workspaces - authoritative Workspace membership.
		* @param sessionId - Session whose browser group is required.
		* @returns owning Workspace id, or {@link UNGROUPED_KEY} when no Workspace accounts for it.
		*/
		function owningGroupKey(workspaces, sessionId) {
			return workspaces.find((workspace) => workspace.sessionIds.includes(sessionId))?.workspaceId ?? "";
		}
		function mainSessionId(list) {
			return Object.values(list.byId).find((session) => (session.retainedBy.mainView ?? 0) > 0)?.id;
		}
		/**
		* Directory display label: basename of the path (both separators accepted).
		* Ungrouped-bucket fallback for surfaces without a workspace title.
		* @param cwd - directory path, or undefined for the ungrouped bucket.
		* @returns basename, the raw cwd when it has no basename, or an empty ungrouped marker.
		*/
		function workspaceLabel(cwd) {
			if (cwd === void 0 || cwd === "") return "";
			const base = workspaceTitleOf(cwd);
			return base !== "" ? base : cwd;
		}
		/**
		* Project known account members by current Session recency.
		* @param sessionIds - authoritative account membership.
		* @param summaries - current Session summaries; members without a summary are omitted until it arrives.
		* @returns known members newest first, with Session identity as the deterministic tie-break.
		*/
		function orderByRecency(sessionIds, summaries) {
			return sessionIds.flatMap((id) => {
				const summary = summaries[id];
				if (summary === void 0) return [];
				return [{
					id,
					rank: summary.updatedAt
				}];
			}).sort((a, b) => {
				if (a.rank !== b.rank) return b.rank - a.rank;
				return a.id < b.id ? -1 : 1;
			}).map((member) => member.id);
		}
		/**
		* Reconcile a browser-local manual order with current account membership.
		* New ordinary forks precede their sources without changing saved entries' relative order.
		* @param memberIds - authoritative account membership.
		* @param savedOrder - previously saved browser-local order.
		* @param summaries - current Session metadata; unknown new members wait for their summaries.
		* @param rowState - global pin and archive membership; only account members can supplement the order.
		* @returns saved relative positions plus missing members ordered by pin, fork source, recency, and archive status.
		*/
		function reconcileManualOrder(memberIds, savedOrder, summaries, rowState) {
			const members = new Map(memberIds.map((id) => [id, id]));
			const included = /* @__PURE__ */ new Set();
			const ordered = [];
			for (const key of savedOrder ?? []) {
				const id = members.get(key);
				if (id === void 0 || included.has(key)) continue;
				ordered.push(id);
				included.add(key);
			}
			const archived = new Set(rowState?.archivedSessionIds);
			const pins = [];
			for (const sessionId of rowState?.pinnedSessionIds ?? []) {
				const id = members.get(sessionId);
				if (id === void 0 || included.has(id) || archived.has(id) || summaries[id] === void 0) continue;
				pins.push(id);
				included.add(id);
			}
			const ordinary = [];
			const archives = [];
			for (const id of orderByRecency([...members.values()].filter((id) => !included.has(id)), summaries)) if (archived.has(id)) archives.push(id);
			else ordinary.push(id);
			const result = [
				...pins,
				...ordered,
				...ordinary,
				...archives
			];
			const pending = new Set(ordinary);
			const placeFork = (id) => {
				if (!pending.delete(id)) return;
				const parentId = summaries[id]?.parentId;
				if (parentId === void 0 || parentId === id || !result.includes(parentId)) return;
				placeFork(parentId);
				result.splice(result.indexOf(id), 1);
				result.splice(result.indexOf(parentId), 0, id);
			};
			for (const id of [...ordinary].reverse()) placeFork(id);
			return result;
		}
		/**
		* Keep the selected provisional New Session ahead of either base order.
		* @param order - recency or reconciled manual order.
		* @param currentBlank - selected blank Session in this account, when present.
		* @returns a copy with the selected blank first and no duplicate slot.
		*/
		function pinCurrentBlank(order, currentBlank) {
			if (currentBlank === void 0) return [...order];
			return [currentBlank, ...order.filter((id) => id !== currentBlank)];
		}
		/**
		* Ordinary sessions are visible; among blank sessions, only the current one
		* is visible. Subagent children use their parent header catalog; archived
		* sessions follow the archived filter, while their accounting slots remain
		* either way so unarchiving restores position.
		*/
		function sessionVisible(session, current, archived, archivedFilter) {
			if (session.origin === "subagent") return false;
			if (session.blank && session.id !== current) return false;
			switch (archivedFilter) {
				case "default": return !archived.has(session.id);
				case "show": return true;
				case "only": return archived.has(session.id);
				/* v8 ignore next 2 -- closed-union backstop; only reached if the filter is forged */
				default: return assertNever$1(archivedFilter);
			}
		}
		/**
		* Keep the visible New Session placeholder first, then partition pinned and
		* ordinary rows without changing either partition's caller order.
		*/
		function sectionMembers(members, pinned, archived) {
			const placeholders = [];
			const leading = [];
			const rest = [];
			for (const member of members) if (member.blank) placeholders.push(member);
			else if (!archived.has(member.id) && pinned.has(member.id)) leading.push(member);
			else rest.push(member);
			return [
				...placeholders,
				...leading,
				...rest
			];
		}
		/**
		* A blank session is the selected Workspace's provisional New Session row;
		* its canonical title never enters search (blank rows are query-excluded)
		* and the renderer localizes its display label. Unnamed history also yields an
		* empty title for localization and does not match a directory-name title search.
		*/
		function sessionTitle(session) {
			return session.blank ? "" : session.title?.trim() ?? "";
		}
		/** Build one group without projecting session lineage into presentation. */
		function buildGroup(key, workspaceId, cwd, createdAt, label, members) {
			return {
				key,
				workspaceId,
				cwd,
				createdAt,
				label,
				sessions: [...members]
			};
		}
		/** Apply a stored Ungrouped order and append newly loose Sessions by recency. */
		function orderedUngrouped(members, stored, summaries) {
			const byId = new Map(members.map((session) => [session.id, session]));
			return (stored === void 0 ? orderByRecency(members.map((session) => session.id), summaries) : reconcileManualOrder(members.map((session) => session.id), stored, summaries)).flatMap((id) => {
				const session = byId.get(id);
				/* v8 ignore next -- ids are projected exclusively from the members used to build byId. */
				return session === void 0 ? [] : [session];
			});
		}
		/**
		* Group Sessions by Workspace: one group per caller-ordered entity, with
		* members resolved from caller-ordered sessionIds. Sessions outside every
		* Workspace trail in the browser-local Ungrouped order, which falls back to
		* recency before that order is initialized.
		*/
		function groupByWorkspace(list, workspaces, archived, archivedFilter, ungroupedOrder) {
			const current = mainSessionId(list);
			const groups = [];
			const accounted = /* @__PURE__ */ new Set();
			for (const workspace of workspaces) {
				const members = [];
				for (const id of workspace.sessionIds) {
					const summary = list.byId[id];
					if (summary === void 0) continue;
					accounted.add(id);
					if (!sessionVisible(summary, current, archived, archivedFilter)) continue;
					members.push(summary);
				}
				if (archivedFilter === "only" && members.length === 0) continue;
				groups.push(buildGroup(workspace.workspaceId, workspace.workspaceId, workspace.path, Date.parse(workspace.createdAt), workspace.title, members));
			}
			const stray = list.ids.map((id) => list.byId[id]).filter((s) => s !== void 0 && !accounted.has(s.id) && sessionVisible(s, current, archived, archivedFilter));
			if (stray.length > 0) groups.push(buildGroup("", void 0, void 0, void 0, "", orderedUngrouped(stray, ungroupedOrder, list.byId)));
			return groups;
		}
		/** Keep navigation presentation independent from domain-owned interaction objects. */
		function visiblePendingKind(kind) {
			switch (kind) {
				case "approval":
				case "plan-review":
				case "question": return kind;
				default: return;
			}
		}
		function runningChildCount(list, parentId, statuses) {
			return list.projectionsBySession[parentId]?.values.subagentCatalog?.reduce((count, child) => count + ((statuses.get(child.id)?.running ?? list.byId[child.id]?.running) === true ? 1 : 0), 0) ?? 0;
		}
		function sessionNode(s, list, statuses, pinned, archived) {
			const status = statuses.get(s.id);
			const pendingInteraction = visiblePendingKind(status?.pendingInteraction?.kind);
			return {
				id: s.id,
				title: sessionTitle(s),
				blank: s.blank,
				running: status?.running ?? s.running,
				runningSubagentCount: runningChildCount(list, s.id, statuses),
				completed: status?.completionUnread === true,
				pinned: !archived.has(s.id) && pinned.has(s.id),
				archived: archived.has(s.id),
				updatedAt: s.updatedAt,
				...pendingInteraction === void 0 ? {} : { pendingInteraction }
			};
		}
		/**
		* Derive the workspace browser groups with every session as a top-level row.
		*
		* Every group shows, except that the archived-only filter drops groups
		* without visible members; sessions populate under expanded groups with
		* pinned rows leading in the selected local order. Blank sessions are
		* excluded except for the selected provisional New Session row; archived
		* sessions keep their slots and appear per the archived filter. Content
		* search lives outside this derivation (see {@link deriveSearchResults}).
		* @param list - sessions list snapshot (`mainView` retention feeds containsCurrent).
		* @param workspaces - real Workspaces in Host group order with caller-projected Session order.
		* @param rowState - registry-global pin and archive sets plus the archived filter.
		* @param statuses - unified UI status by Session.
		* @param view - local expansion arrays.
		* @returns group sections in render order.
		*/
		function deriveGroups(list, workspaces, rowState, statuses, view) {
			const archived = new Set(rowState.archivedSessionIds);
			const pinned = new Set(rowState.pinnedSessionIds);
			const expandedGroups = new Set(view.expandedGroups);
			const current = mainSessionId(list);
			const currentGroup = current === void 0 ? void 0 : owningGroupKey(workspaces, current);
			const groups = [];
			for (const g of groupByWorkspace(list, workspaces, archived, rowState.archivedFilter, view.ungroupedOrder)) {
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
					sessions: expanded ? sectionMembers(g.sessions, pinned, archived).map((session) => sessionNode(session, list, statuses, pinned, archived)) : []
				});
			}
			return groups;
		}
		/**
		* Select complete flat-list membership, independently of archive visibility.
		* @param list - sessions list snapshot.
		* @returns known ordinary Session ids, including archives and only the current blank.
		*/
		function sessionMemberIds(list) {
			return visibleSessionIds(list, [], "show");
		}
		/**
		* Select visible flat-list members without deriving row presentation or ordering.
		* @param list - sessions list snapshot.
		* @param archivedSessionIds - registry-global archive set.
		* @param archivedFilter - archived-row visibility choice.
		* @returns known visible Session ids in list order, including ordinary forks and only the current blank.
		*/
		function visibleSessionIds(list, archivedSessionIds, archivedFilter) {
			const archived = new Set(archivedSessionIds);
			const current = mainSessionId(list);
			return list.ids.filter((id) => {
				const s = list.byId[id];
				return s !== void 0 && sessionVisible(s, current, archived, archivedFilter);
			});
		}
		/**
		* Derive flat rows from the browser's complete ordered Session ids, with
		* pinned rows fronted ahead of the supplied order.
		* @param list - sessions list snapshot used to select the ids.
		* @param sessionIds - complete account members in the selected order, including hidden archives.
		* @param rowState - registry-global pin and archive sets plus the archived filter.
		* @param statuses - unified UI status by Session.
		* @returns flat rows in sectioned order with current status indicators.
		*/
		function deriveFlat(list, sessionIds, rowState, statuses) {
			const archived = new Set(rowState.archivedSessionIds);
			const pinned = new Set(rowState.pinnedSessionIds);
			const current = mainSessionId(list);
			return sectionMembers(sessionIds.flatMap((id) => {
				const session = list.byId[id];
				return session !== void 0 && sessionVisible(session, current, archived, rowState.archivedFilter) ? [session] : [];
			}), pinned, archived).map((session) => sessionNode(session, list, statuses, pinned, archived));
		}
		/**
		* Merge immediate title/Workspace substring matches with ranked Host content
		* matches. Local rows lead newest-first, content-only rows retain backend
		* order, and duplicate sessions receive the backend snippet in place.
		* @param list - session metadata authority.
		* @param workspaces - Workspace membership and display labels.
		* @param query - caller text; surrounding whitespace is ignored.
		* @param archivedSessionIds - registry-global archive set (members match per the archived filter).
		* @param archivedFilter - archived-row visibility choice; search follows it.
		* @param statuses - unified UI status by Session.
		* @param content - ranked Host content-search page.
		* @param limit - protocol-owned maximum merged row count.
		* @returns bounded deduplicated flat rows and a refine-query hint bit.
		*/
		function deriveSearchResults(list, workspaces, query, archivedSessionIds, archivedFilter, statuses, content, limit) {
			const q = query.trim().toLowerCase();
			if (q === "") return {
				items: [],
				hasMore: false
			};
			const archived = new Set(archivedSessionIds);
			const current = mainSessionId(list);
			const workspaceBySession = /* @__PURE__ */ new Map();
			for (const workspace of workspaces) for (const sessionId of workspace.sessionIds) if (!workspaceBySession.has(sessionId)) workspaceBySession.set(sessionId, workspace.title);
			const labelOf = (summary) => workspaceBySession.get(summary.id) ?? workspaceLabel(summary.cwd);
			const contentBySession = /* @__PURE__ */ new Map();
			for (const item of content.items) if (!contentBySession.has(item.sessionId)) contentBySession.set(item.sessionId, item);
			const local = [];
			for (const id of list.ids) {
				const summary = list.byId[id];
				if (summary === void 0 || summary.blank || !sessionVisible(summary, current, archived, archivedFilter)) continue;
				if (sessionTitle(summary).toLowerCase().includes(q) || labelOf(summary).toLowerCase().includes(q)) local.push(summary);
			}
			const localById = new Map(local.map((summary) => [summary.id, summary]));
			const orderedLocal = orderByRecency(local.map((summary) => summary.id), list.byId).map((id) => localById.get(id));
			const ordered = [];
			const included = /* @__PURE__ */ new Set();
			const include = (summary) => {
				if (included.has(summary.id)) return;
				included.add(summary.id);
				ordered.push(summary);
			};
			for (const summary of orderedLocal) include(summary);
			for (const item of content.items) {
				const summary = list.byId[item.sessionId];
				if (summary !== void 0 && !summary.blank && sessionVisible(summary, current, archived, archivedFilter)) include(summary);
			}
			return {
				items: ordered.slice(0, limit).map((summary) => {
					const match = contentBySession.get(summary.id);
					const status = statuses.get(summary.id);
					const pendingInteraction = visiblePendingKind(status?.pendingInteraction?.kind);
					return {
						id: summary.id,
						title: sessionTitle(summary),
						workspace: labelOf(summary),
						running: status?.running ?? summary.running,
						runningSubagentCount: runningChildCount(list, summary.id, statuses),
						...pendingInteraction === void 0 ? {} : { pendingInteraction },
						completed: status?.completionUnread === true,
						archived: archived.has(summary.id),
						...match === void 0 ? {} : { snippet: match.snippet }
					};
				}),
				hasMore: content.hasMore || ordered.length > limit
			};
		}
		/** Normalize separators for comparison without interpreting POSIX backslashes as separators. */
		function folderPath(path) {
			return (/^[A-Za-z]:[/\\]/.test(path) || path.startsWith("\\\\") ? path.replaceAll("\\", "/") : path).replace(/\/+$/, "");
		}
		/**
		* Find the nearest registered ancestor, excluding the Workspace directory itself.
		* Paths use Host spelling; matching is case-sensitive, like Workspace identity.
		* @param path - Workspace directory.
		* @param parents - registered Workspace directory paths.
		* @returns the owning parent path, or undefined when no parent contains the Workspace.
		*/
		function owningParentFolder(path, parents) {
			const child = folderPath(path);
			let owner;
			let length = -1;
			for (const parent of parents) {
				const root = folderPath(parent);
				if (root.length > length && child !== root && child.startsWith(`${root}/`)) {
					owner = parent;
					length = root.length;
				}
			}
			return owner;
		}
		//#endregion
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
		/** Copy read-only projections into the persisted mutable store representation. */
		function copySessionOrders(orders) {
			return Object.fromEntries(Object.entries(orders).map(([key, order]) => [key, [...order]]));
		}
		/**
		* Create the workspace browser viewing store handle.
		* @returns the store handle (spec + type + identity + factory in one).
		*/
		function createWorkspaceViewStore() {
			return (0, _deepseek_ai_dsh_client_store.defineStore)({
				init: () => ({
					groupBy: "workspace",
					orderBy: "updated",
					groupExpansion: {},
					sessionOrderByAccount: {},
					archivedFilter: "default"
				}),
				persist: "dsh.workspace.view.v5",
				actions: {
					setGroupBy: (d, mode) => {
						d.groupBy = mode;
					},
					setOrderBy: (d, mode, initialOrders) => {
						if (mode === d.orderBy) return;
						d.sessionOrderByAccount = mode === "manual" ? copySessionOrders(initialOrders) : {};
						d.orderBy = mode;
					},
					setGroupExpanded: (d, key, expanded) => {
						d.groupExpansion[key] = expanded;
					},
					retainAccountKeys: (d, workspaceKeys) => {
						const retained = new Set(workspaceKeys);
						d.groupExpansion = Object.fromEntries(Object.entries(d.groupExpansion).filter(([key]) => retained.has(key)));
						d.sessionOrderByAccount = Object.fromEntries(Object.entries(d.sessionOrderByAccount).filter(([key]) => retained.has(key)));
						delete d.sessionUpdatedAtByAccount;
					},
					syncSessionOrders: (d, orders) => {
						if (d.orderBy !== "manual") return;
						Object.assign(d.sessionOrderByAccount, copySessionOrders(orders));
					},
					setSessionOrder: (d, accountKey, order, initialOrders) => {
						if (d.orderBy === "updated") d.sessionOrderByAccount = copySessionOrders(initialOrders);
						else Object.assign(d.sessionOrderByAccount, copySessionOrders(initialOrders));
						d.orderBy = "manual";
						d.sessionOrderByAccount[accountKey] = [...order];
					},
					pinSessionOrder: (d, sessionId, accountKeys, source) => {
						const selected = new Set(accountKeys);
						d.sessionOrderByAccount = Object.fromEntries(Object.entries(source.members).map(([key, members]) => {
							const order = reconcileManualOrder(members, d.sessionOrderByAccount[key], source.summaries, source.rowState);
							return [key, selected.has(key) ? [sessionId, ...order.filter((id) => id !== sessionId)] : order];
						}));
					},
					setArchivedFilter: (d, filter) => {
						d.archivedFilter = filter;
					}
				}
			});
		}
		//#endregion
		//#region lib/types/client/pin-order.js
		/**
		* Every account's complete membership: each Workspace, Ungrouped, and the flat list.
		* @param workspaces - current Host Workspaces.
		* @param list - current Session list snapshot.
		* @param rowState - registry-global pin and archive sets.
		* @returns the order source for one pin write.
		*/
		function pinOrderSource(workspaces, list, rowState) {
			const accounted = new Set(workspaces.flatMap((workspace) => workspace.sessionIds));
			return {
				members: Object.fromEntries([
					...workspaces.map((workspace) => [workspace.workspaceId, workspace.sessionIds]),
					["", list.ids.filter((id) => list.byId[id] !== void 0 && !accounted.has(id))],
					[FLAT_SESSION_ORDER_KEY, sessionMemberIds(list)]
				]),
				summaries: list.byId,
				rowState
			};
		}
		/**
		* The accounts a pinned Session leads: its group (or Ungrouped) and the flat list.
		* @param workspaces - current Host Workspaces.
		* @param sessionId - the Session being pinned.
		* @returns the account keys `pinSessionOrder` fronts.
		*/
		function pinOrderAccounts(workspaces, sessionId) {
			return [owningGroupKey(workspaces, sessionId), FLAT_SESSION_ORDER_KEY];
		}
		//#endregion
		//#region lib/types/client/navigation.js
		/** Workspace archive and directory UI capability. */
		/** Structured directory failure exposed to directory UI consumers. */
		var DirectoryBrowseError = class extends Error {
			rpcError;
			name = "DirectoryBrowseError";
			/** @param rpcError - Host directory business failure. */
			constructor(rpcError) {
				super(`directory browse failed: ${rpcError.code}: ${rpcError.message}`);
				this.rpcError = rpcError;
			}
		};
		/** Implements Workspace archive and directory UI operations. */
		var UiWorkspaceService = class extends _deepseek_ai_cordis.Service {
			directoryPicker;
			workspaces;
			sessions;
			view;
			notify;
			/** The latest in-flight connection per Workspace; a request joins it only when both name the same preset. */
			connecting = /* @__PURE__ */ new Map();
			lifetime = new AbortController();
			selection = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)({}, { persist: { name: "dsh.sessions.current" } });
			mainReference;
			/**
			* @param ctx - Client root Context.
			* @param directoryPicker - the directory-picking Remote namespace.
			* @param workspaces - pure Workspace Controller.
			* @param sessions - pure Session Controller.
			* @param view - the browser's viewing-store write set (one instance shared with its registration).
			* @param notify - show one notice through the Workspace notice channel.
			*/
			constructor(ctx, directoryPicker, workspaces, sessions, view, notify) {
				super(ctx, "uiWorkspace");
				this.directoryPicker = directoryPicker;
				this.workspaces = workspaces;
				this.sessions = sessions;
				this.view = view;
				this.notify = notify;
				ctx.effect(() => {
					const stop = this.watchNavigation();
					return () => {
						stop();
						this.lifetime.abort();
						const reference = this.mainReference;
						this.mainReference = void 0;
						reference?.release();
					};
				}, "ui-workspace: Workspace navigation policy");
			}
			connectWorkspace(workspaceId, options = {}) {
				return this.connectBlank(workspaceId, options);
			}
			/**
			* @param reuse - preset for the reused or created blank.
			*/
			async connectBlank(workspaceId, reuse) {
				const workspace = this.workspaces.list.getSnapshot().items.find((item) => item.workspaceId === workspaceId);
				if (workspace === void 0) throw new Error(`uiWorkspace.connectWorkspace: unknown workspace ${workspaceId}`);
				const inflight = this.connecting.get(workspaceId);
				if (inflight !== void 0 && inflight.agentPreset === reuse.agentPreset) return inflight.attempt;
				const attempt = this.createInWorkspace(workspace, reuse).finally(() => {
					if (this.connecting.get(workspaceId)?.attempt === attempt) this.connecting.delete(workspaceId);
				});
				this.connecting.set(workspaceId, {
					agentPreset: reuse.agentPreset,
					attempt
				});
				return attempt;
			}
			/** Name the first reusable member blank; a requested preset also skips blanks listing another preset. */
			createInWorkspace(workspace, options) {
				const archived = this.workspaces.list.getSnapshot().archivedSessionIds;
				const sessions = this.sessions.list.getSnapshot();
				const blank = sessions.ids.find((id) => {
					const summary = sessions.byId[id];
					const listed = summary?.projectionValues?.agentPreset;
					return summary !== void 0 && summary.blank && summary.cwd === workspace.path && workspace.sessionIds.includes(id) && !archived.includes(id) && (options.agentPreset === void 0 || typeof listed !== "string" || listed === options.agentPreset);
				});
				return this.createNamed({
					workspaceId: workspace.workspaceId,
					...blank === void 0 ? {} : { sessionId: blank },
					...options.agentPreset === void 0 ? {} : { agentPreset: options.agentPreset }
				});
			}
			/**
			* Create through the Host. A named blank the Host declined may still read as
			* blank from stale cached list metadata, which hides it from the Session tree;
			* its projections are reloaded so the row reflects its log.
			*/
			async createNamed(request) {
				const sessionId = await this.sessions.create(request);
				const named = request.sessionId;
				if (named !== void 0 && named !== sessionId) this.sessions.refreshProjections(named).catch((reason) => {
					console.warn("declined blank Session projection reload failed:", reason);
				});
				return sessionId;
			}
			/**
			* Reopen a saved blank Session under the preset its log recorded, or under
			* the Host default once that preset no longer activates. Listed values are
			* cached hints that can lag the log after an unclean Host exit, so the
			* Session's projections are reloaded before the preset is read; a Session
			* that still awaits a format migration reloads only those cached hints.
			*/
			async restoreBlank(workspaceId, sessionId) {
				await this.sessions.refreshProjections(sessionId);
				const recorded = this.sessions.list.getSnapshot().byId[sessionId]?.projectionValues?.agentPreset;
				const request = {
					workspaceId,
					sessionId
				};
				if (typeof recorded !== "string") return this.createNamed(request);
				try {
					return await this.createNamed({
						...request,
						agentPreset: recorded
					});
				} catch (error) {
					const code = sessionCreateErrorOf(error)?.rpcError.code;
					if (code !== "agent-preset/not-found" && code !== "agent-preset/invalid") throw error;
					return this.createNamed(request);
				}
			}
			openSession(target) {
				this.replaceMain(target, this.lifetime.signal, "reveal");
			}
			openWorkspace(workspaceId, beforeOpen, options = {}) {
				return this.openWorkspaceSession(workspaceId, beforeOpen, options);
			}
			async openWorkspaceSession(workspaceId, beforeOpen, reuse) {
				const navigation = AbortSignal.any([this.ctx.layout.beginNavigation(), this.lifetime.signal]);
				let sessionId;
				try {
					sessionId = await this.connectBlank(workspaceId, reuse);
				} catch (error) {
					if (!navigation.aborted) this.notify({
						kind: "createFailed",
						message: creationFailureMessage(error)
					});
					throw error;
				}
				if (navigation.aborted) return;
				this.replaceMain(sessionId, navigation, "reveal", beforeOpen);
			}
			async forkSession(sessionId, onCreated, options) {
				return this.sessions.fork({
					sessionId,
					increaseTitle: true,
					...onCreated === void 0 ? {} : { onCreated },
					...options?.allowMigration === void 0 ? {} : { allowMigration: options.allowMigration }
				});
			}
			startSession(workspaceId, options) {
				const { agentPreset, ...draft } = options ?? {};
				const draftOptions = options === void 0 ? void 0 : draft;
				const initializeDraft = draftOptions !== void 0 && (draftOptions.prompt !== void 0 || (draftOptions.whenDraftExists ?? (draftOptions.clearPreviousDraft === true ? "replace" : "keep")) === "replace");
				const workspace = this.workspaces.list.getSnapshot();
				const sessions = this.sessions.list.getSnapshot();
				const current = this.mainReference?.sessionId;
				const currentWorkspaceId = current === void 0 ? void 0 : workspace.items.find((item) => item.sessionIds.includes(current))?.workspaceId;
				const recent = workspace.phase === "ready" && sessions.phase === "ready" ? recentWorkspace(workspace.items, sessions.byId) : void 0;
				const target = workspaceId ?? currentWorkspaceId ?? recent;
				if (target === void 0) {
					if (initializeDraft) {
						this.notify({
							kind: "createFailed",
							message: this.ctx.locale.bind("workspace")("draft.workspaceRequired")
						});
						return;
					}
					this.clearMain();
					return;
				}
				this.openWorkspace(target, initializeDraft ? (id) => {
					const binding = this.sessions.binding(id);
					if (binding === void 0) this.draftPreparationFailed();
					this.prepareDraft(binding, draftOptions);
				} : void 0, agentPreset === void 0 ? {} : { agentPreset }).catch((reason) => {
					console.warn("new session failed:", reason);
				});
			}
			prepareDraft(binding, options) {
				const conversation = this.ctx.get("conversation");
				if (conversation === void 0) this.draftPreparationFailed();
				if (conversation.input.requestDraftInitialization(binding, options) === "blocked") this.draftPreparationFailed();
			}
			draftPreparationFailed() {
				const message = this.ctx.locale.bind("workspace")("draft.initializationFailed");
				this.notify({
					kind: "createFailed",
					message
				});
				throw new Error(message);
			}
			async archiveSession(sessionId, options = {}) {
				await this.workspaces.archiveSession(sessionId, options);
				if (this.mainReference?.sessionId === sessionId) this.clearMain();
			}
			async unarchiveSession(sessionId) {
				await this.workspaces.unarchiveSession(sessionId);
			}
			async pinSession(sessionId) {
				await this.workspaces.pinSession(sessionId);
				const { items, pinnedSessionIds, archivedSessionIds } = this.workspaces.list.getSnapshot();
				this.view.pinSessionOrder(sessionId, pinOrderAccounts(items, sessionId), pinOrderSource(items, this.sessions.list.getSnapshot(), {
					pinnedSessionIds,
					archivedSessionIds
				}));
			}
			async unpinSession(sessionId) {
				await this.workspaces.unpinSession(sessionId);
			}
			async pickDirectory() {
				const result = await this.directoryPicker.pick();
				if (!result.ok) throw new Error(`directory picker failed: ${result.error.message}`);
				return result.value;
			}
			async listDirectory(path, signal) {
				const result = await this.directoryPicker.list(path, signal);
				if (!result.ok) throw new DirectoryBrowseError(result.error);
				return result.value;
			}
			async createDirectory(path, name) {
				const result = await this.directoryPicker.createDirectory(path, name);
				if (!result.ok) throw new DirectoryBrowseError(result.error);
				return result.value;
			}
			watchNavigation() {
				let initial = "waiting";
				const reconcile = () => {
					if (this.lifetime.signal.aborted) return;
					if (this.clearArchivedCurrent()) return;
					if (initial !== "waiting") return;
					const workspace = this.workspaces.list.getSnapshot();
					const sessions = this.sessions.list.getSnapshot();
					if (workspace.phase !== "ready" || sessions.phase !== "ready") return;
					if (this.mainReference !== void 0) {
						initial = "done";
						return;
					}
					initial = "connecting";
					this.restoreSelection(workspace, sessions).then(() => {
						initial = "done";
					}, (reason) => {
						if (this.lifetime.signal.aborted) return;
						initial = "waiting";
						console.warn("initial Session restoration failed:", reason);
					});
				};
				const disposeWorkspaces = this.workspaces.list.subscribe(reconcile);
				const disposeSessions = this.sessions.list.subscribe(reconcile);
				reconcile();
				return () => {
					this.lifetime.abort();
					disposeSessions();
					disposeWorkspaces();
				};
			}
			async restoreSelection(workspaces, sessions) {
				const saved = this.selection.getSnapshot();
				if (saved.subagentAddress !== void 0) {
					this.replaceMain(saved.subagentAddress, this.lifetime.signal, "preserve");
					return;
				}
				const summary = saved.sessionId === void 0 ? void 0 : sessions.byId[saved.sessionId];
				const workspace = summary === void 0 ? void 0 : workspaces.items.find((item) => item.sessionIds.includes(summary.id));
				if (summary !== void 0 && (!summary.blank || workspace === void 0)) {
					this.replaceMain(summary.id, this.lifetime.signal, "preserve");
					return;
				}
				const navigation = AbortSignal.any([this.ctx.layout.beginNavigation(), this.lifetime.signal]);
				let sessionId;
				if (summary !== void 0 && workspace !== void 0 && summary.cwd === workspace.path && !workspaces.archivedSessionIds.includes(summary.id)) sessionId = await this.restoreBlank(workspace.workspaceId, summary.id);
				let target = workspace?.workspaceId ?? recentWorkspace(workspaces.items, sessions.byId);
				if (target === void 0 && workspaces.items.length === 0 && sessions.ids.length === 0) {
					const prepared = await this.initializeDefaultWorkspace(navigation);
					if (navigation.aborted) return;
					target = prepared?.workspaceId;
				}
				if (sessionId === void 0 && target !== void 0) sessionId = await this.connectWorkspace(target);
				if (sessionId !== void 0 && !navigation.aborted) this.replaceMain(sessionId, navigation, "preserve");
			}
			async initializeDefaultWorkspace(signal) {
				try {
					return await this.workspaces.initializeDefault(signal);
				} catch (_error) {
					if (!signal.aborted) this.notify({ kind: "defaultWorkspaceFailed" });
					return;
				}
			}
			/** @returns true when an archived current selection was cleared. */
			clearArchivedCurrent() {
				const current = this.mainReference?.sessionId;
				if (current === void 0 || !this.workspaces.list.getSnapshot().archivedSessionIds.includes(current)) return false;
				this.clearMain();
				return true;
			}
			clearMain() {
				const previous = this.mainReference;
				this.mainReference = void 0;
				this.selection.set({});
				previous?.release();
				this.ctx.layout.selectPanel(null);
			}
			replaceMain(target, signal, panel, beforeOpen) {
				signal.throwIfAborted();
				const reference = this.sessions.retain(target, { source: "mainView" });
				try {
					signal.throwIfAborted();
					beforeOpen?.(reference.sessionId);
					if (signal.aborted) {
						reference.release();
						return;
					}
					const subagentAddress = typeof target === "string" ? this.sessions.subagentAddress(reference.sessionId) : target;
					this.selection.set({
						sessionId: reference.sessionId,
						...subagentAddress === void 0 ? {} : { subagentAddress }
					});
				} catch (error) {
					reference.release();
					throw error;
				}
				const previous = this.mainReference;
				this.mainReference = reference;
				previous?.release();
				if (panel === "reveal") this.ctx.layout.selectPanel(null);
			}
		};
		/**
		* `error` as the Session Controller's creation failure, or undefined when it
		* is not one. Client plugin bundles do not share error-class identity, so the
		* name decides.
		*/
		function sessionCreateErrorOf(error) {
			return error instanceof Error && error.name === "SessionCreateError" ? error : void 0;
		}
		/**
		* The words a failed Session creation is reported in: a Host refusal keeps its
		* stable code and message; any other failure keeps its own message.
		*/
		function creationFailureMessage(error) {
			const refused = sessionCreateErrorOf(error);
			if (refused !== void 0) return `${refused.rpcError.code}: ${refused.rpcError.message}`;
			return error instanceof Error ? error.message : String(error);
		}
		/** Stable tie-breaking follows Host Workspace order. */
		function recentWorkspace(workspaces, sessions) {
			let selected;
			let selectedTime = Number.NEGATIVE_INFINITY;
			for (const workspace of workspaces) {
				let latest = Number.NEGATIVE_INFINITY;
				for (const sessionId of workspace.sessionIds) {
					const session = sessions[sessionId];
					if (session !== void 0) latest = Math.max(latest, session.updatedAt);
				}
				if (latest === Number.NEGATIVE_INFINITY) latest = Date.parse(workspace.createdAt);
				if (selected === void 0 || latest > selectedTime) {
					selected = workspace.workspaceId;
					selectedTime = latest;
				}
			}
			return selected;
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
		/**
		* The text one Workspace is labeled with. A Workspace still carrying the
		* automatic first-use title reads as the caller's localized default name; every
		* other title reads verbatim in every language. A title the user typed as
		* exactly {@link DEFAULT_WORKSPACE_DIRECTORY} is labeled as the default too;
		* nothing else depends on the distinction.
		* @param title - stored Workspace title.
		* @param localizedDefault - the default Workspace name in the active language.
		* @returns the title to display.
		*/
		function workspaceDisplayTitle(title, localizedDefault) {
			return title === "default-workspace" ? localizedDefault : title;
		}
		//#endregion
		//#region \0dsh-css:/home/runner/work/deepseek-harness/deepseek-harness/packages/client/ui-workspace/src/client/rows/Rows.module.css.mjs
		const css$3 = ".YDXeBa_projectRow,.YDXeBa_sessionRow{border-radius:var(--dsw-radius-md);padding:0 8px;cursor:pointer;user-select:none;color:var(--dsw-alias-label-primary);align-items:center;gap:6px;padding-inline-start:calc(8px + var(--dsh-workspace-indent,0px));display:flex}.YDXeBa_projectRow:hover,.YDXeBa_sessionRow:hover,.YDXeBa_sessionRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultRow{box-sizing:border-box;border-radius:var(--dsw-radius-lg);cursor:pointer;text-align:left;width:100%;min-height:48px;color:var(--dsw-alias-label-primary);background:0 0;border:none;flex-direction:column;align-items:stretch;padding:4px 8px;display:flex}.YDXeBa_searchResultRow:hover,.YDXeBa_searchResultRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultHeading{align-items:center;min-width:0;display:flex}.YDXeBa_searchResultTitle{text-overflow:ellipsis;white-space:nowrap;flex:0 auto;min-width:0;margin-left:4px;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_searchResultMeta{align-items:center;gap:6px;min-width:0;margin-left:20px;display:flex}.YDXeBa_searchResultWorkspace,.YDXeBa_searchResultSnippet{text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:17px;overflow:hidden}.YDXeBa_searchResultWorkspace{max-width:40%;color:var(--dsw-alias-label-tertiary);flex:none}.YDXeBa_searchResultWorkspace:only-child{max-width:100%}.YDXeBa_searchResultSnippet{min-width:0;color:var(--dsw-alias-label-secondary);flex:1}.YDXeBa_projectRow{box-sizing:border-box;align-items:center;height:34px}.YDXeBa_projectRow .YDXeBa_rowActions{height:20px}.YDXeBa_sessionRow{gap:0;height:32px}.YDXeBa_sessionRow .YDXeBa_title{margin:0 6px 0 4px}.YDXeBa_slot{width:16px;height:20px;color:var(--dsw-alias-label-tertiary);flex:none;justify-content:center;align-items:center;display:inline-flex}.YDXeBa_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.YDXeBa_folderActive{color:var(--dsw-alias-state-business-primary)}.YDXeBa_projectRow .YDXeBa_chevron{display:none}.YDXeBa_projectRow:hover .YDXeBa_chevron{display:inline-flex}.YDXeBa_projectRow:hover .YDXeBa_folder{display:none}.YDXeBa_arrow{transition:transform .15s var(--ds-ease-in-out)}.YDXeBa_arrowOpen{transform:rotate(90deg)}.YDXeBa_projectText{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.YDXeBa_title{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_renameInput{border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-button-elevated-fill);min-width:0;color:inherit;outline:none;padding:0 2px;font-size:14px;line-height:20px}.YDXeBa_sessionRow .YDXeBa_title{flex:1}.YDXeBa_sessionRow .YDXeBa_title[data-scrolled]{mask-image:linear-gradient(90deg,#0000,#000 12px)}.YDXeBa_sessionRow .YDXeBa_title[data-clipped]{mask-image:linear-gradient(270deg,#0000,#000 12px)}.YDXeBa_sessionRow .YDXeBa_title[data-scrolled][data-clipped]{mask-image:linear-gradient(90deg,#0000,#000 12px calc(100% - 12px),#0000)}.YDXeBa_meta{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px;overflow:hidden}.YDXeBa_time{color:var(--dsw-alias-label-tertiary);flex:none;font-size:10px;line-height:16px}.YDXeBa_pinIndicator{width:16px;height:20px;color:var(--dsw-alias-label-caption);flex:none;justify-content:center;align-items:center;margin-left:6px;display:inline-flex}.YDXeBa_sessionRow.YDXeBa_archived .YDXeBa_title,.YDXeBa_searchResultRow.YDXeBa_archived .YDXeBa_searchResultTitle,.YDXeBa_searchResultRow.YDXeBa_archived .YDXeBa_searchResultWorkspace,.YDXeBa_searchResultRow.YDXeBa_archived .YDXeBa_searchResultSnippet{color:var(--dsw-alias-label-caption)}.YDXeBa_dot{flex:none}.YDXeBa_rowActions{flex:none;align-items:center;gap:15px;display:none}.YDXeBa_projectRow:hover .YDXeBa_rowActions,.YDXeBa_sessionRow:hover .YDXeBa_rowActions,.YDXeBa_searchResultRow:hover .YDXeBa_rowActions,.YDXeBa_projectRow.YDXeBa_menuOpen .YDXeBa_rowActions,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_rowActions{display:inline-flex}.YDXeBa_searchResultHeading .YDXeBa_rowActions{margin-left:auto}.YDXeBa_sessionRow:hover .YDXeBa_time,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_time,.YDXeBa_sessionRow:hover .YDXeBa_pinIndicator,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_pinIndicator{display:none}@media (hover:hover){.YDXeBa_sessionRow:hover .YDXeBa_title,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_title{text-overflow:clip}}.YDXeBa_projectRow.YDXeBa_menuOpen,.YDXeBa_sessionRow.YDXeBa_menuOpen{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_sessionRow.YDXeBa_dropBefore,.YDXeBa_sessionRow.YDXeBa_dropAfter{position:relative}.YDXeBa_sessionRow.YDXeBa_dropBefore:before,.YDXeBa_sessionRow.YDXeBa_dropAfter:after{content:\"\";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:4px}.YDXeBa_sessionRow.YDXeBa_dropBefore:before{top:-7px}.YDXeBa_sessionRow.YDXeBa_dropAfter:after{bottom:-7px}.YDXeBa_hoverContent{flex-direction:column;gap:8px;display:flex}.YDXeBa_hoverTitle{color:#fff;overflow-wrap:break-word;font-size:14px;line-height:20px}.YDXeBa_hoverPath{color:#cfd3d6;word-break:break-all;font-size:12px;line-height:16px}.YDXeBa_hoverTime{color:#cfd3d6;font-size:12px;line-height:16px}.YDXeBa_hoverStatus{color:#adb2b8;align-items:center;gap:8px;font-size:12px;line-height:20px;display:flex}.YDXeBa_hoverArchived svg{flex-shrink:0;margin:0 -4px}.YDXeBa_iconButton{border-radius:var(--dsw-radius-xs);cursor:pointer;width:16px;height:16px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.YDXeBa_iconButton:hover{color:var(--dsw-alias-label-primary)}.YDXeBa_chevron{color:var(--dsw-alias-label-caption)}@media (prefers-reduced-motion:reduce){.YDXeBa_arrow{transition:none;animation:none}}";
		const tagId$3 = "@deepseek-ai/dsh-client-ui-workspace/Rows.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-workspace";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var Rows_module_css_default = {
			"archived": "YDXeBa_archived",
			"arrow": "YDXeBa_arrow",
			"arrowOpen": "YDXeBa_arrowOpen",
			"chevron": "YDXeBa_chevron",
			"dot": "YDXeBa_dot",
			"dropAfter": "YDXeBa_dropAfter",
			"dropBefore": "YDXeBa_dropBefore",
			"folder": "YDXeBa_folder",
			"folderActive": "YDXeBa_folderActive",
			"hoverArchived": "YDXeBa_hoverArchived",
			"hoverContent": "YDXeBa_hoverContent",
			"hoverPath": "YDXeBa_hoverPath",
			"hoverStatus": "YDXeBa_hoverStatus",
			"hoverTime": "YDXeBa_hoverTime",
			"hoverTitle": "YDXeBa_hoverTitle",
			"iconButton": "YDXeBa_iconButton",
			"menuOpen": "YDXeBa_menuOpen",
			"meta": "YDXeBa_meta",
			"pinIndicator": "YDXeBa_pinIndicator",
			"projectRow": "YDXeBa_projectRow",
			"projectText": "YDXeBa_projectText",
			"renameInput": "YDXeBa_renameInput",
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
		* time->ellipsis, action buttons) are CSS-only, and a session row's clipped
		* title marquees programmatically while the row is hovered. Workspace row
		* menus are visual-only except Rename/Delete. A Session row's "..." menu and
		* its hover buttons are the `sidebar.workspaces.session.menu.item` and
		* `sidebar.workspaces.session.row.action` lists, rendered through the
		* browser's `renderSlot` with the menu's open state as the occurrence's hook
		* context; this package's own actions are entries like any plugin's. The
		* session and workspace hover cards are suppressed while a menu is open.
		*/
		/** Row display title: blank rows show the localized New Session label. */
		function displayTitle(node, t) {
			return node.blank ? t("session.new") : node.title || t("session.untitled");
		}
		const MIN_TITLE_REVEAL_PX = 8;
		const TITLE_MARQUEE_PX_PER_MS = .03;
		/**
		* Place the title's scroll position and publish the stylesheet's fade-mask
		* hooks: `data-scrolled` while the title has left its start (left fade) and
		* `data-clipped` while text remains beyond the right edge (right fade).
		* @param title - the row's clipping title element.
		* @param left - scroll offset in CSS pixels.
		* @param range - the title's maximum scroll offset in CSS pixels.
		*/
		function placeTitle(title, left, range) {
			if (typeof title.scrollTo === "function") title.scrollTo({
				left,
				behavior: "instant"
			});
			else title.scrollLeft = left;
			if (left > 0) title.dataset.scrolled = "";
			else delete title.dataset.scrolled;
			if (left < range) title.dataset.clipped = "";
			else delete title.dataset.clipped;
		}
		/**
		* Return the title to its resting state: scrolled to the start with both fade
		* masks off, so the resting ellipsis renders at full strength.
		* @param title - the row's clipping title element.
		*/
		function restTitle(title) {
			if (typeof title.scrollTo === "function") title.scrollTo({
				left: 0,
				behavior: "instant"
			});
			else title.scrollLeft = 0;
			delete title.dataset.scrolled;
			delete title.dataset.clipped;
		}
		/**
		* Marquee a title wider than its one-line cell while its row is hovered: the
		* title clips its own text, so entering crawls it at a constant speed until the
		* far edge (a fork's incremented title, for example) is in view, then rests
		* there under the pointer. Overflow of at most {@link MIN_TITLE_REVEAL_PX}
		* stays put — a barely-clipped title moving a few pixels reads as jitter, not a
		* reveal. Leaving returns the title to the start in one step, because the
		* resting ellipsis and the narrowed cell would otherwise meet the text while it
		* travelled back. Reduced motion jumps to the far edge instead of crawling.
		* @param title - ref to the row's clipping title element.
		* @returns stable pointer enter/leave handlers for the row.
		*/
		function useTitleMarquee(title) {
			const frame = (0, react.useRef)(0);
			(0, react.useEffect)(() => () => {
				cancelAnimationFrame(frame.current);
			}, []);
			return (0, react.useMemo)(() => ({
				enter: () => {
					/* v8 ignore next -- defensive: the title span renders unconditionally. */
					if (title.current === null) return;
					const element = title.current;
					const range = element.scrollWidth - element.clientWidth;
					if (range <= MIN_TITLE_REVEAL_PX) return;
					if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
						placeTitle(element, range, range);
						return;
					}
					cancelAnimationFrame(frame.current);
					let previous;
					let position = 0;
					const step = (now) => {
						position += previous === void 0 ? 0 : (now - previous) * TITLE_MARQUEE_PX_PER_MS;
						previous = now;
						placeTitle(element, Math.min(position, range), range);
						if (position < range) frame.current = requestAnimationFrame(step);
					};
					frame.current = requestAnimationFrame(step);
				},
				leave: () => {
					cancelAnimationFrame(frame.current);
					/* v8 ignore next -- defensive: the title span renders unconditionally. */
					if (title.current === null) return;
					restTitle(title.current);
				}
			}), [title]);
		}
		/** Localized compact relative time ("刚刚"/"5分钟" in zh, "now"/"5min" in en). */
		function timeLabel(updatedAt, now, t) {
			const { unit, n } = (0, _deepseek_ai_dsh_client_ui_primitives.relativeTime)(updatedAt, now);
			return unit === "now" ? t("time.now") : t(`time.${unit}`, { n });
		}
		/** Hover-card variant: distances wrap in the ago template; the now bucket stays bare (no "now ago"). */
		function hoverTimeLabel(updatedAt, now, t) {
			const { unit, n } = (0, _deepseek_ai_dsh_client_ui_primitives.relativeTime)(updatedAt, now);
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
		* @param props.containsCurrentDescendant - highlight an ancestor even when its subtree is collapsed.
		* @param props.onToggle - expand/collapse the group.
		* @param props.onCreate - start a frontend Session inside this Workspace.
		* @param props.drag - optional workspace-row drag wiring.
		* @param props.home - host account home for POSIX hover-path abbreviation.
		* @param props.t - the browser root's locale seat.
		* @returns the row element.
		*/
		function ProjectRowItem({ group, containsCurrentDescendant = false, onToggle, onCreate, actions, drag, home, newShortcut, t }) {
			const row = group;
			const label = row.workspaceId === void 0 ? t("group.ungrouped") : row.label;
			const active = containsCurrentDescendant || group.expanded && group.containsCurrent;
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
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutlineRegular, {})
			}, {
				id: "delete",
				label: t("delete.workspace"),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutlineRegular, {}),
				danger: true
			}];
			const ownRow = (0, react_jsx_runtime.jsxs)("div", {
				className: clsx(Rows_module_css_default.projectRow, menuOpen && Rows_module_css_default.menuOpen),
				"data-row-key": `workspace:${group.key}`,
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
						children: row.expanded ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenRegular, {}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderCloseRegular, {})
					}),
					(0, react_jsx_runtime.jsx)("span", {
						className: clsx(Rows_module_css_default.slot, Rows_module_css_default.chevron),
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTriangleRightFillRegular, { className: clsx(Rows_module_css_default.arrow, row.expanded && Rows_module_css_default.arrowOpen) })
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
								children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutlineRegular, {})
							})
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
							label: t("actions.newSession"),
							shortcutKeys: newShortcut?.keys,
							side: "bottom",
							align: "end",
							delayMs: 500,
							portal: true,
							children: (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: Rows_module_css_default.iconButton,
								"aria-keyshortcuts": newShortcut?.aria,
								"aria-label": t("actions.newSession.aria", { name: label }),
								onClick: (e) => {
									e.stopPropagation();
									onCreate();
								},
								children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconNewChatOutlineRegular, {})
							})
						})]
					})
				]
			});
			if (row.createdAt === void 0) return ownRow;
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
				anchor: ownRow,
				content: (0, react_jsx_runtime.jsx)(WorkspaceHoverContent, {
					label: row.label,
					cwd: row.cwd === void 0 ? void 0 : abbreviateHomePath(row.cwd, home),
					createdAt: row.createdAt,
					t
				}),
				openDelayMs: 800,
				grouped: true,
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
						label: t("status.waitingApproval"),
						trailingLabel: t("status.compact.approval")
					};
					break;
				case "plan-review":
					pending = {
						state: "warning",
						label: t("status.planReview"),
						trailingLabel: t("status.compact.planReview")
					};
					break;
				case "question":
					pending = {
						state: "warning",
						label: t("status.waitingAnswer"),
						trailingLabel: t("status.compact.answer")
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
				state: "idle",
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
		/** Non-interactive pinned-row marker; the enclosing row remains the only action. */
		function PinnedIndicator({ t }) {
			const label = t("row.pinned");
			return (0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.pinIndicator,
				role: "img",
				"aria-label": label,
				title: label,
				children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPinFillRegular, { size: 14 })
			});
		}
		/**
		* Hover-card body: full title, relative time, the Session's own scheduled-task
		* section, and every relevant live status. The task section sits above the
		* status lines so they stay the card's trailing status line.
		*/
		function SessionHoverContent({ node, now, renderSlot, t }) {
			const statuses = sessionStatuses(node, t).filter((status) => !(node.archived && (status.state === "done" || status.state === "idle")));
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
					renderSlot("sidebar.session.row.hover", { sessionId: node.id }),
					statuses.map((status) => (0, react_jsx_runtime.jsxs)("div", {
						className: Rows_module_css_default.hoverStatus,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: status.state }), (0, react_jsx_runtime.jsx)("span", { children: status.label })]
					}, status.label)),
					node.archived && (0, react_jsx_runtime.jsxs)("div", {
						className: clsx(Rows_module_css_default.hoverStatus, Rows_module_css_default.hoverArchived),
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutlineRegular, { size: 14 }), (0, react_jsx_runtime.jsx)("span", { children: t("row.archived") })]
					})
				]
			});
		}
		/**
		* One flat search result: title, Workspace context, and optional content
		* excerpt. Search navigation opens the session only; it does not address an
		* event inside the conversation. Archived rows carry a hover unarchive
		* button, because search is where the filter surfaces them for recovery.
		* @param props.result - merged local/content search row.
		* @param props.currentId - selected session id.
		* @param props.onOpen - open the selected session.
		* @param props.onUnarchive - unarchive an archived result row.
		* @param props.t - Workspace-browser translation seat.
		* @returns the result row.
		*/
		function SearchResultItem({ result, currentId, onOpen, onUnarchive, t }) {
			const selected = result.id === currentId;
			const statuses = sessionStatuses(result, t);
			const primaryStatus = statuses[0];
			return (0, react_jsx_runtime.jsxs)("div", {
				className: clsx(Rows_module_css_default.searchResultRow, selected && Rows_module_css_default.selected, result.archived && Rows_module_css_default.archived),
				role: "treeitem",
				"aria-selected": selected,
				"aria-description": result.archived ? t("toast.archivedNotOpenable") : void 0,
				onClick: () => {
					onOpen(result.id);
				},
				children: [(0, react_jsx_runtime.jsxs)("span", {
					className: Rows_module_css_default.searchResultHeading,
					children: [
						(0, react_jsx_runtime.jsx)("span", {
							className: Rows_module_css_default.slot,
							children: !result.archived && primaryStatus.state !== "idle" && (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: Rows_module_css_default.searchResultTitle,
							children: result.title || t("session.untitled")
						}),
						result.archived && (0, react_jsx_runtime.jsx)("span", {
							className: Rows_module_css_default.rowActions,
							children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
								label: t("actions.unarchive"),
								side: "bottom",
								align: "end",
								delayMs: 500,
								portal: true,
								children: (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: Rows_module_css_default.iconButton,
									"aria-label": t("menu.unarchiveSession"),
									onClick: (e) => {
										e.stopPropagation();
										onUnarchive(result.id);
									},
									children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconUnarchiveOutlineRegular, { size: 14 })
								})
							})
						})
					]
				}), (0, react_jsx_runtime.jsxs)("span", {
					className: Rows_module_css_default.searchResultMeta,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: Rows_module_css_default.searchResultWorkspace,
						children: result.workspace || t("group.ungrouped")
					}), result.snippet !== void 0 && (0, react_jsx_runtime.jsx)("span", {
						className: Rows_module_css_default.searchResultSnippet,
						children: result.snippet
					})]
				})]
			});
		}
		/**
		* One top-level 32px session row: leading 16px cell (status dot, or the
		* leading seat while the row's primary state is idle), title, relative time or
		* compact pending label, and the row actions menu. A row that owns a state dot
		* keeps that cell and renders no seat, so an ambient automation mark never
		* appears beside the row's own state dot. An archived row keeps the cell blank:
		* neither marker renders there, and its live status stays on the hover card.
		* @param props.node - derived session node.
		* @param props.currentId - selected session id (row highlight).
		* @param props.now - epoch ms for relative-time formatting.
		* @param props.onOpen - open a session by id.
		* @param props.onRenameRequest - open the rename dialog from a title double-click (id + current title).
		* @param props.renderSlot - child-seat renderer for the row's action lists
		* (`sidebar.workspaces.session.menu.item` / `sidebar.workspaces.session.row.action`),
		* its leading decoration, and its hover-card section.
		* @param props.onReveal - scroll this row into view after search navigation, then acknowledge it.
		* @param props.drag - optional row-drag target wiring; blank rows cannot start a drag.
		* @param props.t - the browser root's locale seat.
		* @returns the session row.
		*/
		function SessionNodeItem({ node, currentId, now, onOpen, onRenameRequest, renderSlot, onReveal, drag, t }) {
			const row = node;
			const title = displayTitle(node, t);
			const selected = node.id === currentId;
			const statuses = sessionStatuses(node, t);
			const primaryStatus = statuses[0];
			const showStatus = primaryStatus.state !== "idle";
			const draggable = drag !== void 0 && !row.blank && !row.archived;
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
			const menuOpenState = (0, react.useMemo)(() => [menuOpen, setMenuOpen], [menuOpen]);
			const rowRef = (0, react.useRef)(null);
			const titleRef = (0, react.useRef)(null);
			const marquee = useTitleMarquee(titleRef);
			(0, react.useEffect)(() => {
				if (onReveal === void 0) return;
				rowRef.current?.scrollIntoView({ block: "nearest" });
				onReveal();
			}, [onReveal]);
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
				anchor: (0, react_jsx_runtime.jsxs)("div", {
					ref: rowRef,
					"data-row-key": `session:${node.id}`,
					className: clsx(Rows_module_css_default.sessionRow, selected && Rows_module_css_default.selected, menuOpen && Rows_module_css_default.menuOpen, row.archived && Rows_module_css_default.archived, drag?.marker === "before" && Rows_module_css_default.dropBefore, drag?.marker === "after" && Rows_module_css_default.dropAfter),
					role: "treeitem",
					"aria-selected": selected,
					"aria-description": row.archived ? t("toast.archivedNotOpenable") : void 0,
					onClick: () => {
						onOpen(node.id);
					},
					onPointerEnter: marquee.enter,
					onPointerLeave: marquee.leave,
					draggable,
					onDragStart: !draggable ? void 0 : (e) => {
						e.dataTransfer.effectAllowed = "move";
						e.dataTransfer.setData("text/plain", node.id);
						drag.start();
					},
					onDragEnd: !draggable ? void 0 : drag.end,
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
						(0, react_jsx_runtime.jsx)("span", {
							className: Rows_module_css_default.slot,
							children: !row.archived && !row.blank && (showStatus ? (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses }) : renderSlot("sidebar.session.row.leading", { sessionId: node.id }))
						}),
						(0, react_jsx_runtime.jsx)("span", {
							ref: titleRef,
							className: Rows_module_css_default.title,
							onDoubleClick: row.blank ? void 0 : (e) => {
								e.stopPropagation();
								onRenameRequest(node.id, row.title);
							},
							children: title
						}),
						!row.blank && (0, react_jsx_runtime.jsx)("span", {
							className: Rows_module_css_default.time,
							"aria-hidden": primaryStatus.trailingLabel === void 0 ? void 0 : true,
							children: primaryStatus.trailingLabel ?? timeLabel(row.updatedAt, now, t)
						}),
						row.pinned && !row.archived && (0, react_jsx_runtime.jsx)(PinnedIndicator, { t }),
						!row.blank && (0, react_jsx_runtime.jsxs)("span", {
							className: Rows_module_css_default.rowActions,
							onClick: (e) => {
								e.stopPropagation();
							},
							children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
								open: menuOpen,
								onClose: () => {
									setMenuOpen(false);
								},
								portal: true,
								closeOnPointerLeave: true,
								anchor: (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: Rows_module_css_default.iconButton,
									"aria-label": t("actions.session.aria", { name: title }),
									onClick: () => {
										setMenuOpen((v) => !v);
									},
									children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutlineRegular, {})
								}),
								children: renderSlot("sidebar.workspaces.session.menu.item", {
									sessionId: node.id,
									displayTitle: row.title
								}, { hookContext: menuOpenState })
							}), renderSlot("sidebar.workspaces.session.row.action", {
								sessionId: node.id,
								displayTitle: row.title
							})]
						})
					]
				}),
				content: (0, react_jsx_runtime.jsx)(SessionHoverContent, {
					node,
					now,
					renderSlot,
					t
				}),
				openDelayMs: 800,
				grouped: true,
				disabled: menuOpen || drag?.active === true,
				copyText: row.blank || row.title === "" ? void 0 : row.title,
				copyLabel: t("copy"),
				copiedLabel: t("hover.copied")
			});
		}
		//#endregion
		//#region \0dsh-css:/home/runner/work/deepseek-harness/deepseek-harness/packages/client/ui-workspace/src/client/rows/AnimatedRows.module.css.mjs
		const css$2 = ".Qg_5Eq_exits{contain:strict;pointer-events:none;position:absolute;inset:0;overflow:clip}";
		const tagId$2 = "@deepseek-ai/dsh-client-ui-workspace/AnimatedRows.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-workspace";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var AnimatedRows_module_css_default = { "exits": "Qg_5Eq_exits" };
		//#endregion
		//#region lib/types/client/rows/AnimatedRows.js
		/** React-commit-driven movement and entry/exit fades for the sidebar's keyed rows. */
		const ROW_FADE_MS = 100;
		const ROW_GLIDE_MS = 200;
		function sameRows(previous, next) {
			return previous.rowKeys.length === next.rowKeys.length && previous.rowKeys.every((key, index) => key === next.rowKeys[index]);
		}
		function intersects(row, viewport) {
			return row.bottom > viewport.top && row.top < viewport.bottom && row.right > viewport.left && row.left < viewport.right;
		}
		/**
		* Animates keyed sidebar rows only when their rendered membership or order changes.
		* Motion starts after the first pointer or keyboard input inside the mounted list.
		* The parent supplies a positioned container for the inert exit overlay.
		*/
		var AnimatedRows = class extends react.Component {
			armed = false;
			list = (0, react.createRef)();
			overlay = (0, react.createRef)();
			movements = /* @__PURE__ */ new Map();
			exits = /* @__PURE__ */ new Map();
			getSnapshotBeforeUpdate(previous) {
				const list = this.list.current;
				if (!this.armed || sameRows(previous, this.props) || previous.resetKey !== this.props.resetKey || !previous.ready || !this.props.ready || list === null || typeof list.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
				const viewport = list.getBoundingClientRect();
				const positions = this.readPositions();
				const nextKeys = new Set(this.props.rowKeys);
				const removed = /* @__PURE__ */ new Map();
				for (const [key, row] of positions) {
					if (nextKeys.has(key) || !intersects(row.rect, viewport)) continue;
					const clone = row.element.cloneNode(true);
					clone.removeAttribute("data-row-key");
					clone.inert = true;
					clone.style.setProperty("--dsh-workspace-indent", getComputedStyle(row.element).getPropertyValue("--dsh-workspace-indent"));
					removed.set(key, {
						...row,
						element: clone
					});
				}
				return {
					positions,
					removed
				};
			}
			componentDidUpdate(previous, _state, snapshot) {
				if (snapshot === null) {
					if (!sameRows(previous, this.props) || previous.resetKey !== this.props.resetKey || previous.ready !== this.props.ready) this.clear();
					return;
				}
				this.cancelMovements();
				const list = this.list.current;
				const overlay = this.overlay.current;
				const viewport = list.getBoundingClientRect();
				const origin = overlay.getBoundingClientRect();
				const positions = this.readPositions();
				for (const [key, row] of positions) {
					this.removeExit(key);
					const previousRow = snapshot.positions.get(key);
					if (!intersects(row.rect, viewport) && (previousRow === void 0 || !intersects(previousRow.rect, viewport))) continue;
					if (previousRow === void 0) {
						this.move(row.element, [{ opacity: 0 }, { opacity: 1 }], ROW_FADE_MS);
						continue;
					}
					const dx = previousRow.rect.left - row.rect.left;
					const dy = previousRow.rect.top - row.rect.top;
					if (dx === 0 && dy === 0 && previousRow.opacity === 1) continue;
					this.move(row.element, [{
						transform: `translate(${String(dx)}px, ${String(dy)}px)`,
						opacity: previousRow.opacity
					}, {
						transform: "translate(0, 0)",
						opacity: 1
					}], ROW_GLIDE_MS);
				}
				for (const [key, row] of snapshot.removed) {
					const { element } = row;
					this.removeExit(key);
					Object.assign(element.style, {
						position: "absolute",
						margin: "0",
						transform: "none",
						boxSizing: "border-box",
						left: `${String(row.rect.left - origin.left)}px`,
						top: `${String(row.rect.top - origin.top)}px`,
						width: `${String(row.rect.width)}px`,
						height: `${String(row.rect.height)}px`
					});
					overlay.append(element);
					const animation = element.animate([{ opacity: row.opacity }, { opacity: 0 }], {
						duration: ROW_FADE_MS,
						easing: "ease-out",
						fill: "forwards"
					});
					this.exits.set(key, {
						element,
						animation
					});
					animation.onfinish = () => {
						this.removeExit(key);
					};
				}
			}
			componentWillUnmount() {
				this.clear();
			}
			readPositions() {
				const rows = this.list.current.querySelectorAll("[data-row-key]");
				return new Map(Array.from(rows, (element) => [element.dataset.rowKey, {
					element,
					rect: element.getBoundingClientRect(),
					opacity: this.movements.has(element) ? Number(getComputedStyle(element).opacity) : 1
				}]));
			}
			move(element, keyframes, duration) {
				const animation = element.animate(keyframes, {
					duration,
					easing: "ease-out"
				});
				this.movements.set(element, animation);
				animation.onfinish = () => {
					this.movements.delete(element);
					animation.cancel();
				};
			}
			cancelMovements() {
				for (const animation of this.movements.values()) {
					animation.onfinish = null;
					animation.cancel();
				}
				this.movements.clear();
			}
			removeExit(key) {
				const exit = this.exits.get(key);
				if (exit === void 0) return;
				exit.animation.onfinish = null;
				exit.animation.cancel();
				exit.element.remove();
				this.exits.delete(key);
			}
			clear() {
				this.cancelMovements();
				for (const key of this.exits.keys()) this.removeExit(key);
			}
			render() {
				return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("div", {
					ref: this.list,
					className: this.props.className,
					role: "tree",
					"aria-label": this.props.label,
					onPointerDownCapture: () => {
						this.armed = true;
					},
					onKeyDownCapture: () => {
						this.armed = true;
					},
					children: this.props.children
				}), (0, react_jsx_runtime.jsx)("div", {
					ref: this.overlay,
					className: AnimatedRows_module_css_default.exits,
					"aria-hidden": "true"
				})] });
			}
		};
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
		function WorkspacePickFlow({ t, open, anchorRef, useWorkspaces, createWorkspace, useDirectoryFlow, renderDirectoryFlow, onPick, onClose, addOnly = false, onBusyChange, side = "bottom", selectedId }) {
			const workspaceSnapshot = useWorkspaces((state) => state);
			const workspaces = workspaceSnapshot.items;
			const getAnchorRect = (0, react.useCallback)(() => anchorRef?.current?.getBoundingClientRect() ?? null, [anchorRef]);
			const [errorOpen, setErrorOpen] = (0, react.useState)(false);
			const [modalError, setModalError] = (0, react.useState)(null);
			const [flowOpen, setFlowOpen] = (0, react.useState)(false);
			const [pickingFolder, setPickingFolder] = (0, react.useState)(false);
			const flowBusy = flowOpen || pickingFolder;
			(0, react.useEffect)(() => {
				onBusyChange?.(flowBusy);
			}, [flowBusy, onBusyChange]);
			const flowAvailable = useDirectoryFlow((occupied) => occupied);
			(0, react.useEffect)(() => {
				if (flowOpen && !flowAvailable) setFlowOpen(false);
			}, [flowOpen, flowAvailable]);
			const addEntries = flowAvailable ? [{
				id: ADD_WORKSPACE,
				label: t("menu.addWorkspace"),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutlineRegular, { size: 16 }),
				disabled: flowBusy
			}] : [];
			const pinAdd = !addOnly && workspaces.length > 0;
			const items = pinAdd ? workspaces.map((workspace) => ({
				id: workspace.workspaceId,
				label: workspaceDisplayTitle(workspace.title, t("workspace.defaultName")),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderCloseRegular, { size: 16 }),
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
		//#region \0dsh-css:/home/runner/work/deepseek-harness/deepseek-harness/packages/client/ui-workspace/src/client/rows/WorkspaceBrowser.module.css.mjs
		const css = ".bhn1Oq_root{--dsh-session-list-edge-inset:var(--dsh-sidebar-inline-padding);--dsh-session-list-scrollbar-width:5px;--dsh-session-list-scrollbar-offset:2px;box-sizing:border-box;min-height:0;padding-right:var(--dsh-session-list-edge-inset);flex-direction:column;flex:1;display:flex}.bhn1Oq_root.bhn1Oq_rail{padding-right:0}.bhn1Oq_iconButton{border-radius:var(--dsw-radius-sm);cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.bhn1Oq_iconButton:focus-visible,.bhn1Oq_searchButton:focus-visible,.bhn1Oq_clearButton:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}.bhn1Oq_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.bhn1Oq_viewOptionsMenu{min-width:200px}.bhn1Oq_sectionHeader{box-sizing:border-box;border-radius:var(--dsw-radius-md);height:36px;color:var(--dsw-alias-label-tertiary);flex:none;justify-content:flex-end;align-items:center;gap:4px;margin-bottom:4px;padding-left:4px;display:flex;overflow:hidden}.bhn1Oq_root:not(.bhn1Oq_rail) .bhn1Oq_sectionHeader{margin-top:2px;margin-right:-4px}.bhn1Oq_sectionLabel{white-space:nowrap;opacity:1;visibility:visible;min-width:0;max-width:45%;transition:max-width .18s var(--ds-ease-in-out), margin-right .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;line-height:20px;overflow:hidden}.bhn1Oq_sectionLabelHidden{opacity:0;visibility:hidden;max-width:0;margin-right:-4px;transition-delay:0s,0s,0s,0s,.18s;transform:translate(-4px)}.bhn1Oq_searchSlot{box-sizing:border-box;min-width:0;max-width:28px;transition:max-width .18s var(--ds-ease-in-out), padding-left .18s var(--ds-ease-in-out);flex:1;align-items:center;margin-left:auto;padding-left:0;display:flex}.bhn1Oq_searchSlotExpanded{max-width:100%;padding-left:0}.bhn1Oq_headerActions{opacity:1;visibility:visible;max-width:60px;transition:max-width .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;align-items:center;gap:4px;display:flex;overflow:hidden}.bhn1Oq_headerActionsHidden{opacity:0;visibility:hidden;pointer-events:none;max-width:0;transition-delay:0s,0s,0s,.18s;transform:translate(4px)}.bhn1Oq_search{box-sizing:border-box;border-radius:var(--dsw-radius-sm);cursor:text;width:100%;height:28px;color:var(--dsw-alias-label-secondary);transition:width .18s var(--ds-ease-in-out), padding .18s var(--ds-ease-in-out), border-color .18s var(--ds-ease-in-out), background-color .18s var(--ds-ease-in-out);background:0 0;border:none;flex:none;align-items:center;gap:0;margin:0;padding:0;display:flex;overflow:hidden}.bhn1Oq_searchExpanded{border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);width:calc(100% + 4px);height:30px;color:var(--dsw-alias-label-caption);background:0 0;margin-inline:-2px;padding:0 4px 0 0}.bhn1Oq_searchButton{border-radius:var(--dsw-radius-sm);cursor:pointer;width:28px;height:28px;color:inherit;background:0 0;border:none;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.bhn1Oq_searchExpanded .bhn1Oq_searchButton{width:28px;height:30px}.bhn1Oq_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.bhn1Oq_searchExpanded .bhn1Oq_searchButton:hover{background:0 0}.bhn1Oq_searchInput{opacity:0;pointer-events:none;width:0;min-width:0;color:var(--dsw-alias-label-primary);transition:opacity .12s var(--ds-ease-in-out);background:0 0;border:none;outline:none;flex:1;font-size:13px;line-height:18px}.bhn1Oq_searchExpanded .bhn1Oq_searchInput{opacity:1;pointer-events:auto;margin-left:-2px}.bhn1Oq_searchInput::placeholder{color:var(--dsw-alias-label-tertiary)}.bhn1Oq_clearButton{border-radius:var(--dsw-radius-sm);cursor:pointer;width:24px;height:24px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.bhn1Oq_clearButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.bhn1Oq_rail .bhn1Oq_sectionHeader{justify-content:flex-start;gap:0;margin-bottom:12px;padding-left:0}.bhn1Oq_rail .bhn1Oq_headerActions{max-width:none}.bhn1Oq_rail .bhn1Oq_iconButton{border-radius:var(--dsw-radius-md);width:36px;height:36px;color:var(--dsw-alias-label-primary)}.bhn1Oq_rail .bhn1Oq_search{border-radius:var(--dsw-radius-md);background:0 0;border-color:#0000;gap:0;width:36px;height:36px;margin:0 0 12px;padding:0}.bhn1Oq_rail .bhn1Oq_searchButton{border-radius:var(--dsw-radius-md);width:36px;height:36px;color:var(--dsw-alias-label-primary)}.bhn1Oq_rail .bhn1Oq_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.bhn1Oq_listArea{min-height:0;margin-left:-4px;margin-right:calc(-1 * var(--dsh-session-list-edge-inset));flex-direction:column;flex:1;padding-left:4px;display:flex;overflow:visible}.bhn1Oq_rail .bhn1Oq_listArea{margin-left:0;margin-right:0;padding-left:0}.bhn1Oq_treeBody{flex-direction:column;flex:1;min-height:0;display:flex;position:relative}.bhn1Oq_fade{left:0;right:var(--dsh-session-list-edge-inset);background:linear-gradient(to bottom, transparent, var(--dsw-specific-sidebar-fill));pointer-events:none;height:24px;position:absolute;bottom:0}[data-platform=darwin] .bhn1Oq_fade{display:none}.bhn1Oq_wide{animation:bhn1Oq_wide-in .2s var(--ds-ease-in-out)}@keyframes bhn1Oq_wide-in{0%{opacity:0}}.bhn1Oq_list{min-height:0;margin-left:-4px;margin-right:var(--dsh-session-list-scrollbar-offset);padding-left:4px;padding-right:calc(var(--dsh-session-list-edge-inset) - var(--dsh-session-list-scrollbar-width) - var(--dsh-session-list-scrollbar-offset));scrollbar-gutter:stable;flex:1;padding-bottom:16px;overflow-y:auto}.bhn1Oq_flatList>*+*,.bhn1Oq_searchTree>[role=treeitem]+[role=treeitem],.bhn1Oq_groupSection>*+*{margin-top:2px}.bhn1Oq_searchStatus{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:12px;line-height:18px}.bhn1Oq_skeletonRow{box-sizing:border-box;align-items:flex-start;gap:8px;min-height:48px;padding:6px 8px 7px;display:flex}.bhn1Oq_skeletonDot{corner-shape:round;border-radius:50%;flex:none;width:16px;height:16px}.bhn1Oq_skeletonBars{flex-direction:column;flex:1;gap:6px;min-width:0;display:flex}.bhn1Oq_skeletonDot,.bhn1Oq_skeletonBar{background:var(--dsw-alias-bg-skeleton);animation:2s cubic-bezier(.36,0,.64,1) infinite bhn1Oq_search-skeleton}.bhn1Oq_skeletonBar{border-radius:var(--dsw-radius-xs);width:65%;height:16px}.bhn1Oq_skeletonBarWide{width:90%;height:13px}@keyframes bhn1Oq_search-skeleton{0%{opacity:1}40%{opacity:.6}80%,to{opacity:1}}.bhn1Oq_groupSection{position:relative}.bhn1Oq_groupSection+.bhn1Oq_groupSection{margin-top:4px}.bhn1Oq_listTopDropIndicator,.bhn1Oq_workspaceDropBefore:before,.bhn1Oq_workspaceDropAfter:after{content:\"\";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:0}.bhn1Oq_listTopDropIndicator{top:-8px;left:0;right:var(--dsh-session-list-edge-inset)}.bhn1Oq_listTopDropActive>.bhn1Oq_workspaceDropBefore:first-child:before{display:none}.bhn1Oq_workspaceDropBefore:before{top:-8px}.bhn1Oq_workspaceDropAfter:after{bottom:-8px}.bhn1Oq_sessionOverflowButton{border-radius:var(--dsw-radius-sm);width:100%;height:28px;padding:0 12px 0 calc(28px + var(--dsh-workspace-indent,0px));cursor:pointer;text-align:left;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;font-size:12px}.bhn1Oq_groupSection>.bhn1Oq_sessionOverflowButton{margin-top:0}.bhn1Oq_sessionOverflowButton:hover{color:var(--dsw-alias-label-secondary);background:0 0}.bhn1Oq_empty{color:var(--dsw-alias-label-tertiary);padding:16px 12px;font-size:13px}.bhn1Oq_emptyState{color:var(--dsw-alias-label-tertiary);flex-direction:column;align-items:center;gap:8px;margin-top:80px;padding:0 12px;font-size:13px;line-height:20px;display:flex}.bhn1Oq_emptyState>svg{color:var(--dsw-alias-label-caption);margin-bottom:4px}.bhn1Oq_emptyAction{cursor:pointer;color:var(--dsw-alias-link);background:0 0;border:none;padding:0;font-size:13px;line-height:20px}.bhn1Oq_renameInput{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-lg);width:100%;height:44px;color:var(--dsw-alias-label-primary);background:0 0;outline:none;padding:7px 14px;font-size:14px;font-weight:400;line-height:22px}.bhn1Oq_renameInput:disabled{color:var(--dsw-alias-label-dimmed)}.bhn1Oq_renameError{color:var(--dsw-alias-state-error-primary);margin-top:8px;font-size:12px;line-height:18px}.bhn1Oq_deleteAction:not(:disabled){color:var(--dsw-alias-state-error-primary)}.bhn1Oq_deleteStatus{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.bhn1Oq_archiveActivity{color:var(--dsw-alias-label-primary);margin:0 0 8px;padding-left:18px;font-size:13px;line-height:20px}.bhn1Oq_archiveActivity li{overflow-wrap:anywhere}@media (prefers-reduced-motion:reduce){.bhn1Oq_wide,.bhn1Oq_skeletonDot,.bhn1Oq_skeletonBar{animation:none}.bhn1Oq_search,.bhn1Oq_sectionLabel,.bhn1Oq_searchSlot,.bhn1Oq_searchInput,.bhn1Oq_headerActions{transition:none}}";
		const tagId = "@deepseek-ai/dsh-client-ui-workspace/WorkspaceBrowser.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-workspace";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var WorkspaceBrowser_module_css_default = {
			"archiveActivity": "bhn1Oq_archiveActivity",
			"clearButton": "bhn1Oq_clearButton",
			"deleteAction": "bhn1Oq_deleteAction",
			"deleteStatus": "bhn1Oq_deleteStatus",
			"empty": "bhn1Oq_empty",
			"emptyAction": "bhn1Oq_emptyAction",
			"emptyState": "bhn1Oq_emptyState",
			"fade": "bhn1Oq_fade",
			"flatList": "bhn1Oq_flatList",
			"groupSection": "bhn1Oq_groupSection",
			"headerActions": "bhn1Oq_headerActions",
			"headerActionsHidden": "bhn1Oq_headerActionsHidden",
			"iconButton": "bhn1Oq_iconButton",
			"list": "bhn1Oq_list",
			"listArea": "bhn1Oq_listArea",
			"listTopDropActive": "bhn1Oq_listTopDropActive",
			"listTopDropIndicator": "bhn1Oq_listTopDropIndicator",
			"rail": "bhn1Oq_rail",
			"renameError": "bhn1Oq_renameError",
			"renameInput": "bhn1Oq_renameInput",
			"root": "bhn1Oq_root",
			"search": "bhn1Oq_search",
			"search-skeleton": "bhn1Oq_search-skeleton",
			"searchButton": "bhn1Oq_searchButton",
			"searchExpanded": "bhn1Oq_searchExpanded",
			"searchInput": "bhn1Oq_searchInput",
			"searchSlot": "bhn1Oq_searchSlot",
			"searchSlotExpanded": "bhn1Oq_searchSlotExpanded",
			"searchStatus": "bhn1Oq_searchStatus",
			"searchTree": "bhn1Oq_searchTree",
			"sectionHeader": "bhn1Oq_sectionHeader",
			"sectionLabel": "bhn1Oq_sectionLabel",
			"sectionLabelHidden": "bhn1Oq_sectionLabelHidden",
			"sessionOverflowButton": "bhn1Oq_sessionOverflowButton",
			"skeletonBar": "bhn1Oq_skeletonBar",
			"skeletonBarWide": "bhn1Oq_skeletonBarWide",
			"skeletonBars": "bhn1Oq_skeletonBars",
			"skeletonDot": "bhn1Oq_skeletonDot",
			"skeletonRow": "bhn1Oq_skeletonRow",
			"treeBody": "bhn1Oq_treeBody",
			"viewOptionsMenu": "bhn1Oq_viewOptionsMenu",
			"wide": "bhn1Oq_wide",
			"wide-in": "bhn1Oq_wide-in",
			"workspaceDropAfter": "bhn1Oq_workspaceDropAfter",
			"workspaceDropBefore": "bhn1Oq_workspaceDropBefore"
		};
		//#endregion
		//#region lib/types/client/rows/WorkspaceBrowser.js
		/**
		* The workspace/session browsing region filling the sidebar shell's
		* `sidebar.workspaces` hole: section header (title + view options + add
		* workspace), search, the grouped tree or flat list, and the workspace
		* dialogs. Wide state renders the full browser; rail state renders the two
		* region icons (search / add workspace) as 36px controls on the shell's shared
		* rail entry path, each requesting expansion through the owner share. Adding
		* is the header button's one action, so it raises the directory flow with no
		* menu in between; the flow and its error dialog live in WorkspacePicker
		* (same package — direct composition, no slot between them). A Session row's
		* "..." menu and hover buttons are the `sidebar.workspaces.session.menu.item`
		* and `sidebar.workspaces.session.row.action` lists rendered through this
		* entry's `renderSlot`; the actions in them, this package's own included,
		* are slot entries with their own behavior, so this component threads no
		* action callbacks and hosts no action surface.
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
		/** Non-blank Session rows visible per Workspace while no Session raises its watermark. */
		const SESSION_WATERMARK_BASE = 5;
		/** Highest watermark that attention-bearing Sessions raise automatically; Show more and search reveals may exceed it. */
		const SESSION_WATERMARK_AUTO_MAX = 50;
		/** Show the blank row plus the first `watermark` non-blank rows, in list order. */
		function watermarkRows(sessions, watermark) {
			let count = 0;
			const rows = sessions.filter((session) => {
				if (session.blank) return true;
				count += 1;
				return count <= watermark;
			});
			return {
				rows,
				hiddenCount: sessions.length - rows.length
			};
		}
		/**
		* Smallest watermark that covers every non-blank row within the automatic maximum that is running, has a running
		* child, awaits the user, carries an unread completion, or is current, and the reveal target at any position.
		*/
		function requiredWatermark(sessions, current, revealSessionId) {
			let index = 0;
			let required = 0;
			for (const session of sessions) {
				if (session.blank) continue;
				index += 1;
				if (index <= SESSION_WATERMARK_AUTO_MAX && (session.running || session.runningSubagentCount > 0 || session.pendingInteraction !== void 0 || session.completed || session.id === current) || session.id === revealSessionId) required = index;
			}
			return required;
		}
		/** Raise each listed group's watermark to its requirement; returns `marks` itself when nothing rises. */
		function raiseWatermarks(marks, required) {
			let raised = marks;
			for (const [key, watermark] of required) if (watermark > (raised[key] ?? SESSION_WATERMARK_BASE)) raised = {
				...raised,
				[key]: watermark
			};
			return raised;
		}
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
		/** Grouping, ordering, and archived-filter menu; own open state so it resets with the wide chrome. */
		function ViewOptionsMenu({ groupBy, orderBy, archivedFilter, onGroupPick, onOrderPick, onArchivedFilterPick, t }) {
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
						label: t("groupBy.workspace"),
						icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderCloseRegular, {})
					},
					{
						id: "workspace-tree",
						label: t("groupBy.workspaceTree"),
						icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWorkspaceTreeOutlineRegular, {})
					},
					{
						id: "flat",
						label: t("groupBy.flat"),
						icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFlatListOutlineRegular, {})
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
						label: t("orderBy.manual"),
						icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronsUpDownOutlineRegular, {})
					},
					{
						id: "updated",
						label: t("orderBy.updated"),
						icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconClockOutlineRegular, {})
					},
					{
						type: "separator",
						id: "archived-filter-separator"
					},
					{
						type: "label",
						id: "filter-by",
						text: t("filterBy.label")
					},
					{
						id: "hide-archived",
						label: t("viewOptions.hideArchived"),
						icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOffOutlineRegular, {})
					},
					{
						id: "show-archived",
						label: t("viewOptions.showArchived"),
						icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconQueueOutlineRegular, {})
					},
					{
						id: "only-archived",
						label: t("viewOptions.onlyArchived"),
						icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveCheckOutlineRegular, {})
					}
				],
				selectedIds: [
					groupBy,
					orderBy,
					{
						default: "hide-archived",
						show: "show-archived",
						only: "only-archived"
					}[archivedFilter]
				],
				onSelect: (id) => {
					if (id === "workspace" || id === "workspace-tree" || id === "flat") onGroupPick(id);
					else if (id === "manual" || id === "updated") onOrderPick(id);
					else if (id === "hide-archived") onArchivedFilterPick("default");
					else if (id === "show-archived") onArchivedFilterPick("show");
					else if (id === "only-archived") onArchivedFilterPick("only");
					setOpen(false);
				},
				align: "end",
				dense: true,
				listClassName: WorkspaceBrowser_module_css_default.viewOptionsMenu,
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
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSlidersTwoOutlineRegular, {})
					})
				})
			});
		}
		/** Apply a visible drop to the complete account without removing hidden members. */
		function sessionDragOrder(order, rows, drag, over) {
			const source = rows.find((row) => row.id === drag.sessionId);
			const target = rows.find((row) => row.id === over.id);
			if (source === void 0 || target === void 0 || source.blank || source.pinned !== drag.pinned || target.pinned !== drag.pinned || source.id === target.id || !order.includes(source.id)) return;
			const section = rows.filter((row) => row.pinned === drag.pinned);
			const sourceIndex = section.findIndex((row) => row.id === source.id);
			if (section.filter((row) => row.id !== source.id).findIndex((row) => row.id === target.id) + (over.half === "after" ? 1 : 0) === sourceIndex) return;
			const next = order.filter((id) => id !== source.id);
			const targetIndex = next.indexOf(target.id);
			if (targetIndex === -1) return;
			next.splice(targetIndex + (over.half === "after" ? 1 : 0), 0, source.id);
			return pinCurrentBlank(next, rows.find((row) => row.blank)?.id);
		}
		/** Resolve an insertion side across the Workspace header, descendants, and Sessions. */
		function workspaceGroupHalf(e) {
			const rect = e.currentTarget.getBoundingClientRect();
			return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
		}
		/** The list-empty placeholder — a glyph over the text; the archived-only view names its filter and offers the way back. */
		function EmptySessions({ rowState, onLeaveArchivedOnly, t }) {
			const archivedOnly = rowState.archivedFilter === "only";
			return (0, react_jsx_runtime.jsxs)("div", {
				className: WorkspaceBrowser_module_css_default.emptyState,
				"data-row-key": "empty",
				children: [
					archivedOnly ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutlineRegular, { size: 24 }) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconQueueOutlineRegular, { size: 24 }),
					(0, react_jsx_runtime.jsx)("div", { children: archivedOnly ? t("empty.noneArchived") : t("empty.none") }),
					archivedOnly && (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: WorkspaceBrowser_module_css_default.emptyAction,
						onClick: onLeaveArchivedOnly,
						children: t("empty.viewOthers")
					})
				]
			});
		}
		/** The scrolling session tree; unmounting drops the sessions subscription and the session watermarks. */

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

	/** One worktree line for the 0.2 SessionTree (see __wtpWorktreeRow). */
	function __wtpWorktreeRow02({ wtKey, name, pill, dirty, expanded, onToggle, sessions, overflow, currentId, now, onOpen, onRenameRequest, renderSlot, onRevealFor, dragFor, onNewSession, onDelete, main, onPillClick, t }) {
		return (0, react_jsx_runtime.jsxs)("div", { children: [
			(0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-wtp-worktree-row" + (main ? " dsh-wtp-worktree-row-main" : ""),
				"data-row-key": wtKey,
				onClick: onToggle,
				children: [
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
				]
			}),
			expanded && (0, react_jsx_runtime.jsxs)("div", { className: "dsh-wtp-nested", children: [
				(sessions || []).map((node) => (0, react_jsx_runtime.jsx)(SessionNodeItem, {
					node,
					currentId,
					now,
					onOpen,
					onRenameRequest,
					renderSlot,
					onReveal: onRevealFor(node),
					drag: dragFor(node),
					t
				}, node.id)),
				overflow != null && (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: WorkspaceBrowser_module_css_default.sessionOverflowButton,
					"data-row-key": "overflow:" + wtKey,
					"aria-expanded": overflow.expanded,
					onClick: overflow.onToggle,
					children: overflow.expanded ? t("sessions.collapse") : t("sessions.expand", { n: overflow.n })
				})
			] })
		] });
	}
		function SessionTree({ list, useSessionStatus, startSession, open, workspaces, ungroupedSessionIds, rowState, onLeaveArchivedOnly, workspaceReady, animationResetKey, usePanelInfo, onRenameRequest, onDeleteRequest, onSessionRenameRequest, renderSlot, insertWorkspaceBefore, nestWorkspaces, groupExpansion, setGroupExpanded, setSessionOrder, home, t, revealSessionId, onSessionRevealed, shortcuts }) {
			const panelActive = usePanelInfo((info) => info.activePanelId !== null);
			const statuses = useSessionStatus((s) => s);
			const current = panelActive ? void 0 : Object.values(list.byId).find((session) => (session.retainedBy.mainView ?? 0) > 0)?.id;
			const revealGroup = revealSessionId === void 0 || !workspaceReady ? void 0 : owningGroupKey(workspaces, revealSessionId);
			const [storedWatermarks, setStoredWatermarks] = (0, react.useState)({});
			const [watermarkMotionKey, setWatermarkMotionKey] = (0, react.useState)(0);
			const [drag, setDrag] = (0, react.useState)(null);
			const sessionDropCommitted = (0, react.useRef)(false);
			const [workspaceDrag, setWorkspaceDrag] = (0, react.useState)(null);
			const workspaceDropCommitted = (0, react.useRef)(false);
			const nativeDragActive = drag !== null || workspaceDrag !== null;
			useNativeDragAcceptance(nativeDragActive);
			const wtp = __wtpUseTopology();
			const [wtpExpanded, setWtpExpanded] = (0, react.useState)({});
			// 官方添加/删除工作区后刷新 worktree 拓扑（新注册的 git 仓库自动出现）。
			(0, react.useEffect)(() => { wtp.reloadDebounced(); }, [workspaces.length]);
			const currentGroup = current === void 0 || !workspaceReady ? void 0 : owningGroupKey(workspaces, current);
			(0, react.useEffect)(() => {
				if (current === void 0 || currentGroup === void 0 || Object.hasOwn(groupExpansion, currentGroup)) return;
				setGroupExpanded(currentGroup, true);
			}, [
				current,
				currentGroup,
				setGroupExpanded,
				groupExpansion
			]);
			const parents = (0, react.useMemo)(() => {
				if (!nestWorkspaces) return /* @__PURE__ */ new Map();
				const keysByPath = new Map(workspaces.map((workspace) => [workspace.path, workspace.workspaceId]));
				const paths = [...keysByPath.keys()];
				return new Map(workspaces.map((workspace) => {
					const path = owningParentFolder(workspace.path, paths);
					return [workspace.workspaceId, path === void 0 ? void 0 : keysByPath.get(path)];
				}));
			}, [nestWorkspaces, workspaces]);
			const currentAncestors = (0, react.useMemo)(() => {
				const keys = /* @__PURE__ */ new Set();
				for (let key = currentGroup === void 0 ? void 0 : parents.get(currentGroup); key !== void 0; key = parents.get(key)) keys.add(key);
				return keys;
			}, [currentGroup, parents]);
			const expandedGroups = (0, react.useMemo)(() => {
				const ancestorKeys = new Set(parents.values());
				return [...workspaces.map((workspace) => workspace.workspaceId), ""].filter((key) => groupExpansion[key] ?? ancestorKeys.has(key));
			}, [
				groupExpansion,
				parents,
				workspaces
			]);
			const groups = (0, react.useMemo)(() => deriveGroups(list, workspaces, rowState, statuses, {
				expandedGroups,
				ungroupedOrder: ungroupedSessionIds
			}), [
				list,
				workspaces,
				rowState,
				statuses,
				expandedGroups,
				ungroupedSessionIds
			]);
			(0, react.useEffect)(() => {
				for (let key = revealGroup; key !== void 0; key = parents.get(key)) if (groupExpansion[key] === false || key === revealGroup && groupExpansion[key] !== true) setGroupExpanded(key, true);
			}, [
				groupExpansion,
				parents,
				revealGroup,
				setGroupExpanded
			]);
			const baselines = new Map(groups.map((group) => [group.key, Math.max(SESSION_WATERMARK_BASE, requiredWatermark(group.sessions, current, group.key === revealGroup ? revealSessionId : void 0))]));
			const foldedKeys = new Set(groups.filter((group) => !group.expanded).map((group) => group.key));
			const underFoldedAncestor = (key) => {
				for (let owner = parents.get(key); owner !== void 0; owner = parents.get(owner)) if (foldedKeys.has(owner)) return true;
				return false;
			};
			const requiredWatermarks = new Map([...baselines].filter(([key]) => !underFoldedAncestor(key)));
			const sessionWatermarks = raiseWatermarks(storedWatermarks, requiredWatermarks);
			if (sessionWatermarks !== storedWatermarks) setStoredWatermarks((marks) => raiseWatermarks(marks, requiredWatermarks));
			const dropWatermarks = (drop) => {
				if (!Object.keys(storedWatermarks).some(drop)) return;
				setStoredWatermarks((marks) => Object.fromEntries(Object.entries(marks).filter(([key]) => !drop(key))));
				setWatermarkMotionKey((key) => key + 1);
			};
			const withinGroup = (key, root) => {
				for (let owner = key; owner !== void 0; owner = parents.get(owner)) if (owner === root) return true;
				return false;
			};
			const now = Date.now();
			const commitSessionDrag = (activeDrag, over) => {
				if (sessionDropCommitted.current) return;
				sessionDropCommitted.current = true;
				setDrag(null);
				const group = groups.find((candidate) => candidate.key === activeDrag.accountKey);
				if (group === void 0) return;
				if (over.id === activeDrag.sessionId) return;
				const accountSessionIds = activeDrag.accountKey === "" ? ungroupedSessionIds : workspaces.find((workspace) => workspace.workspaceId === activeDrag.accountKey)?.sessionIds;
				if (accountSessionIds === void 0) return;
				const renderedSessions = watermarkRows(group.sessions, sessionWatermarks[group.key] ?? SESSION_WATERMARK_BASE).rows;
				const nextOrder = sessionDragOrder(accountSessionIds, renderedSessions, activeDrag, over);
				if (nextOrder !== void 0) setSessionOrder(activeDrag.accountKey, nextOrder);
			};
			const commitWorkspaceDrag = (activeDrag, over) => {
				if (workspaceDropCommitted.current) return;
				workspaceDropCommitted.current = true;
				setWorkspaceDrag(null);
				const owner = parents.get(activeDrag.workspaceId);
				const siblings = workspaces.filter((workspace) => parents.get(workspace.workspaceId) === owner);
				const rowIndex = siblings.findIndex((workspace) => workspace.workspaceId === over.id);
				if (rowIndex === -1) return;
				const anchor = over.half === "before" ? over.id : siblings[rowIndex + 1]?.workspaceId;
				if (anchor === activeDrag.workspaceId) return;
				const sourceIndex = siblings.findIndex((workspace) => workspace.workspaceId === activeDrag.workspaceId);
				const anchorIndex = anchor === void 0 ? siblings.length : siblings.findIndex((workspace) => workspace.workspaceId === anchor);
				if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
				insertWorkspaceBefore(activeDrag.workspaceId, anchor).catch((reason) => {
					console.warn("workspace reorder rejected:", reason);
				});
			};
			const childrenByParent = (0, react.useMemo)(() => {
				const rendered = new Set(groups.map((group) => group.key));
				const children = /* @__PURE__ */ new Map();
				for (const group of groups) {
					let parent = parents.get(group.key);
					while (parent !== void 0 && !rendered.has(parent)) parent = parents.get(parent);
					const siblings = children.get(parent);
					if (siblings === void 0) children.set(parent, [group]);
					else siblings.push(group);
				}
				return children;
			}, [groups, parents]);
			const rootGroups = childrenByParent.get(void 0) ?? [];
			const wtpRepoByWorkspace = new Map();
			for (const repo of wtp.tree.repos) if (repo.workspaceId != null) wtpRepoByWorkspace.set(repo.workspaceId, repo);
			const wtpHidden = new Set();
			for (const repo of wtp.tree.repos) {
				if (repo.workspaceId == null) continue;
				for (const wt of (repo.worktrees || [])) if (wt.workspaceId != null) wtpHidden.add(wt.workspaceId);
			}
			const wtpWorkspaceById = new Map(workspaces.map((workspace) => [workspace.workspaceId, workspace]));
			const wtpPinned = new Set(rowState.pinnedSessionIds);
			const wtpArchived = new Set(rowState.archivedSessionIds);
			// linked worktree 的工作区不在顶层出现，只嵌在所属仓库行下。
			const wtpRootGroups = rootGroups.filter((group) => group.workspaceId === void 0 || !wtpHidden.has(group.workspaceId));
			// worktree 子行的会话拖拽：与官方同形状，accountKey 指向所属 worktree 工作区。
			const wtpSessionDrag = (accountKey, node) => ({
				start: () => {
					sessionDropCommitted.current = false;
					setDrag({ accountKey, sessionId: node.id, pinned: node.pinned, over: null });
				},
				active: drag !== null && drag.accountKey === accountKey,
				marker: drag !== null && drag.accountKey === accountKey && drag.over?.id === node.id ? drag.over.half : null,
				hover: (half) => {
					setDrag((d) => d === null ? d : { ...d, over: { id: node.id, half } });
				},
				drop: (half) => {
					if (drag === null) return;
					commitSessionDrag(drag, { id: node.id, half });
				},
				end: () => {
					if (drag?.over !== null && drag?.over !== void 0) commitSessionDrag(drag, drag.over);
					else setDrag(null);
					sessionDropCommitted.current = false;
				}
			});
			const workspaceDropAtListStart = wtpRootGroups[0]?.workspaceId !== void 0 && workspaceDrag?.over?.id === wtpRootGroups[0].workspaceId && workspaceDrag.over.half === "before";
			const rowKeys = groups.length === 0 ? ["empty"] : [];
			const renderGroup = (group, depth) => {
				const workspaceId = group.workspaceId;
				const children = childrenByParent.get(group.key) ?? [];
				const wtpChildren = children.filter((child) => child.workspaceId === void 0 || !wtpHidden.has(child.workspaceId));
				const wtpRepo = workspaceId === void 0 ? void 0 : wtpRepoByWorkspace.get(workspaceId);
				const compatibleDrag = workspaceDrag !== null && parents.get(workspaceDrag.workspaceId) === parents.get(group.key);
				const watermark = sessionWatermarks[group.key] ?? SESSION_WATERMARK_BASE;
				const collapsed = watermarkRows(group.sessions, baselines.get(group.key) ?? SESSION_WATERMARK_BASE);
				const visible = watermarkRows(group.sessions, watermark);
				const sessionsExpanded = visible.hiddenCount === 0;
				rowKeys.push(`workspace:${group.key}`);
				const childRows = group.expanded ? wtpChildren.map((child) => renderGroup(child, depth + 1)) : [];
				const sessions = visible.rows;
				for (const node of (wtpRepo !== void 0 ? [] : sessions)) rowKeys.push(`session:${node.id}`);
				if (collapsed.hiddenCount > 0) rowKeys.push(`overflow:${group.key}`);
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
				const hoverWorkspace = workspaceId === void 0 || !compatibleDrag ? void 0 : (half) => {
					setWorkspaceDrag((active) => active === null ? active : {
						...active,
						over: {
							id: workspaceId,
							half
						}
					});
				};
				const dropWorkspace = workspaceId === void 0 || !compatibleDrag ? void 0 : (half) => {
					commitWorkspaceDrag(workspaceDrag, {
						id: workspaceId,
						half
					});
				};
				return (0, react_jsx_runtime.jsxs)("div", {
					style: { "--dsh-workspace-indent": `${depth * 12}px` },
					className: clsx(WorkspaceBrowser_module_css_default.groupSection, workspaceMarker === "before" && WorkspaceBrowser_module_css_default.workspaceDropBefore, workspaceMarker === "after" && WorkspaceBrowser_module_css_default.workspaceDropAfter),
					onDragOver: workspaceDrag === null ? void 0 : (e) => {
						e.preventDefault();
						if (hoverWorkspace === void 0 && parents.get(group.key) !== void 0) return;
						e.stopPropagation();
						if (hoverWorkspace === void 0) {
							e.dataTransfer.dropEffect = "none";
							if (workspaceDrag.over !== null) setWorkspaceDrag({
								...workspaceDrag,
								over: null
							});
						} else {
							e.dataTransfer.dropEffect = "move";
							hoverWorkspace(workspaceGroupHalf(e));
						}
					},
					onDrop: workspaceDrag === null ? void 0 : (e) => {
						e.preventDefault();
						if (dropWorkspace === void 0 && parents.get(group.key) !== void 0) return;
						e.stopPropagation();
						if (dropWorkspace === void 0) {
							workspaceDropCommitted.current = true;
							setWorkspaceDrag(null);
						} else dropWorkspace(workspaceGroupHalf(e));
					},
					children: [
						(0, react_jsx_runtime.jsx)(ProjectRowItem, {
							newShortcut: shortcuts.find((row) => row.id === "session.new"),
							group,
							containsCurrentDescendant: currentAncestors.has(group.key),
							home,
							t,
							onToggle: () => {
								if (group.expanded) dropWatermarks((key) => withinGroup(key, group.key));
								setGroupExpanded(group.key, !group.expanded);
							},
							onCreate: () => {
								setGroupExpanded(group.key, true);
								// Git 项目：打开分支/worktree 创建器；非 Git：保持官方默认，直接开会话。
								if (wtpRepo !== void 0) wtp.setDialog({ type: "branch", repo: wtpRepo });
								else if (group.workspaceId !== void 0) startSession(group.workspaceId);
							},
							drag: workspaceDragProps,
							actions: group.workspaceId === void 0 ? void 0 : {
								initializeGit: wtpRepo !== void 0 ? void 0 : () => {
									wtp.setDialog({
										type: "init",
										workspace: { workspaceId: group.workspaceId, label: group.label, path: group.cwd }
									});
								},
								rename: () => {
									/* v8 ignore next -- narrowing guard: the actions object exists only for real-workspace groups. */
									if (group.workspaceId !== void 0) onRenameRequest(group.workspaceId, group.label);
								},
								delete: () => {
									/* v8 ignore next -- narrowing guard: the actions object exists only for real-workspace groups. */
									if (group.workspaceId !== void 0) onDeleteRequest(group.workspaceId, group.label);
								}
							}
						}),
						childRows.length > 0 && (0, react_jsx_runtime.jsx)("div", {
							role: "group",
							children: childRows
						}),
						(wtpRepo !== void 0 ? [] : sessions).map((node) => {
							const sameGroupDrag = drag !== null && drag.accountKey === group.key;
							const compatibleTarget = sameGroupDrag && drag.pinned === node.pinned;
							const normalizeHalf = (half) => node.blank ? "after" : half;
							const dragProps = {
								start: () => {
									sessionDropCommitted.current = false;
									setDrag({
										accountKey: group.key,
										sessionId: node.id,
										pinned: node.pinned,
										over: null
									});
								},
								active: compatibleTarget,
								marker: sameGroupDrag && drag.over?.id === node.id ? drag.over.half : null,
								hover: (half) => {
									/* v8 ignore next -- narrowing guard: Rows gates hover on `active`, which is false while the drag state is null. */
									setDrag((d) => d === null ? d : {
										...d,
										over: {
											id: node.id,
											half: normalizeHalf(half)
										}
									});
								},
								drop: (half) => {
									/* v8 ignore next -- narrowing guard: Rows gates drop on `active`, which is false while the drag state is null. */
									if (drag === null) return;
									commitSessionDrag(drag, {
										id: node.id,
										half: normalizeHalf(half)
									});
								},
								end: () => {
									if (drag?.over !== null && drag?.over !== void 0) commitSessionDrag(drag, drag.over);
									else setDrag(null);
									sessionDropCommitted.current = false;
								}
							};
							return (0, react_jsx_runtime.jsx)(SessionNodeItem, {
								node,
								currentId: current,
								now,
								onOpen: open,
								onRenameRequest: onSessionRenameRequest,
								renderSlot,
								onReveal: node.id === revealSessionId && group.key === revealGroup ? () => {
									onSessionRevealed(node.id);
								} : void 0,
								drag: dragProps,
								t
							}, node.id);
						}),
						wtpRepo === void 0 && collapsed.hiddenCount > 0 && (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: WorkspaceBrowser_module_css_default.sessionOverflowButton,
							"data-row-key": `overflow:${group.key}`,
							"aria-expanded": sessionsExpanded,
							onClick: () => {
								if (sessionsExpanded) {
									dropWatermarks((key) => key === group.key);
									return;
								}
								setStoredWatermarks((marks) => ({
									...marks,
									[group.key]: visible.hiddenCount <= SESSION_WATERMARK_BASE ? Infinity : watermark + SESSION_WATERMARK_BASE
								}));
								setWatermarkMotionKey((key) => key + 1);
							},
							children: sessionsExpanded ? t("sessions.collapse") : t("sessions.expand", { n: visible.hiddenCount })
						}),
					wtpRepo !== void 0 && group.expanded && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						(function () {
							// 主工作树：官方工作区会话 ∪ /tree 主目录快照（注册丢失时仍显示）。
							const official = group.sessions;
							const all = [];
							const seen = new Set();
							for (const n of official) { if (n !== void 0 && !seen.has(n.id)) { seen.add(n.id); all.push(n); } }
							for (const s of (wtpRepo.sessions || [])) {
								const live = list.byId[s.id];
								if (live !== void 0 && !seen.has(live.id) && sessionVisible(live, current, wtpArchived, rowState.archivedFilter)) { seen.add(live.id); all.push(sessionNode(live, list, statuses, wtpPinned, wtpArchived)); }
							}
							const moreKey = "more-main-" + group.key;
							const showAll = wtpExpanded[moreKey] === true;
							const shown = showAll ? all : all.slice(0, 5);
							const wtKey = "wt-main-" + group.key;
							rowKeys.push(wtKey);
							for (const n of shown) rowKeys.push("session:" + n.id);
							return (0, react_jsx_runtime.jsx)(__wtpWorktreeRow02, {
								wtKey,
								name: t("wtp.main"),
								pill: wtpRepo.branch,
								dirty: wtpRepo.dirty,
								main: true,
								onPillClick: () => wtp.setDialog({ type: "switch", repo: wtpRepo }),
								expanded: wtpExpanded["main-" + group.key] !== false,
								onToggle: () => setWtpExpanded((v) => ({ ...v, ["main-" + group.key]: wtpExpanded["main-" + group.key] !== false ? false : true })),
								sessions: shown,
								overflow: all.length > 5 ? {
									expanded: showAll,
									n: all.length - 5,
									onToggle: () => setWtpExpanded((v) => ({ ...v, [moreKey]: !showAll }))
								} : null,
								currentId: current,
								now,
								onOpen: open,
								onRenameRequest: onSessionRenameRequest,
								renderSlot,
								onRevealFor: (node) => node.id === revealSessionId ? () => onSessionRevealed(node.id) : void 0,
								dragFor: (node) => wtpSessionDrag(wtpRepo.workspaceId, node),
								onNewSession: () => {
									// 自动展开主工作树行，让新会话立即可见。
									setWtpExpanded((v) => ({ ...v, ["main-" + group.key]: true }));
									startSession(group.workspaceId);
								},
								t
							});
						})(),
						(wtpRepo.worktrees || []).map((wt) => {
							const wtKey = "wt-" + wtpRepo.name + "/" + wt.name;
							const workspaceSessionIds = wt.workspaceId == null
								? []
								: (wtpWorkspaceById.get(wt.workspaceId)?.sessionIds || []);
							const wtSessionIds = [...new Set([
								...workspaceSessionIds,
								...(wt.sessions || []).map((session) => session.id)
							])];
							const wtNodes = wtSessionIds
								.map((id) => list.byId[id])
								.filter((n) => n !== void 0 && sessionVisible(n, current, wtpArchived, rowState.archivedFilter))
								.map((n) => sessionNode(n, list, statuses, wtpPinned, wtpArchived));
							rowKeys.push(wtKey);
							for (const n of wtNodes) rowKeys.push("session:" + n.id);
							return (0, react_jsx_runtime.jsx)(__wtpWorktreeRow02, {
								wtKey,
								name: wt.name,
								pill: null,
								dirty: wt.dirty,
								expanded: wtpExpanded[wtKey] !== false,
								onToggle: () => setWtpExpanded((v) => ({ ...v, [wtKey]: wtpExpanded[wtKey] !== false ? false : true })),
								sessions: wtNodes,
								overflow: null,
								currentId: current,
								now,
								onOpen: open,
								onRenameRequest: onSessionRenameRequest,
								renderSlot,
								onRevealFor: (node) => node.id === revealSessionId ? () => onSessionRevealed(node.id) : void 0,
								dragFor: (node) => wtpSessionDrag(wt.workspaceId != null ? wt.workspaceId : group.key, node),
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
									wtp.api.registerWorktree(wtpRepo.name, wt.name).then((r) => {
										if (r && r.error) throw new Error(r.error);
										// 乐观更新：本地把该 worktree 的 workspaceId 置上，不整树重载。
										wtp.setTree((prev) => ({
											...prev,
											repos: (prev.repos || []).map((rr) =>
												rr.name === wtpRepo.name
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
										wtp.api.removeWorktree(wtpRepo.name, wt.name).then((r) => {
											if (r && r.error) throw new Error(r.error);
											wtp.reload();
										}).catch((err) => wtp.setActionError(String((err && err.message) || err)));
									}
								},
								t
							}, wtKey);
						})
					] })
					]
				}, group.key);
			};
			const groupRows = wtpRootGroups.map((group) => renderGroup(group, 0));
			return (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.HoverCardGroup, {
				className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
				children: [
					workspaceDropAtListStart && (0, react_jsx_runtime.jsx)("span", {
						className: WorkspaceBrowser_module_css_default.listTopDropIndicator,
						"aria-hidden": "true"
					}),
					(0, react_jsx_runtime.jsxs)(AnimatedRows, {
						className: clsx(WorkspaceBrowser_module_css_default.list, workspaceDropAtListStart && WorkspaceBrowser_module_css_default.listTopDropActive),
						label: t("section.sessions"),
						rowKeys,
						ready: list.phase === "ready" && workspaceReady && !nativeDragActive,
						resetKey: JSON.stringify([animationResetKey, watermarkMotionKey]),
						children: [groups.length === 0 && (0, react_jsx_runtime.jsx)(EmptySessions, {
							rowState,
							onLeaveArchivedOnly,
							t
						}), groupRows]
					}),
					wtp.actionError != null && (0, react_jsx_runtime.jsx)("div", {
						className: "dsh-wtp-error",
						children: t("wtp.failed", { msg: wtp.actionError })
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
		function FlatList({ list, sessionIds, rowState, onLeaveArchivedOnly, useSessionStatus, open, onSessionRenameRequest, usePanelInfo, setSessionOrder, workspaceReady, animationResetKey, revealSessionId, onSessionRevealed, renderSlot, t }) {
			const panelActive = usePanelInfo((info) => info.activePanelId !== null);
			const statuses = useSessionStatus((s) => s);
			const rows = (0, react.useMemo)(() => deriveFlat(list, sessionIds, rowState, statuses), [
				list,
				sessionIds,
				rowState,
				statuses
			]);
			const [drag, setDrag] = (0, react.useState)(null);
			const dropCommitted = (0, react.useRef)(false);
			useNativeDragAcceptance(drag !== null);
			const currentId = panelActive ? void 0 : Object.values(list.byId).find((session) => (session.retainedBy.mainView ?? 0) > 0)?.id;
			const commitDrag = (activeDrag, over) => {
				if (dropCommitted.current) return;
				dropCommitted.current = true;
				setDrag(null);
				const nextOrder = sessionDragOrder(sessionIds, rows, activeDrag, over);
				if (nextOrder !== void 0) setSessionOrder(FLAT_SESSION_ORDER_KEY, nextOrder);
			};
			const now = Date.now();
			return (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.HoverCardGroup, {
				className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
				children: [(0, react_jsx_runtime.jsxs)(AnimatedRows, {
					className: clsx(WorkspaceBrowser_module_css_default.list, WorkspaceBrowser_module_css_default.flatList),
					label: t("section.sessions"),
					rowKeys: rows.length === 0 ? ["empty"] : rows.map((row) => `session:${row.id}`),
					ready: list.phase === "ready" && workspaceReady && drag === null,
					resetKey: animationResetKey,
					children: [rows.length === 0 && (0, react_jsx_runtime.jsx)(EmptySessions, {
						rowState,
						onLeaveArchivedOnly,
						t
					}), rows.map((node) => {
						const active = drag !== null && drag.pinned === node.pinned;
						const normalizeHalf = (half) => node.blank ? "after" : half;
						return (0, react_jsx_runtime.jsx)(SessionNodeItem, {
							node,
							currentId,
							now,
							onOpen: open,
							onRenameRequest: onSessionRenameRequest,
							renderSlot,
							onReveal: node.id === revealSessionId ? () => {
								onSessionRevealed(node.id);
							} : void 0,
							drag: {
								start: () => {
									dropCommitted.current = false;
									setDrag({
										accountKey: FLAT_SESSION_ORDER_KEY,
										sessionId: node.id,
										pinned: node.pinned,
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
											half: normalizeHalf(half)
										}
									});
								},
								drop: (half) => {
									if (drag !== null) commitDrag(drag, {
										id: node.id,
										half: normalizeHalf(half)
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
		function SearchResults({ useSessions, useSessionStatus, open, onUnarchive, workspaces, archivedSessionIds, archivedFilter, query, remote, resultLimit, usePanelInfo, t }) {
			const panelActive = usePanelInfo((info) => info.activePanelId !== null);
			const list = useSessions((s) => s);
			const statuses = useSessionStatus((s) => s);
			const currentRemote = remote.query === query ? remote : {
				query,
				status: "loading",
				items: [],
				hasMore: false
			};
			const results = (0, react.useMemo)(() => deriveSearchResults(list, workspaces, query, archivedSessionIds, archivedFilter, statuses, currentRemote, resultLimit), [
				list,
				workspaces,
				query,
				archivedSessionIds,
				archivedFilter,
				statuses,
				currentRemote,
				resultLimit
			]);
			const pending = currentRemote.status === "loading";
			const currentId = panelActive ? void 0 : Object.values(list.byId).find((session) => (session.retainedBy.mainView ?? 0) > 0)?.id;
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
								currentId,
								onOpen: open,
								onUnarchive,
								t
							}, result.id))
						}),
						pending && (0, react_jsx_runtime.jsx)("div", {
							role: "status",
							"aria-label": t("search.pending"),
							children: (results.items.length === 0 ? [0, 1] : [0]).map((i) => (0, react_jsx_runtime.jsxs)("div", {
								className: WorkspaceBrowser_module_css_default.skeletonRow,
								"aria-hidden": "true",
								children: [(0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.skeletonDot }), (0, react_jsx_runtime.jsxs)("span", {
									className: WorkspaceBrowser_module_css_default.skeletonBars,
									children: [(0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.skeletonBar }), (0, react_jsx_runtime.jsx)("span", { className: clsx(WorkspaceBrowser_module_css_default.skeletonBar, WorkspaceBrowser_module_css_default.skeletonBarWide) })]
								})]
							}, i))
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
		function WorkspaceBrowser({ wide, usePanelInfo, expandSidebar, useSessions, useSessionStatus, useWorkspaces, useStore, actions, startSession, open, requestSessionRename, notifyArchivedNotOpenable, renameWorkspace, deleteWorkspace, insertWorkspaceBefore, unarchiveSession, createWorkspace, searchSessions, searchResultLimit, useDirectoryFlow, useHostInfo, useShortcuts, useWorkspaceShortcuts, requestSearch, requestAddWorkspace, closeAddWorkspace, setDirectoryBusy, renderSlot, t }) {
			const home = useHostInfo((info) => info.home);
			const shortcuts = useShortcuts((rows) => rows);
			const searchShortcut = shortcuts.find((row) => row.id === "session.search");
			const addShortcut = shortcuts.find((row) => row.id === "workspace.add");
			const shortcutState = useWorkspaceShortcuts((state) => state);
			const list = useSessions((state) => state);
			const storedWorkspaces = useWorkspaces((state) => state.items);
			const defaultWorkspaceName = t("workspace.defaultName");
			const workspaces = (0, react.useMemo)(() => storedWorkspaces.map((workspace) => ({
				...workspace,
				title: workspaceDisplayTitle(workspace.title, defaultWorkspaceName)
			})), [storedWorkspaces, defaultWorkspaceName]);
			const workspacePhase = useWorkspaces((state) => state.phase);
			const workspaceStreamState = useWorkspaces((state) => state.state);
			const archivedSessionIds = useWorkspaces((state) => state.archivedSessionIds);
			const pinnedSessionIds = useWorkspaces((state) => state.pinnedSessionIds);
			const directoryFlowAvailable = useDirectoryFlow((occupied) => occupied);
			const groupBy = useStore((s) => s.groupBy);
			const orderBy = useStore((s) => s.orderBy);
			const archivedFilter = useStore((s) => s.archivedFilter ?? "default");
			const groupExpansion = useStore((s) => s.groupExpansion);
			const sessionOrderByAccount = useStore((s) => s.sessionOrderByAccount);
			const guardedOpen = (sessionId) => {
				if (archivedSessionIds.includes(sessionId)) {
					notifyArchivedNotOpenable();
					return;
				}
				open(sessionId);
			};
			const leaveArchivedOnly = () => {
				actions.setArchivedFilter("default");
			};
			const workspaceReady = workspacePhase === "ready" && workspaceStreamState !== "loading";
			const mainSessionId = Object.values(list.byId).find((session) => (session.retainedBy.mainView ?? 0) > 0)?.id;
			const currentBlank = mainSessionId !== void 0 && list.byId[mainSessionId]?.blank === true ? mainSessionId : void 0;
			const ungroupedMemberIds = (0, react.useMemo)(() => {
				const accounted = new Set(workspaces.flatMap((workspace) => workspace.sessionIds));
				return list.ids.filter((id) => list.byId[id] !== void 0 && !accounted.has(id));
			}, [list, workspaces]);
			const orderState = (0, react.useMemo)(() => ({
				pinnedSessionIds,
				archivedSessionIds
			}), [archivedSessionIds, pinnedSessionIds]);
			const rowState = (0, react.useMemo)(() => ({
				...orderState,
				archivedFilter
			}), [orderState, archivedFilter]);
			const flatMemberIds = (0, react.useMemo)(() => sessionMemberIds(list), [list]);
			const orderedWorkspaces = (0, react.useMemo)(() => workspaces.map((workspace) => {
				const memberIds = workspace.sessionIds;
				const baseOrder = orderBy === "updated" ? orderByRecency(memberIds, list.byId) : reconcileManualOrder(memberIds, sessionOrderByAccount[workspace.workspaceId], list.byId, orderState);
				return {
					...workspace,
					sessionIds: pinCurrentBlank(baseOrder, currentBlank !== void 0 && memberIds.includes(currentBlank) ? currentBlank : void 0)
				};
			}), [
				currentBlank,
				list.byId,
				orderBy,
				orderState,
				sessionOrderByAccount,
				workspaces
			]);
			const orderedUngroupedSessionIds = (0, react.useMemo)(() => {
				return pinCurrentBlank(orderBy === "updated" ? orderByRecency(ungroupedMemberIds, list.byId) : reconcileManualOrder(ungroupedMemberIds, sessionOrderByAccount[""], list.byId, orderState), currentBlank !== void 0 && ungroupedMemberIds.includes(currentBlank) ? currentBlank : void 0);
			}, [
				currentBlank,
				list.byId,
				orderBy,
				orderState,
				sessionOrderByAccount,
				ungroupedMemberIds
			]);
			const orderedFlatSessionIds = (0, react.useMemo)(() => {
				return pinCurrentBlank(orderBy === "updated" ? orderByRecency(flatMemberIds, list.byId) : reconcileManualOrder(flatMemberIds, sessionOrderByAccount[FLAT_SESSION_ORDER_KEY], list.byId, orderState), currentBlank !== void 0 && flatMemberIds.includes(currentBlank) ? currentBlank : void 0);
			}, [
				currentBlank,
				flatMemberIds,
				list.byId,
				orderBy,
				orderState,
				sessionOrderByAccount
			]);
			const activeSessionOrders = (0, react.useMemo)(() => Object.fromEntries([
				...orderedWorkspaces.map((workspace) => [workspace.workspaceId, workspace.sessionIds]),
				["", orderedUngroupedSessionIds],
				[FLAT_SESSION_ORDER_KEY, orderedFlatSessionIds]
			]), [
				orderedFlatSessionIds,
				orderedUngroupedSessionIds,
				orderedWorkspaces
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
			(0, react.useEffect)(() => {
				if (list.phase !== "ready" || workspaceReady || orderBy !== "manual" || currentBlank === void 0) return;
				const changed = {};
				for (const [key, ids] of Object.entries(activeSessionOrders)) {
					if (key !== "__flat_session_order__" && workspacePhase !== "ready") continue;
					const saved = sessionOrderByAccount[key] ?? [];
					if (ids[0] !== currentBlank || saved[0] === currentBlank) continue;
					changed[key] = [currentBlank, ...saved.filter((id) => id !== currentBlank)];
				}
				if (Object.keys(changed).length > 0) actions.syncSessionOrders(changed);
			}, [
				actions.syncSessionOrders,
				activeSessionOrders,
				currentBlank,
				list.phase,
				orderBy,
				sessionOrderByAccount,
				workspacePhase,
				workspaceReady
			]);
			(0, react.useEffect)(() => {
				if (list.phase !== "ready" || !workspaceReady || orderBy !== "manual" || currentBlank === void 0) return;
				if (Object.entries(activeSessionOrders).some(([key, ids]) => ids[0] === currentBlank && sessionOrderByAccount[key]?.[0] !== currentBlank)) actions.syncSessionOrders(activeSessionOrders);
			}, [
				actions.syncSessionOrders,
				activeSessionOrders,
				currentBlank,
				list.phase,
				orderBy,
				sessionOrderByAccount,
				workspaceReady
			]);
			const saveSessionOrder = (accountKey, order) => {
				actions.setSessionOrder(accountKey, order, activeSessionOrders);
			};
			const [query, setQuery] = (0, react.useState)("");
			const [searchExpanded, setSearchExpanded] = (0, react.useState)(false);
			const [revealSessionId, setRevealSessionId] = (0, react.useState)(void 0);
			const normalizedQuery = sanitizeSearchQuery(query).trim();
			const [remoteSearch, setRemoteSearch] = (0, react.useState)({
				query: "",
				status: "idle",
				items: [],
				hasMore: false
			});
			const searchRoot = (0, react.useRef)(null);
			const searchInput = (0, react.useRef)(null);
			const wsPickerOpen = shortcutState.addRequested;
			const wsPlusRef = (0, react.useRef)(null);
			const composingRef = (0, react.useRef)(false);
			const openSearchResult = (sessionId) => {
				if (archivedSessionIds.includes(sessionId)) {
					notifyArchivedNotOpenable();
					return;
				}
				setRevealSessionId(sessionId);
				setQuery("");
				setSearchExpanded(false);
				open(sessionId);
			};
			const acknowledgeSessionReveal = (sessionId) => {
				setRevealSessionId((current) => current === sessionId ? void 0 : current);
			};
			(0, react.useEffect)(() => {
				if (normalizedQuery !== "") setRevealSessionId(void 0);
			}, [normalizedQuery]);
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
				if (shortcutState.searchRequest === 0) return;
				closeAddWorkspace();
				setSearchExpanded(true);
				if (!wide) {
					setSearchOnExpand(true);
					expandSidebar();
				} else searchInput.current?.focus({ preventScroll: true });
			}, [shortcutState.searchRequest]);
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
			const renameDuplicate = renameTarget !== null && renameTrimmed !== "" && workspaces.some((w) => w.workspaceId !== renameTarget.workspaceId && w.title === renameTrimmed);
			const renameBlocked = renaming || renameTrimmed === "" || renameTarget === null || renameTrimmed === renameTarget.storedTitle || renameDuplicate;
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
			const onSessionUnarchive = (sessionId) => {
				unarchiveSession(sessionId).catch((reason) => {
					console.warn("session unarchive rejected:", reason);
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
										closeAddWorkspace();
										setSearchExpanded(true);
										searchInput.current?.focus();
									},
									children: [
										(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
											label: t("search"),
											shortcutKeys: searchShortcut?.keys,
											side: "bottom",
											delayMs: 500,
											disabled: searchExpanded,
											children: (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: WorkspaceBrowser_module_css_default.searchButton,
												"aria-label": t("search.sessions.aria"),
												"aria-keyshortcuts": searchShortcut?.aria,
												"aria-expanded": searchExpanded,
												onClick: () => {
													requestSearch();
												},
												children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutlineRegular, { size: searchExpanded ? 11 : 14 })
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
											children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseFillRegular, {})
										})
									]
								})
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: clsx(WorkspaceBrowser_module_css_default.headerActions, wide && searchExpanded && WorkspaceBrowser_module_css_default.headerActionsHidden),
								children: [wide && (0, react_jsx_runtime.jsx)(ViewOptionsMenu, {
									groupBy,
									orderBy,
									archivedFilter,
									onGroupPick: actions.setGroupBy,
									onOrderPick: (mode) => {
										actions.setOrderBy(mode, activeSessionOrders);
									},
									onArchivedFilterPick: actions.setArchivedFilter,
									t
								}), directoryFlowAvailable && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
									label: t("workspace.add"),
									shortcutKeys: addShortcut?.keys,
									side: "bottom",
									delayMs: 500,
									children: (0, react_jsx_runtime.jsx)("button", {
										ref: wsPlusRef,
										type: "button",
										className: WorkspaceBrowser_module_css_default.iconButton,
										"aria-label": t("workspace.add"),
										"aria-keyshortcuts": addShortcut?.aria,
										onClick: () => {
											requestAddWorkspace();
										},
										children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconProjectAddOutlineRegular, { size: wide ? 16 : 18 })
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
								onBusyChange: setDirectoryBusy,
								side: "right",
								onPick: (workspaceId) => {
									closeAddWorkspace();
									startSession(workspaceId, { clearPreviousDraft: false });
								},
								onClose: () => {
									closeAddWorkspace();
								}
							})
						]
					}),
					!wide && (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceBrowser_module_css_default.search,
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
							label: t("search"),
							shortcutKeys: searchShortcut?.keys,
							children: (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorkspaceBrowser_module_css_default.searchButton,
								"aria-label": t("search.sessions.aria"),
								"aria-keyshortcuts": searchShortcut?.aria,
								onClick: () => {
									requestSearch();
								},
								children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutlineRegular, { size: 18 })
							})
						})
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceBrowser_module_css_default.listArea,
						children: wide && (normalizedQuery !== "" ? (0, react_jsx_runtime.jsx)(SearchResults, {
							usePanelInfo,
							useSessions,
							useSessionStatus,
							open: openSearchResult,
							onUnarchive: onSessionUnarchive,
							workspaces,
							archivedSessionIds,
							archivedFilter,
							query: normalizedQuery,
							remote: remoteSearch,
							resultLimit: searchResultLimit,
							t
						}) : groupBy === "flat" ? (0, react_jsx_runtime.jsx)(FlatList, {
							usePanelInfo,
							list,
							sessionIds: orderedFlatSessionIds,
							rowState,
							onLeaveArchivedOnly: leaveArchivedOnly,
							workspaceReady,
							animationResetKey: `${groupBy}/${orderBy}/${archivedFilter}`,
							useSessionStatus,
							open: guardedOpen,
							onSessionRenameRequest: requestSessionRename,
							renderSlot,
							setSessionOrder: saveSessionOrder,
							revealSessionId,
							onSessionRevealed: acknowledgeSessionReveal,
							t
						}) : (0, react_jsx_runtime.jsx)(SessionTree, {
							usePanelInfo,
							list,
							shortcuts,
							useSessionStatus,
							onSessionRenameRequest: requestSessionRename,
							renderSlot,
							workspaces: orderedWorkspaces,
							ungroupedSessionIds: orderedUngroupedSessionIds,
							workspaceReady,
							nestWorkspaces: groupBy === "workspace-tree",
							animationResetKey: `${groupBy}/${orderBy}/${archivedFilter}`,
							groupExpansion,
							setGroupExpanded: actions.setGroupExpanded,
							setSessionOrder: saveSessionOrder,
							rowState,
							onLeaveArchivedOnly: leaveArchivedOnly,
							startSession,
							open: guardedOpen,
							insertWorkspaceBefore,
							revealSessionId,
							onSessionRevealed: acknowledgeSessionReveal,
							home,
							t,
							onRenameRequest: (workspaceId, displayTitle) => {
								setRenameTarget({
									workspaceId,
									storedTitle: storedWorkspaces.find((w) => w.workspaceId === workspaceId)?.title ?? displayTitle
								});
								setRenameDraft(displayTitle);
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
								"data-modal-autofocus": true,
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
		//#region lib/types/client/session-actions/ArchiveSession.js
		/**
		* The archive action: a `sidebar.workspaces.session.menu.item` row and a
		* `sidebar.workspaces.session.row.action` button over one injected behavior,
		* plus the `shell.overlay` dialog that confirms stopping a Session's running
		* work before archiving it. The same entries restore an archived row; the
		* notice a successful archive raises and the diagnostics for Host rejections
		* live in the injected callbacks, not here.
		*/
		/**
		* Menu row (order 400): archive, or restore an archived row.
		* @param props - owner share, the archive share, and the menu open state.
		* @returns the row.
		*/
		function ArchiveSessionMenuItem({ sessionId, useArchived, useMenuOpenState, useShortcuts, archiveSession, unarchiveSession, t }) {
			const [, setMenuOpen] = useMenuOpenState();
			const shortcut = useShortcuts((rows) => rows.find((row) => row.id === "session.archive"));
			const archived = useArchived((set) => set.has(sessionId));
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MenuItemButton, {
				shortcut: archived ? void 0 : shortcut,
				icon: archived ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconUnarchiveOutlineRegular, { size: 14 }) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutlineRegular, { size: 14 }),
				onSelect: () => {
					setMenuOpen(false);
					(archived ? unarchiveSession : archiveSession)(sessionId);
				},
				children: t(archived ? "menu.unarchiveSession" : "menu.archiveSession")
			});
		}
		/**
		* Hover button (order 100): archive, or restore an archived row.
		* @param props - owner share and the archive share.
		* @returns the button.
		*/
		function ArchiveSessionRowButton({ sessionId, useArchived, archiveSession, unarchiveSession, t }) {
			const archived = useArchived((set) => set.has(sessionId));
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label: t(archived ? "actions.unarchive" : "actions.archive"),
				side: "bottom",
				align: "end",
				delayMs: 500,
				portal: true,
				children: (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: Rows_module_css_default.iconButton,
					"aria-label": t(archived ? "menu.unarchiveSession" : "menu.archiveSession"),
					onClick: () => {
						(archived ? unarchiveSession : archiveSession)(sessionId);
					},
					children: archived ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconUnarchiveOutlineRegular, { size: 14 }) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutlineRegular, { size: 14 })
				})
			});
		}
		/**
		* The `shell.overlay` entry: nothing while no confirmation is pending,
		* otherwise one dialog per request (keyed by the Session). Confirming asks
		* the Host to stop the listed work and archive; cancelling leaves the
		* Session running and visible.
		* @param props - the request hook, its settlement, the stop-and-archive hop, and the locale seat.
		* @returns the open dialog, or null.
		*/
		function SessionArchiveConfirmDialog({ useArchiveRequest, settleSessionArchive, stopAndArchiveSession, t }) {
			const request = useArchiveRequest((pending) => pending);
			if (request === null) return null;
			return (0, react_jsx_runtime.jsx)(ArchiveConfirmForm, {
				request,
				stopAndArchiveSession,
				onSettle: settleSessionArchive,
				t
			}, request.sessionId);
		}
		/** One request's dialog: in-flight and error state die with it. */
		function ArchiveConfirmForm({ request, stopAndArchiveSession, onSettle, t }) {
			const [archiving, setArchiving] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const close = () => {
				if (archiving) return;
				onSettle();
			};
			const confirm = () => {
				setArchiving(true);
				setError(null);
				stopAndArchiveSession(request.sessionId).then(() => {
					setArchiving(false);
					onSettle();
				}).catch((reason) => {
					setArchiving(false);
					setError(reason instanceof Error ? reason.message : String(reason));
				});
			};
			return (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose: close,
				closeLabel: t("close"),
				title: t("archive.confirm.title"),
				description: t("archive.confirm.desc", { title: request.displayTitle }),
				footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					disabled: archiving,
					onClick: close,
					children: t("cancel")
				}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					className: WorkspaceBrowser_module_css_default.deleteAction,
					disabled: archiving,
					onClick: confirm,
					children: t("archive.confirm.action")
				})] }),
				children: [
					(0, react_jsx_runtime.jsx)("ul", {
						className: WorkspaceBrowser_module_css_default.archiveActivity,
						"aria-label": t("archive.confirm.activity"),
						children: request.activity.map((entry, index) => (0, react_jsx_runtime.jsx)("li", { children: activityLine(entry, t) }, `${entry.kind}-${String(index)}`))
					}),
					archiving && (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceBrowser_module_css_default.deleteStatus,
						role: "status",
						children: t("archive.confirm.pending")
					}),
					error !== null && (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceBrowser_module_css_default.renameError,
						role: "alert",
						children: error
					})
				]
			});
		}
		/**
		* One family's line: its count and the items' labels (ids when a family
		* carries no label). A family this dictionary does not know — a provider
		* merged into the kind map — falls through to the generic line.
		*/
		function activityLine(entry, t) {
			const items = entry.items ?? [];
			const n = items.length;
			const names = items.map((item) => item.label ?? item.id).join(t("archive.confirm.listSeparator"));
			const plural = n === 1 ? "one" : "other";
			switch (entry.kind) {
				case "turn": return t("archive.confirm.turn");
				case "subagent": return t(`archive.confirm.subagents.${plural}`, {
					n,
					names
				});
				case "job": return t(`archive.confirm.jobs.${plural}`, {
					n,
					names
				});
				case "schedule": return t(`archive.confirm.schedules.${plural}`, {
					n,
					names
				});
				default: return t(`archive.confirm.other.${plural}`, {
					kind: entry.kind,
					n
				});
			}
		}
		//#endregion
		//#region lib/types/client/session-actions/derived.js
		/**
		* Project one observable into another, recomputing only when the source
		* snapshot changes identity, so consumers that select from the projection
		* (a Set lookup per row) never rebuild it per read.
		* @param source - the observable to project.
		* @param project - pure projection of one source snapshot.
		* @returns the projected observable, subscribing through the source.
		*/
		function derive(source, project) {
			let seen;
			let value;
			return {
				getSnapshot: () => {
					const snapshot = source.getSnapshot();
					if (value === void 0 || snapshot !== seen) {
						seen = snapshot;
						value = project(snapshot);
					}
					return value;
				},
				subscribe: (listener) => source.subscribe(listener)
			};
		}
		//#endregion
		//#region lib/types/client/session-actions/ForkSession.js
		/** The fork action: one `sidebar.workspaces.session.menu.item` row. */
		/**
		* Menu row (order 300): fork at the Session's last completed turn; the child
		* arrives through the Host list beside its source. Absent when the access
		* snapshot excludes `session/fork` for this Session.
		* @param props - owner share, menu open state, access Hook, and the fork share.
		* @returns the row, or nothing when the caller may not fork this Session.
		*/
		function ForkSessionMenuItem({ sessionId, useMenuOpenState, useShortcuts, useSessionAccess, forkSession, t }) {
			const [, setMenuOpen] = useMenuOpenState();
			const shortcut = useShortcuts((rows) => rows.find((row) => row.id === "session.fork"));
			if (!useSessionAccess(sessionId, "session/fork")) return null;
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MenuItemButton, {
				shortcut,
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutlineRegular, {}),
				onSelect: () => {
					setMenuOpen(false);
					forkSession(sessionId);
				},
				children: t("menu.fork")
			});
		}
		//#endregion
		//#region lib/types/client/session-actions/PinSession.js
		/**
		* The pin action: a `sidebar.workspaces.session.menu.item` row and a
		* `sidebar.workspaces.session.row.action` button over one injected behavior.
		* Pin and archive are mutually exclusive on the Host, so the action reads both
		* sets and does not offer itself on an archived row; what a pin does beyond
		* the Host call (fronting the Session in its saved orders, the failure
		* notice) lives in the injected callbacks, not here.
		*/
		/** The row's pin and archive membership, one Set lookup each. */
		function usePinState({ sessionId, usePinned, useArchived }) {
			return {
				pinned: usePinned((pinned) => pinned.has(sessionId)),
				archived: useArchived((archived) => archived.has(sessionId))
			};
		}
		/**
		* Menu row (order 100): pin or unpin by the row's current state; absent on archived rows.
		* @param props - owner share, the pin share, and the menu open state.
		* @returns the row, or null for an archived Session.
		*/
		function PinSessionMenuItem(props) {
			const { sessionId, useMenuOpenState, pinSession, unpinSession, t } = props;
			const [, setMenuOpen] = useMenuOpenState();
			const { pinned, archived } = usePinState(props);
			if (archived) return null;
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MenuItemButton, {
				icon: pinned ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPinFillRegular, {}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPinOutlineRegular, {}),
				onSelect: () => {
					setMenuOpen(false);
					(pinned ? unpinSession : pinSession)(sessionId);
				},
				children: t(pinned ? "menu.unpinSession" : "menu.pinSession")
			});
		}
		/**
		* Hover button (order 200, rightmost: it lands where the rest-state pin marker sits); absent on archived rows.
		* @param props - owner share and the pin share.
		* @returns the button, or null for an archived Session.
		*/
		function PinSessionRowButton(props) {
			const { sessionId, pinSession, unpinSession, t } = props;
			const { pinned, archived } = usePinState(props);
			if (archived) return null;
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label: t(pinned ? "actions.unpin" : "actions.pin"),
				side: "bottom",
				align: "end",
				delayMs: 500,
				portal: true,
				children: (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: Rows_module_css_default.iconButton,
					"aria-label": t(pinned ? "menu.unpinSession" : "menu.pinSession"),
					onClick: () => {
						(pinned ? unpinSession : pinSession)(sessionId);
					},
					children: pinned ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPinFillRegular, { size: 14 }) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPinOutlineRegular, { size: 14 })
				})
			});
		}
		//#endregion
		//#region lib/types/client/session-actions/RenameSession.js
		/**
		* The rename action: a `sidebar.workspaces.session.menu.item` row that raises
		* the rename request, and the `shell.overlay` dialog entry that answers it.
		* The dialog lives outside the row menu because the row unmounts with the
		* menu; the browser raises the same request from a title double-click.
		*/
		/**
		* Menu row (order 200): ask for the rename dialog, seeded with the row's current title.
		* @param props - owner share, menu open state, and the rename share.
		* @returns the row.
		*/
		function RenameSessionMenuItem({ sessionId, displayTitle, useMenuOpenState, useShortcuts, requestSessionRename, t }) {
			const [, setMenuOpen] = useMenuOpenState();
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MenuItemButton, {
				shortcut: useShortcuts((rows) => rows.find((row) => row.id === "session.rename")),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutlineRegular, {}),
				onSelect: () => {
					setMenuOpen(false);
					requestSessionRename(sessionId, displayTitle);
				},
				children: t("rename")
			});
		}
		/**
		* The `shell.overlay` entry: nothing while no rename is requested, otherwise
		* one dialog per request (keyed by the Session, so a new request starts a
		* fresh draft). Sessions have no client-side name-conflict rule (the host
		* normalizes), and unlike Workspace rename an unchanged title is NOT
		* blocked. An unnamed Session starts with an empty draft and requires a name.
		* @param props - the request hook, its settlement, the rename hop, and the locale seat.
		* @returns the open dialog, or null.
		*/
		function SessionRenameDialog({ useRenameRequest, settleSessionRename, renameSession, t }) {
			const request = useRenameRequest((pending) => pending);
			if (request === null) return null;
			return (0, react_jsx_runtime.jsx)(RenameForm, {
				request,
				renameSession,
				onSettle: settleSessionRename,
				t
			}, request.sessionId);
		}
		/** One request's dialog: the draft seeds from the request on mount; in-flight and error state die with it. */
		function RenameForm({ request, renameSession, onSettle, t }) {
			const [draft, setDraft] = (0, react.useState)(request.currentTitle);
			const [renaming, setRenaming] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const composingRef = (0, react.useRef)(false);
			const trimmed = draft.trim();
			const blocked = renaming || trimmed === "";
			const close = () => {
				if (renaming) return;
				onSettle();
			};
			const confirm = () => {
				if (blocked) return;
				setRenaming(true);
				setError(null);
				renameSession(request.sessionId, trimmed).then(() => {
					setRenaming(false);
					onSettle();
				}).catch((reason) => {
					setRenaming(false);
					setError(reason instanceof Error ? reason.message : String(reason));
				});
			};
			return (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose: close,
				closeLabel: t("close"),
				title: t("rename.session.title"),
				footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					disabled: renaming,
					onClick: close,
					children: t("cancel")
				}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: blocked,
					onClick: confirm,
					children: t("rename")
				})] }),
				children: [(0, react_jsx_runtime.jsx)("input", {
					className: WorkspaceBrowser_module_css_default.renameInput,
					value: draft,
					"aria-label": t("field.sessionName"),
					"data-modal-autofocus": true,
					disabled: renaming,
					onFocus: (e) => {
						e.target.select();
					},
					onChange: (e) => {
						setDraft(e.target.value);
						setError(null);
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
							confirm();
						}
					}
				}), error !== null && (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.renameError,
					role: "alert",
					children: error
				})]
			});
		}
		//#endregion
		//#region lib/types/client/session-actions/RowActionToast.js
		/**
		* Dispatch the current notice without interpreting its business payload.
		* @param props - Current notice, dismissal, and the declared keyed renderer.
		* @returns The selected notice presentation, or nothing.
		*/
		function RowActionToast({ useToast, dismissToast, renderSlot }) {
			const notice = useToast((current) => current);
			if (notice === null) return null;
			return renderSlot("workspace.toast", {
				...notice,
				dismissToast
			}, { entryKey: notice.kind });
		}
		//#endregion
		//#region lib/types/client/toast/Toast.js
		/** One presentation Factory and the adapters for keyed Workspace notices. */
		/**
		* Render one notice using the shared Factory.
		* @param props - Keyed payload, injected display mapping, locale, and Factory renderer.
		* @returns The shared Toast occurrence.
		*/
		function ToastEntry(props) {
			const { dismissToast, display, t, renderFactorySlot, seq } = props;
			return renderFactorySlot("workspace.toast.content", {
				...display(props, t, dismissToast),
				seq,
				onDone: dismissToast
			});
		}
		/**
		* Keep the archive filter action reactive without subscribing unrelated notices.
		* @param props - Archive notice, display mapping, and the existing viewing store.
		* @returns The shared Toast occurrence with its current actions.
		*/
		function ArchiveToastEntry(props) {
			const { dismissToast, display, filterAction, useStore, t, renderFactorySlot, seq } = props;
			const archivedVisible = useStore((state) => (state.archivedFilter ?? "default") !== "default");
			const fields = display(props, t, dismissToast);
			return renderFactorySlot("workspace.toast.content", {
				...fields,
				actions: [...fields.actions ?? [], ...archivedVisible ? [] : [filterAction(t, dismissToast)]],
				seq,
				onDone: dismissToast
			});
		}
		/**
		* Present plain display data with the shared primitive's timing and portal.
		* @param props - Localized display fields, display identity, and dismissal.
		* @returns One Toast, remounted only for a new display identity.
		*/
		function WorkspaceToast({ seq, text, tone, holdMs, actions, onDone }) {
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
				text,
				onDone,
				...tone === "success" ? { tone: "success" } : {},
				...tone === "warning" ? { icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutlineRegular, {}) } : {},
				...holdMs === void 0 ? {} : { holdMs },
				...actions === void 0 ? {} : { actions }
			}, seq);
		}
		//#endregion
		//#region lib/types/client/toast/register.js
		/** Register notice presentations with their business-owned display fields and actions.
		* @param ctx - Workspace plugin context.
		* @param viewStore - Viewing store, read only by archive notices.
		* @param actions - Archive and source-opening callbacks.
		*/
		function registerToasts(ctx, viewStore, actions) {
			const archiveFilterAction = (t, dismiss) => ({
				prefix: t("toast.archivedOr"),
				label: t("toast.archivedFilter"),
				onClick: () => {
					dismiss();
					actions.showArchived();
				}
			});
			ctx.slots.registerFactory({
				name: "workspace.toast.content",
				scope: "root"
			}, WorkspaceToast);
			ctx.slots.inject("workspace.toast", function* () {
				yield ctx.slots.register({
					name: "workspace.toast",
					key: "sessionIdCopied",
					locale: "workspace",
					inject: () => ({ display: (_notice, t) => ({
						text: t("toast.sessionIdCopied"),
						tone: "success"
					}) })
				}, ToastEntry);
				yield ctx.slots.register({
					name: "workspace.toast",
					key: "sessionIdCopyFailed",
					locale: "workspace",
					inject: () => ({ display: (_notice, t) => ({
						text: t("toast.sessionIdCopyFailed"),
						tone: "warning"
					}) })
				}, ToastEntry);
				yield ctx.slots.register({
					name: "workspace.toast",
					key: "pinFailed",
					locale: "workspace",
					inject: () => ({ display: (_notice, t) => ({
						text: t("toast.pinFailed"),
						tone: "warning"
					}) })
				}, ToastEntry);
				yield ctx.slots.register({
					name: "workspace.toast",
					key: "unpinFailed",
					locale: "workspace",
					inject: () => ({ display: (_notice, t) => ({
						text: t("toast.unpinFailed"),
						tone: "warning"
					}) })
				}, ToastEntry);
				yield ctx.slots.register({
					name: "workspace.toast",
					key: "archivedNotOpenable",
					locale: "workspace",
					inject: () => ({ display: (_notice, t) => ({
						text: t("toast.archivedNotOpenable"),
						tone: "warning"
					}) })
				}, ToastEntry);
				yield ctx.slots.register({
					name: "workspace.toast",
					key: "defaultWorkspaceFailed",
					locale: "workspace",
					inject: () => ({ display: (_notice, t) => ({
						text: t("defaultWorkspace.failed"),
						tone: "warning"
					}) })
				}, ToastEntry);
				yield ctx.slots.register({
					name: "workspace.toast",
					key: "shortcutForkFailed",
					locale: "workspace",
					inject: () => ({ display: (notice, t) => ({
						text: t(notice.reason === "unavailable" ? "shortcut.noCompletedTurn" : "shortcut.forkFailed"),
						tone: "plain"
					}) })
				}, ToastEntry);
				yield ctx.slots.register({
					name: "workspace.toast",
					key: "createFailed",
					locale: "workspace",
					inject: () => ({ display: (notice, t) => ({
						text: t("toast.createFailed", { message: notice.message }),
						tone: "warning",
						holdMs: 6e3
					}) })
				}, ToastEntry);
				yield ctx.slots.register({
					name: "workspace.toast",
					key: "forkRequiresOpen",
					locale: "workspace",
					inject: () => ({ display: (notice, t, dismiss) => ({
						text: t("toast.forkRequiresOpen"),
						tone: "warning",
						holdMs: 6e3,
						actions: [{
							label: t("toast.openForkSource"),
							onClick: () => {
								dismiss();
								actions.openForkSource(notice.sessionId);
							}
						}]
					}) })
				}, ToastEntry);
				yield ctx.slots.register({
					name: "workspace.toast",
					key: "archived",
					locale: "workspace",
					store: viewStore,
					inject: () => ({
						display: (notice, t, dismiss) => ({
							text: t("toast.archived"),
							tone: "success",
							holdMs: 6e3,
							actions: [{
								label: t("toast.archivedUndo"),
								onClick: () => {
									dismiss();
									actions.undoArchive(notice.sessionId);
								}
							}]
						}),
						filterAction: archiveFilterAction
					})
				}, ArchiveToastEntry);
				yield ctx.slots.register({
					name: "workspace.toast",
					key: "stoppedAndArchived",
					locale: "workspace",
					store: viewStore,
					inject: () => ({
						display: (notice, t, dismiss) => ({
							text: t("toast.stoppedAndArchived"),
							tone: "success",
							holdMs: 6e3,
							actions: [{
								label: t("toast.archivedUndo"),
								onClick: () => {
									dismiss();
									actions.undoArchive(notice.sessionId);
								}
							}]
						}),
						filterAction: archiveFilterAction
					})
				}, ArchiveToastEntry);
			});
		}
		//#endregion
		//#region lib/types/client/session-actions/SessionId.js
		/** Copy the row's Session ID without opening its history. */
		/**
		* Copy the complete ID after dismissing the row menu.
		* @param props - Row identity, menu dismissal, clipboard action, and locale.
		* @returns The final built-in menu item.
		*/
		function SessionIdMenuItem({ sessionId, useMenuOpenState, copySessionId, t }) {
			const [, setMenuOpen] = useMenuOpenState();
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MenuItemButton, {
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutlineRegular, {}),
				onSelect: () => {
					setMenuOpen(false);
					copySessionId(sessionId);
				},
				children: t("menu.sessionId")
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
			"defaultWorkspace.failed": "无法创建默认工作区，请通过“选择工作区”选择文件夹",
			"draft.workspaceRequired": "请先选择工作区",
			"draft.initializationFailed": "暂时无法填入草稿，请稍后重试",
			"group.ungrouped": "未分组",
			"session.new": "新会话",
			"session.untitled": "未命名",
			"shortcut.noSession": "请先选择一个会话",
			"shortcut.noPicker": "目录选择器不可用",
			"shortcut.directoryBusy": "正在选择或添加工作区",
			"shortcut.noCompletedTurn": "当前会话没有已结束的轮次",
			"shortcut.forkFailed": "无法分叉会话，请重试",
			"section.workspaces": "工作区",
			"section.sessions": "会话",
			"viewOptions.label": "视图选项",
			"groupBy.label": "分组方式",
			"groupBy.workspace": "按工作区",
			"groupBy.workspaceTree": "按工作区树",
			"groupBy.flat": "单列表",
			"orderBy.label": "排序方式",
			"orderBy.manual": "手动排序",
			"orderBy.updated": "最近更新",
			"filterBy.label": "筛选会话",
			"viewOptions.hideArchived": "隐藏已归档",
			"viewOptions.showArchived": "全部对话（显示已归档）",
			"viewOptions.onlyArchived": "仅显示已归档",
			"sessions.expand": "展开其余 {n} 个会话",
			"sessions.collapse": "收起",
			"empty.none": "暂无会话",
			"empty.noneArchived": "暂无已归档会话",
			"empty.viewOthers": "查看其他会话",
			"empty.noMatches": "无匹配结果",
			"workspace.add": "添加工作区",
			"search.sessions.aria": "搜索会话",
			"search.placeholder": "搜索会话名称",
			"search.clear": "清除搜索",
			"search.results.aria": "搜索结果",
			"search.pending": "正在搜索会话历史…",
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
			"menu.unarchiveSession": "取消归档",
			"menu.pinSession": "置顶会话",
			"menu.unpinSession": "取消置顶",
			"menu.sessionId": "复制 Session ID",
			"toast.sessionIdCopied": "Session ID 已复制",
			"toast.sessionIdCopyFailed": "复制失败，请重试",
			"row.archived": "已归档",
			"row.pinned": "已置顶",
			"toast.archivedNotOpenable": "已归档对话暂时无法查看，请取消归档后查看",
			"toast.archived": "会话已归档，可",
			"toast.stoppedAndArchived": "已停止并归档，可",
			"archive.confirm.title": "停止并归档此会话？",
			"archive.confirm.desc": "“{title}”仍有正在进行的工作。归档会先停止这些工作；之后可在侧栏筛选“全部对话（显示已归档）”中恢复会话，被停止的工作不会自动继续。",
			"archive.confirm.activity": "将被停止的工作",
			"archive.confirm.turn": "进行中的回合",
			"archive.confirm.subagents.one": "{n} 个运行中的子智能体：{names}",
			"archive.confirm.subagents.other": "{n} 个运行中的子智能体：{names}",
			"archive.confirm.jobs.one": "{n} 个后台任务：{names}",
			"archive.confirm.jobs.other": "{n} 个后台任务：{names}",
			"archive.confirm.schedules.one": "{n} 条定时提醒：{names}",
			"archive.confirm.schedules.other": "{n} 条定时提醒：{names}",
			"archive.confirm.other.one": "{n} 项其他工作（{kind}）",
			"archive.confirm.other.other": "{n} 项其他工作（{kind}）",
			"archive.confirm.listSeparator": "、",
			"archive.confirm.action": "停止并归档",
			"archive.confirm.pending": "正在停止并归档…",
			"toast.archivedUndo": "撤销",
			"toast.archivedOr": "或",
			"toast.archivedFilter": "筛选已归档会话",
			"toast.pinFailed": "置顶失败，请稍后重试",
			"toast.unpinFailed": "取消置顶失败，请稍后重试",
			"toast.createFailed": "新建会话失败：{message}",
			"toast.forkRequiresOpen": "请先打开原会话完成迁移，再创建分支",
			"toast.openForkSource": "打开原会话",
			"sessions.count.one": "{n} 个会话",
			"sessions.count.other": "{n} 个会话",
			"actions.workspace.aria": "工作区“{name}”的操作",
			"actions.session.aria": "会话“{name}”的操作",
			"actions.archive": "归档会话",
			"actions.unarchive": "取消归档",
			"actions.pin": "置顶会话",
			"actions.unpin": "取消置顶",
			"actions.newSession": "新会话",
			"actions.newSession.aria": "在“{name}”中新建会话",
			"status.running": "进行中",
			"status.subagentsRunning.one": "{n} 个子智能体运行中",
			"status.subagentsRunning.other": "{n} 个子智能体运行中",
			"status.idle": "空闲",
			"status.waitingApproval": "等待审批",
			"status.planReview": "计划待审",
			"status.waitingAnswer": "等待回答",
			"status.compact.approval": "待审批",
			"status.compact.planReview": "计划待审",
			"status.compact.answer": "待回答",
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
			"defaultWorkspace.failed": "Unable to create default workspace. Use Choose workspace to select a folder.",
			"draft.workspaceRequired": "Choose a workspace first.",
			"draft.initializationFailed": "Could not fill the draft. Please try again shortly.",
			"group.ungrouped": "Ungrouped",
			"session.new": "New Session",
			"session.untitled": "Untitled",
			"shortcut.noSession": "Select a session first",
			"shortcut.noPicker": "Directory picker unavailable",
			"shortcut.directoryBusy": "Selecting or adding a workspace",
			"shortcut.noCompletedTurn": "This session has no completed turn",
			"shortcut.forkFailed": "Could not fork the session. Try again.",
			"section.workspaces": "Workspaces",
			"section.sessions": "Sessions",
			"viewOptions.label": "View options",
			"groupBy.label": "Group by",
			"groupBy.workspace": "WorkSpace",
			"groupBy.workspaceTree": "Workspace Tree",
			"groupBy.flat": "In one list",
			"orderBy.label": "Order by",
			"orderBy.manual": "Manual",
			"orderBy.updated": "Last updated",
			"filterBy.label": "Filter sessions",
			"viewOptions.hideArchived": "Hide archived",
			"viewOptions.showArchived": "All conversations (show archived)",
			"viewOptions.onlyArchived": "Archived only",
			"sessions.expand": "Show {n} more sessions",
			"sessions.collapse": "Show less",
			"empty.none": "No sessions yet",
			"empty.noneArchived": "No archived sessions yet",
			"empty.viewOthers": "View other sessions",
			"empty.noMatches": "No matches",
			"workspace.add": "Add workspace",
			"search.sessions.aria": "Search sessions",
			"search.placeholder": "Search session names",
			"search.clear": "Clear search",
			"search.results.aria": "Search results",
			"search.pending": "Searching session history…",
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
			"menu.unarchiveSession": "Unarchive session",
			"menu.pinSession": "Pin session",
			"menu.unpinSession": "Unpin session",
			"menu.sessionId": "Copy Session ID",
			"toast.sessionIdCopied": "Session ID copied",
			"toast.sessionIdCopyFailed": "Copy failed. Try again.",
			"row.archived": "Archived",
			"row.pinned": "Pinned",
			"toast.archivedNotOpenable": "Archived sessions cannot be opened. Unarchive it to view.",
			"toast.archived": "Session archived. You can ",
			"toast.stoppedAndArchived": "Session stopped and archived. You can ",
			"archive.confirm.title": "Stop and archive this session?",
			"archive.confirm.desc": "“{title}” still has work in progress. Archiving stops it first; you can restore the session later from the “All conversations (show archived)” filter in the sidebar, and the stopped work will not resume on its own.",
			"archive.confirm.activity": "Work that will be stopped",
			"archive.confirm.turn": "The turn in progress",
			"archive.confirm.subagents.one": "{n} running subagent: {names}",
			"archive.confirm.subagents.other": "{n} running subagents: {names}",
			"archive.confirm.jobs.one": "{n} background job: {names}",
			"archive.confirm.jobs.other": "{n} background jobs: {names}",
			"archive.confirm.schedules.one": "{n} scheduled reminder: {names}",
			"archive.confirm.schedules.other": "{n} scheduled reminders: {names}",
			"archive.confirm.other.one": "{n} other item of work ({kind})",
			"archive.confirm.other.other": "{n} other items of work ({kind})",
			"archive.confirm.listSeparator": ", ",
			"archive.confirm.action": "Stop and archive",
			"archive.confirm.pending": "Stopping and archiving…",
			"toast.archivedUndo": "undo",
			"toast.archivedOr": " or ",
			"toast.archivedFilter": "filter archived sessions",
			"toast.pinFailed": "Pin failed. Try again later.",
			"toast.unpinFailed": "Unpin failed. Try again later.",
			"toast.createFailed": "New session failed: {message}",
			"toast.forkRequiresOpen": "Open the original session to complete migration before creating a branch.",
			"toast.openForkSource": "Open original session",
			"sessions.count.one": "{n} session",
			"sessions.count.other": "{n} sessions",
			"actions.workspace.aria": "Workspace actions for {name}",
			"actions.session.aria": "Session actions for {name}",
			"actions.archive": "Archive",
			"actions.unarchive": "Unarchive",
			"actions.pin": "Pin",
			"actions.unpin": "Unpin",
			"actions.newSession": "New session",
			"actions.newSession.aria": "New session in {name}",
			"status.running": "Running",
			"status.subagentsRunning.one": "{n} subagent running",
			"status.subagentsRunning.other": "{n} subagents running",
			"status.idle": "Idle",
			"status.waitingApproval": "Waiting for approval",
			"status.planReview": "Plan awaiting review",
			"status.waitingAnswer": "Waiting for answer",
			"status.compact.approval": "Approval",
			"status.compact.planReview": "Plan review",
			"status.compact.answer": "Answer",
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
			"remote",
			"remote.directoryPicker",
			"layout",
			"shortcuts",
			"remoteAccess"
		];
		/**
		* Register the browser and picker once their slot declarations are on the
		* ledger. Inject factories return plain callbacks; data reads use the
		* framework's global hooks.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const sessions = ctx.get("sessions");
			const workspaces = ctx.get("workspaces");
			const viewHandle = createWorkspaceViewStore();
			const viewInstance = viewHandle.create();
			const viewStore = {
				...viewHandle,
				create: () => viewInstance
			};
			const rowToast = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(null);
			let toastSeq = 0;
			const notify = (toast) => {
				rowToast.set({
					...toast,
					seq: ++toastSeq
				});
			};
			const uiWorkspace = new UiWorkspaceService(ctx, ctx.remote.directoryPicker, workspaces, sessions, viewInstance.actions, notify);
			ctx.slots.provideRoot({
				hooks: { workspaces: workspaces.list },
				keyedHooks: { workspaceAccess: (workspaceId, action) => action === void 0 ? void 0 : ctx.remoteAccess.source("workspace", workspaceId, action) }
			});
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-workspace: dictionaries");
			const shortcutControls = createWorkspaceShortcutControls();
			const searchSessions = async (query, signal) => {
				const result = await sessions.search(query, signal);
				if (!result.ok) throw new Error(result.error.message);
				return result.value;
			};
			const flowSource = (hole) => ({
				getSnapshot: () => ctx.slots.entries(hole).length > 0,
				subscribe: (listener) => ctx.slots.subscribe(hole, listener)
			});
			const browserFlowSource = flowSource("sidebar.workspaces.directoryFlow");
			const hostInfo = {
				getSnapshot: () => ctx.remote.$host,
				subscribe: (listener) => ctx.on("connection/reset", listener)
			};
			const pickerFlowSource = flowSource("conversation.hero.workspace.directoryFlow");
			const openSession = (sessionId) => {
				uiWorkspace.openSession(sessionId);
			};
			const pinnedSet = derive(workspaces.list, (snapshot) => new Set(snapshot.pinnedSessionIds));
			const archivedSet = derive(workspaces.list, (snapshot) => new Set(snapshot.archivedSessionIds));
			const renameRequest = derive(shortcutControls.state, (state) => state.renameTarget);
			const archiveRequest = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(null);
			const requestSessionRename = shortcutControls.rename;
			const unarchiveSession = (sessionId) => {
				uiWorkspace.unarchiveSession(sessionId).catch((reason) => {
					console.warn("session unarchive rejected:", reason);
				});
			};
			const renameSession = async (sessionId, title) => {
				const result = await sessions.using(sessionId, { source: "workspaceOperation" }, (reference) => reference.binding.session.rename(title));
				if (!result.ok) throw new Error(result.error.message);
			};
			const pinInjected = () => ({
				hooks: {
					pinned: pinnedSet,
					archived: archivedSet
				},
				pinSession: (sessionId) => {
					uiWorkspace.pinSession(sessionId).catch(() => {
						notify({ kind: "pinFailed" });
					});
				},
				unpinSession: (sessionId) => {
					uiWorkspace.unpinSession(sessionId).catch(() => {
						notify({ kind: "unpinFailed" });
					});
				}
			});
			const archiveInjected = () => ({
				hooks: { archived: archivedSet },
				archiveSession: (sessionId) => {
					uiWorkspace.archiveSession(sessionId).then(() => {
						notify({
							kind: "archived",
							sessionId
						});
					}).catch((reason) => {
						const activity = activeSessionRefusal(reason);
						if (activity === void 0) {
							console.warn("session archive rejected:", reason);
							return;
						}
						const displayTitle = sessions.list.getSnapshot().byId[sessionId]?.displayTitle ?? sessionId;
						archiveRequest.set({
							sessionId,
							displayTitle,
							activity
						});
					});
				},
				unarchiveSession
			});
			installWorkspaceShortcuts(ctx, uiWorkspace, shortcutControls, archiveInjected().archiveSession, (reason) => {
				notify({
					kind: "shortcutForkFailed",
					reason
				});
			});
			const archiveConfirmInjected = () => ({
				hooks: { archiveRequest },
				settleSessionArchive: () => {
					archiveRequest.set(null);
				},
				stopAndArchiveSession: async (sessionId) => {
					await uiWorkspace.archiveSession(sessionId, { stopActivity: true });
					notify({
						kind: "stoppedAndArchived",
						sessionId
					});
				}
			});
			const forkInjected = () => ({ forkSession: (sessionId) => {
				uiWorkspace.forkSession(sessionId, (childId) => {
					ctx.get("productAnalytics")?.track("branch_session_click", {
						session_id: childId,
						parent_session_id: sessionId,
						click_position: "sidebar"
					});
				}, { allowMigration: false }).catch((error) => {
					if (error instanceof Error && error.name === "SessionForkError" && error.rpcError.code === "session/migration-required") notify({
						kind: "forkRequiresOpen",
						sessionId
					});
				});
			} });
			const sessionIdInjected = () => ({ copySessionId: async (sessionId) => {
				notify({ kind: await (0, _deepseek_ai_dsh_client_ui_primitives.writeClipboard)(sessionId) ? "sessionIdCopied" : "sessionIdCopyFailed" });
			} });
			const renameInjected = () => ({ requestSessionRename });
			const renameDialogInjected = () => ({
				hooks: { renameRequest },
				settleSessionRename: shortcutControls.closeRename,
				renameSession
			});
			registerToasts(ctx, viewStore, {
				undoArchive: unarchiveSession,
				showArchived: () => {
					viewInstance.actions.setArchivedFilter("show");
				},
				openForkSource: (sessionId) => {
					if (workspaces.list.getSnapshot().archivedSessionIds.includes(sessionId)) {
						notify({ kind: "archivedNotOpenable" });
						return;
					}
					openSession(sessionId);
				}
			});
			const rowToastInjected = () => ({
				hooks: { toast: rowToast },
				dismissToast: () => {
					rowToast.set(null);
				}
			});
			const browserInjected = () => ({
				startSession: (workspaceId, options) => {
					uiWorkspace.startSession(workspaceId, options);
				},
				open: openSession,
				searchSessions,
				searchResultLimit: sessions.searchResultLimit,
				requestSessionRename,
				notifyArchivedNotOpenable: () => {
					notify({ kind: "archivedNotOpenable" });
				},
				renameWorkspace: async (workspaceId, title) => {
					await workspaces.rename(workspaceId, title);
				},
				deleteWorkspace: async (workspaceId) => {
					await workspaces.delete(workspaceId);
				},
				insertWorkspaceBefore: async (workspaceId, beforeWorkspaceId) => {
					await workspaces.insertBefore(workspaceId, beforeWorkspaceId);
				},
				unarchiveSession: async (sessionId) => {
					await uiWorkspace.unarchiveSession(sessionId);
				},
				createWorkspace: (input) => workspaces.create(input),
				requestSearch: shortcutControls.search,
				requestAddWorkspace: shortcutControls.add,
				closeAddWorkspace: shortcutControls.closeAdd,
				setDirectoryBusy: shortcutControls.directoryBusy,
				hooks: {
					directoryFlow: browserFlowSource,
					hostInfo,
					workspaceShortcuts: shortcutControls.state,
					shortcuts: ctx.shortcuts.catalog
				}
			});
			const pickerInjected = () => ({
				createWorkspace: (input) => workspaces.create(input),
				hooks: { directoryFlow: pickerFlowSource }
			});
			ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({
				name: "sidebar.workspaces",
				children: {
					"sidebar.workspaces.directoryFlow": {
						kind: "single",
						scope: "root"
					},
					"sidebar.workspaces.session.menu.item": {
						kind: "list",
						scope: "root",
						inject: { hooks: {
							menuOpenState: menuOpenStateFactory,
							shortcuts: ctx.shortcuts.catalog
						} }
					},
					"sidebar.workspaces.session.row.action": {
						kind: "list",
						scope: "root"
					},
					"sidebar.session.row.leading": {
						kind: "list",
						scope: "root"
					},
					"sidebar.session.row.hover": {
						kind: "list",
						scope: "root"
					}
				},
				store: viewStore,
				inject: browserInjected,
				locale: NS
			}, WorkspaceBrowser));
			ctx.slots.inject("sidebar.workspaces.session.menu.item", function* () {
				yield ctx.slots.register({
					name: "sidebar.workspaces.session.menu.item",
					id: "pin",
					order: 100,
					locale: NS,
					inject: pinInjected
				}, PinSessionMenuItem);
				yield ctx.slots.register({
					name: "sidebar.workspaces.session.menu.item",
					id: "rename",
					order: 200,
					locale: NS,
					inject: renameInjected
				}, RenameSessionMenuItem);
				yield ctx.slots.register({
					name: "sidebar.workspaces.session.menu.item",
					id: "fork",
					order: 300,
					locale: NS,
					inject: forkInjected
				}, ForkSessionMenuItem);
				yield ctx.slots.register({
					name: "sidebar.workspaces.session.menu.item",
					id: "archive",
					order: 400,
					locale: NS,
					inject: archiveInjected
				}, ArchiveSessionMenuItem);
				yield ctx.slots.register({
					name: "sidebar.workspaces.session.menu.item",
					id: "session-id",
					order: 450,
					locale: NS,
					inject: sessionIdInjected
				}, SessionIdMenuItem);
			});
			ctx.slots.inject("sidebar.workspaces.session.row.action", function* () {
				yield ctx.slots.register({
					name: "sidebar.workspaces.session.row.action",
					id: "archive",
					order: 100,
					locale: NS,
					inject: archiveInjected
				}, ArchiveSessionRowButton);
				yield ctx.slots.register({
					name: "sidebar.workspaces.session.row.action",
					id: "pin",
					order: 200,
					locale: NS,
					inject: pinInjected
				}, PinSessionRowButton);
			});
			ctx.slots.inject("shell.overlay", function* () {
				yield ctx.slots.register({
					name: "shell.overlay",
					id: "workspace.session-rename",
					locale: NS,
					inject: renameDialogInjected
				}, SessionRenameDialog);
				yield ctx.slots.register({
					name: "shell.overlay",
					id: "workspace.session-archive",
					locale: NS,
					inject: archiveConfirmInjected
				}, SessionArchiveConfirmDialog);
				yield ctx.slots.register({
					name: "shell.overlay",
					id: "workspace.row-toast",
					inject: rowToastInjected,
					children: { "workspace.toast": {
						kind: "keyed",
						scope: "root"
					} }
				}, RowActionToast);
			});
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
		/**
		* The activity a Host `workspace/session-active` refusal reported, or nothing
		* for any other failure. The class identity check goes by name: client plugin
		* bundles do not share error-class identity.
		*/
		function activeSessionRefusal(reason) {
			if (!(reason instanceof Error) || reason.name !== "WorkspaceArchiveError") return void 0;
			const { rpcError } = reason;
			return rpcError.code === "workspace/session-active" ? rpcError.details.activity : void 0;
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map