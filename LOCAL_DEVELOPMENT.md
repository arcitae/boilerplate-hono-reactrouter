# Local Development Guide

## Overview

The application uses a single Cloudflare Worker that handles both frontend (React Router) and backend (Hono API) routes. For local development, you have two options:

1. **React Router Dev Server (Recommended)** - Fastest development experience
2. **Wrangler Dev** - Test the exact Cloudflare Workers environment

## Option 1: React Router Dev Server (Recommended)

Use React Router's built-in dev server for the fastest development experience.

```bash
npm run dev
```

**How it works:**
- React Router dev server runs on `http://localhost:5173` (or similar)
- API routes (`/api/*`) are handled by the Hono backend app directly (no HTTP)
- Hot Module Replacement (HMR) for instant updates
- No build step needed

**Pros:**
- ✅ Fastest HMR (Hot Module Replacement)
- ✅ Best developer experience
- ✅ No build step needed
- ✅ API calls work directly (zero latency)

**Cons:**
- ❌ Different from production (single process vs Cloudflare Workers)
- ❌ Doesn't test Cloudflare Workers environment

**When to use:** Daily development, UI work, rapid iteration

## Option 2: Wrangler Dev (Cloudflare Workers)

Test the exact production environment locally using Wrangler.

```bash
npm run dev:server
# or
wrangler dev
```

This starts the worker on `http://localhost:8787` (or another port if 8787 is taken).

**Pros:**
- ✅ Matches production environment exactly
- ✅ Tests Cloudflare Workers runtime
- ✅ Tests environment variable handling
- ✅ Tests Prisma with Cloudflare Workers adapter

**Cons:**
- ❌ Slower than React Router dev server
- ❌ Requires build step for changes
- ❌ Less responsive HMR

**When to use:** Testing production setup, debugging Workers-specific issues, before deployment

## Environment Variables

### For React Router Dev Server (`npm run dev`)

Uses `.dev.vars` file (or `.env.local`):

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/db_name?schema=public
# Or for Prisma Accelerate:
PRISMA_ACCELERATE_URL=prisma://accelerate.prisma-data.net/?api_key=__API_KEY__

# Clerk
CLERK_SECRET_KEY=sk_...
VITE_CLERK_PUBLISHABLE_KEY=pk_...

# Optional: PostHog
VITE_PUBLIC_POSTHOG_KEY=phc_...
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Note:** `VITE_BACKEND_URL` is **not needed** - API calls use the same origin.

### For Wrangler Dev (`wrangler dev`)

Uses `wrangler.jsonc` configuration and `.dev.vars` file.

Set secrets:
```bash
wrangler secret put DATABASE_URL
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_PUBLISHABLE_KEY
# etc.
```

Or use `.dev.vars` file (automatically loaded by Wrangler):
```bash
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...
```

## Quick Reference

| Command | What it does | Best for |
|---------|-------------|----------|
| `npm run dev` | React Router dev server | Daily development, UI work |
| `npm run dev:server` | Wrangler dev (Cloudflare Workers) | Testing production environment |
| `npm run build` | Build for production | Before deployment |
| `npm run preview` | Preview production build | Testing production build locally |

## API Client Behavior

### Server-Side (React Router Loaders)

In server-side code (loaders), API calls use **direct function calls** to the Hono app:
- **Zero latency** - No HTTP overhead
- **Same worker** - Direct function invocation
- **Type-safe** - Full TypeScript support

Example:
```typescript
// In a loader
const client = apiClient(args.context, args.request);
const res = await client.api.posts.$get({ query: { page: "1" } });
// This is a direct function call, not an HTTP request!
```

### Client-Side (Browser)

In client-side code, API calls use HTTP requests to the same origin:
- Uses `window.location.origin` (same worker)
- Normal HTTP requests
- Still type-safe via Hono client

Example:
```typescript
// In client component
const client = apiClient();
const res = await client.api.posts.$get({ query: { page: "1" } });
// This is an HTTP request to the same origin
```

## Database Setup

### Using Direct PostgreSQL

1. Set up PostgreSQL database (local or hosted)
2. Set `DATABASE_URL` in `.dev.vars`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/db_name?schema=public
   ```
3. Run migrations:
   ```bash
   npm run db:migrate
   ```

### Using Prisma Accelerate

1. Enable Accelerate in Prisma Data Platform
2. Get your Accelerate connection string
3. Set `PRISMA_ACCELERATE_URL` in `.dev.vars`:
   ```
   PRISMA_ACCELERATE_URL=prisma://accelerate.prisma-data.net/?api_key=__API_KEY__
   ```
4. The app automatically uses Accelerate extension

## Troubleshooting

### CORS Errors

CORS should not be an issue since frontend and backend run in the same worker. If you see CORS errors:
- Check that you're using the single worker setup (not separate workers)
- Verify API calls are using relative paths

### API Calls Not Working

1. **Server-side**: Check that `args.context` is passed to `apiClient()`
2. **Client-side**: Verify the worker is running and accessible
3. Check browser console for errors
4. Verify environment variables are set correctly

### Database Connection Issues

1. Verify `DATABASE_URL` or `PRISMA_ACCELERATE_URL` is set correctly
2. For local PostgreSQL: Ensure database is running and accessible
3. For Accelerate: Verify connection string format (starts with `prisma://`)
4. Check Prisma logs in console

### Build Errors

1. Run `npm run build` to see detailed errors
2. Clear `.react-router` cache if needed: `rm -rf .react-router`
3. Verify all dependencies: `npm install`
4. Check TypeScript: `npm run typecheck`

### Environment Variables Not Loading

1. **React Router dev**: Check `.dev.vars` or `.env.local` file exists
2. **Wrangler dev**: Check `.dev.vars` file or set secrets via `wrangler secret put`
3. Restart dev server after changing environment variables
4. Verify variable names match exactly (case-sensitive)

## Recommendation

**For daily development:** Use `npm run dev` (React Router dev server)
- Fastest iteration
- Best developer experience
- Instant feedback

**Before deployment:** Use `npm run dev:server` (Wrangler dev)
- Test production environment
- Verify Workers-specific behavior
- Test environment variable handling
