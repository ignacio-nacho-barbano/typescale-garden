#!/usr/bin/env node
/**
 * D1 Setup & Migration Helper
 *
 * This script helps you set up Cloudflare D1 for typescale-garden
 *
 * Pre-setup:
 * - Ensure Wrangler is installed: npm install -g @wrangler/cli
 * - Login to Cloudflare: wrangler login
 *
 * Usage:
 *   npm run d1:create     # Create D1 database
 *   npm run d1:migrate    # Apply migrations
 *   npm run d1:info       # Show database info
 *   npm run d1:query      # Interactive shell
 */

console.log(`
╔════════════════════════════════════════════════════════════╗
║     Cloudflare D1 Setup for typescale-garden             ║
╚════════════════════════════════════════════════════════════╝

This project is configured for Cloudflare D1 + SvelteKit.

STEPS TO DEPLOY:
────────────────────────────────────────────────────────────

1. CREATE DATABASE
   npm run d1:create
   (Copy the Database ID)

2. UPDATE wrangler.toml
   Edit ./wrangler.toml and replace:
   database_id = "YOUR_DATABASE_ID_HERE"
   with your actual Database ID

3. APPLY MIGRATIONS
   npm run d1:migrate

4. TEST LOCALLY
   export DATABASE_URL="file:./.local/dev.db"
   npm run dev

5. DEPLOY TO CLOUDFLARE PAGES
   Push to Git or deploy manually:
   wrangler pages deploy ./build/client

For detailed setup: See D1_SETUP.md

────────────────────────────────────────────────────────────
`);
