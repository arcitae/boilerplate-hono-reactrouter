# Project Architecture

This document describes the codebase organization and structure.

## Folder Structure

```
app/
├── root.tsx           # React Router root (re-exports from frontend/root.tsx)
├── entry.server.tsx   # SSR entry (re-exports from frontend/entry.server.tsx)
├── routes.ts          # Route configuration
│
├── frontend/          # React Router frontend code
│   ├── routes/        # React Router route files
│   ├── components/    # React components
│   ├── root.tsx       # Root layout component (actual implementation)
│   ├── entry.server.tsx  # SSR entry point (actual implementation)
│   └── app.css        # Global styles
│
├── backend/           # Hono API backend code
│   ├── routes/        # API route handlers
│   ├── middleware/    # Hono middleware
│   ├── services/      # Business logic
│   ├── schemas/       # Zod validation schemas
│   ├── lib/           # Backend utilities (Prisma, etc.)
│   └── index.ts       # Main Hono app (exports AppType)
│
└── shared/            # Shared code (types, utilities)
    └── (shared code that both frontend and backend can use)

workers/
└── app.ts             # Cloudflare Worker entry point
```

**Note:** React Router requires `root.tsx`, `entry.server.tsx`, and `routes.ts` at the `app/` root level. These files are thin wrappers that re-export from `app/frontend/` to maintain our folder structure while satisfying React Router's requirements.

## Path Aliases

The project uses path aliases for clean imports:

- `@frontend/*` → `app/frontend/*`
- `@backend/*` → `app/backend/*`
- `@shared/*` → `app/shared/*`

### Usage Examples

**Frontend:**
```typescript
import { Header } from "@frontend/components/Header";
import { someUtil } from "@shared/utils";
```

**Backend:**
```typescript
import { prisma } from "@backend/lib/prisma";
import { validateUser } from "@shared/validation";
```

**Shared:**
```typescript
// Can import from shared in both frontend and backend
import { UserType } from "@shared/types";
```

## Code Isolation

### ✅ Frontend Code (`app/frontend/`)
- React components and pages
- React Router routes and loaders
- Client-side state management
- UI components

**Rules:**
- ✅ Can import from `@shared/*`
- ✅ Can import from `@frontend/*`
- ❌ **NEVER** import from `@backend/*`
- ❌ No direct database access
- ❌ No server-only APIs

### ✅ Backend Code (`app/backend/`)
- Hono API routes
- Database operations (Prisma)
- Business logic
- Server-side middleware

**Rules:**
- ✅ Can import from `@shared/*`
- ✅ Can import from `@backend/*`
- ❌ **NEVER** import from `@frontend/*`
- ✅ All database operations happen here
- ✅ All API endpoints defined here

### ✅ Shared Code (`app/shared/`)
- Type definitions
- Utility functions
- Validation schemas (Zod)
- Constants

**Rules:**
- ✅ Must be safe for both browser and server
- ❌ No backend-specific code (database, file system)
- ❌ No frontend-specific code (React components, browser APIs)

## Build Configuration

### Vite Configuration
- Path aliases configured in `vite.config.ts`
- Backend code excluded from client bundle
- Frontend code properly isolated

### TypeScript Configuration
- Path aliases configured in `tsconfig.cloudflare.json`
- Proper type checking for all aliases

## Development Workflow

1. **Frontend Development**: Work in `app/frontend/`
2. **Backend Development**: Work in `app/backend/`
3. **Shared Code**: Add to `app/shared/` when needed by both

## API Communication

Frontend communicates with backend through:
1. React Router loaders/actions (server-side)
2. Type-safe API calls using `hc<AppType>` client
3. Backend exports `AppType` from `app/backend/index.ts`

Example:
```typescript
// Frontend loader
import { AppType } from "@backend/index";
import { hc } from "hono/client";

const client = hc<AppType>(process.env.API_URL);
const res = await client.api.users.$get();
```

## Important Notes

- **Backend code is excluded from browser bundle** via Vite configuration
- **Type safety** is maintained through TypeScript path aliases
- **Clear separation** prevents accidental code leakage
- **Shared code** must be environment-agnostic

