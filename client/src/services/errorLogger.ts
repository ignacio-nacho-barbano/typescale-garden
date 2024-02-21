import { PUB_ROLLBAR_TOKEN, PUB_APP_ENV } from "$env/static/public";
import Rollbar from "rollbar";

export const rollbar = new Rollbar({
	accessToken: PUB_ROLLBAR_TOKEN,
	captureUncaught: true,
	captureUnhandledRejections: true,
	payload: {
		code_version: "1.0.0"
	}
});

export const logError = (message: string, error?: Record<string, any> | unknown) => {
	console.error("🚨 Error Logger: ", message, error);
	if (PUB_APP_ENV !== "dev") {
		rollbar.error(message, error);
	}
};
