import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import type { AppContext } from "../types/context.js";

/**
 * API Documentation routes
 * Serves OpenAPI specification and Swagger UI
 */

// Basic OpenAPI document structure
// This will be enhanced with actual route documentation
const openApiDoc = {
  openapi: "3.0.0",
  info: {
    title: "Panya API",
    version: "1.0.0",
    description: "API documentation for Panya language learning platform",
    contact: {
      name: "API Support",
    },
  },
  servers: [
    {
      url: "/api",
      description: "API Base URL",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        description: "Returns the health status of the API",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                    service: { type: "string", example: "panya-api" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/health/ready": {
      get: {
        summary: "Readiness check",
        description: "Checks if the service is ready to accept traffic (includes database check)",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Service is ready",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ready" },
                    timestamp: { type: "string", format: "date-time" },
                    database: { type: "string", example: "connected" },
                  },
                },
              },
            },
          },
          "503": {
            description: "Service is not ready",
          },
        },
      },
    },
    "/health/live": {
      get: {
        summary: "Liveness check",
        description: "Checks if the service is alive",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Service is alive",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "alive" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: "Health",
      description: "Health check endpoints",
    },
  ],
};

const docs = new Hono<AppContext>()
  // Serve OpenAPI JSON specification
  .get("/openapi", (c) => {
    return c.json(openApiDoc);
  })
  // Serve Swagger UI
  .get(
    "/",
    swaggerUI({
      url: "/api/docs/openapi",
    })
  )
  // Alternative Swagger UI endpoint
  .get(
    "/ui",
    swaggerUI({
      url: "/api/docs/openapi",
    })
  );

export default docs;
export type DocsAppType = typeof docs;
