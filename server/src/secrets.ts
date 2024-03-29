import { Secret } from "jsonwebtoken";
import * as path from "path";

export const CLIENT_ORIGIN = process.env.PUB_CLIENT_ORIGIN;
export const AUTH_DOMAIN = process.env.PUB_AUTH_DOMAIN;
export const API_URL = process.env.PUB_API_URL;
export const AUTH_CLIENT_ID = process.env.PUB_AUTH_CLIENT_ID;
export const APP_PORT = parseInt(process.env.APP_PORT || "3000");
export const ENVIRONMENT = process.env.PUB_APP_ENV || "dev";
export const IS_PRODUCTION = ENVIRONMENT === "production";

export const LOG_DIRECTORY = process.env.LOG_DIRECTORY || path.resolve("logs");
export const JWT_SECRET = process.env.JWT_SECRET as Secret;
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const BASE_URL = process.env.BASE_URL || "";
export const CLIENT_ID = process.env.CLIENT_ID || "";
export const ISSUER = process.env.ISSUER || "";
export const DB = {
	CERTIFICATE_FILE: process.env.DB_CERTIFICATE,
	USER: process.env.DB_USER || "root",
	PASSWORD: process.env.DB_USER_PWD || "secret",
	HOST: process.env.DB_HOST || "localhost",
	NAME: process.env.DB_NAME || "conduit",
	PORT: parseInt(process.env.DB_PORT || "27017"),
	STRING: `mongodb+srv://${process.env.DB_HOST}/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority`
};
