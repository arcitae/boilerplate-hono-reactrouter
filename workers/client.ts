/**
 * Frontend Cloudflare Worker Entry Point
 * Handles all frontend routes via React Router
 * 
 * This worker is completely separate from the backend worker.
 * API calls are made to the backend worker via HTTP.
 */
import { createRequestHandler, RouterContextProvider } from "react-router";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    return requestHandler(request, {
      getLoadContext() {
        // Return RouterContextProvider for middleware support
        return new RouterContextProvider();
      },
    } as any);
  },
};

