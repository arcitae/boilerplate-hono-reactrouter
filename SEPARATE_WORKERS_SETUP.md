# Separate Workers Setup Summary

## What Was Changed

The application has been split into two separate Cloudflare Workers:

1. **Backend Worker** (`workers/backend.ts`) - Handles all API routes
2. **Frontend Worker** (`workers/frontend.ts`) - Handles all React Router routes

## New Files Created

### Worker Entry Points
- `workers/backend.ts` - Backend worker entry point (exports Hono app)
- `workers/frontend.ts` - Frontend worker entry point (React Router handler)

### Configuration Files
- `wrangler.backend.jsonc` - Backend worker configuration
- `wrangler.frontend.jsonc` - Frontend worker configuration

### Documentation
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `SEPARATE_WORKERS_SETUP.md` - This file

## Modified Files

### API Client
- `app/frontend/lib/api-client.ts`
  - Updated to use `BACKEND_URL` from environment variables
  - Removed direct backend app import (no longer available in separate workers)
  - Now makes HTTP requests to backend worker URL

### Environment Types
- `app/backend/types/env.ts`
  - Added `BACKEND_URL` to `Env` type

### Package Scripts
- `package.json`
  - Added `deploy:backend` - Deploy backend worker only
  - Added `deploy:frontend` - Build and deploy frontend worker only
  - Added `deploy:all` - Deploy both workers

## Key Changes

### 1. API Client Architecture

**Before** (Single Worker):
- Server-side: Direct backend app fetch (no HTTP)
- Client-side: HTTP requests to same origin

**After** (Separate Workers):
- Server-side: HTTP requests to `BACKEND_URL`
- Client-side: HTTP requests to `BACKEND_URL`

### 2. Environment Variables

**Backend Worker** needs:
- `FRONTEND_URL` - For CORS configuration
- `DATABASE_URL` - PostgreSQL connection
- `CLERK_SECRET_KEY` - Authentication
- Other service API keys

**Frontend Worker** needs:
- `BACKEND_URL` - Backend worker URL (for API calls)
- `CLERK_PUBLISHABLE_KEY` - Authentication
- `POSTHOG_KEY` - Analytics (optional)

### 3. CORS Configuration

Backend CORS is already configured to use `FRONTEND_URL` from environment:
- Located in `app/backend/middleware/config.ts`
- Automatically allows requests from frontend worker URL
- Credentials enabled for authenticated requests

## Deployment Workflow

1. **Deploy Backend First**:
   ```bash
   npm run deploy:backend
   ```
   - Get the backend worker URL: `https://panya-backend.<subdomain>.workers.dev`

2. **Update Frontend Config**:
   - Set `BACKEND_URL` in `wrangler.frontend.jsonc` to backend worker URL

3. **Deploy Frontend**:
   ```bash
   npm run deploy:frontend
   ```

4. **Update Backend CORS** (if needed):
   - Set `FRONTEND_URL` secret in backend to frontend worker URL

## Development

For local development, you can still use the single worker setup:
- Keep `workers/app.ts` and `wrangler.jsonc` for local dev
- Or run backend and frontend separately with different ports

## Migration Notes

- The original `workers/app.ts` is still available for single-worker deployments
- Both deployment methods are supported
- Choose based on your needs:
  - **Single Worker**: Simpler, single deployment, same origin
  - **Separate Workers**: Independent scaling, separate domains, better isolation

## Next Steps

1. Review `DEPLOYMENT_GUIDE.md` for detailed deployment instructions
2. Set up environment variables (secrets) for both workers
3. Deploy backend worker first
4. Update frontend config with backend URL
5. Deploy frontend worker
6. Test both workers
7. Configure custom domains (optional)


