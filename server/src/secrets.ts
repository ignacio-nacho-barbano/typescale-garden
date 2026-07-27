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
// Fails closed — anything that is not explicitly "dev" is treated as production,
// so error responses never leak raw errors just because a value was misspelled.
// (This previously compared against "production", a value PUB_APP_ENV is never
// set to, so IS_PRODUCTION was always false.)
export const IS_PRODUCTION = ENVIRONMENT !== "dev";

export const LOG_DIRECTORY = process.env.LOG_DIRECTORY || path.resolve("logs");
export const JWT_SECRET = process.env.JWT_SECRET as Secret;
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const BASE_URL = process.env.BASE_URL || "";
export const CLIENT_ID = process.env.CLIENT_ID || "";
export const ISSUER = process.env.ISSUER || "";
// NOTE: the Mongo connection settings that used to live here are gone —
// typescales are stored in D1, reached through the `DB` binding (see src/db/d1.ts)
// rather than a connection string.
