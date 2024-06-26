import { PUB_ROLLBAR_TOKEN, PUB_APP_ENV } from "$env/static/public";
import Rollbar from "rollbar";

let rollbar: Rollbar;

try {
	rollbar = new Rollbar({
		accessToken: PUB_ROLLBAR_TOKEN,
		captureUncaught: true,
		captureUnhandledRejections: true,
		environment: PUB_APP_ENV,
		itemsPerMinute: 10,
		maxItems: 5,
		payload: {
			code_version: "1.0.0"
		}
	});
} catch (e) {
	console.log("Unable to load rollbar");
}

export const logError = (message: string, error?: Record<string, any> | unknown) => {
	if (PUB_APP_ENV !== "dev" && rollbar) {
		rollbar.error(message, error);
	} else {
		console.error("🚨 Error Logger: ", message, error);
	}
};
