// Note: dotenv is NOT imported here because:
// 1. In Cloudflare Workers: Wrangler automatically loads .env files
// 2. In Node.js: Can be loaded separately if needed
// 3. dotenv uses Node.js file system APIs that don't work in Workers
// If you need dotenv for Node.js-only code, import it conditionally there

import { Hono } from "hono";
import type { AppContext } from "./types/context.js";

// Import middleware (using centralized registry)
import withPrisma from "./lib/prisma.js";
import {
  applyMiddleware,
  getMiddlewareConfig,
  errorHandler,
  notFoundHandler,
} from "./middleware/index.js";

// Import routes
import apiRoutes from "./routes/index.js";

/**
 * Main Hono application
 * All middleware is applied in the correct order for proper execution
 * 
 * Middleware order (applied via applyMiddleware):
 * 1. Request ID - Generate unique ID first (for tracing)
 * 2. Logger - Log all requests (needs request ID)
 * 3. OpenTelemetry - Start distributed tracing (needs request ID)
 * 4. CORS - Handle cross-origin requests
 * 5. Secure Headers - Add security headers
 * 6. Compression - Compress responses (disabled for Cloudflare Workers)
 */
const app = new Hono<AppContext>();

// Apply middleware using centralized factory
// Configuration is environment-aware (dev vs prod)
// Note: We use a default config here, but middleware factories
// will get actual context when requests come in
const middlewareConfig = getMiddlewareConfig();
applyMiddleware(app, middlewareConfig);

// 7. Prisma middleware - Inject Prisma client into context
// Applied globally so all routes have access to database
// This is after other middleware but before routes
app.use("*", withPrisma);

// 8. Error handler - Must be before routes to catch errors
app.onError((err, c) => {
  return errorHandler(c, async () => {
    throw err;
  });
});

// API routes - All routes under /api prefix
app.route("/api", apiRoutes);

// 404 handler - Must be last (after all routes)
app.notFound(notFoundHandler);

// Export AppType for type-safe RPC client
// This allows frontend to use hc<AppType> for type-safe API calls
export type AppType = typeof app;

export default app;

