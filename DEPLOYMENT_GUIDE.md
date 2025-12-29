# Deployment Guide

This guide explains how to deploy the application as a single Cloudflare Worker that handles both frontend (React Router) and backend (Hono API) routes.

## Architecture

- **Single Worker**: Handles both frontend routes (React Router) and API routes (`/api/*`) in one Cloudflare Worker
- **Zero Latency API Calls**: Server-side API calls use direct function calls (no HTTP overhead)
- **Same Origin**: Frontend and backend run in the same worker, eliminating CORS issues

## Prerequisites

1. Cloudflare account with Workers enabled
2. Wrangler CLI installed and authenticated: `wrangler login`
3. Database configured (PostgreSQL or Prisma Accelerate)
4. Environment variables ready

## Deployment Steps

### Step 1: Set Up Environment Variables

Set up secrets (sensitive data) using Wrangler:

```bash
# Required secrets
wrangler secret put DATABASE_URL
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_PUBLISHABLE_KEY

# Optional: Prisma Accelerate (if using)
wrangler secret put PRISMA_ACCELERATE_URL

# Optional: AI service keys
wrangler secret put OPENAI_API_KEY
wrangler secret put DEEPGRAM_API_KEY
wrangler secret put GOOGLE_TTS_API_KEY
wrangler secret put HEYGEN_API_KEY
```

**Note:** Secrets are set per worker. Since we use a single worker, set them once.

### Step 2: Configure Worker Variables

Update `wrangler.jsonc` with non-sensitive variables:

```jsonc
{
  "vars": {
    "NODE_ENV": "production",
    "VITE_CLERK_PUBLISHABLE_KEY": "pk_...",  // Can be in vars or secrets
    "VITE_PUBLIC_POSTHOG_KEY": "phc_...",     // Optional
    "VITE_PUBLIC_POSTHOG_HOST": "https://us.i.posthog.com"  // Optional
  }
}
```

**Important:** `VITE_BACKEND_URL` is **not needed** - frontend and backend run in the same worker, so API calls use relative paths (same origin).

### Step 3: Deploy

Deploy the worker:

```bash
npm run build
wrangler deploy
```

Or use the deploy script:

```bash
npm run deploy
```

This will deploy to: `https://boilerplate-hono-reactrouter.<your-subdomain>.workers.dev`

## Environment Variables

### Secrets (set via `wrangler secret put`)

- `DATABASE_URL` - PostgreSQL connection string (or Prisma Accelerate URL)
- `PRISMA_ACCELERATE_URL` - (optional) Prisma Accelerate connection string (if using Accelerate)
- `CLERK_SECRET_KEY` - Clerk authentication secret key
- `CLERK_PUBLISHABLE_KEY` or `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (can be in vars or secrets)
- `OPENAI_API_KEY` - (optional) OpenAI API key
- `DEEPGRAM_API_KEY` - (optional) Deepgram API key
- `GOOGLE_TTS_API_KEY` - (optional) Google TTS API key
- `HEYGEN_API_KEY` - (optional) HeyGen API key

### Vars (set in `wrangler.jsonc`)

- `NODE_ENV` - Set to "production"
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (can be in vars or secrets)
- `VITE_PUBLIC_POSTHOG_KEY` - (optional) PostHog analytics key
- `VITE_PUBLIC_POSTHOG_HOST` - (optional) PostHog host URL

**Note:** `VITE_BACKEND_URL` is **not needed** - API calls use the same origin.

## Custom Domains

You can add a custom domain to your worker:

1. Add route in `wrangler.jsonc`:
   ```jsonc
   "routes": [
     { "pattern": "yourdomain.com/*", "custom_domain": true }
   ]
   ```

2. Configure DNS in Cloudflare Dashboard to point to your worker

## Database Configuration

### Using Direct PostgreSQL

Set `DATABASE_URL` secret:
```bash
wrangler secret put DATABASE_URL
# Enter: postgresql://user:password@host:port/db_name?schema=public
```

### Using Prisma Accelerate

1. Enable Accelerate in Prisma Data Platform
2. Get your Accelerate connection string (starts with `prisma://`)
3. Set it as a secret:
   ```bash
   wrangler secret put PRISMA_ACCELERATE_URL
   # Enter: prisma://accelerate.prisma-data.net/?api_key=__API_KEY__
   ```

The application automatically detects Accelerate URLs and uses the Accelerate extension for connection pooling and caching.

## Troubleshooting

### Environment Variables Not Working

1. Secrets must be set via `wrangler secret put` (not in `wrangler.jsonc`)
2. Vars can be set in `wrangler.jsonc` or via `wrangler secret put`
3. Restart worker after setting new environment variables
4. Check worker logs in Cloudflare Dashboard

### Database Connection Issues

1. Verify `DATABASE_URL` or `PRISMA_ACCELERATE_URL` is set correctly
2. For Accelerate: Ensure the connection string starts with `prisma://`
3. Check database firewall allows Cloudflare IPs (for direct connections)
4. Review Prisma logs in worker output

### Clerk Authentication Errors

1. Verify `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` are set
2. Check that keys match between frontend and backend
3. Ensure `VITE_CLERK_PUBLISHABLE_KEY` is accessible in the worker environment

### Build Errors

1. Run `npm run build` to check for build errors
2. Verify all dependencies are installed: `npm install`
3. Check TypeScript errors: `npm run typecheck`

## Performance Optimizations

### Zero Latency API Calls

Since frontend and backend run in the same worker:
- **Server-side API calls** (in React Router loaders) use direct function calls - **zero latency**
- **Client-side API calls** use HTTP requests to the same origin
- No network overhead for server-side requests

### Prisma Accelerate

Using Prisma Accelerate provides:
- Connection pooling (reduces database connection overhead)
- Optional caching (improves query performance)
- Better performance for serverless environments

## Monitoring

- **Cloudflare Dashboard**: View worker logs, errors, and metrics
- **Observability**: Enabled by default in `wrangler.jsonc`
- **PostHog**: Analytics and error tracking (if configured)

## Notes

- Single worker deployment simplifies configuration and reduces latency
- All routes (`/api/*` and frontend routes) are handled by one worker
- API calls from server-side loaders use direct function calls (no HTTP)
- No CORS configuration needed (same origin)
- Environment variables are shared between frontend and backend
