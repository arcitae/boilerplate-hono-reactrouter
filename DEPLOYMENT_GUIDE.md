# Separate Workers Deployment Guide

This guide explains how to deploy the frontend and backend as separate Cloudflare Workers.

## Architecture

- **Backend Worker** (`panya-backend`): Handles all API routes (`/api/*`)
- **Frontend Worker** (`panya-frontend`): Handles all frontend routes (React Router)

## Prerequisites

1. Cloudflare account with Workers enabled
2. Wrangler CLI installed and authenticated: `wrangler login`
3. Database configured (PostgreSQL)
4. Environment variables ready

## Deployment Steps

### Step 1: Deploy Backend Worker

1. **Set up environment variables** (secrets):
   ```bash
   # Required secrets
   wrangler secret put DATABASE_URL --config wrangler.backend.jsonc
   wrangler secret put CLERK_SECRET_KEY --config wrangler.backend.jsonc
   wrangler secret put FRONTEND_URL --config wrangler.backend.jsonc
   
   # Optional: AI service keys
   wrangler secret put OPENAI_API_KEY --config wrangler.backend.jsonc
   wrangler secret put DEEPGRAM_API_KEY --config wrangler.backend.jsonc
   # ... etc
   ```

2. **Update `wrangler.backend.jsonc`**:
   - Set `FRONTEND_URL` to your frontend worker URL (you'll get this after deploying frontend)
   - Or set it as a secret: `wrangler secret put FRONTEND_URL --config wrangler.backend.jsonc`

3. **Deploy backend**:
   ```bash
   npm run deploy:backend
   ```
   
   This will deploy to: `https://panya-backend.<your-subdomain>.workers.dev`

### Step 2: Deploy Frontend Worker

1. **Update `wrangler.frontend.jsonc`**:
   - Set `BACKEND_URL` in the `vars` section to your backend worker URL:
     ```jsonc
     "vars": {
       "NODE_ENV": "production",
       "BACKEND_URL": "https://panya-backend.<your-subdomain>.workers.dev"
     }
     ```

2. **Set up environment variables** (secrets):
   ```bash
   # Required secrets
   wrangler secret put CLERK_PUBLISHABLE_KEY --config wrangler.frontend.jsonc
   
   # Optional
   wrangler secret put POSTHOG_KEY --config wrangler.frontend.jsonc
   wrangler secret put POSTHOG_HOST --config wrangler.frontend.jsonc
   ```

3. **Build and deploy frontend**:
   ```bash
   npm run deploy:frontend
   ```
   
   This will deploy to: `https://panya-frontend.<your-subdomain>.workers.dev`

### Step 3: Update Backend CORS (if needed)

After deploying the frontend, make sure the backend's `FRONTEND_URL` matches your frontend worker URL:

```bash
wrangler secret put FRONTEND_URL --config wrangler.backend.jsonc
# Enter: https://panya-frontend.<your-subdomain>.workers.dev
```

Or update it in the Cloudflare Dashboard.

## Deployment Scripts

- `npm run deploy:backend` - Deploy only the backend worker
- `npm run deploy:frontend` - Build and deploy only the frontend worker
- `npm run deploy:all` - Deploy both workers (backend first, then frontend)

## Environment Variables

### Backend Worker (`wrangler.backend.jsonc`)

**Secrets** (set via `wrangler secret put`):
- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` - Clerk authentication secret
- `FRONTEND_URL` - Frontend worker URL (for CORS)
- `OPENAI_API_KEY` - (optional) OpenAI API key
- `DEEPGRAM_API_KEY` - (optional) Deepgram API key
- `GOOGLE_TTS_API_KEY` - (optional) Google TTS API key
- `HEYGEN_API_KEY` - (optional) HeyGen API key

**Vars** (set in `wrangler.backend.jsonc`):
- `NODE_ENV` - Set to "production"

### Frontend Worker (`wrangler.frontend.jsonc`)

**Secrets** (set via `wrangler secret put`):
- `CLERK_PUBLISHABLE_KEY` - Clerk frontend publishable key
- `POSTHOG_KEY` - (optional) PostHog analytics key
- `POSTHOG_HOST` - (optional) PostHog host URL

**Vars** (set in `wrangler.frontend.jsonc`):
- `NODE_ENV` - Set to "production"
- `BACKEND_URL` - Backend worker URL (e.g., `https://panya-backend.<your-subdomain>.workers.dev`)

## Custom Domains

You can add custom domains to each worker:

1. **Backend**: Add route in `wrangler.backend.jsonc`:
   ```jsonc
   "routes": [
     { "pattern": "api.yourdomain.com", "custom_domain": true }
   ]
   ```

2. **Frontend**: Add route in `wrangler.frontend.jsonc`:
   ```jsonc
   "routes": [
     { "pattern": "yourdomain.com/*", "custom_domain": true }
   ]
   ```

## Development

For local development with separate workers:

1. **Backend**: Run backend locally (if you have a local Hono server setup)
2. **Frontend**: Update `BACKEND_URL` in `.env.local`:
   ```
   VITE_BACKEND_URL=http://localhost:8787
   ```
3. Run `npm run dev` for frontend development

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Check that `FRONTEND_URL` in backend matches your frontend worker URL
2. Verify CORS middleware is enabled in backend
3. Check browser console for specific CORS error details

### API Client Errors

If API calls fail:
1. Verify `BACKEND_URL` is set correctly in `wrangler.frontend.jsonc`
2. Check that backend worker is deployed and accessible
3. Verify network requests in browser DevTools

### Environment Variables Not Working

1. Secrets must be set via `wrangler secret put` (not in `wrangler.jsonc`)
2. Vars can be set in `wrangler.jsonc` or via `wrangler secret put`
3. Restart worker after setting new environment variables

## Migration from Single Worker

If you're migrating from the single worker setup:

1. Keep the old `workers/app.ts` and `wrangler.jsonc` for reference
2. Deploy backend first (Step 1)
3. Update frontend config with backend URL
4. Deploy frontend (Step 2)
5. Test both workers
6. Once verified, you can remove the old single worker files

## Notes

- Both workers are independent and can be deployed separately
- Backend worker handles all `/api/*` routes
- Frontend worker handles all other routes (React Router)
- API client automatically uses `BACKEND_URL` from environment
- CORS is configured automatically based on `FRONTEND_URL` in backend


