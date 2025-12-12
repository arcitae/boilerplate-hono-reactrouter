import { hc, type InferResponseType } from "hono/client";
import type { AppType } from "../../backend/index.js";
import backendApp from "../../backend/index.js";

/**
 * Custom fetch function for server-side requests
 * Uses the backend app directly to avoid React Router interception
 * Preserves headers (including Authorization) from the original request
 */
async function serverFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Hono client passes the URL as input and options (including headers) in init
  // We need to create a proper Request with all headers merged
  
  let request: Request;
  
  if (input instanceof Request) {
    // If input is already a Request, merge init into it
    request = new Request(input, init);
  } else {
    // If input is a URL string, create new Request with init
    request = new Request(input, init);
  }
  
  // Debug: Log headers in development
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      console.log("[API Client] Authorization header present:", authHeader.substring(0, 20) + "...");
    } else {
      console.warn("[API Client] No Authorization header found in request");
    }
  }
  
  // Use the backend app's fetch method directly
  // This preserves all headers including Authorization
  const response = backendApp.fetch(request);
  
  // Ensure we return a Promise<Response>
  return response instanceof Promise ? response : Promise.resolve(response);
}

/**
 * Get the base URL for API requests
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side: use current origin
    return window.location.origin;
  }
  // Server-side: use a dummy URL (we'll override fetch)
  return "http://localhost";
}

/**
 * Create a type-safe API client
 * 
 * In server-side loaders, this uses the backend app directly via custom fetch
 * In client-side code, this makes HTTP requests
 * 
 * Usage:
 * ```ts
 * const res = await apiClient().api.posts.$get({ query: { page: "1" } });
 * const data = await res.json();
 * ```
 */
export function apiClient() {
  const isServer = typeof window === "undefined";
  
  if (isServer) {
    // Server-side: use custom fetch that calls backend app directly
    // This avoids React Router intercepting the request
    return hc<AppType>("http://localhost", {
      fetch: serverFetch,
    });
  }
  
  // Client-side: make HTTP requests
  return hc<AppType>(window.location.origin);
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
