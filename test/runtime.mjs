// Shared test runtime resolution: react comes from this repo's own
// devDependencies (the profiles and npx caches are not guaranteed to carry
// react/react-dom), and the DSH client module loader comes from the installed
// desktop app's app.asar — with the legacy unpacked / cache layouts as
// fallbacks. A stale npx cache copy previously masked a shipping-app rebuild,
// so the asar source is preferred over any cache.
import { createRequire } from "node:module"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

/** Minimal asar reader: pull one file out of an Electron archive as a Buffer. */
export function readAsarFile(asarPath, innerPath) {
	const buf = readFileSync(asarPath)
	const headerSize = buf.readUInt32LE(4)
	const jsonLen = buf.readUInt32LE(12)
	const header = JSON.parse(buf.slice(16, 16 + jsonLen).toString("utf8"))
	let node = header
	for (const part of innerPath.split("/")) {
		node = node.files?.[part]
		if (!node) throw new Error(`asar: ${innerPath} not found in ${asarPath}`)
	}
	if (node.files) throw new Error(`asar: ${innerPath} is a directory`)
	return buf.slice(8 + headerSize + Number(node.offset), 8 + headerSize + Number(node.offset) + node.size)
}

const repoRequire = createRequire(join(import.meta.dirname, "..", "package.json"))

/** react / react-dom resolved from this repo's devDependencies. */
export const React = repoRequire("react")
export const jsxRuntime = repoRequire("react/jsx-runtime")
export const ReactDOMServer = repoRequire("react-dom/server")

/** The DSH client module loader source (dsh-client-modules/lib/client.js). */
export function loadLoaderSource() {
	const explicit = process.env.DSH_CLIENT_MODULES_BUNDLE
	if (explicit && existsSync(explicit)) return readFileSync(explicit, "utf8")
	for (const app of ["DeepSeek Harness.app", "DSH Desktop.app"]) {
		const asar = join("/Applications", app, "Contents", "Resources", "app.asar")
		try {
			return readAsarFile(asar, "dsh/node_modules/@deepseek-ai/dsh-client-modules/lib/client.js").toString("utf8")
		} catch {
			/* app not installed or module absent — fall through */
		}
	}
	const legacy = [
		"/Applications/DSH Desktop.app/Contents/Resources/app.asar.unpacked/node_modules/@deepseek-ai/dsh-client-modules/lib/client.js",
		join(homedir(), ".dsh", "profiles", "web", "node_modules", "@deepseek-ai", "dsh-client-modules", "lib", "client.js"),
	].find((path) => existsSync(path))
	if (legacy) return readFileSync(legacy, "utf8")
	throw new Error("cannot locate DSH client module loader; set DSH_CLIENT_MODULES_BUNDLE")
}
