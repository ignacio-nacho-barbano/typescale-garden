import { Collection, Document, MongoClient, ObjectId, WithId } from "mongodb";

// SCRAM connection string — the same value the Prisma datasource read via
// env("DB_STRING"). Set as a Worker secret (prod) or in .dev.vars (local).
const uri = process.env.DB_STRING;

// Prisma persisted this model in the collection named after the model
// ("Typescale"), inside the database named in the connection string. We match
// both exactly so existing documents are read/written in place.
const COLLECTION = process.env.DB_COLLECTION || "Typescale";

export interface TypescaleDoc extends Document {
	_id: ObjectId;
	authorId: string;
	name: string;
	base: Record<string, unknown>;
	overrides?: unknown;
	createdAt: Date;
	lastModifiedAt: Date;
}

// Runs a collection operation against a freshly-connected client that is closed
// before we return.
//
// We deliberately do NOT cache the client across requests. Cloudflare freezes the
// isolate between requests, which kills the driver's background SDAM monitors and
// leaves dangling timers/sockets — that both hangs the invocation (~30s / "Worker
// hung" errors) and leaves the cached topology in an Unknown state, so the next
// request fast-fails. Connecting per request and closing in `finally` keeps all of
// the driver's async work inside a single invocation.
export async function withTypescales<T>(
	op: (collection: Collection<TypescaleDoc>) => Promise<T>
): Promise<T> {
	if (!uri) {
		throw new Error("DB_STRING is not set");
	}
	const client = new MongoClient(uri, {
		maxPoolSize: 1,
		minPoolSize: 0,
		serverSelectionTimeoutMS: 5000
	});
	try {
		await client.connect();
		// client.db() with no argument uses the database from the connection
		// string, exactly as the Prisma MongoDB connector did.
		return await op(client.db().collection<TypescaleDoc>(COLLECTION));
	} finally {
		await client.close().catch(() => {});
	}
}

// A MongoError's `name`/`message`/`stack` are non-enumerable, so JSON.stringify
// of a raw driver error loses them (leaving only `{errorLabelSet:{}}`). Log the
// full error for Cloudflare observability / `wrangler tail`, and return a compact,
// serializable summary so failures are diagnosable.
export function describeError(error: unknown) {
	console.error(error);
	if (error instanceof Error) {
		return { name: error.name, message: error.message };
	}
	return { error: String(error) };
}

// Prisma exposed the Mongo _id (ObjectId) as a string field named `id`. The
// client relies on `id` (e.g. loadedTypescaleId, DELETE /saved/:id), so we
// reproduce that mapping on every response document.
export function serialize(doc: WithId<TypescaleDoc>) {
	const { _id, ...rest } = doc;
	return { id: _id.toHexString(), ...rest };
}

export { ObjectId };
