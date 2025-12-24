# Architecture: Separate Frontend and Backend Workers

This project uses a **two-worker architecture** with separate Cloudflare Workers for frontend and backend.

## Architecture Overview

```
┌─────────────────────┐         HTTP         ┌─────────────────────┐
│  Frontend Worker    │ ───────────────────> │  Backend Worker     │
│  (React Router)     │   API Requests       │  (Hono)             │
│                     │ <─────────────────── │                     │
│  - Handles UI       │      JSON Responses  │  - Handles /api/*   │
│  - SSR/CSR          │                       │  - Database access   │
│  - Static assets    │                       │  - Business logic   │
└─────────────────────┘                       └─────────────────────┘
```

## Benefits

1. **Independent Scaling**: Frontend and backend can scale independently
2. **Technology Flexibility**: Backend can be moved to containers/other platforms without affecting frontend
3. **Clean Separation**: Clear boundaries between frontend and backend
4. **Simpler Development**: No complex integration code, just HTTP requests
5. **Easier Debugging**: Each worker can be tested independently

## File Structure

```
workers/
├── backend.ts          # Backend worker entry point
└── frontend.ts         # Frontend worker entry point

wrangler.backend.toml   # Backend worker configuration
wrangler.frontend.toml  # Frontend worker configuration

app/
├── frontend/           # React Router frontend code
│   ├── entry.server.tsx
│   ├── lib/
│   │   └── api-client.ts  # HTTP client for backend API
│   └── ...
└── backend/            # Hono backend code
    ├── index.ts
    ├── routes/
    └── ...
```

## Development

### Local Development

**Option 1: Run both workers separately (recommended)**
```bash
# Terminal 1: Start backend worker
npm run dev:backend

# Terminal 2: Start frontend dev server
npm run dev:frontend
```

**Option 2: Run both together**
```bash
npm run dev:all
```

The frontend dev server (React Router) will proxy `/api/*` requests to the backend worker at `http://localhost:8787`.

### Environment Variables

**Backend Worker** (`wrangler.backend.toml`):
- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` - Clerk authentication secret
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- Other API keys (OpenAI, Deepgram, etc.)

**Frontend Worker** (`wrangler.frontend.toml`):
- `BACKEND_URL` - Backend worker URL (for server-side requests)
- `VITE_BACKEND_URL` - Backend worker URL (for client-side requests)
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key

## Deployment

### Deploy Both Workers

```bash
# Deploy backend first
npm run deploy:backend

# Update wrangler.frontend.toml with backend worker URL
# Then deploy frontend
npm run deploy:frontend

# Or deploy both at once
npm run deploy:all
```

### Update Backend URL

After deploying the backend worker, update `wrangler.frontend.toml`:

```toml
[vars]
BACKEND_URL = "https://your-backend-worker.your-subdomain.workers.dev"
VITE_BACKEND_URL = "https://your-backend-worker.your-subdomain.workers.dev"
```

## API Client

The frontend uses a type-safe API client (`app/frontend/lib/api-client.ts`) that:

- **Client-side**: Makes HTTP requests to `VITE_BACKEND_URL`
- **Server-side**: Makes HTTP requests to `BACKEND_URL`
- Uses Hono's `hc<AppType>` for full type safety

Example usage:
```typescript
import { apiClient } from "@frontend/lib/api-client";

const client = apiClient();
const res = await client.api.posts.$get({ query: { page: "1" } });
const data = await res.json();
```

## CORS Configuration

The backend worker is configured to allow requests from the frontend worker origin. CORS settings are in `app/backend/middleware/config.ts`.

## Future Migration

If you need to move the backend to containers or another platform:

1. Update `BACKEND_URL` and `VITE_BACKEND_URL` in `wrangler.frontend.toml`
2. No changes needed to frontend code
3. Backend remains a standard Hono application
