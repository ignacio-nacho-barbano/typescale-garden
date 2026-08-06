import * as Sentry from "@sentry/cloudflare";
import { httpServerHandler } from "cloudflare:node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import logger from "morgan";
import { refreshFontsSnapshot, serveFontsSnapshot } from "./fonts/snapshot";
import { MainRouter } from "./routes";
import { APP_PORT, CLIENT_ORIGIN } from "./secrets";
import { FONTS_CRON_MONITOR, workerSentryOptions } from "./sentry";
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
const handler = {
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
		// `withMonitor` brackets the run with Sentry check-ins (in-progress, then ok or
		// error) and re-throws, so the documented fail-closed behaviour above is intact.
		//
		// The check-ins are the point: `withSentry` below already captures whatever this
		// throws, but an exception can only be reported by a run that actually happened.
		// A cron that stops firing — a deleted trigger, a suspended Worker, an account
		// issue — produces no error at all, and snapshot.ts is deliberately built so that
		// silence looks exactly like success from the outside. The monitor is what turns
		// that silence into an alert.
		await Sentry.withMonitor(FONTS_CRON_MONITOR.slug, () => refreshFontsSnapshot(), {
			schedule: FONTS_CRON_MONITOR.schedule,
			checkinMargin: FONTS_CRON_MONITOR.checkinMargin,
			maxRuntime: FONTS_CRON_MONITOR.maxRuntime,
			timezone: FONTS_CRON_MONITOR.timezone
		});
	}
} satisfies ExportedHandler<Env>;

// Wrapped rather than `Sentry.init()`-ed at module scope: on Workers there is no
// long-lived process to initialise into, and the SDK needs the invocation's
// AsyncLocalStorage context to tie an error to the request that caused it. This also
// instruments `scheduled`, so an uncaught throw from the cron is reported without the
// handler doing anything.
//
// Unhandled errors from *Express* do not reach here — its error middleware catches them
// first and answers a 500 — which is why utils/error-handling.ts captures separately.
export default Sentry.withSentry(() => workerSentryOptions(), handler);
