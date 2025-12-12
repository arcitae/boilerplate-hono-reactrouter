import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import backendApp from "../backend/index.js";

/**
 * React Router server-side rendering entry point
 * 
 * Architecture:
 * - In development: React Router dev server uses this file
 *   - API routes (/api/*) are intercepted and handled by Hono backend
 *   - Frontend routes are handled by React Router
 * 
 * - In production (Cloudflare Workers): workers/app.ts handles everything
 *   - Hono backend handles /api/* routes
 *   - React Router catch-all handles frontend routes
 * 
 * This dual approach ensures API routes work in both dev and production.
 */
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  // Intercept /api/* requests and handle them with the Hono backend
  // This is necessary in development mode where React Router dev server
  // processes all requests before they reach workers/app.ts
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    try {
      const response = await backendApp.fetch(request);
      return response;
    } catch (error) {
      console.error("[Entry Server] Error handling API request:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    },
  );
  shellRendered = true;

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
