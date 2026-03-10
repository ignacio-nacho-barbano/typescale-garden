# Cloudflare D1 Deployment Guide

## Overview

This project has been configured for **Cloudflare Pages + D1** deployment. It uses:

- **SvelteKit with Cloudflare adapter** – Server-side rendering on Cloudflare Workers
- **Cloudflare D1** – SQLite database with full Prisma support
- **Edge-compatible JWT verification** – Auth0 integration using `jose` library
- **Prisma ORM** – Database access with D1 adapter

## Architecture

```
User Request
    ↓
Cloudflare Pages (SvelteKit adapter-cloudflare)
    ↓
SvelteKit Endpoints (+server.ts) with JWT auth via hooks.server.ts
    ↓
Prisma Client + D1 Adapter
    ↓
Cloudflare D1 (SQLite)
```

## Prerequisites

- **Node.js** 18+
- **npm** or **pnpm**
- **Wrangler CLI** v3+ (`npm install -g @wrangler/cli` or `npm run d1:*` scripts)
- **Cloudflare Account** with Workers/Pages enabled
- **Auth0 Application** configured (for JWT verification)

## Setup Steps

### Step 1: Create Cloudflare D1 Database

```bash
cd client

# Login to Cloudflare
wrangler login

# Create database
npm run d1:create
# or: wrangler d1 create typescale-garden
```

Output:

```
✔ Successfully created D1 database typescale-garden
┌─────────────────────────────────────────────────┐
│ Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx │
│ Database name: typescale-garden                  │
└─────────────────────────────────────────────────┘
```

**Copy the Database ID** – you'll need it for the next step.

### Step 2: Update wrangler.toml

Edit `wrangler.toml` and replace `YOUR_DATABASE_ID_HERE` with your actual database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "typescale-garden"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← Your ID here
```

Also update environment variables with your Auth0 domain:

```toml
[env.production]
vars = {
  PUB_API_URL = "https://your-domain.com",
  PUB_CLIENT_ORIGIN = "https://your-domain.com",
  PUB_AUTH_DOMAIN = "https://your-auth0-domain.auth0.com/",  # ← Your Auth0 domain
  PUB_APP_ENV = "production"
}
```

### Step 3: Create Database Schema

The migration file is already prepared. Apply it:

```bash
npm run d1:migrate
# or: wrangler d1 migrations apply typescale-garden --remote
```

Verify the schema:

```bash
npm run d1:query
# or: wrangler d1 shell typescale-garden

# Then run:
# .tables
# PRAGMA table_info(Typescale);
```

### Step 4: Migrate Data from MongoDB (Optional)

If you have existing MongoDB data, migrate it to D1:

```bash
# Export from MongoDB
mongodump --uri "your-mongodb-url" --archive=export.archive

# Create a migration script or use Prisma Studio:
npm run prisma:generate

# Manual migration:
# 1. Query MongoDB: db.typescale.find({})
# 2. Transform and insert into D1 via Wrangler or your API
```

**Example TypeScript transformation:**

```typescript
// MongoDB document
{
  _id: ObjectId("..."),
  authorId: "auth0|123",
  name: "My Typescale",
  base: {
    breakpoint: 768,
    fontName: "Inter",
    baseUnit: 4,
    baseSize: 16,
    // ... other fields
  },
  overrides: null
}

// Transform to D1 format
{
  id: "uuid-here",
  createdAt: "2024-01-01T00:00:00Z",
  lastModifiedAt: "2024-01-01T00:00:00Z",
  authorId: "auth0|123",
  name: "My Typescale",
  base: JSON.stringify({ breakpoint: 768, fontName: "Inter", ... }),
  overrides: null
}
```

### Step 5: Configure Cloudflare Pages

1. Go to **Cloudflare Dashboard** → **Pages**
2. **Create application** → **Connect to Git** (or upload manually)
3. Set build command: `npm run build`
4. Set build output directory: `build/client`
5. **Environment Variables** → Add:
   - `PUB_AUTH_DOMAIN` = `https://your-auth0-domain.auth0.com/`
   - `PUB_API_URL` = `https://your-domain.com` (or leave empty for same-origin)
   - `PUB_CLIENT_ORIGIN` = `https://your-domain.com`
   - `PUB_APP_ENV` = `production`
