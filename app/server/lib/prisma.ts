import type { Context, Next } from "hono";
import { PrismaClient } from "../../../app/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "hono/adapter";
import type { AppContext } from "../types/context.js";
import type { Env } from "../types/env.js";

/**
 * Get database URL from environment
 * Supports both Cloudflare Workers (c.env) and Node.js (process.env)
 */
function getDatabaseUrl(c?: Context<AppContext>): string {
  // Try to get from Cloudflare Workers bindings first
  if (c) {
    const envVars = env<Env>(c);
    // Prefer Prisma Accelerate URL if available (for production)
    if (envVars.PRISMA_ACCELERATE_URL) {
      return envVars.PRISMA_ACCELERATE_URL;
    }
    if (envVars.DATABASE_URL) {
      return envVars.DATABASE_URL;
    }
  }

  // Fallback to process.env for Node.js/local development
  if (typeof process !== "undefined" && process.env) {
    if (process.env.PRISMA_ACCELERATE_URL) {
      return process.env.PRISMA_ACCELERATE_URL;
    }
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }
  }

  throw new Error(
    "DATABASE_URL or PRISMA_ACCELERATE_URL must be set in environment variables"
  );
}

/**
 * Create Prisma client instance
 * Uses Prisma Accelerate URL if available, otherwise direct connection
 */
function createPrismaClient(databaseUrl: string): PrismaClient {
  // If using Prisma Accelerate, the URL will be the Accelerate connection string
  // For Accelerate, we can use it directly without an adapter
  // However, Prisma Client needs the connection string at initialization
  // For Cloudflare Workers, we'll use the adapter approach for consistency
  // Note: Accelerate works via HTTP, so technically no adapter is needed,
  // but for simplicity and to ensure the connection string is passed correctly,
  // we'll use the adapter for both cases in Cloudflare Workers environment
  
  // Direct PostgreSQL connection - requires adapter for Cloudflare Workers
  // For Accelerate, we can also use adapter (it will handle the HTTP connection)
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  return new PrismaClient({ adapter });
}

// Singleton Prisma client instance
// For Cloudflare Workers, we'll create per-request instances
// For Node.js, we'll reuse a single instance
let prismaInstance: PrismaClient | null = null;

/**
 * Get or create Prisma client instance
 * In Cloudflare Workers, creates per-request instance
 * In Node.js, reuses singleton
 */
function getPrismaClient(c?: Context<AppContext>): PrismaClient {
  // For Cloudflare Workers, create per-request instance
  if (c) {
    const databaseUrl = getDatabaseUrl(c);
    // For Accelerate, we need to ensure the connection string is available
    // Prisma Client will read it from the environment
    // In Cloudflare Workers, we set it via c.env which is available
    return createPrismaClient(databaseUrl);
  }

  // For Node.js, use singleton pattern
  if (!prismaInstance) {
    const databaseUrl = getDatabaseUrl();
    prismaInstance = createPrismaClient(databaseUrl);
  }

  return prismaInstance;
}

/**
 * Prisma middleware for Hono
 * Injects Prisma client into context
 */
function withPrisma(c: Context<AppContext>, next: Next) {
  if (!c.get("prisma")) {
    const prisma = getPrismaClient(c);
    c.set("prisma", prisma);
  }
  return next();
}

export default withPrisma;
export { getPrismaClient, createPrismaClient };