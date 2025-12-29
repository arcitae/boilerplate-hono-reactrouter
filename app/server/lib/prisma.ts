import type { Context, Next } from "hono";
import { PrismaClient } from "../../../app/generated/prisma/client.js";
import { withAccelerate } from "@prisma/extension-accelerate";

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
 * 
 * For Cloudflare Workers (edge runtime), uses Accelerate extension when Accelerate URL is detected
 * @see https://www.prisma.io/docs/accelerate/getting-started
 */
function createPrismaClient(databaseUrl: string) {
  // Check if using Prisma Accelerate (URL starts with "prisma://" or contains "accelerate.prisma-data.net")
  const isAccelerate = databaseUrl.startsWith("prisma://") || 
                       databaseUrl.includes("accelerate.prisma-data.net");
  
  if (isAccelerate) {
    // For Prisma Accelerate in Cloudflare Workers (edge runtime)
    // Use accelerateUrl option and extend with Accelerate extension
    // This provides connection pooling and optional caching
    // @see https://www.prisma.io/docs/accelerate/getting-started#24-extend-your-prisma-client-instance-with-the-accelerate-extension
    const prisma = new PrismaClient({
      accelerateUrl: databaseUrl,
    }).$extends(withAccelerate());
    
    // Return extended client (type assertion needed as extended type differs from base PrismaClient)
    return prisma as any;
  }
  
  // Direct PostgreSQL connection - requires adapter for Cloudflare Workers
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  return new PrismaClient({ adapter });
}

// Singleton Prisma client instance
// For Cloudflare Workers, we'll create per-request instances
// For Node.js, we'll reuse a single instance
let prismaInstance: any = null;

/**
 * Get or create Prisma client instance
 * In Cloudflare Workers, creates per-request instance
 * In Node.js, reuses singleton
 */
function getPrismaClient(c?: Context<AppContext>): any {
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
    // Type assertion needed because extended Prisma client type doesn't match base PrismaClient
    c.set("prisma" as any, prisma);
  }
  return next();
}

export default withPrisma;
export { getPrismaClient, createPrismaClient };