import { hc } from "hono/client";
import type { AppType } from "../../server";

/**
 * Get the base URL for API requests
 * 
 * Since frontend and backend run in the same Cloudflare Worker,
 * we use relative paths by default. BACKEND_URL is only used if
 * explicitly set (for local dev with separate servers or future split workers).
 */
function getBaseUrl(request?: Request): string {
  // If BACKEND_URL is explicitly set, use it (for local dev with separate servers)
  // Check environment variables first
  if (globalThis.window !== undefined) {
    // Client-side: check VITE_BACKEND_URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (backendUrl && backendUrl !== "http://localhost:5173") {
      return backendUrl;
    }
    // Use current origin (same worker) - frontend and backend are in same worker
    return globalThis.window.location.origin;
  }
  
  // Server-side: check BACKEND_URL from process.env (for local dev with separate servers)
  if (typeof process !== "undefined" && process.env.BACKEND_URL) {
    const backendUrl = process.env.BACKEND_URL;
    // Only use it if it's not the default localhost (meaning it's explicitly set)
    if (backendUrl && backendUrl !== "http://localhost:5173") {
      return backendUrl;
    }
  }
  
  // Use request origin (server-side in same worker)
  // This ensures API calls go to the same worker origin
  if (request) {
    const url = new URL(request.url);
    return url.origin;
  }
  
  // Fallback: this shouldn't happen, but return empty string
  // Hono client will handle relative paths
  return "";
}

/**
 * Create a type-safe API client
 * 
 * Makes HTTP requests to the backend API.
 * Since frontend and backend run in the same Cloudflare Worker,
 * uses relative paths by default (same origin).
 * 
 * Usage:
 * ```ts
 * // In a loader (server-side):
 * const res = await apiClient(args.request).api.posts.$get({ query: { page: "1" } });
 * 
 * // In client-side code:
 * const res = await apiClient().api.posts.$get({ query: { page: "1" } });
 * ```
 */
export function apiClient(request?: Request) {
  const baseUrl = getBaseUrl(request);
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
