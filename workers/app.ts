import { createRequestHandler, RouterContextProvider } from "react-router";
import backendApp from "../app/backend/index.js";

/**
 * Cloudflare Workers entry point
 * Integrates Hono backend API with React Router frontend
 * 
 * The backend app handles all /api/* routes
 * React Router handles all other routes (frontend)
 */
const app = backendApp;

// React Router catch-all route (must be last, after all API routes)
// This handles all non-API routes for the frontend
app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    getLoadContext() {
      // Return RouterContextProvider for middleware support
      // Cloudflare context (c.env) is automatically available in Hono context
      return new RouterContextProvider();
    },
  } as any);
});

export default app;
