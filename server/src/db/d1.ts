import { env } from "cloudflare:workers";
// `base` is the nested object the client sends and expects back; Mongo stored it as
// a subdocument, in D1 each field is its own column. Both shapes come from `core`,
// the single definition shared with the client and the plugin — they used to be
// hand-written here and kept in step by hand.
import type { Typescale, TypescaleBase } from "core";

// The D1 binding declared in wrangler.jsonc (typed via worker-configuration.d.ts,
// regenerate with `npm run cf-typegen`). Express handlers run outside the Worker
// `fetch(request, env, ctx)` signature, and `cloudflare:workers` is how you reach
// bindings from anywhere in the module graph. Bindings are only populated inside a
// request, which is fine: every caller here is on a request path.
// Exported so src/db/plugin-auth.ts can share it: the invariant worth keeping is
// "one module resolves the binding", not "one module holds every query".
export function db(): D1Database {
	if (!env.DB) {
		throw new Error("D1 binding DB is not available — check d1_databases in wrangler.jsonc");
	}
	return env.DB;
}

// Re-exported so this module's public surface is unchanged for anything that
// imported the types from here.
export type { Typescale, TypescaleBase };

// One row of the `typescales` table: base fields flattened, booleans as SQLite
// 0/1 integers, `overrides` as a JSON string.
type TypescaleRow = Omit<TypescaleBase, "useUppercaseForTitles" | "useItalicsForTitles"> & {
	id: string;
	authorId: string;
	name: string;
	useUppercaseForTitles: number;
	useItalicsForTitles: number;
	overrides: string | null;
	createdAt: string;
	lastModifiedAt: string;
};

// Column order used by every INSERT/UPDATE below. Keep in sync with
// migrations/0001_create_typescales.sql.
const BASE_COLUMNS = [
	"breakpoint",
	"fontName",
	"baseUnit",
	"baseSize",
	"desktopRatio",
	"mobileRatio",
	"letterSpacingRatio",
	"useUppercaseForTitles",
	"useItalicsForTitles",
	"headingsInitialWeight",
	"headingsFinalWeight"
] as const;

// Now that TypescaleBase comes from `core`, the "keep these in sync" note above can
// be enforced instead of trusted: adding a field to TypescaleBase without adding
// the column here is a compile error. It does NOT check the migration — that pairing
// is still on you.
type MissingBaseColumns = Exclude<keyof TypescaleBase, (typeof BASE_COLUMNS)[number]>;
// Tuple-wrapped on purpose: a bare `MissingBaseColumns extends never` is a
// distributive conditional, and distributing over the empty union yields `never`,
// so the check would fail exactly when it should pass.
const _assertEveryBaseFieldHasAColumn: [MissingBaseColumns] extends [never] ? true : never = true;

const SELECT_COLUMNS = [
	"id",
	"authorId",
	"name",
	...BASE_COLUMNS,
	"overrides",
	"createdAt",
	"lastModifiedAt"
].join(", ");

const INTEGER_BASE_COLUMNS = new Set([
	"breakpoint",
	"headingsInitialWeight",
	"headingsFinalWeight"
]);
const BOOLEAN_BASE_COLUMNS = new Set(["useUppercaseForTitles", "useItalicsForTitles"]);
const TEXT_BASE_COLUMNS = new Set(["fontName"]);

// Prisma exposed the Mongo _id as a string field named `id` and generated it
// server-side. D1 has no equivalent default, so we mint the id ourselves.
// Migrated rows keep their old ObjectId hex ids; new ones are UUIDs.
export function newTypescaleId() {
	return crypto.randomUUID();
}

// The request body is untrusted: it arrives as `req.body.data` and may carry
// strings where numbers belong (the client's inputs are text fields) or extra
// keys. Bind values are therefore coerced per column and anything unrecognised
// is dropped rather than reaching SQLite.
function baseBindValues(base: Record<string, unknown> | undefined): (number | string)[] {
	const source = base ?? {};

	return BASE_COLUMNS.map((column) => {
		const value = source[column];

		if (BOOLEAN_BASE_COLUMNS.has(column)) {
			return value === true || value === "true" || value === 1 ? 1 : 0;
		}
		if (TEXT_BASE_COLUMNS.has(column)) {
			if (typeof value !== "string" || !value) {
				throw new BadTypescaleError(`base.${column} must be a non-empty string`);
			}
			return value;
		}

		const asNumber = typeof value === "string" ? Number(value) : value;
		if (typeof asNumber !== "number" || !Number.isFinite(asNumber)) {
			throw new BadTypescaleError(`base.${column} must be a number`);
		}
		return INTEGER_BASE_COLUMNS.has(column) ? Math.round(asNumber) : asNumber;
	});
}

