/**
 * Recognising a Cloudflare bot-mitigation challenge, and saying so once.
 *
 * Both `typescalegarden.uy` and `api.typescalegarden.uy` sit behind Cloudflare, whose bot
 * mitigation challenges requests from datacenter IP ranges — which is exactly what a
 * GitHub-hosted runner has. Every client is affected, not just an unconvincing one:
 *
 * ```
 * node fetch                       → 403, cf-mitigated: challenge
 * Playwright's APIRequestContext   → 403, cf-mitigated: challenge
 * fetch() inside a real Chromium   → TypeError: Failed to fetch
 * navigating a real Chromium       → 403, a Turnstile page titled "Just a moment..."
 * ```
 *
 * The third line is the one that rules out every clever workaround: a challenge response
 * carries no `Access-Control-Allow-Origin`, so the deployed app's own cross-origin call to
 * `/api/fonts` fails as an opaque network error however faithfully the request is made. And
 * the fourth rules out the rest: a headless Chromium does not clear the interstitial, so the
 * app never boots at all. There is nothing this repo can do about any of it — see CLAUDE.md
 * for the Cloudflare-side change that lifts it.
 *
 * What this module is for is making the *diagnosis* immediate. Left alone the suite reports
 * `GET https://api.typescalegarden.uy/api/fonts answered 403 Forbidden`, which reads like the
 * Worker rejecting the request — the one thing it is not, since the challenge is answered at
 * the edge and the Worker never sees it. `server/src/` contains no 403 at all.
 */

/**
 * `cf-mitigated` is the canonical signal and the only one worth branching on: Cloudflare sets
 * it on every mitigated response, and nothing this repo serves would ever emit it.
 *
 * The body markers are a second opinion for the case where the header is stripped by
 * something in between. They are deliberately not the primary test — "Just a moment" is a
 * phrase, and matching prose is how a check like this quietly stops working.
 */
const BODY_MARKERS = ["__cf_chl", "cf_chl_opt", "challenges.cloudflare.com"];

export interface ChallengeVerdict {
	challenged: boolean;
	/** `cf-mitigated`'s value when it was the signal, for the message. */
	mitigation: string | null;
}

/**
 * Whether a response is a challenge rather than an answer.
 *
 * `body` is optional because the header alone is usually conclusive and reading a body is
 * not always free — pass it when it has already been read.
 */
export const inspectForChallenge = (
	headers: { get(name: string): string | null },
	body?: string
): ChallengeVerdict => {
	const mitigated = headers.get("cf-mitigated");

	if (mitigated) return { challenged: true, mitigation: mitigated };

	if (body && BODY_MARKERS.some((marker) => body.includes(marker))) {
		return { challenged: true, mitigation: null };
	}

	return { challenged: false, mitigation: null };
};

/**
 * Thrown when the live target cannot be reached from *here*, as opposed to being broken.
 *
 * The distinction is the whole point of a separate type. A challenge says nothing about the
 * deployment — production is serving every real visitor perfectly while this is happening —
 * so it must not be reported as a regression, and `e2e.yml` decides what to do about it by
 * catching this rather than by pattern-matching a message.
 */
export class UnreachableLiveEnvironment extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UnreachableLiveEnvironment";
	}
}

/** The one copy of the explanation, so all three call sites say the same thing. */
export const challengeMessage = (url: string, status: number, mitigation: string | null): string =>
	[
		`Cloudflare is challenging this client, so ${url} cannot be reached from here.`,
		`  ${status}${mitigation ? `, cf-mitigated: ${mitigation}` : ", challenge page in the body"}`,
		"",
		"This is not a failure of the deployment: the challenge is answered at Cloudflare's edge",
		"and the Worker never sees the request. Production is serving real visitors normally.",
		"",
		"It is what a GitHub-hosted runner's datacenter IP gets, and it blocks every client —",
		"node fetch, Playwright's request context, and a real Chromium alike. Lifting it is a",
		"Cloudflare-side change; CLAUDE.md's \"Why the live e2e run cannot reach production from",
		'CI" records what to configure.'
	].join("\n");

/**
 * The check every non-browser call in a live run funnels through.
 *
 * Throws `UnreachableLiveEnvironment` on a challenge and returns otherwise, so a caller's own
 * error handling stays about its own endpoint.
 */
export const throwIfChallenged = (response: Response, url: string, body?: string): void => {
	const { challenged, mitigation } = inspectForChallenge(response.headers, body);

	if (challenged) {
		throw new UnreachableLiveEnvironment(challengeMessage(url, response.status, mitigation));
	}
};
