import { describe, it, expect, beforeAll } from "vitest";
import backendApp from "../index.js";

/**
 * Health check endpoint tests
 */
describe("Health Check Endpoints", () => {
  describe("GET /api/health", () => {
    it("should return 200 with health status", async () => {
      const res = await backendApp.request("/api/health", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("status", "ok");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("service", "panya-api");
    });
  });

  describe("GET /api/health/ready", () => {
    it("should return 200 when service is ready", async () => {
      const res = await backendApp.request("/api/health/ready", {
        method: "GET",
      });

      // May return 200 or 503 depending on database connection
      expect([200, 503]).toContain(res.status);
      const data = (await res.json()) as {
        status: string;
        timestamp: string;
        database?: string;
      };
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("timestamp");
      
      if (res.status === 200) {
        expect(data).toHaveProperty("database", "connected");
      } else {
        expect(data).toHaveProperty("database", "disconnected");
      }
    });
  });

  describe("GET /api/health/live", () => {
    it("should return 200 with liveness status", async () => {
      const res = await backendApp.request("/api/health/live", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("status", "alive");
      expect(data).toHaveProperty("timestamp");
    });
  });
});

/**
 * 404 handler tests
 */
describe("404 Handler", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await backendApp.request("/api/unknown-route", {
      method: "GET",
    });

    expect(res.status).toBe(404);
    const data = (await res.json()) as {
      error: { message: string; code: string };
    };
    expect(data).toHaveProperty("error");
    expect(data.error).toHaveProperty("message", "Route not found");
    expect(data.error).toHaveProperty("code", "NOT_FOUND");
  });
});
