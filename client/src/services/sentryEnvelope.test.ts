import { afterEach, describe, expect, it, vi } from "vitest";
import { captureToSentry, parseDsn } from "./sentryEnvelope";

/**
 * The SSR half of error reporting talks to Sentry's ingest API by hand rather than through
 * an SDK (see the file's own comment for why), so the envelope format is this repo's
 * problem. These tests are what stands between "an SSR error is reported" and "an SSR error
 * is silently posted into the void" — a malformed envelope is accepted with a 200 and
 * dropped server-side, so nothing else would notice.
 */

// Deliberately fake. The real DSN is configuration (`PUB_SENTRY_DSN`), and a test that
// hardcoded it would start posting to the live project the moment someone removed a mock.
const DSN = "https://0123456789abcdef0123456789abcdef@o0000.ingest.de.sentry.io/1234567890";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("parseDsn", () => {
	it("splits a DSN into its ingest URL and public key", () => {
		expect(parseDsn(DSN)).toEqual({
			envelopeUrl: "https://o0000.ingest.de.sentry.io/api/1234567890/envelope/",
			publicKey: "0123456789abcdef0123456789abcdef"
		});
	});

	// Every one of these has to yield `undefined` rather than throwing: `SENTRY_ENABLED` only
	// checks that the DSN is non-empty, so a typo'd value reaches this function, and throwing
	// here would turn a page that failed to render into a page that fails to render *twice*.
	it.each([
		["empty", ""],
		["not a URL", "nonsense"],
		["no public key", "https://o4509.ingest.us.sentry.io/4511809570144336"],
		["no project id", "https://key@o4509.ingest.us.sentry.io/"]
	])("returns undefined for a DSN that is %s", (_label, dsn) => {
		expect(parseDsn(dsn)).toBeUndefined();
	});
});

describe("captureToSentry", () => {
	it("posts a well-formed three-line envelope", async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(""));
		vi.stubGlobal("fetch", fetchMock);

		await captureToSentry(new TypeError("nope"), {
			dsn: DSN,
			environment: "prod",
			surface: "ssr",
			tags: { route: "/" },
			extra: { status: 500 }
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0];

		expect(url).toBe(
			"https://o0000.ingest.de.sentry.io/api/1234567890/envelope/" +
				"?sentry_key=0123456789abcdef0123456789abcdef&sentry_version=7"
		);
		expect(init.method).toBe("POST");
		expect(init.headers["Content-Type"]).toBe("application/x-sentry-envelope");

		// An envelope is newline-delimited JSON: header, item header, item payload.
		const [header, itemHeader, payload] = init.body
			.split("\n")
			.map((line: string) => JSON.parse(line));

		expect(itemHeader).toEqual({ type: "event" });
		// The header's event_id must match the payload's, or Sentry rejects the envelope.
		expect(header.event_id).toBe(payload.event_id);
		expect(header.event_id).toMatch(/^[0-9a-f]{32}$/);
		expect(header.dsn).toBe(DSN);

		expect(payload.exception.values[0]).toMatchObject({ type: "TypeError", value: "nope" });
		expect(payload.level).toBe("error");
		expect(payload.environment).toBe("prod");
		expect(payload.tags).toEqual({ surface: "ssr", route: "/" });
		expect(payload.extra.status).toBe(500);
		expect(payload.extra.stack).toContain("TypeError");
	});

	it("describes a non-Error throw instead of dropping it", async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(""));
		vi.stubGlobal("fetch", fetchMock);

		await captureToSentry("just a string", { dsn: DSN, environment: "prod", surface: "ssr" });

		const payload = JSON.parse(fetchMock.mock.calls[0][1].body.split("\n")[2]);
		expect(payload.exception.values[0]).toEqual({ type: "Error", value: "just a string" });
	});

	it("sends nothing when the DSN is unusable", async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		await captureToSentry(new Error("x"), { dsn: "", environment: "prod", surface: "ssr" });

		expect(fetchMock).not.toHaveBeenCalled();
	});

	// Reporting an error must never become a second error: `handleError` does not await this
	// in the Worker path (it hands it to `waitUntil`), so a rejection would surface as an
	// unhandled rejection in production.
	it("resolves even when the request fails", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

		await expect(
			captureToSentry(new Error("x"), { dsn: DSN, environment: "prod", surface: "ssr" })
		).resolves.toBeUndefined();
	});
});
