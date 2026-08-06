/**
 * Error reporting for the plugin sandbox: a hand-rolled Sentry envelope POST.
 *
 * ## Why there is no SDK here
 *
 * - **`code.js` is committed** and its diffs get read (see build.mjs, which declines to
 *   minify for the same reason). Bundling `@sentry/browser` would add tens of thousands of
 *   lines to a reviewed artifact to send one HTTP request.
 * - **Figma's sandbox is not a browser.** There is no `window`, no DOM, no
 *   `XMLHttpRequest`, no `crypto` and no `URL` — the SDK's transports and most of its
 *   default integrations assume several of those. That is also why the DSN is parsed with a
 *   regex and the event id is built from `Math.random` below: both `URL` and
 *   `crypto.randomUUID` are web APIs, not ECMAScript, and neither is available.
 *   `plugin/test/plugin.test.mjs` enforces this — it runs the built bundle in a `vm`
 *   context with an explicit global whitelist, so reaching for a non-ES global fails the
 *   test suite rather than only failing inside Figma.
 * - **Nothing the SDK adds is reachable anyway**: no DOM breadcrumbs, no navigation, and no
 *   global `onerror`/`unhandledrejection` hook to install. Coverage comes from wrapping the
 *   one entry point instead — see `figma.ui.onmessage` in code.ts.
 *
 * The report is correspondingly thin: exception type, message, a parsed stack and whatever
 * context the call site names. That is enough to answer "which flow broke, and where".
 *
 * ## Source maps
 *
 * The stack is turned into real Sentry frames rather than sent as a string, because a
 * string can never be symbolicated: Sentry resolves a source map per *frame*, against that
 * frame's file, line and column. With the frames below, `plugin/build.mjs` emitting
 * code.js.map, and `npm run sourcemaps:upload` having uploaded it under this event's
 * `release`, an issue shows `code.ts`/`core` source instead of positions in a 20 kB IIFE.
 * All three have to be in place — see scripts/sentry-sourcemaps.mjs.
 */

// No env system in a Figma plugin, so this is a constant — same as API_BASE in code.ts.
// A DSN is a public identifier: it only grants "write an event", so shipping it inside a
// published plugin is expected and is what every browser SDK does.
//
// Setting this to "" is a fully supported state: `resolveEndpoint` returns null,
// `captureError` becomes a no-op, and the plugin behaves exactly as it did before Sentry
// existed.
//
// The host must stay in step with `networkAccess.allowedDomains` in manifest.json — a
// sandbox `fetch` to a domain that is not listed there is blocked outright. The `de` is
// the org's Sentry region and is part of the DSN.
const SENTRY_DSN =
	"https://d67d38563f6359c0766c81e5126ad044@o4511689468608512.ingest.de.sentry.io/4511809570144336";

/**
 * The plugin's equivalent of `PUB_APP_ENV`, and like `API_BASE` it is a constant because a
 * Figma plugin has no env system — what Figma loads is whatever `code.js` was committed.
 *
 * A published plugin is always production, so `prod` is the right default. Set this to
 * `"local"` while developing against a local Worker (i.e. whenever you change `API_BASE`
 * in code.ts): reporting is skipped entirely, which keeps a developer's own broken build
 * out of the same issue list that real users' crashes land in. `"dev"` exists only so the
 * three values match the other surfaces.
 */
const ENVIRONMENT: "local" | "dev" | "prod" = "prod";

/**
 * `plugin@<version>`, replaced at build time by esbuild's `define` from plugin/package.json
 * — the same call the source-map upload uses, so the two cannot drift. See
 * scripts/sentryRelease.mjs.
 *
 * Declared rather than imported because it does not exist as a value anywhere: `tsc` is only
 * ever run with `--noEmit` here, and esbuild owns the emit. The `typeof` guard is what keeps
 * a build that forgot the `define` from turning the error path into a `ReferenceError`.
 */
declare const __PLUGIN_RELEASE__: string;

const RELEASE = typeof __PLUGIN_RELEASE__ === "string" ? __PLUGIN_RELEASE__ : undefined;

/** `https://<publicKey>@<host>/<projectId>` — see the note above on why not `URL`. */
const DSN_PATTERN = /^(https?:)\/\/([0-9a-f]+)@([^/]+)\/(\d+)$/i;

/**
 * What every frame is reported as, whatever Figma's sandbox actually calls the script.
 *
 * Two things make this correct rather than a fudge. The bundle is a single IIFE — there is
 * exactly one file to be in — and the name the sandbox reports is an internal detail of
 * Figma's loader that this repo cannot pin, so normalizing is the only way to guarantee the
 * frame matches the uploaded artifact. `app:///` is the conventional scheme for a bundle
 * that was never served over HTTP (React Native uses it), and Sentry resolves it to the
 * `~/code.js` the upload script names the artifact.
 *
 * The raw stack string is kept in `extra` as well. Normalizing means a frame that really
 * came from somewhere else would be mislabelled, and the unedited string is the check on
 * that. In practice the sandbox's own host functions are native and carry no line numbers,
 * so they are dropped by the parser rather than mislabelled.
 */
const FRAME_FILE = "app:///code.js";

/** Sentry's cap is 250; 50 keeps a runaway recursion from filling the payload. */
const MAX_FRAMES = 50;

interface StackFrame {
	filename: string;
	abs_path: string;
	function?: string;
	lineno: number;
	colno?: number;
	in_app: boolean;
}

