# Architecture: Single Worker Setup

## Current Architecture

The application uses a **single Cloudflare Worker** that handles both:
- **Frontend routes** (React Router) - All non-API routes
- **Backend API routes** (Hono) - All `/api/*` routes

## Why Single Worker?

### Benefits

1. **Zero Latency API Calls**
   - Server-side API calls (in React Router loaders) use direct function calls
   - No HTTP overhead - instant responses
   - Better performance than separate workers

2. **Simplified Configuration**
   - Single deployment
   - Shared environment variables
   - No CORS configuration needed
   - No `BACKEND_URL` needed

3. **Cost Effective**
   - One worker instead of two
   - Lower complexity
   - Easier to manage

4. **Better Performance**
   - No network latency between frontend and backend
   - Shared memory and context
   - Optimized for serverless

### Trade-offs

- **Scaling**: Both frontend and backend scale together (usually fine for most apps)
- **Isolation**: Less isolation between frontend and backend (usually not an issue)

## How It Works

### Worker Entry Point

`workers/app.ts` handles routing:

```typescript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // API routes → Hono app
    if (url.pathname.startsWith('/api/')) {
      return honoApp.fetch(request, env, ctx);
    }
    
    // All other routes → React Router
    return requestHandler(eventContext);
  }
}
```

### API Client

The API client (`app/client/lib/api-client.ts`) automatically detects the environment:

- **Server-side (loaders)**: Makes direct function calls to Hono app (zero latency)
- **Client-side (browser)**: Makes HTTP requests to same origin

```typescript
// Server-side: Direct call (zero latency)
const client = apiClient(args.context, args.request);
const res = await client.api.posts.$get();

// Client-side: HTTP request (same origin)
const client = apiClient();
const res = await client.api.posts.$get();
```

## File Structure

```
workers/
  └── app.ts              # Single worker entry point

app/
  ├── client/             # Frontend (React Router)
  │   ├── routes/         # React Router routes
  │   └── lib/
  │       └── api-client.ts  # API client (handles direct calls + HTTP)
  └── server/             # Backend (Hono)
      ├── routes/         # API routes
      └── index.ts        # Hono app export

wrangler.jsonc            # Single worker configuration
```

## Environment Variables

All environment variables are shared between frontend and backend:

**Secrets** (set via `wrangler secret put`):
- `DATABASE_URL` - Database connection
- `CLERK_SECRET_KEY` - Backend authentication
- `CLERK_PUBLISHABLE_KEY` - Frontend authentication
- Other service API keys

**Vars** (set in `wrangler.jsonc`):
- `NODE_ENV` - Environment
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `VITE_PUBLIC_POSTHOG_KEY` - PostHog analytics (optional)

**Note:** `VITE_BACKEND_URL` is **not needed** - API calls use the same origin.

## Deployment

Single deployment command:

```bash
npm run build
wrangler deploy
```

Or:

```bash
npm run deploy
```

## Migration from Separate Workers

If you previously used separate workers:

1. ✅ **Already migrated** - Current setup uses single worker
2. ✅ **API client** - Automatically handles direct calls vs HTTP
3. ✅ **Environment variables** - All in one place
4. ✅ **No CORS** - Same origin, no CORS needed

## Performance Characteristics

### Server-Side API Calls (Loaders)

- **Latency**: ~0ms (direct function call)
- **Overhead**: Minimal (no serialization)
- **Type Safety**: Full TypeScript support

### Client-Side API Calls (Browser)

- **Latency**: Network latency (same origin, very fast)
- **Overhead**: Normal HTTP overhead
- **Type Safety**: Full TypeScript support via Hono client

## Best Practices

1. **Use loaders for data fetching** - Get zero-latency API calls
2. **Keep API routes in `/api/*`** - Clear separation
3. **Share environment variables** - Single source of truth
4. **Use type-safe API client** - Full TypeScript support

## Notes

- Single worker is the recommended approach for most applications
- Provides best performance with zero-latency server-side API calls
- Simplifies deployment and configuration
- No need for separate worker setup unless you have specific scaling requirements
