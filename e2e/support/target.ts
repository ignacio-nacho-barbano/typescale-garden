/**
 * Which environment the suite is pointed at, and therefore how much of it is faked.
 *
 * One suite, two modes:
 *
 * - **hermetic** (the default) drives a dev server this process starts, with a fake Auth0
 *   tenant, a fake Worker and a six-family fixture catalogue. Every answer is known in
 *   advance, so the generated CSS and tokens are asserted against the bytes committed in
 *   `core/src/__tests__/fixtures/golden.json`. This is the PR gate.
 * - **live** drives an already-deployed build against the real API and a real Auth0 user.
 *   Nothing is faked, so nothing is known in advance — the expectations are derived at
 *   runtime from the catalogue the app itself received (see support/subjects.ts).
 *
 * Selected with `E2E_TARGET`:
 *
 * ```
 * (unset) | local   → http://localhost:5199, hermetic
 * prod              → https://typescalegarden.uy, live
 * https://…         → that origin, live
 * ```
 *
 * The URL form is what keeps a preview deployment a matter of configuration rather than
 * code. Note it does not work today: `redirect_uri` is `PUB_CLIENT_ORIGIN`, which
 * SvelteKit inlines at build time and Cloudflare Pages sets once for every preview, so a
 * preview build sends its login redirect to production and silent auth posts its
 * `web_message` to an origin that is not the parent. CLAUDE.md lists what has to change.
 */
import path from "path";

export type Mode = "hermetic" | "live";

export interface Target {
	mode: Mode;
	baseUrl: string;
	/** The API the *deployed* client talks to. Only meaningful when live. */
	apiUrl: string;
}

/** The port the hermetic dev server is pinned to. Also hardcoded into every fake origin. */
export const LOCAL_PORT = 5199;
const LOCAL_URL = `http://localhost:${LOCAL_PORT}`;

const NAMED: Record<string, Omit<Target, "mode">> = {
	prod: {
		baseUrl: "https://typescalegarden.uy",
		apiUrl: "https://api.typescalegarden.uy"
	}
};

const trimSlash = (url: string): string => url.replace(/\/+$/, "");

export const resolveTarget = (raw = process.env.E2E_TARGET): Target => {
	const value = (raw ?? "local").trim();

	if (value === "" || value === "local") {
		// The hermetic API URL is a path prefix on our own origin — see support/env.ts for
		// why the fakes are not mounted on their real hostnames.
		return { mode: "hermetic", baseUrl: LOCAL_URL, apiUrl: `${LOCAL_URL}/mock-api` };
	}

	const named = NAMED[value];
	if (named) {
		return { mode: "live", ...named };
	}

	if (!/^https?:\/\//.test(value)) {
		throw new Error(
			`E2E_TARGET must be "local", one of [${Object.keys(NAMED).join(
				", "
			)}], or an http(s) URL — got "${value}"`
		);
	}

	// An arbitrary deployment. Its API is whichever one the build was compiled against, so
	// it cannot be derived from the URL; assume production's, which is what every deployed
	// build currently points at, and allow an override for anything else.
	return {
		mode: "live",
		baseUrl: trimSlash(value),
		apiUrl: trimSlash(process.env.E2E_API_URL ?? NAMED.prod.apiUrl)
	};
};

export const TARGET = resolveTarget();
export const IS_LIVE = TARGET.mode === "live";
export const IS_HERMETIC = TARGET.mode === "hermetic";

/**
 * Whether the live run is allowed to create and delete real typescales. Off by default
 * for any target the caller did not explicitly opt in for — writing to a production
 * database should never be something a run does by accident.
 */
export const LIVE_WRITES = IS_LIVE && process.env.E2E_LIVE_WRITES !== "0";

/**
 * Where the live-auth setup project parks the signed-in session for the rest of the run.
 *
 * Absolute, resolved from this file, so it lands in the same place whether the suite is run
 * from `e2e/`, through turbo from the repo root, or with an explicit `--config`. It holds a
 * real session cookie — `.gitignore` excludes the whole `e2e/playwright/` directory.
 */
export const LIVE_STORAGE_STATE = path.resolve(__dirname, "../playwright/.auth/live-user.json");

export const liveCredentials = (): { username: string; password: string } | null => {
	const username = process.env.E2E_AUTH0_USERNAME;
	const password = process.env.E2E_AUTH0_PASSWORD;

	return username && password ? { username, password } : null;
};
