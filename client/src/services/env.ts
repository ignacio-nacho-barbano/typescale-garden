import { browser } from "$app/environment";
import {
	PUB_API_URL,
	PUB_APP_ENV,
	PUB_AUTH_CLIENT_ID,
	PUB_AUTH_DOMAIN,
	PUB_CLIENT_ORIGIN
} from "$env/static/public";

if (!PUB_API_URL) {
	throw new Error("There was an issue loading env variables");
}

export const ENV = {
	API_URL: PUB_API_URL,
	APP_ENV: PUB_APP_ENV,
	AUTH_CLIENT_ID: PUB_AUTH_CLIENT_ID,
	AUTH_DOMAIN: PUB_AUTH_DOMAIN,
	CLIENT_ORIGIN: PUB_CLIENT_ORIGIN,
	IS_DEV: PUB_APP_ENV === "dev",
	IS_PROD: PUB_APP_ENV === "prod",
	IS_BROWSER: browser
};
