import type { Context, Next } from "hono";
import { requestId } from "hono/request-id";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import type { AppContext } from "../types/context.js";
import type { MiddlewareConfig } from "./config.js";
import { createSecureHeadersMiddleware } from "./security.js";

/**
 * Base/Basic Middleware
 * 
 * Contains simple, configuration-based middleware:
 * - Request ID (for tracing)
 * - CORS (cross-origin requests)
 * - Security Headers (HTTP security headers)
 * - Compression (response compression)
 * 
 * These are grouped together as they are straightforward,
 * configuration-driven middleware without complex logic.
 */

/**
 * Create request ID middleware
 * Generates unique ID for each request (for tracing)
 * 
 * Supports platform-specific request IDs:
 * - Cloudflare Workers: Uses CF-Ray-ID if available
 * - AWS Lambda: Uses Lambda request ID if available
 * - Default: Generates UUID
 */
export function createRequestIdMiddleware(
  config: MiddlewareConfig["requestId"]
) {
  if (!config.enabled) {
    // Return no-op middleware if disabled
    return async (c: Context<AppContext>, next: Next) => {
      return next();
    };
  }

  return requestId({
    headerName: config.headerName,
  });
}

/**
 * Create CORS middleware
 * Handles cross-origin requests
 * 
 * Note: CORS middleware needs context to determine origin dynamically
 * 
 * Features:
 * - Dynamic origin configuration
 * - Support for multiple origins
 * - Credentials support
 * - Configurable methods and headers
 */
export function createCorsMiddleware(
  config: MiddlewareConfig["cors"]
): (c: Context<AppContext>) => ReturnType<typeof cors> {
  if (!config.enabled) {
    // Return no-op middleware factory if disabled
    return () => {
      return async (c: Context<AppContext>, next: Next) => {
        return next();
      };
    };
  }

  // Return a function that creates the middleware with context
  return (c: Context<AppContext>) => {
    // Handle dynamic origin function
    const origin = config.origin;
    if (typeof origin === "function") {
      // For dynamic origins, create middleware with function
      return cors({
        origin: (originHeader: string) => {
          const result = origin(originHeader, c);
          return typeof result === "string" ? result : originHeader;
        },
        credentials: config.credentials,
        allowMethods: config.allowMethods,
        allowHeaders: config.allowHeaders,
        exposeHeaders: config.exposeHeaders,
        maxAge: config.maxAge,
      });
    }

    // Handle string or string[] origin
    return cors({
      origin: origin || "*",
      credentials: config.credentials,
      allowMethods: config.allowMethods,
      allowHeaders: config.allowHeaders,
      exposeHeaders: config.exposeHeaders,
      maxAge: config.maxAge,
    });
  };
}

/**
 * Create secure headers middleware factory
 * Adds security headers to responses
 * 
 * Returns a function that creates the middleware with context
 * 
 * Security headers include:
 * - Content Security Policy (CSP)
 * - HSTS (HTTP Strict Transport Security)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - And more...
 */
export function createSecureHeadersMiddlewareFactory(
  config: MiddlewareConfig["secureHeaders"]
): (c: Context<AppContext>) => ReturnType<typeof createSecureHeadersMiddleware> {
  if (!config.enabled) {
    // Return no-op middleware factory if disabled
    return () => {
      return async (c: Context<AppContext>, next: Next) => {
        return next();
      };
    };
  }

  // The secure headers middleware needs context to determine environment
  // So we return a function that creates the middleware
  return (c: Context<AppContext>) => {
    return createSecureHeadersMiddleware(c);
  };
}

/**
 * Create compression middleware
 * Compresses response bodies
 * 
 * Note: Cloudflare Workers auto-compress, so this is mainly for Node.js
 * 
 * Features:
 * - Gzip/deflate encoding
 * - Configurable threshold
 * - Runtime detection (auto-disable for Cloudflare Workers)
 */
export function createCompressMiddleware(config: MiddlewareConfig["compress"]) {
  if (!config.enabled) {
    // Return no-op middleware if disabled
    return async (c: Context<AppContext>, next: Next) => {
      return next();
    };
  }

  return compress({
    encoding: config.encoding,
    threshold: config.threshold,
  });
}
