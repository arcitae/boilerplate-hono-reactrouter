import type { Context, Next } from "hono";
import { clerkMiddleware as honoClerkMiddleware, getAuth } from "@hono/clerk-auth";
import { env } from "hono/adapter";
import { HTTPException } from "hono/http-exception";
import type { AppContext } from "../types/context.js";
import type { Env } from "../types/env.js";
import type { ClerkUser } from "../types/context.js";

/**
 * Get Clerk secret key from environment
 * Supports both Cloudflare Workers (c.env) and Node.js (process.env)
 */
function getClerkSecretKey(c: Context<AppContext>): string {
  // Get environment variables from Hono context
  // Fallback to process.env if context doesn't have env (e.g., when called from React Router dev server)
  let envVars: Env = {};
  try {
    envVars = env<Env>(c) || {};
  } catch {
    // If env() fails, use empty object and fall back to process.env
  }
  
  if (envVars.CLERK_SECRET_KEY) {
    return envVars.CLERK_SECRET_KEY;
  }

  // Fallback to process.env for Node.js/local development
  if (typeof process !== "undefined" && process.env?.CLERK_SECRET_KEY) {
    return process.env.CLERK_SECRET_KEY;
  }

  throw new Error("CLERK_SECRET_KEY must be set in environment variables");
}

/**
 * Get Clerk publishable key from environment
 * Supports both Cloudflare Workers (c.env) and Node.js (process.env)
 * Uses VITE_CLERK_PUBLISHABLE_KEY for both frontend and backend (same value)
 * Falls back to CLERK_PUBLISHABLE_KEY for backward compatibility
 */
function getClerkPublishableKey(c: Context<AppContext>): string {
  // Get environment variables from Hono context
  // Fallback to process.env if context doesn't have env (e.g., when called from React Router dev server)
  let envVars: Env = {};
  try {
    envVars = env<Env>(c) || {};
  } catch {
    // If env() fails, use empty object and fall back to process.env
  }
  
  // Prefer VITE_CLERK_PUBLISHABLE_KEY (used by both frontend and backend)
  if (envVars.VITE_CLERK_PUBLISHABLE_KEY) {
    return envVars.VITE_CLERK_PUBLISHABLE_KEY;
  }
  
  // Fallback to CLERK_PUBLISHABLE_KEY for backward compatibility
  if (envVars.CLERK_PUBLISHABLE_KEY) {
    return envVars.CLERK_PUBLISHABLE_KEY;
  }

  // Fallback to process.env for Node.js/local development
  if (typeof process !== "undefined" && process.env) {
    // Try VITE_CLERK_PUBLISHABLE_KEY first (preferred)
    if (process.env.VITE_CLERK_PUBLISHABLE_KEY) {
      return process.env.VITE_CLERK_PUBLISHABLE_KEY;
    }
    // Fallback to CLERK_PUBLISHABLE_KEY for backward compatibility
    if (process.env.CLERK_PUBLISHABLE_KEY) {
      return process.env.CLERK_PUBLISHABLE_KEY;
    }
  }

  throw new Error("VITE_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY) must be set in environment variables");
}

/**
 * Clerk authentication middleware factory
 * Creates middleware configured with environment-specific keys
 * Note: @hono/clerk-auth requires both secretKey and publishableKey
 * We need to support both Cloudflare Workers (c.env) and Node.js (process.env)
 */
export function createClerkMiddleware(c: Context<AppContext>) {
  const secretKey = getClerkSecretKey(c);
  const publishableKey = getClerkPublishableKey(c);
  
  // Debug logging in development
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[Clerk Middleware] Secret key:", secretKey ? "Present" : "Missing");
    console.log("[Clerk Middleware] Publishable key:", publishableKey ? "Present" : "Missing");
    console.log("[Clerk Middleware] Using VITE_CLERK_PUBLISHABLE_KEY:", process.env.VITE_CLERK_PUBLISHABLE_KEY ? "Yes" : "No");
  }
  
  // Create middleware with explicit keys
  // This ensures it works in both Cloudflare Workers and Node.js
  return honoClerkMiddleware({
    secretKey,
    publishableKey,
  });
}

/**
 * Clerk authentication middleware
 * Verifies JWT tokens and extracts user information
 * 
 * Usage:
 * - Apply to specific routes: app.use('/api/protected/*', clerkAuth)
 * - Or use in route handlers: app.get('/api/users', clerkAuth, handler)
 */
export async function clerkAuth(
  c: Context<AppContext>,
  next: Next
) {
  try {
    // Create and execute Clerk middleware
    const middleware = createClerkMiddleware(c);
    
    return middleware(c, async () => {
      // After Clerk middleware, extract auth info
      const auth = getAuth(c);
      
      if (!auth?.userId) {
        throw new HTTPException(401, {
          message: "Unauthorized: Authentication required",
        });
      }

      // Extract user information from auth token
      const user: ClerkUser = {
        id: auth.userId,
        email: auth.sessionClaims?.email as string | undefined,
        firstName: auth.sessionClaims?.firstName as string | undefined,
        lastName: auth.sessionClaims?.lastName as string | undefined,
        imageUrl: auth.sessionClaims?.imageUrl as string | undefined,
      };

      // Store user info in context
      c.set("user", user);
      c.set("userId", auth.userId);

      // Return the response from next() to propagate it through the middleware chain
      return await next();
    });
  } catch (error) {
    console.error("Clerk authentication error:", error);
    if (error instanceof HTTPException) {
      throw error;
    }

    // Handle Clerk-specific errors
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized") || error.message.includes("Invalid")) {
        throw new HTTPException(401, {
          message: "Unauthorized: Invalid or expired token",
        });
      }
    }

    throw new HTTPException(500, {
      message: "Authentication error",
    });
  }
}

