import setRateLimit from "express-rate-limit";
import { ENVIRONMENT } from "../secrets";

export const rateLimiter = setRateLimit({
	windowMs: 10 * 60 * 1000,
	limit: ENVIRONMENT === "dev" ? 100 : 20,
	message: {
		message: "ERROR: Exceeded maximum number of allowed requests within window, try again later."
	},
	headers: true
});
