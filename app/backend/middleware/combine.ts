import { some, every, except } from "hono/combine";
import type { Context, Next } from "hono";
import type { AppContext } from "../types/context.js";
import { clerkAuth } from "./clerk.js";

/**
 * Combine Middleware Utilities
 * 
 * Provides utilities for conditional middleware application using Hono's combine middleware.
 * Useful for complex access control rules, conditional authentication, etc.
 * 
 * @see https://hono.dev/docs/middleware/builtin/combine
 */

/**
 * Create conditional auth middleware
 * Applies authentication only when condition is not met
 * 
 * Example: Skip auth for public routes
 * ```ts
 * app.use('/api/*', createConditionalAuth('/api/public/*'));
 * ```
 */
export function createConditionalAuth(
  publicPaths: string | string[]
): ReturnType<typeof except> {
  return except(publicPaths, clerkAuth);
}

/**
 * Create conditional middleware that applies auth OR rate limiting
 * If client has valid token, skip rate limiting
 * Otherwise, apply rate limiting
 * 
 * Example usage:
 * ```ts
 * app.use('/api/*', createAuthOrRateLimit(rateLimitMiddleware));
 * ```
 */
export function createAuthOrRateLimit(
  rateLimitMiddleware: (c: Context<AppContext>, next: Next) => Promise<Response>
) {
  return some(clerkAuth, rateLimitMiddleware);
}

/**
 * Create middleware that requires both auth AND additional checks
 * All middleware must pass for request to continue
 * 
 * Example: Require auth AND IP whitelist
 * ```ts
 * app.use('/api/admin/*', createAuthAndCheck(ipWhitelistMiddleware));
 * ```
 */
export function createAuthAndCheck(
  additionalMiddleware: (c: Context<AppContext>, next: Next) => Promise<Response>
) {
  return every(clerkAuth, additionalMiddleware);
}

/**
 * Re-export combine utilities for direct use
 */
export { some, every, except } from "hono/combine";
