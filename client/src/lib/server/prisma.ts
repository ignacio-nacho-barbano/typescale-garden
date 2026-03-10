import { PrismaClient } from "@prisma/client";
import { dev } from "$app/environment";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		log: dev ? ["query"] : []
	});

if (!dev) globalForPrisma.prisma = prisma;

/**
 * For Cloudflare D1, create a Prisma client with D1 adapter
 * Usage in +server.ts:
 *
 * export const GET: RequestHandler = async (event) => {
 *   const prismaD1 = await getPrismaD1(event.platform);
 *   // ... use prismaD1 for queries
 * };
 */
export async function getPrismaD1(platform: App.Platform) {
	const { PrismaD1 } = await import("@prisma/adapter-d1");

	if (!platform?.env?.DB) {
		throw new Error(
			'D1 database binding not found. Ensure "DB" is configured in wrangler.toml [[d1_databases]] section.'
		);
	}

	const adapter = new PrismaD1(platform.env.DB);

	return new PrismaClient({
		adapter,
		log: dev ? ["query"] : []
	});
}
