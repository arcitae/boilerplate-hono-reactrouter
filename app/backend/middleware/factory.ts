import type { Context, Next } from "hono";
import type { AppContext } from "../types/context.js";
import type { MiddlewareConfig } from "./config.js";

// Import from grouped middleware files
import {
  createRequestIdMiddleware,
  createCorsMiddleware,
  createSecureHeadersMiddlewareFactory,
  createCompressMiddleware,
} from "./base.js";

import { createLoggerMiddleware } from "./logger.js";
import { createTelemetryMiddleware } from "./telemetry.js";

/**
 * Middleware Factory
 * 
 * Orchestrates middleware creation from grouped modules:
 * - Base middleware (Request ID, CORS, Security Headers, Compression)
 * - Logger middleware (Enhanced logging)
 * - Telemetry middleware (Traces, Metrics)
 * 
 * This file acts as a coordinator that imports from the grouped
 * middleware files and provides the `applyMiddleware` function.
 */

// Re-export factory functions for backward compatibility
export {
  createRequestIdMiddleware,
  createCorsMiddleware,
  createSecureHeadersMiddlewareFactory,
  createCompressMiddleware,
} from "./base.js";

export { createLoggerMiddleware } from "./logger.js";
export { createTelemetryMiddleware } from "./telemetry.js";

/**
 * Apply all middleware to Hono app
 * Centralized middleware setup with configuration
 * 
 * This function applies middleware in the correct order:
 * 1. Request ID (for tracing)
 * 2. Logger (needs request ID)
 * 3. OpenTelemetry (needs request ID)
 * 4. CORS (handles cross-origin)
 * 5. Secure Headers (security)
 * 6. Compression (response compression)
 * 
 * Usage:
 * ```ts
 * import { Hono } from "hono";
 * import { applyMiddleware, getMiddlewareConfig } from "./middleware/factory";
 * 
 * const app = new Hono<AppContext>();
 * // Get config from a request context (or use default)
 * const config = getMiddlewareConfig();
 * applyMiddleware(app, config);
 * ```
 */
export function applyMiddleware(
  app: any, // Hono app instance (using any to avoid circular type dependencies)
  config: MiddlewareConfig
) {
  // 1. Request ID - Generate unique ID first (for tracing)
  app.use("*", createRequestIdMiddleware(config.requestId));

  // 2. Logger - Log all requests (needs request ID)
  app.use("*", createLoggerMiddleware(config.logger));

  // 3. OpenTelemetry - Start distributed tracing (needs request ID)
  app.use("*", createTelemetryMiddleware(config.telemetry));

  // 4. CORS - Handle cross-origin requests
  // Note: CORS needs context, so we apply it dynamically
  // Explicitly await to ensure proper error propagation through the middleware chain
  app.use("*", async (c: Context<AppContext>, next: Next) => {
    const corsFactory = createCorsMiddleware(config.cors);
    const corsMiddleware = corsFactory(c);
    return await corsMiddleware(c, next);
  });

  // 5. Secure Headers - Add security headers
  // Explicitly await to ensure proper error propagation through the middleware chain
  app.use("*", async (c: Context<AppContext>, next: Next) => {
    const secureHeadersFactory = createSecureHeadersMiddlewareFactory(
      config.secureHeaders
    );
    const secureHeadersMiddleware = secureHeadersFactory(c);
    return await secureHeadersMiddleware(c, next);
  });

  // 6. Compression - Compress responses (if enabled)
  // Note: Cloudflare Workers auto-compress, so this is mainly for Node.js
  app.use("*", createCompressMiddleware(config.compress));
}
