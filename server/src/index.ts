import { httpServerHandler } from "cloudflare:node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import logger from "morgan";
import { refreshFontsSnapshot, serveFontsSnapshot } from "./fonts/snapshot";
import { MainRouter } from "./routes";
import { APP_PORT, CLIENT_ORIGIN } from "./secrets";
import { loadErrorHandlers } from "./utils";

const app = express();
// Morgan's named formats ("dev", "combined", …) are compiled with `new Function`,
// which the Workers runtime forbids ("Code generation from strings disallowed").
// The EvalError is thrown from the response's `finish` listener, so the request
// context never settles and the runtime cancels it — surfacing to the browser as
// an intermittent 503 with no CORS headers, i.e. a spurious "CORS error".
// Passing a format *function* skips morgan's compile step entirely.
app.use(
	logger((tokens, req, res) =>
		[
			tokens.method(req, res),
			tokens.url(req, res),
			tokens.status(req, res),
			`${tokens["response-time"](req, res)}ms`
		].join(" ")
	)
);

// Browsers report a missing Access-Control-Allow-Origin as a generic "CORS error",
// so anything serving the client has to be listed here explicitly.
const ALLOWED_ORIGINS = [
	CLIENT_ORIGIN!, // https://typescalegarden.uy — the apex, from PUB_CLIENT_ORIGIN
	"https://www.typescalegarden.uy", // www variant, in case the apex ever redirects here
	"https://typescale-garden.netlify.app"
];

// The Figma plugin is not an origin that can be allowlisted. In the browser build of
// Figma, plugin code runs inside a sandboxed `data:` iframe, so its requests arrive
// with the literal `Origin: null` and are subject to CORS exactly like a web page's.
// (Only the desktop app's sandbox is exempt, which is why this failed for some users
// and not others.) Echoing `null` back would grant every other sandboxed document the
// same access, so these routes answer `*` instead — safe because nothing in the API is
// cookie-authenticated: the plugin sends a bearer token in a header, and `*` is
// incompatible with credentialed requests by construction.
//
// Listed route by route rather than as the whole `/api/plugin` prefix: the pairing-code
// and connection-management routes there are reached from the web app only, and they
// stay behind the allowlist above. `GET /api/fonts` needs no entry — it never reaches
// Express and sets its own `*` (see src/fonts/snapshot.ts).
const PLUGIN_REACHABLE_PATHS = [
	"/api/typescales/default", // unpaired installs list the community defaults
	"/api/plugin/tokens", // redeeming a pairing code
	"/api/plugin/typescales" // reading the user's own scales
];

// Order matters: the strict `cors()` below terminates preflights itself
// (`preflightContinue` defaults to false), so it would answer OPTIONS for a null
// origin with no headers before this ever ran. On non-preflight requests both run, and
// the later one overwrites Access-Control-Allow-Origin when the origin *is* allowlisted
// — so the web app keeps getting its own origin echoed on these paths, not `*`.
app.use(PLUGIN_REACHABLE_PATHS, cors({ origin: "*" }));
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// NOTE: express.static was dropped — Workers has no filesystem and the served
// public/ folder was only the express-generator welcome page, not part of the API.
// NOTE: express-rate-limit was removed — its in-memory store calls setInterval at
// module-init time, which Workers forbids in global scope, and per-isolate counters
// are ineffective at the edge. Do rate limiting at the platform level instead
// (Cloudflare WAF rate-limiting rule, or the Workers Rate Limiting binding).
app.use(helmet());

app.use("/api/", MainRouter);

loadErrorHandlers(app);

app.listen(APP_PORT, () => {
	console.log(`[server]: Server is running at port ${APP_PORT}`);
});

// Bridge the Express server into the Workers runtime. The port must match the
// one passed to app.listen above.
const nodeBridge = httpServerHandler({ port: APP_PORT });

// The Node bridge only ever gives us a `fetch`, so a Cron Trigger needs a handler
// object of our own that delegates to it. Wrapping rather than spreading
// `httpServerHandler(...)` also lets a route be answered before Express sees it,
// which /api/fonts relies on.
//
// Do NOT reach for the lower-level `handleAsNodeRequest` to do this instead: it
// exists at runtime but is absent from @cloudflare/workers-types and the generated
// worker-configuration.d.ts, so it breaks `npm run check`.
export default {
	async fetch(request, env, ctx) {
		// The fonts snapshot is served here rather than as an Express route: helmet's
		// Cross-Origin-Resource-Policy header would block the client's cross-origin
		// read, and Express's weak ETag would hash ~1.9 MB per request. See
		// src/fonts/snapshot.ts.
		const url = new URL(request.url);
		if (request.method === "GET" && url.pathname === "/api/fonts") {
			return serveFontsSnapshot(request, ctx);
		}

		return nodeBridge.fetch!(request, env, ctx);
	},
	// Daily Google Fonts refresh — schedule lives in wrangler.jsonc. The runtime
	// awaits this promise, so no ctx.waitUntil is needed. Throwing is the intended
	// failure mode: it leaves the last good snapshot in KV.
	async scheduled() {
		await refreshFontsSnapshot();
	}
} satisfies ExportedHandler<Env>;
