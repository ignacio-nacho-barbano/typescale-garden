export const CLIENT_ORIGIN = process.env.PUB_CLIENT_ORIGIN || "";
export const AUTH_DOMAIN = process.env.PUB_AUTH_DOMAIN || "";
export const API_URL = process.env.PUB_API_URL || "";
export const DATABASE_URL = process.env.DATABASE_URL || "";
export const ENVIRONMENT = process.env.PUB_APP_ENV || "dev";
export const IS_PRODUCTION = ENVIRONMENT === "production";
