import { hc } from "hono/client";
import type { AppType } from "../../server";
import { cloudflareContext } from "../../context";
// Import Hono app for direct calls (same worker)
// @ts-ignore - TypeScript doesn't resolve the alias, but Vite does
import honoApp from "@backend/index.js";

/**
 * Check if we can make direct calls to Hono app (same worker)
 * Returns env and ctx if available, null otherwise
 */
function getCloudflareContext(context?: any): { env: any; ctx: ExecutionContext } | null {
  if (!context) return null;
  
  try {
    const cloudflareData = context.get(cloudflareContext);
    if (cloudflareData?.env && cloudflareData?.ctx) {
      return { env: cloudflareData.env, ctx: cloudflareData.ctx };
    }
  } catch {
    // Context doesn't have cloudflareContext, fall back to HTTP
  }
  
  return null;
}

/**
 * Create a type-safe API client
 * 
 * **Optimization**: Since frontend and backend run in the same Cloudflare Worker,
 * this function makes direct calls to the Hono app (zero latency) when possible,
 * falling back to HTTP requests only when necessary (client-side or separate workers).
 * 
 * Usage:
 * ```ts
 * // In a loader (server-side - direct call, zero latency):
 * const res = await apiClient(args.context, args.request).api.posts.$get({ query: { page: "1" } });
 * 
 * // In client-side code (HTTP request):
 * const res = await apiClient().api.posts.$get({ query: { page: "1" } });
 * ```
 */
export function apiClient(context?: any, request?: Request) {
  // Try to get Cloudflare env/ctx for direct calls
  const cloudflare = getCloudflareContext(context);
  
  if (cloudflare) {
    // Same worker - make direct call to Hono app (zero latency!)
    // This is a function call, not an HTTP request
    // We create a Proxy that mimics hc's structure but calls honoApp.fetch() directly
    return {
      api: new Proxy({} as any, {
        get(_target, routeName: string) {
          // Return a proxy for the route (e.g., api.posts)
          return new Proxy({} as any, {
            get(_target, method: string) {
              // Handle methods like $get, $post, $put, $delete
              return async (params?: any, requestOptions?: { headers?: HeadersInit; body?: BodyInit }) => {
                // Map Hono client method names to HTTP methods
                const methodMap: Record<string, string> = {
                  "$get": "GET",
                  "$post": "POST",
                  "$put": "PUT",
                  "$patch": "PATCH",
                  "$delete": "DELETE",
                };
                
                const httpMethod = methodMap[method] || "GET";
                
                // Construct the API path: /api/{routeName}
                let path = `/api/${routeName}`;
                
                // Add query string if params has query
                if (params?.query) {
                  const queryParams = new URLSearchParams();
                  Object.entries(params.query).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                      // Handle different value types
                      if (typeof value === "object" && !Array.isArray(value)) {
                        queryParams.append(key, JSON.stringify(value));
                      } else if (Array.isArray(value)) {
                        // Handle arrays - append each item
                        value.forEach((item) => {
                          queryParams.append(key, String(item));
                        });
                      } else {
                        queryParams.append(key, String(value));
                      }
                    }
                  });
                  if (queryParams.toString()) {
                    path += `?${queryParams.toString()}`;
                  }
                }
                
                // Prepare body
                let body: BodyInit | undefined;
                if (requestOptions?.body) {
                  body = requestOptions.body;
                } else if (params?.json) {
                  body = JSON.stringify(params.json);
                } else if (params?.form) {
                  body = params.form;
                } else if (params?.body) {
                  body = params.body;
                }
                
                // Merge headers
                const headers = new Headers(requestOptions?.headers);
                if (body && typeof body === "string" && !headers.has("Content-Type")) {
                  headers.set("Content-Type", "application/json");
                }
                
                // Create Request object for direct call
                // Use request origin if available, otherwise dummy origin (doesn't matter for direct calls)
                const origin = request ? new URL(request.url).origin : "http://localhost";
                const apiRequest = new Request(`${origin}${path}`, {
                  method: httpMethod,
                  headers: headers,
                  body: body,
                });
                
                // Direct call to Hono app - zero latency, no network overhead!
                return honoApp.fetch(apiRequest, cloudflare.env, cloudflare.ctx);
              };
            },
          });
        },
      }),
    } as ReturnType<typeof hc<AppType>>;
  }
  
  // Fall back to HTTP client (client-side or separate workers)
  let baseUrl = "";
  
  if (globalThis.window !== undefined) {
    // Client-side: check VITE_BACKEND_URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (backendUrl && backendUrl !== "http://localhost:5173") {
      baseUrl = backendUrl;
    } else {
      baseUrl = globalThis.window.location.origin;
    }
  } else if (request) {
    // Server-side: use request origin
    const url = new URL(request.url);
    baseUrl = url.origin;
  } else if (typeof process !== "undefined" && process.env.BACKEND_URL) {
    baseUrl = process.env.BACKEND_URL;
  }
  
  return hc<AppType>(baseUrl);
}

/**
 * Helper function to get auth headers for authenticated requests
 * This will be used when Clerk tokens are needed
 */
export function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}
