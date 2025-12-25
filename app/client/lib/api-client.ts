import { hc } from "hono/client";
import type { AppType } from "../../server";

/**
 * Get the base URL for API requests
 * Reads from environment variable BACKEND_URL or falls back to default
 */
function getBaseUrl(): string {
  if (globalThis.window !== undefined) {
    // Client-side: use VITE_BACKEND_URL from environment
    // This is set in .env.local or wrangler.frontend.toml
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (backendUrl) {
      return backendUrl;
    }
    // Fallback: use current origin (for local dev with proxy)
    return globalThis.window.location.origin;
  }
  
  // Server-side: use BACKEND_URL from environment
  // This is set in wrangler.frontend.toml or via environment variables
  // In React Router dev server, this comes from process.env
  if (typeof process !== "undefined" && process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  
  // Fallback for local development
  return "http://localhost:8787";
}

/**
 * Create a type-safe API client
 * 
 * Makes HTTP requests to the backend worker.
 * The backend URL is determined by getBaseUrl() which reads from environment variables.
 * 
 * Usage:
 * ```ts
 * const res = await apiClient().api.posts.$get({ query: { page: "1" } });
 * const data = await res.json();
 * ```
 */
export function apiClient() {
  const baseUrl = getBaseUrl();
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
