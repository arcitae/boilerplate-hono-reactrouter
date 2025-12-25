import type { PrismaClient } from "../../generated/prisma/client.js";
import type { Env } from "./env.js";

/**
 * Clerk user information extracted from JWT token
 */
export type ClerkUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
};

/**
 * Hono context type definitions
 * This ensures type safety for context variables and bindings
 */
export type ContextVariables = {
  prisma: PrismaClient;
  user?: ClerkUser;
  userId?: string;
};

/**
 * Hono context type with Bindings and Variables
 * Used for type-safe access to environment and context variables
 */
export type AppContext = {
  Bindings: Env;
  Variables: ContextVariables;
};
