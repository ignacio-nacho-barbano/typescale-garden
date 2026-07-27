import { httpServerHandler } from "cloudflare:node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import logger from "morgan";
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
export default httpServerHandler({ port: APP_PORT });