// A payload the columns cannot accept. Distinguished from a database failure so
// the controllers can answer 400 instead of 500.
export class BadTypescaleError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BadTypescaleError";
	}
}

function requireName(name: unknown): string {
	if (typeof name !== "string" || !name.trim()) {
		throw new BadTypescaleError("name must be a non-empty string");
	}
	return name.trim();
}

function serializeOverrides(overrides: unknown): string | null {
	return overrides === null || overrides === undefined ? null : JSON.stringify(overrides);
}

// Re-nests the flat row into the shape the client has always received: `base` as
// an object, booleans as booleans, `overrides` parsed back from JSON.
function toTypescale(row: TypescaleRow): Typescale {
	const base = {} as TypescaleBase;

	for (const column of BASE_COLUMNS) {
		const value = (row as unknown as Record<string, unknown>)[column];
		(base as unknown as Record<string, unknown>)[column] = BOOLEAN_BASE_COLUMNS.has(column)
			? Boolean(value)
			: value;
	}

	return {
		id: row.id,
		authorId: row.authorId,
		name: row.name,
		base,
		overrides: row.overrides === null ? null : safeParseJson(row.overrides),
		createdAt: row.createdAt,
		lastModifiedAt: row.lastModifiedAt
	};
}

// `overrides` predates any validation, so a malformed value in an old row must
// not take down the whole list response.
function safeParseJson(value: string): unknown {
	try {
		return JSON.parse(value);
	} catch {
		console.warn("Could not parse stored overrides JSON, returning null");
		return null;
	}
}

export async function findByAuthors(authorIds: string[], newestFirst = false) {
	const placeholders = authorIds.map(() => "?").join(", ");
	const order = newestFirst ? " ORDER BY lastModifiedAt DESC" : "";
	const { results } = await db()
		.prepare(`SELECT ${SELECT_COLUMNS} FROM typescales WHERE authorId IN (${placeholders})${order}`)
		.bind(...authorIds)
		.all<TypescaleRow>();

	return results.map(toTypescale);
}

export async function countByAuthor(authorId: string) {
	const count = await db()
		.prepare("SELECT COUNT(*) AS count FROM typescales WHERE authorId = ?")
		.bind(authorId)
		.first<number>("count");

	return count ?? 0;
}

export async function insertTypescale(
	authorId: string,
	data: { name?: unknown; base?: Record<string, unknown>; overrides?: unknown }
) {
	const now = new Date().toISOString();
	const columns = [
		"id",
		"authorId",
		"name",
		...BASE_COLUMNS,
		"overrides",
		"createdAt",
		"lastModifiedAt"
	];

	// Prisma set createdAt/lastModifiedAt automatically (@default(now()) /
	// @updatedAt); D1 has no equivalent, so both are bound explicitly.
	await db()
		.prepare(
			`INSERT INTO typescales (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`
		)
		.bind(
			newTypescaleId(),
			authorId,
			requireName(data.name),
			...baseBindValues(data.base),
			serializeOverrides(data.overrides),
			now,
			now
		)
		.run();
}

// Scoped to the owner so a user can only update their own typescale. Returns
// whether a row actually matched.
export async function updateTypescale(
	id: string,
	authorId: string,
	data: { name?: unknown; base?: Record<string, unknown>; overrides?: unknown }
) {
	const assignments = ["name", ...BASE_COLUMNS, "overrides", "lastModifiedAt"]
		.map((column) => `${column} = ?`)
		.join(", ");

	const { meta } = await db()
		.prepare(`UPDATE typescales SET ${assignments} WHERE id = ? AND authorId = ?`)
		.bind(
			requireName(data.name),
			...baseBindValues(data.base),
			serializeOverrides(data.overrides),
			new Date().toISOString(),
			id,
			authorId
		)
		.run();

	return meta.changes > 0;
}

export async function deleteTypescale(id: string, authorId: string) {
	const { meta } = await db()
		.prepare("DELETE FROM typescales WHERE id = ? AND authorId = ?")
		.bind(id, authorId)
		.run();

	return meta.changes > 0;
}

// D1 errors carry the useful detail on non-enumerable Error fields, so
// JSON.stringify of a raw one loses it. Log the full error for Cloudflare
// observability / `wrangler tail`, and return a compact serializable summary.
export function describeError(error: unknown) {
	console.error(error);
	if (error instanceof Error) {
		return { name: error.name, message: error.message };
	}
	return { error: String(error) };
}
