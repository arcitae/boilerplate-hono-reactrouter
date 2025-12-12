# Authentication Debugging Guide

## Current Implementation

### How Authentication Works

1. **Frontend Loader** (`app/frontend/routes/users.tsx` or `posts.tsx`):
   - Uses `getAuth(args)` from `@clerk/react-router/server` to get auth state
   - Extracts token using `auth.getToken()`
   - Passes token in `Authorization: Bearer <token>` header to API client

2. **API Client** (`app/frontend/lib/api-client.ts`):
   - Server-side: Uses custom `serverFetch` that calls backend app directly
   - Headers (including Authorization) are preserved and passed to backend

3. **Backend Middleware** (`app/backend/middleware/clerk.ts`):
   - `clerkAuth` middleware verifies the JWT token
   - Extracts user info and stores in context
   - Throws 401 if token is missing or invalid

## Testing Authentication

### 1. Check if User is Signed In

Navigate to `/users` or `/posts`. If not signed in, you should be redirected to `/sign-in`.

### 2. Verify Token is Being Passed

Add console logs to debug:

```typescript
// In loader
const auth = await getAuth(args);
console.log("Auth state:", { userId: auth.userId, isAuthenticated: auth.userId !== null });
const token = await auth.getToken();
console.log("Token:", token ? "Present" : "Missing");
```

### 3. Check Backend Logs

The backend should log requests. Check for:
- 401 errors (unauthorized)
- 500 errors (authentication error)

### 4. Test with cURL

```bash
# First, sign in through the browser and get your token
# Then test the API directly:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5173/api/users
```

## Common Issues

### Issue: "Unauthorized: Authentication required"

**Cause**: Token is not being passed or is invalid

**Solutions**:
1. Make sure you're signed in through the frontend
2. Check that `getAuth(args)` is returning a valid auth state
3. Verify `auth.getToken()` returns a token
4. Check that headers are being passed correctly in the API client

### Issue: "Authentication error" (500)

**Cause**: Clerk middleware is failing to verify the token

**Solutions**:
1. Verify `CLERK_SECRET_KEY` is set in environment variables
2. Check that the token format is correct (Bearer token)
3. Ensure Clerk keys match between frontend and backend

### Issue: Token is null

**Cause**: User is not authenticated or session expired

**Solutions**:
1. Sign in through the frontend
2. Check Clerk session is valid
3. Verify Clerk is properly configured

## Debugging Steps

1. **Check Environment Variables**:
   ```bash
   # Make sure these are set in .env.local
   CLERK_SECRET_KEY=sk_...
   VITE_CLERK_PUBLISHABLE_KEY=pk_...
   ```

2. **Add Debug Logging**:
   ```typescript
   // In loader
   console.log("Auth:", await getAuth(args));
   console.log("Token:", await (await getAuth(args)).getToken());
   ```

3. **Check Network Tab**:
   - Open browser DevTools
   - Go to Network tab
   - Check if Authorization header is present in requests

4. **Test Backend Directly**:
   ```bash
   # Test health endpoint (no auth)
   curl http://localhost:5173/api/health
   
   # Test users endpoint (requires auth)
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5173/api/users
   ```

## Next Steps

Once authentication is working:
1. Remove debug logging
2. Add proper error handling for auth failures
3. Implement token refresh if needed
4. Add rate limiting for authenticated endpoints