/**
 * Turn an `error.stack` string into Sentry frames, oldest first, which is the order Sentry
 * renders bottom-to-top.
 *
 * Three shapes are accepted, because which one appears depends on the engine behind
 * Figma's sandbox and that is not a promise Figma makes: `at fn (file:12:34)`,
 * `at file:12:34`, and JavaScriptCore's `fn@file:12:34`. A column is optional — some
 * engines report only a line. Anything else is skipped, which is what drops the
 * `Error: message` header and native frames.
 */
function parseStack(stack: string): StackFrame[] {
	const frames: StackFrame[] = [];

	for (const rawLine of stack.split("\n")) {
		const trimmed = rawLine.trim();
		const line = trimmed.replace(/^at\s+/, "").replace(/^async\s+/, "");

		if (!line) {
			continue;
		}

		const parenthesized = /^(.*?)\s*\(([^()]*)\)$/.exec(line);
		const atSign = /^([^@]*)@(.*)$/.exec(line);

		// A frame is `at …` (V8, QuickJS) or `…@…` (JavaScriptCore) — nothing else. Both
		// markers are checked rather than just looking for a trailing `:line:col`, because
		// the first line of a stack is the message and a message that happens to end in
		// something like "retry at 12:34" would otherwise be reported as a frame.
		if (!/^at\s+/.test(trimmed) && !atSign) {
			continue;
		}

		const name = parenthesized ? parenthesized[1] : atSign ? atSign[1] : "";
		const location = parenthesized ? parenthesized[2] : atSign ? atSign[2] : line;
		const position = /:(\d+)(?::(\d+))?$/.exec(location);

		if (!position) {
			continue;
		}

		const frame: StackFrame = {
			filename: FRAME_FILE,
			abs_path: FRAME_FILE,
			lineno: Number(position[1]),
			in_app: true
		};

		if (position[2]) {
			frame.colno = Number(position[2]);
		}

		if (name) {
			frame.function = name;
		}

		frames.push(frame);

		// Capping before the reverse keeps the innermost frames — the ones next to the
		// throw — rather than the entry point.
		if (frames.length === MAX_FRAMES) {
			break;
		}
	}

	return frames.reverse();
}

interface Endpoint {
	url: string;
	key: string;
}

/** `undefined` = not yet parsed, `null` = no usable DSN. Parsed at most once. */
let endpoint: Endpoint | null | undefined;

function resolveEndpoint(): Endpoint | null {
	if (endpoint !== undefined) {
		return endpoint;
	}

	// `local` never reports, matching the other two surfaces.
	const match = ENVIRONMENT === "local" ? null : DSN_PATTERN.exec(SENTRY_DSN.trim());

	endpoint = match
		? { url: `${match[1]}//${match[3]}/api/${match[4]}/envelope/`, key: match[2] }
		: null;

	return endpoint;
}

/** 32 hex characters, which is the shape Sentry wants for `event_id`. */
function newEventId(): string {
	let id = "";

	for (let index = 0; index < 32; index++) {
		id += Math.floor(Math.random() * 16).toString(16);
	}

	return id;
}

/**
 * Report an error, fire and forget.
 *
 * Never throws and never rejects: a failure to report must not become a second failure on
 * top of the one being reported. `context` is a short label for the flow that broke
 * ("import-typescale", "pair", …) and becomes a Sentry tag, so issues group by flow.
 */
export function captureError(
	error: unknown,
	context: string,
	extra?: Record<string, unknown>
): void {
	const target = resolveEndpoint();

	if (!target) {
		return;
	}

	const isError = error instanceof Error;
	const eventId = newEventId();
	const frames = isError && error.stack ? parseStack(error.stack) : [];

	const event = {
		event_id: eventId,
		timestamp: Date.now() / 1000,
		platform: "javascript",
		level: "error",
		environment: ENVIRONMENT,
		// Undefined drops out of JSON.stringify, so a build without the `define` simply
		// reports an unsymbolicated event rather than one Sentry rejects.
		release: RELEASE,
		tags: {
			// Keep in step with client/src/services/sentry.ts and server/src/sentry.ts: all
			// three surfaces can report into one project, and this tag is what keeps an
			// issue list triageable.
			surface: "plugin",
			flow: context
		},
		exception: {
			values: [
				{
					type: isError ? error.name : "Error",
					value: isError ? error.message : String(error),
					// Omitted rather than sent empty when the stack could not be parsed:
					// `stacktrace: { frames: [] }` makes Sentry group every such event
					// together, whereas no stacktrace at all groups on type and message.
					stacktrace: frames.length > 0 ? { frames } : undefined
				}
			]
		},
		// The unedited stack is kept alongside the frames on purpose — it is the check on
		// the normalization FRAME_FILE performs, and the only thing left if the parser ever
		// meets a stack shape it does not know. A call site may override it, which is what
		// the `ui-error` case in code.ts does with the iframe's own stack.
		extra: { stack: isError ? error.stack : undefined, ...extra }
	};

	let body: string;

	try {
		body = [
			JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn: SENTRY_DSN }),
			JSON.stringify({ type: "event" }),
			JSON.stringify(event)
		].join("\n");
	} catch {
		// `extra` comes from call sites and could hold something circular. Losing the
		// report is better than throwing from the error path.
		return;
	}

	void fetch(`${target.url}?sentry_key=${target.key}&sentry_version=7`, {
		method: "POST",
		headers: { "Content-Type": "application/x-sentry-envelope" },
		body
	}).catch(() => {
		// Offline, blocked by the manifest, rate limited — all equally unactionable here.
	});
}
