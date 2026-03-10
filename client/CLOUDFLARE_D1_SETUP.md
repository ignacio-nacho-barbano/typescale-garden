# Prisma + Cloudflare D1 Setup Guide

Your Prisma configuration has been updated for Cloudflare D1 integration. Here's what was configured:

## ✅ Completed Setup

1. **Updated Prisma Schema** (`prisma/schema.prisma`)

   - Added `runtime = "cloudflare"` to the generator
   - Added output path: `../src/generated/prisma`
   - Provider remains: `sqlite`

2. **Installed Dependencies**

   - `@prisma/adapter-d1` - D1 adapter for Prisma Client
   - `dotenv` - Environment variable management

3. **Created `prisma.config.ts`**

   - Configuration file for migrations workflow
   - Uses DATABASE_URL from environment variables

4. **Generated Prisma Client**

   - Client generated to `src/generated/prisma`
   - Ready for cloudflare runtime

5. **Configured `wrangler.toml`** (Already done)
   - D1 database bindings configured for `preview` and `production` environments
   - Database IDs are set up

## 📋 Next Steps

### 1. Generate Migration Files

```bash
cd client
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/migrations/0001_init.sql
```

### 2. Apply Migrations to Local D1 Database

```bash
# Apply to local development database
npx wrangler d1 execute typescale-garden-dev --local --file="./prisma/migrations/0001_init.sql"
```

### 3. Apply Migrations to Remote D1 Database

```bash
# Apply to remote production database
npx wrangler d1 execute typescale-garden-prod --remote --file="./prisma/migrations/0001_init.sql"
```

### 4. Use PrismaD1 Adapter in Your Worker

Update your worker handler to use the D1 adapter:

```typescript
import { PrismaClient } from "./generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

export interface Env {
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const adapter = new PrismaD1(env.DB);
		const prisma = new PrismaClient({ adapter });

		// Your queries here
		const data = await prisma.typescale.findMany();

		// Always disconnect to prevent memory issues
		ctx.waitUntil(prisma.$disconnect());

		return new Response(JSON.stringify(data));
	}
};
```

### 5. Add Type Definitions for Worker Environment (Optional)

Run this command to auto-generate types from wrangler.toml:

```bash
npx wrangler types
```

## 📌 Important Notes

- **Always call `prisma.$disconnect()`** in your worker handlers to prevent memory leaks
- Use `ctx.waitUntil()` to ensure disconnect happens before worker terminates
- For local development, use the `--local` flag with wrangler d1 commands
- For production, use the `--remote` flag
- The `__generated/prisma` directory should NOT be committed to git (add to .gitignore if not already there)

## 🔄 Future Migrations

For schema changes, generate new migration files:

```bash
npx prisma migrate diff \
  --from-local-d1 \
  --to-schema prisma/schema.prisma \
  --script > prisma/migrations/0002_your_change.sql
```

Then apply using the wrangler commands above.

## 📖 References

- [Prisma D1 Documentation](https://www.prisma.io/docs/guides/deployment/cloudflare-d1)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1)
- [Prisma Adapter D1](https://www.prisma.io/docs/orm/reference/prisma-client-reference#d1)
