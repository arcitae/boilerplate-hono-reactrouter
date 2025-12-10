import { createRequestHandler, RouterContextProvider } from "react-router";
import backendApp from "../app/backend/index";

const app = backendApp;

// React Router catch-all route (must be last)
app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    getLoadContext() {
      // Return RouterContextProvider for middleware support
      // Cloudflare context can be added later if needed
      return new RouterContextProvider();
    },
  } as any);
});

export default app;
