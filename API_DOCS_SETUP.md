# API Documentation Setup

## Overview

Auto-generated API documentation using `@rcmade/hono-docs` and Swagger UI. The OpenAPI specification is automatically generated from Hono route type definitions.

## Setup

### 1. Configuration File

The configuration is in `hono-docs.ts` at the project root. It defines:
- OpenAPI metadata (title, version, description)
- API route groups (Health, Users, Posts)
- Route metadata (summary, description, tags)

### 2. Generate Documentation

Run the following command to generate the OpenAPI specification:

```bash
npm run docs:generate
```

This will:
- Read route type definitions from `app/backend/routes/*.ts`
- Generate OpenAPI 3.0 specification
- Save to `openapi/openapi.json`

### 3. View Documentation

Once generated, view the documentation at:
- **Swagger UI**: `http://localhost:5173/api/docs` or `http://localhost:5173/api/docs/ui`
- **OpenAPI JSON**: `http://localhost:5173/api/docs/openapi`

## Route Requirements

For auto-generation to work, each route file must:

1. **Export AppType**: Export `export type AppType = typeof routeVariable;`
   ```typescript
   const users = new Hono<AppContext>()...
   export default users;
   export type AppType = typeof users; // Required!
   ```

2. **Use Type-Safe Patterns**: Use Zod validators and proper TypeScript types

3. **Define Routes**: Routes should be defined using Hono's routing methods

## Adding New Routes

To add a new route group to the documentation:

1. **Create Route File**: Create `app/backend/routes/your-route.ts`
   ```typescript
   const yourRoute = new Hono<AppContext>()
     .get("/", ...)
     .post("/", ...);
   
   export default yourRoute;
   export type AppType = typeof yourRoute;
   ```

2. **Update hono-docs.ts**: Add route group to `apis` array
   ```typescript
   {
     name: "Your Route Group",
     apiPrefix: "/your-route",
     appTypePath: "app/backend/routes/your-route.ts",
     api: [
       {
         api: "/",
         method: "get",
         summary: "Get items",
         description: "Retrieve all items",
         tag: ["YourTag"],
       },
       // ... more routes
     ],
   }
   ```

3. **Mount Route**: Add to `app/backend/routes/index.ts`
   ```typescript
   import yourRoute from "./your-route.js";
   
   const apiRoutes = new Hono<AppContext>()
     .route("/your-route", yourRoute);
   ```

4. **Regenerate Docs**: Run `npm run docs:generate`

## Swagger UI Features

- **Interactive Testing**: Test API endpoints directly from the UI
- **Request/Response Examples**: See example requests and responses
- **Authentication**: Supports Bearer token authentication (persisted)
- **Schema Validation**: View request/response schemas

## Combine Middleware

The project includes utilities for conditional middleware using Hono's `combine` middleware:

### Conditional Auth
```typescript
import { createConditionalAuth } from "./middleware/combine";

// Skip auth for public routes
app.use("/api/*", createConditionalAuth("/api/public/*"));
```

### Auth OR Rate Limit
```typescript
import { createAuthOrRateLimit } from "./middleware/combine";

// If authenticated, skip rate limiting
app.use("/api/*", createAuthOrRateLimit(rateLimitMiddleware));
```

### Auth AND Additional Check
```typescript
import { createAuthAndCheck } from "./middleware/combine";

// Require both auth AND IP whitelist
app.use("/api/admin/*", createAuthAndCheck(ipWhitelistMiddleware));
```

## Files

- `hono-docs.ts` - Configuration for auto-generation
- `openapi/openapi.json` - Generated OpenAPI specification (gitignored)
- `app/backend/routes/docs.ts` - Documentation routes (serves Swagger UI)
- `app/backend/middleware/combine.ts` - Combine middleware utilities

## Workflow

1. **Development**: Add/modify routes in `app/backend/routes/*.ts`
2. **Update Config**: Update `hono-docs.ts` with route metadata
3. **Generate**: Run `npm run docs:generate`
4. **View**: Check Swagger UI at `/api/docs`
5. **Commit**: Commit changes (but not `openapi/openapi.json` - it's generated)

## Notes

- The OpenAPI spec is auto-generated, so manual edits will be overwritten
- Route metadata (summary, description, tags) is defined in `hono-docs.ts`
- The Swagger UI automatically loads the latest generated spec
- If the spec file doesn't exist, a fallback structure is shown with a message to run generation
