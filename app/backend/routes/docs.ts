import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import type { AppContext } from "../types/context.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * API Documentation routes
 * Serves auto-generated OpenAPI specification and Swagger UI
 * 
 * The OpenAPI spec is auto-generated using @rcmade/hono-docs
 * Run: npm run docs:generate
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openApiPath = path.join(__dirname, "../../../openapi/openapi.json");

/**
 * Load OpenAPI specification from generated file
 * Falls back to basic structure if file doesn't exist
 */
async function loadOpenApiSpec() {
  try {
    const content = await fs.readFile(openApiPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    // Fallback to basic structure if file doesn't exist
    // This happens before first generation
    return {
      openapi: "3.0.0",
      info: {
        title: "Panya API",
        version: "1.0.0",
        description:
          "API documentation for Panya language learning platform. Run 'npm run docs:generate' to generate full documentation.",
      },
      servers: [
        {
          url: "/api",
          description: "API Base URL",
        },
      ],
      paths: {},
      tags: [],
    };
  }
}

const docs = new Hono<AppContext>()
  // Serve OpenAPI JSON specification (auto-generated)
  .get("/openapi", async (c) => {
    const openApiDoc = await loadOpenApiSpec();
    return c.json(openApiDoc);
  })
  // Serve Swagger UI at root
  .get(
    "/",
    swaggerUI({
      url: "/api/docs/openapi",
      config: {
        persistAuthorization: true, // Persist auth tokens in Swagger UI
      },
    })
  )
  // Alternative Swagger UI endpoint
  .get(
    "/ui",
    swaggerUI({
      url: "/api/docs/openapi",
      config: {
        persistAuthorization: true,
      },
    })
  );

export default docs;
export type AppType = typeof docs;
