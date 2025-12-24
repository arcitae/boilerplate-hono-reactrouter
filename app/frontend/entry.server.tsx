import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter, RouterContextProvider } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

/**
 * React Router server-side rendering entry point
 * 
 * Architecture:
 * - Frontend worker handles all frontend routes via React Router
 * - Backend worker handles all /api/* routes via Hono (separate worker)
 * - Frontend makes HTTP requests to backend worker
 * 
 * This separation allows:
 * - Independent scaling of frontend and backend
 * - Backend can be moved to containers/other platforms in future
 * - Cleaner architecture with clear boundaries
 */

/**
 * Get load context for React Router
 * CRITICAL: When middleware is enabled, this MUST return RouterContextProvider
 * React Router validates this before calling handleRequest
 */
export function getLoadContext(): RouterContextProvider {
  const context = new RouterContextProvider();
  return context;
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
) {
  // When middleware is enabled, loadContext is a RouterContextProvider instance
  // returned from getLoadContext(). React Router validates this automatically.

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
