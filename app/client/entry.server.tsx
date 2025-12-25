import type { EntryContext } from "react-router";
import { ServerRouter, RouterContextProvider } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

/**
 * Get load context for React Router
 * CRITICAL: When middleware is enabled, this MUST return a RouterContextProvider instance
 * React Router validates this before calling handleRequest
 * 
 * @see https://reactrouter.com/how-to/middleware
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
  loadContext: RouterContextProvider
) {
  let shellRendered = false;
  let statusCode = responseStatusCode;
  const userAgent = request.headers.get("user-agent");

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        statusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    }
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
    status: statusCode,
  });
}