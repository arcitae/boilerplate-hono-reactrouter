/**
 * Frontend Cloudflare Worker Entry Point
 * Handles all frontend routes via React Router
 * 
 * This worker is completely separate from the backend worker.
 * API calls are made to the backend worker via HTTP.
 */
import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

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
    
    return requestHandler(request, {
      cloudflare: { 
        env,
        ctx
      },
    });
  },
} satisfies ExportedHandler<Env>;
