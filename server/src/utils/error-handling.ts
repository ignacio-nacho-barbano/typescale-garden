import * as Sentry from "@sentry/cloudflare";
import { Application, Request, Response } from "express";
import { IS_PRODUCTION } from "../secrets";
// import logger from "./logger";

export function loadErrorHandlers(app: Application) {
	// catch 404 errors and forward to error handler
	app.use((req, res, next) => {
		interface BetterError extends Error {
			status?: number;
		}

		const err: BetterError = new Error("Not Found");
		err.status = 404;
		next(err);
	});

	app.use((err: any, req: Request, res: Response, next: any) => {
		if (err.name === "ValidationError") {
			return res.status(422).json({
				errors: Object.keys(err.errors).reduce(function (errors: any, key: string) {
					errors[key] = err.errors[key].message;

					return errors;
				}, {})
			});
		}

		const status = err.status || 500;

		// Report server faults only. Express never lets an error out to the Workers
		// runtime — it answers a 500 itself — so `withSentry` in src/index.ts cannot see
		// these and this is the only place they can be captured.
		//
		// The 4xx family is deliberately excluded, and the exclusion is load-bearing
		// rather than tidiness: the handler above manufactures an `Error("Not Found")` for
		// *every* unmatched path, so reporting those would mean one Sentry issue per
		// crawler hitting /wp-login.php. The client errors this API raises on purpose
		// (`BadTypescaleError` → 400, the tier cap → 401, ValidationError → 422) are
		// answers, not failures.
		if (status >= 500) {
			Sentry.captureException(err, {
				tags: { route: req.route?.path ?? req.path, method: req.method },
				extra: { status }
			});
		}

		// logger.error(err);
		res.status(status);
		res.json({
			errors: {
				message: err.message,
				error: !IS_PRODUCTION ? err : {}
			}
		});
	});
}
