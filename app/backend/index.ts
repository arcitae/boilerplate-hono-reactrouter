import "dotenv/config"; // Load environment variables from .env files
import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { httpInstrumentationMiddleware } from "@hono/otel";
import { env } from "hono/adapter";
import type { AppContext } from "./types/context.js";
import type { Env } from "./types/env.js";

// Import middleware
import withPrisma from "./lib/prisma.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

// Import routes
import apiRoutes from "./routes/index.js";

/**
 * Get frontend URL from environment
 * Supports both Cloudflare Workers (using env adapter) and Node.js (process.env)
 */
function getFrontendUrl(c?: Context<AppContext>): string {
  // For Cloudflare Workers, use env adapter to extract environment variables
  if (c) {
    try {
      const envVars = env<Env>(c);
      if (envVars.FRONTEND_URL) {
        return envVars.FRONTEND_URL;
      }
    } catch {
      // If env adapter fails, fall through to process.env check
    }
  }
  
  // Fallback to process.env for Node.js/local development
  if (typeof process !== "undefined" && process.env?.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  
  return "http://localhost:5173";
}

/**
 * Main Hono application
 * All middleware is applied in the correct order for proper execution
 */
const app = new Hono<AppContext>();

// Middleware order (critical - must follow this order):
// 1. Request ID - Generate unique ID first (for tracing)
app.use("*", requestId());

// 2. Logger - Log all requests (needs request ID)
app.use("*", logger());

// 3. OpenTelemetry - Start distributed tracing (needs request ID)
// Note: For Cloudflare Workers, OpenTelemetry setup may require additional configuration
app.use(
  "*",
  httpInstrumentationMiddleware({
    serviceName: "panya-api",
  })
);

// 4. CORS - Handle cross-origin requests
app.use("*", (c, next) => {
  const frontendUrl = getFrontendUrl(c);
  return cors({
    origin: frontendUrl,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })(c, next);
});

// 5. Prisma middleware - Inject Prisma client into context
// Applied globally so all routes have access to database
app.use("*", withPrisma);

// 6. Error handler - Must be before routes to catch errors
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

