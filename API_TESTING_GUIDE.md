# API Testing Guide

This guide explains how to test the Panya API endpoints.

## Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:5173` (or the port shown in your terminal).

### 2. Seed the Database

Before testing, seed the database with sample data:

```bash
npm run db:seed
```

This will create:
- 2 users (Alice and Bob)
- 3 posts (2 for Alice, 1 for Bob)

## Testing Methods

### Method 1: Using the Frontend (Recommended)

The easiest way to test the API is through the frontend:

1. **View Users**: Navigate to `http://localhost:5173/users`
   - Shows all users with their posts
   - Includes pagination

2. **View Posts**: Navigate to `http://localhost:5173/posts`
   - Shows all posts with their authors
   - Includes pagination

3. **API Documentation**: Navigate to `http://localhost:5173/api/docs`
   - Interactive Swagger UI
   - Test endpoints directly from the browser

### Method 2: Using cURL

#### Health Check (No Auth Required)

```bash
# Basic health check
curl http://localhost:5173/api/health

# Readiness check (includes database)
curl http://localhost:5173/api/health/ready

# Liveness check
curl http://localhost:5173/api/health/live
```

#### Get Users (Auth Required)

```bash
# Get all users (requires authentication)
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  http://localhost:5173/api/users

# With pagination
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  "http://localhost:5173/api/users?page=1&limit=10"

# Get user by ID
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  http://localhost:5173/api/users/1
```

#### Create User (Auth Required)

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}' \
  http://localhost:5173/api/users
```

#### Get Posts (Auth Required)

```bash
# Get all posts
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  http://localhost:5173/api/posts

# Get post by ID
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  http://localhost:5173/api/posts/1
```

#### Create Post (Auth Required)

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"My New Post",
    "content":"This is the content",
    "published":true,
    "authorId":1
  }' \
  http://localhost:5173/api/posts
```

### Method 3: Using Swagger UI

1. Navigate to `http://localhost:5173/api/docs`
2. Click on any endpoint to expand it
3. Click "Try it out"
4. Fill in the parameters
5. Click "Execute"
6. View the response

**Note**: For authenticated endpoints, you'll need to:
1. Sign in through the frontend first
2. Get your Clerk token from the browser's developer tools
3. Add it to the Swagger UI authorization

### Method 4: Using Postman or Insomnia

1. Import the OpenAPI spec from `http://localhost:5173/api/docs/openapi`
2. Set up environment variables:
   - `base_url`: `http://localhost:5173`
   - `auth_token`: Your Clerk JWT token
3. Use the collection to test all endpoints

### Method 5: Using the Frontend API Client (Type-Safe)

In your React Router loaders/actions, use the type-safe client:

```typescript
import { apiClient } from "../lib/api-client.js";

// In a loader
export async function loader({ request }: Route.LoaderArgs) {
  const res = await apiClient.api.users.$get();
  const data = await res.json(); // Fully typed!
  return { users: data.data };
}
```

## Getting Your Clerk Token

To test authenticated endpoints, you need a Clerk JWT token:

### Option 1: From Browser DevTools

1. Sign in through the frontend
2. Open browser DevTools (F12)
3. Go to Application/Storage → Local Storage
4. Look for Clerk session token
5. Or check Network tab → Headers → Authorization

### Option 2: From Clerk Dashboard

1. Go to your Clerk Dashboard
2. Navigate to Users
3. Select a user
4. Generate a session token for testing

### Option 3: Programmatically (for testing)

```typescript
import { getAuth } from "@clerk/react-router/server";

// In a React Router loader
export async function loader({ request }: Route.LoaderArgs) {
  const auth = getAuth(request);
  const token = auth.getToken();
  // Use token in API calls
}
```

## Testing Without Authentication

For development/testing, you can temporarily remove the `clerkAuth` middleware from routes:

```typescript
// In app/backend/routes/users.ts
// Change from:
.get("/", clerkAuth, zValidator(...), handler)

// To:
.get("/", zValidator(...), handler)
```

**Warning**: Only do this for local development. Never deploy without authentication.

## API Endpoints Summary

### Health Endpoints (No Auth)
- `GET /api/health` - Basic health check
- `GET /api/health/ready` - Readiness check (with DB)
- `GET /api/health/live` - Liveness check

### User Endpoints (Auth Required)
- `GET /api/users` - List all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Post Endpoints (Auth Required)
- `GET /api/posts` - List all posts (with pagination)
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Documentation Endpoints (No Auth)
- `GET /api/docs` - Swagger UI
- `GET /api/docs/openapi` - OpenAPI JSON spec

## Example Test Scripts

### Test All Health Endpoints

```bash
#!/bin/bash
BASE_URL="http://localhost:5173/api"

echo "Testing Health Endpoints..."
echo ""

echo "1. Health Check:"
curl -s "$BASE_URL/health" | jq
echo ""

echo "2. Readiness Check:"
curl -s "$BASE_URL/health/ready" | jq
echo ""

echo "3. Liveness Check:"
curl -s "$BASE_URL/health/live" | jq
```

### Test Users Endpoints (with auth)

```bash
#!/bin/bash
BASE_URL="http://localhost:5173/api"
TOKEN="YOUR_CLERK_TOKEN"

echo "Testing Users Endpoints..."
echo ""

echo "1. Get All Users:"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/users" | jq
echo ""

echo "2. Get User by ID:"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/users/1" | jq
echo ""

echo "3. Create User:"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","name":"New User"}' \
  "$BASE_URL/users" | jq
```

## Troubleshooting

### "Unauthorized" Errors

- Make sure you're signed in through the frontend
- Verify your Clerk token is valid
- Check that `CLERK_SECRET_KEY` is set in your environment

### "Database connection" Errors

- Verify `DATABASE_URL` is set correctly
- Check that the database is running
- For Prisma Accelerate, verify `PRISMA_ACCELERATE_URL` is set

### "Route not found" Errors

- Make sure the server is running
- Verify the route path is correct (should start with `/api/`)
- Check that the route is registered in `app/backend/routes/index.ts`

### TypeScript Errors in Frontend

- Run `npm run typecheck` to see all errors
- Make sure `AppType` is exported from `app/backend/index.ts`
- Verify the API client is using the correct type: `hc<AppType>`

## Next Steps

1. **Add more tests**: Create integration tests using Vitest
2. **Add request validation**: Test edge cases and invalid inputs
3. **Add rate limiting**: Test API rate limits
4. **Monitor performance**: Use OpenTelemetry to track API performance
