# Local Development Guide

## Overview

You have three options for local development:

1. **Single Worker (Recommended for Local Dev)** - Use the original integrated setup
2. **Separate Workers** - Test the production setup locally
3. **React Router Dev Server** - Fastest development experience

## Option 1: Single Worker (Recommended)

This uses the original `workers/app.ts` that combines both frontend and backend in one worker. This is the **easiest** option for local development.

```bash
npm run dev:single
# or
wrangler dev
```

**Pros:**
- ✅ Single command
- ✅ No CORS issues (same origin)
- ✅ Fastest setup
- ✅ API calls work directly (no HTTP overhead)

**Cons:**
- ❌ Different from production (separate workers)

**When to use:** Daily development, quick testing

## Option 2: Separate Workers

Test the exact production setup locally with two separate workers.

### Terminal 1: Backend Worker
```bash
npm run dev:backend
# or
wrangler dev --config wrangler.backend.jsonc
```

This starts the backend worker on `http://localhost:8787` (or another port if 8787 is taken).

### Terminal 2: Frontend Worker
```bash
npm run dev:frontend
# or
npm run build && wrangler dev --config wrangler.frontend.jsonc
```

**Important:** Before running the frontend, update `wrangler.frontend.jsonc`:
```jsonc
"vars": {
  "NODE_ENV": "development",
  "BACKEND_URL": "http://localhost:8787"  // Match backend port
}
```

**Pros:**
- ✅ Matches production setup exactly
- ✅ Tests CORS configuration
- ✅ Tests separate worker communication

**Cons:**
- ❌ Requires two terminals
- ❌ Need to build frontend first
- ❌ More complex setup

**When to use:** Testing production setup, debugging CORS issues, before deployment

## Option 3: React Router Dev Server

Use React Router's built-in dev server (fastest for frontend development).

```bash
npm run dev
```

**How it works:**
- React Router dev server runs on `http://localhost:5173` (or similar)
- API routes (`/api/*`) are intercepted by `app/frontend/entry.server.tsx`
- Backend app is called directly (no HTTP)

**Pros:**
- ✅ Fastest HMR (Hot Module Replacement)
- ✅ Best developer experience
- ✅ No build step needed
- ✅ API calls work directly

**Cons:**
- ❌ Different from production (single process)
- ❌ Doesn't test Cloudflare Workers environment

**When to use:** Frontend development, UI work, rapid iteration

## Environment Variables

### For Single Worker (`wrangler dev`)
Uses `wrangler.jsonc` configuration. Set secrets:
```bash
wrangler secret put DATABASE_URL
wrangler secret put CLERK_SECRET_KEY
# etc.
```

### For Separate Workers

**Backend** (`wrangler.backend.jsonc`):
```bash
wrangler secret put DATABASE_URL --config wrangler.backend.jsonc
wrangler secret put CLERK_SECRET_KEY --config wrangler.backend.jsonc
wrangler secret put FRONTEND_URL --config wrangler.backend.jsonc
# Set to: http://localhost:8788 (or frontend port)
```

**Frontend** (`wrangler.frontend.jsonc`):
- Set `BACKEND_URL` in `vars` section (see above)
- Secrets:
```bash
wrangler secret put CLERK_PUBLISHABLE_KEY --config wrangler.frontend.jsonc
```

### For React Router Dev Server
Uses `.env.local` file:
```bash
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...
FRONTEND_URL=http://localhost:5173
```

## Quick Reference

| Command | What it does | Best for |
|---------|-------------|----------|
| `npm run dev` | React Router dev server | Frontend development |
| `npm run dev:single` | Single worker (integrated) | General development |
| `npm run dev:backend` | Backend worker only | Backend API testing |
| `npm run dev:frontend` | Frontend worker only | Frontend worker testing |
| `npm run dev:backend` + `npm run dev:frontend` | Separate workers | Production testing |

## Troubleshooting

### CORS Errors (Separate Workers)
- Check `FRONTEND_URL` in backend config matches frontend worker URL
- Check `BACKEND_URL` in frontend config matches backend worker URL
- Verify ports are correct

### API Calls Not Working
- Check `BACKEND_URL` is set correctly
- Verify backend worker is running
- Check browser console for errors

### Build Errors
- Run `npm run build` before `dev:frontend`
- Clear `.react-router` cache if needed

## Recommendation

**For daily development:** Use `npm run dev` (React Router dev server)

**For production testing:** Use separate workers (`dev:backend` + `dev:frontend`)

**For quick testing:** Use single worker (`dev:single`)


