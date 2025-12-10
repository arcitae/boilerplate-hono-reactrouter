import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";

// Import middleware
// import withPrisma from "./lib/prisma";

// Import routes
// import apiRoutes from "./routes";

const app = new Hono();

// Middleware order (critical):
// 1. Request ID - Generate unique ID first
app.use("*", requestId());

// 2. Logger - Log all requests
app.use("*", logger());

// 3. CORS - Handle cross-origin requests
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// 4. Prisma middleware (when needed)
// app.use("*", withPrisma);

// API routes
// app.route("/api", apiRoutes);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Export AppType for type-safe RPC client
export type AppType = typeof app;

export default app;

