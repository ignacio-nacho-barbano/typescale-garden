import { env } from "cloudflare:workers";
import { RequestHandler } from "express";

/**
 * Per-user rate limiting through the Workers Rate Limiting binding — the platform-level
 * replacement for express-rate-limit, which cannot run here (see src/index.ts).
 *
 * Mount it AFTER `checkUser`: it keys on the verified Auth0 `sub`, so one user cannot
 * exhaust another's budget, and an unauthenticated request never reaches it.
 *
 * The binding's counters are per Cloudflare location and eventually consistent, so this
 * bounds abuse rather than enforcing an exact quota — which is all it is for.
 *
 * A missing binding (a config that predates it) lets the request through rather than
 * failing it: losing the limit is better than losing the feature.
 */
export const rateLimitByUser =
	(binding: "FAVORITES_RATE_LIMITER"): RequestHandler =>
	async (req, res, next) => {
		// Cast rather than relying on worker-configuration.d.ts, which `npm run cf-typegen`
		// regenerates and which this binding may predate in a given checkout.
		const limiter = (env as unknown as Partial<Record<typeof binding, RateLimit>>)[binding];
		const key = req.auth?.payload.sub;

		if (!limiter || !key) {
			next();
			return;
		}

		try {
			const { success } = await limiter.limit({ key });

			if (!success) {
				res.status(429).json({ message: "Too many requests, slow down" });
				return;
			}
		} catch {
			// The limiter is advisory; an outage of it must not take the route down.
		}
		next();
	};