6. Deploy

### Step 6: Link D1 to Cloudflare Pages

In your Cloudflare Pages project settings:

```bash
# Connect D1 database to the Pages deployment
wrangler pages deployment tail
wrangler d1 info typescale-garden
```

Verify connection:

```bash
wrangler d1 execute typescale-garden "SELECT COUNT(*) FROM Typescale;"
```

## Local Development

### Option A: Local SQLite Development

```bash
# Create local database
mkdir -p .local
touch .local/dev.db

# Set DATABASE_URL
export DATABASE_URL="file:./.local/dev.db"

# Generate Prisma client
npm run prisma:generate

# Apply migrations
npx prisma migrate dev --name init

# Start dev server
npm run dev
```

The app will be at `http://localhost:5173`

### Option B: Test with Cloudflare D1 Locally

```bash
# Run with Wrangler (requires D1 setup)
npm run wrangler
# or: wrangler dev
```

This uses your actual D1 database locally (useful for testing before production).

### Manual Database Testing

```bash
# Connect to D1 database
npm run d1:query

# In the shell:
SELECT * FROM Typescale WHERE authorId = 'auth0|123';
SELECT COUNT(*) FROM Typescale;
INSERT INTO Typescale (id, authorId, name, base) VALUES ('id-123', 'auth0|123', 'Test', '{}');
```

## Database Schema

### Typescale Table (SQLite)

```sql
CREATE TABLE "Typescale" (
    id TEXT PRIMARY KEY,                  -- UUID
    createdAt DATETIME NOT NULL,          -- ISO 8601
    lastModifiedAt DATETIME NOT NULL,     -- ISO 8601
    authorId TEXT NOT NULL,               -- Auth0 user ID or "typescale-garden"
    name TEXT NOT NULL,                   -- Display name
    base TEXT NOT NULL,                   -- JSON: {breakpoint, fontName, baseUnit, baseSize, ratios, ...}
    overrides TEXT                        -- JSON: custom overrides (optional)
);

CREATE INDEX "Typescale_authorId_idx" ON "Typescale"("authorId");
```

### Data Format

```typescript
// base field (JSON string)
{
  "breakpoint": 768,
  "fontName": "Inter",
  "baseUnit": 4,
  "baseSize": 16,
  "desktopRatio": 1.2,
  "mobileRatio": 1.125,
  "letterSpacingRatio": 0.05,
  "useUppercaseForTitles": false,
  "useItalicsForTitles": false,
  "headingsInitialWeight": 700,
  "headingsFinalWeight": 400
}

// overrides field (JSON string, optional)
{
  "h1": { "fontSize": "2rem", "lineHeight": "1.2" },
  "body": { "fontSize": "1rem", "lineHeight": "1.6" }
}
```

## API Endpoints

All endpoints work the same, now with D1 backend:

| Endpoint                    | Method | Auth | Purpose                  |
| --------------------------- | ------ | ---- | ------------------------ |
| `/api/typescales/default`   | GET    | ❌   | Fetch default typescales |
| `/api/typescales/saved`     | GET    | ✅   | Get user's typescales    |
| `/api/typescales/saved`     | POST   | ✅   | Create typescale         |
| `/api/typescales/saved/:id` | PUT    | ✅   | Update typescale         |
| `/api/typescales/saved/:id` | DELETE | ✅   | Delete typescale         |
| `/api/users`                | GET    | ❌   | Check auth status        |
| `/api/status`               | GET    | ❌   | Health check             |

**Auth Header Format:**

```
Authorization: Bearer <Auth0_JWT_Token>
```

