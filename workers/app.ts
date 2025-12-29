/**
 * Frontend Cloudflare Worker Entry Point
 * Handles all frontend routes via React Router
 * 
 * This worker is completely separate from the backend worker.
 * API calls are made to the backend worker via HTTP.
 * 
 * Uses @react-router/cloudflare's createRequestHandler which properly handles
 * middleware and RouterContextProvider for Cloudflare Workers.
 * @see https://github.com/remix-run/react-router/tree/main/packages/react-router-cloudflare
 */
import { createRequestHandler } from "@react-router/cloudflare";
import { RouterContextProvider } from "react-router";
import { cloudflareContext } from "../app/context";

const app = await import("../app/server/index.js");

const apiRequestHandler = app.default.fetch;

const requestHandler = createRequestHandler({
  build: () => import("virtual:react-router/server-build"),
  mode: import.meta.env.MODE,
  getLoadContext({ request, context }) {
    // Return RouterContextProvider for middleware support
    // This is required when middleware is enabled
    // @see https://reactrouter.com/how-to/middleware
    const routerContext = new RouterContextProvider();
    
    // Store Cloudflare env/ctx in the context for use in middleware/loaders
    // context.cloudflare contains: env, ctx (with waitUntil, passThroughOnException), cf, caches
    // We extract what we need and store it in our context
    routerContext.set(cloudflareContext, { 
      env: context.cloudflare.env, 
      ctx: context.cloudflare.ctx as ExecutionContext
    });
    
    return routerContext;
  },
});

// PostHog proxy configuration - following official Cloudflare documentation
const API_HOST = "us.i.posthog.com"; // Change to "eu.i.posthog.com" for EU region
const ASSET_HOST = "us-assets.i.posthog.com"; // Change to "eu-assets.i.posthog.com" for EU region

async function handlePostHogRequest(request: Request, ctx: ExecutionContext) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const search = url.search;
  const pathWithParams = pathname + search;

  if (pathname.startsWith("/static/")) {
    return retrieveStatic(request, pathWithParams, ctx);
  } else {
    return forwardRequest(request, pathWithParams);
  }
}

async function retrieveStatic(request: Request, pathname: string, ctx: ExecutionContext) {
  // Use the global cache for static assets
  const cache = await caches.open('posthog-assets');
  let response = await cache.match(request);
  if (!response) {
    response = await fetch(`https://${ASSET_HOST}${pathname}`);
    // Cache the response for future requests
    ctx.waitUntil(cache.put(request, response.clone()));
  }
  return response;
}

async function forwardRequest(request: Request, pathWithSearch: string) {
  const originRequest = new Request(request);
  originRequest.headers.delete("cookie");

  const forwardUrl = `https://${API_HOST}${pathWithSearch}`;

  // Rebuild the request properties explicitly to avoid ambiguity
  const init = {
    method: originRequest.method,
    headers: originRequest.headers,
    body: originRequest.body,
    redirect: 'follow' as RequestRedirect
  };

  return await fetch(forwardUrl, init);
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/.well-known/')) {
      return new Response(null, { status: 200 });
    }

    if (url.pathname.startsWith('/api/')) {
      return apiRequestHandler(request, env, ctx);
    }

    // Handle PostHog proxy routes - using the exact pattern from PostHog docs
    if (url.pathname.startsWith('/ingest/') || 
        url.pathname.startsWith('/decide/') || 
        url.pathname.startsWith('/e/') ||
        url.pathname.startsWith('/s/') ||
        url.pathname.startsWith('/capture/') ||
        url.pathname.startsWith('/batch/') ||
        url.pathname.startsWith('/static/') ||
        url.pathname.startsWith('/flags/') ||
        url.pathname.startsWith('/array/')) {
      try {
        return await handlePostHogRequest(request, ctx);
      } catch (error) {
        console.error('PostHog proxy error:', error);
        return new Response('PostHog proxy error', { status: 500 });
      }
    }
    
    // @react-router/cloudflare's createRequestHandler expects an EventContext-like object
    // It spreads all properties and constructs context.cloudflare internally
    // The handler will call getLoadContext with: { request, context: { cloudflare: {...} } }
    const eventContext = {
      request,
      env,
      waitUntil: ctx.waitUntil.bind(ctx),
      passThroughOnException: ctx.passThroughOnException?.bind(ctx),
      // Add cf from request if available (Cloudflare-specific)
      cf: (request as any).cf,
      // Add caches (global CacheStorage API)
      caches: globalThis.caches,
      // Add other EventContext properties
      params: {},
      data: {},
    } as any;
    
    return requestHandler(eventContext);
  },
} satisfies ExportedHandler<Env>;
