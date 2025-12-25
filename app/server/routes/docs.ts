import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import type { AppContext } from "../types/context.js";
// Import OpenAPI spec as a module - Vite will bundle it at build time
// This works in both Node.js and Cloudflare Workers
import openApiSpec from "../../../openapi/openapi.json";

/**
 * API Documentation routes
 * Serves auto-generated OpenAPI specification and Swagger UI
 * 
 * The OpenAPI spec is auto-generated using @rcmade/hono-docs
 * Run: npm run docs:generate
 * 
 * The spec is imported directly as a module, so it's bundled at build time
 * and works in Cloudflare Workers (no filesystem access needed).
 */

const docs = new Hono<AppContext>()
  // Serve OpenAPI JSON specification (auto-generated)
  .get("/openapi", (c) => {
    return c.json(openApiSpec);
  })
  // Serve Swagger UI at root
  .get("/", swaggerUI({ url: "/api/docs/openapi" }))
  // Alternative Swagger UI endpoint
  .get("/ui", swaggerUI({ url: "/api/docs/openapi" }));

export default docs;
export type AppType = typeof docs;
