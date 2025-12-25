import { Hono } from "hono";
import type { AppContext } from "../types/context.js";

/**
 * Health check routes
 * Used for monitoring and load balancer health checks
 */
const health = new Hono<AppContext>()
  .get("/", async (c) => {
    // Basic health check
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "panya-api",
    });
  })
  .get("/ready", async (c) => {
    // Readiness check - verify database connection
    try {
      const prisma = c.get("prisma");
      if (prisma) {
        // Simple query to check database connectivity
        await prisma.$queryRaw`SELECT 1`;
      }
      return c.json({
        status: "ready",
        timestamp: new Date().toISOString(),
        database: "connected",
      });
    } catch (error) {
      return c.json(
        {
          status: "not ready",
          timestamp: new Date().toISOString(),
          database: "disconnected",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        503
      );
    }
  })
  .get("/live", async (c) => {
    // Liveness check - just verify the service is running
    return c.json({
      status: "alive",
      timestamp: new Date().toISOString(),
    });
  });

export default health;
export type AppType = typeof health;
