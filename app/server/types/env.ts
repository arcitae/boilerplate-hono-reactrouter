/**
 * Environment variable types for type-safe access
 * Supports both Cloudflare Workers (c.env) and Node.js (process.env)
 */
export type Env = {
  // Database
  DATABASE_URL?: string;
  PRISMA_ACCELERATE_URL?: string;

  // Clerk Authentication
  CLERK_SECRET_KEY?: string;
  VITE_CLERK_PUBLISHABLE_KEY?: string; // Used by both frontend and backend (same value)
  CLERK_PUBLISHABLE_KEY?: string; // Fallback for backward compatibility

  // Application
  FRONTEND_URL?: string;
  BACKEND_URL?: string;
  NODE_ENV?: "development" | "production" | "test";

  // Cloudflare Workers specific
  // Add other Cloudflare bindings here as needed
};
