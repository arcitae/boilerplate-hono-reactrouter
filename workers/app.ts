import { createRequestHandler, RouterContextProvider } from "react-router";
import backendApp from "../app/backend/index.js";

/**
 * Cloudflare Workers entry point
 * Integrates Hono backend API with React Router frontend
 * 
 * Architecture:
 * - Hono backend handles all /api/* routes (defined in app/backend/)
 * - React Router handles all other routes (frontend pages)
 * - Both are integrated in a single Cloudflare Worker
 * 
 * Request flow:
 * 1. Request comes in
 * 2. Hono middleware stack processes it (CORS, logging, etc.)
 * 3. If path starts with /api/*, Hono routes handle it
 * 4. Otherwise, React Router catch-all handles it (frontend)
 */
const app = backendApp;

// React Router catch-all route (must be last, after all API routes)
// This handles all non-API routes for the frontend
app.get("*", async (c) => {
  // Check if this is an API route - if so, let Hono handle it (shouldn't reach here)
  // This is a safety check, but API routes should be handled by app.route("/api", apiRoutes) above
  const url = new URL(c.req.url);
  if (url.pathname.startsWith("/api/")) {
    // This shouldn't happen as API routes are defined before this catch-all
    // But if it does, return 404 (API routes should have been handled already)
    return c.notFound();
  }

  // Create React Router request handler
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  // Handle the request with React Router
  return requestHandler(c.req.raw, {
    getLoadContext() {
      // Return RouterContextProvider for middleware support
      // Cloudflare context (c.env) is automatically available in Hono context
      // You can extend this to pass additional context to React Router loaders/actions
      return new RouterContextProvider();
    },
  } as any);
});

export default app;
