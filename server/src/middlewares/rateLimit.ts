import setRateLimit from "express-rate-limit";

export const rateLimiter = setRateLimit({
	windowMs: 10 * 60 * 1000,
	max: 20,
	message: "ERROR: Exceeded maximum number of allowed requests within window, try again later.",
	headers: true
});
