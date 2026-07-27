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
app.use(logger("dev"));

app.use(cors({ origin: [CLIENT_ORIGIN!, "https://typescale-garden.netlify.app"] }));
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
