import { Secret } from "jsonwebtoken";
import * as path from "path";

export const CLIENT_ORIGIN = process.env.PUB_CLIENT_ORIGIN;
export const AUTH_DOMAIN = process.env.PUB_AUTH_DOMAIN;
export const API_URL = process.env.PUB_API_URL;
export const AUTH_CLIENT_ID = process.env.PUB_AUTH_CLIENT_ID;
export const APP_PORT = parseInt(process.env.APP_PORT || "3000");
// Annotated as `string` on purpose: `wrangler types` narrows configured vars to
// their literal value ("prod"), which makes every comparison below a type error.
export const ENVIRONMENT: string = process.env.PUB_APP_ENV || "dev";
// Three values: "local" (a machine running `wrangler dev`), "dev" (a deployed non-prod
// build) and "prod". See the comment on PUB_APP_ENV in client/src/services/env.ts.
export const IS_LOCAL = ENVIRONMENT === "local";
// Fails closed — anything that is not explicitly a non-production value is treated as
// production, so error responses never leak raw errors just because a value was
// misspelled. (This previously compared against "production", a value PUB_APP_ENV is
// never set to, so IS_PRODUCTION was always false.)
export const IS_PRODUCTION = ENVIRONMENT !== "dev" && !IS_LOCAL;

// Sentry's ingest endpoint for this Worker. A DSN is a public identifier — it only
// grants "write an event", which is why it sits in `vars` rather than behind
// `wrangler secret put`, exactly like the client's PUB_ prefixed copy.
//
// Empty is a supported state and means "report nothing": the DSN handed to the SDK is
// gated on SENTRY_ENABLED below, and the SDK itself treats a falsy DSN as disabled. So an
// unset value degrades to the pre-Sentry behaviour instead of throwing at module init —
// which on Workers would take the whole isolate down.
// Annotated as `string` for the same reason as ENVIRONMENT above: `wrangler types`
// narrows a configured var to its literal value, so the generated type is the literal DSN
// string and anything treating this as a general string would stop compiling if it changed.
export const SENTRY_DSN: string = process.env.SENTRY_DSN || "";

// `local` never reports, matching the client (see client/src/services/sentry.ts).
//
// Worth knowing: `wrangler dev` reads `vars` from wrangler.jsonc, where PUB_APP_ENV is
// "prod" — so a local Worker looks like production unless `server/.dev.vars` overrides it.
// Put `PUB_APP_ENV=local` there, or local runs will file issues against the prod project.
export const SENTRY_ENABLED = Boolean(SENTRY_DSN) && !IS_LOCAL;

export const LOG_DIRECTORY = process.env.LOG_DIRECTORY || path.resolve("logs");
export const JWT_SECRET = process.env.JWT_SECRET as Secret;
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const BASE_URL = process.env.BASE_URL || "";
export const CLIENT_ID = process.env.CLIENT_ID || "";
export const ISSUER = process.env.ISSUER || "";
// NOTE: the Mongo connection settings that used to live here are gone —
// typescales are stored in D1, reached through the `DB` binding (see src/db/d1.ts)
// rather than a connection string.