## Authentication (Auth0)

JWT verification uses the **`jose`** library (edge-compatible):

1. **Request comes in** with `Authorization: Bearer <token>`
2. **hooks.server.ts** extracts the token
3. **lib/server/auth.ts** verifies using Auth0 JWKS:
   - Fetches public keys from `https://your-auth0-domain.auth0.com/.well-known/jwks.json`
   - Caches keys for 24 hours (edge-friendly)
   - Verifies signature and claims
4. **event.locals.auth** is populated with user info
5. **+server.ts endpoints** check `event.locals.auth` for protected routes

**Cloudflare-Compatible:**

- ✅ Uses `fetch()` API (Cloudflare supports this)
- ✅ No Node.js `http` module required
- ✅ Caching reduces external API calls
- ✅ Works in Workers, Pages, and Durable Objects

## Troubleshooting

### "D1 database binding not found"

```bash
# Verify wrangler.toml
cat wrangler.toml

# Check database exists
wrangler d1 list
```

### "Could not resolve ./query_engine_bg.wasm"

This was a previous issue with Prisma + Cloudflare adapter. Now fixed with `@prisma/adapter-d1`.

### Migrations Not Applied

```bash
# Check migration status
wrangler d1 migrations list typescale-garden

# Apply all pending
wrangler d1 migrations apply typescale-garden --remote
```

### JWT Verification Fails

1. Check Auth0 domain is correct in `wrangler.toml`
2. Verify token is valid: `https://jwt.io`
3. Check audience claim matches `PUB_API_URL`
4. Check issuer claim matches `PUB_AUTH_DOMAIN`

### Slow JWKS Fetching

- JWKS is cached for 24 hours locally
- First request is slower (fetches from Auth0)
- Subsequent requests use cache

## Deployment Checklist

- [ ] D1 database created and ID added to `wrangler.toml`
- [ ] Migrations applied: `npm run d1:migrate`
- [ ] Auth0 domain in `wrangler.toml` and Cloudflare Pages env
- [ ] Local dev tested: `npm run dev` (with `DATABASE_URL=file:.local/dev.db`)
- [ ] Build succeeds: `npm run build` ✓
- [ ] Cloudflare Pages project created
- [ ] Environment variables configured in Cloudflare Dashboard
- [ ] Data migrated from MongoDB (if needed)
- [ ] Deployed to Cloudflare Pages
- [ ] All API endpoints tested in production
- [ ] Database verified: `npm run d1:query` → `SELECT COUNT(*) FROM Typescale;`

## Production Deployment

1. **Push to Git** (GitHub, GitLab, etc.)
2. **Cloudflare Pages** auto-deploys on push
3. **Monitor** via Cloudflare Dashboard
4. **View logs** via `wrangler tail` or Cloudflare Dashboard

```bash
# Monitor live logs
wrangler tail --service typescale-garden
```

## Performance Tips

- D1 is edge-local; queries are fast (~1-2ms latency)
- Prisma caches schema parsing (fast subsequent queries)
- JWKS cached for 24 hours (reduces Auth0 API calls)
- Use indexes (already created on `authorId`)
- Avoid N+1 queries (Prisma helps prevent this)

## Security

✅ **What's Protected:**

- Auth0 integration (RS256 signatures verified)
- Database is private to Cloudflare environment
- Environment variables never exposed to client
- Typescale data scoped to user (checked on every mutation)

## Next Steps

1. Follow the setup steps above
2. Test locally: `npm run dev`
3. Deploy to Cloudflare Pages
4. Monitor in Cloudflare Dashboard

## Support

- **Cloudflare D1:** https://developers.cloudflare.com/d1/
- **Prisma D1:** https://www.prisma.io/docs/orm/overview/databases/sqlite
- **SvelteKit Cloudflare:** https://kit.svelte.dev/docs/adapter-cloudflare
- **jose (JWT):** https://github.com/panva/jose
