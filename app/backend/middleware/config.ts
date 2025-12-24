import type { Context } from "hono";
import { env } from "hono/adapter";
import type { AppContext } from "../types/context.js";
import type { Env } from "../types/env.js";

/**
 * Middleware configuration
 * Centralized configuration for all middleware
 * Environment-based settings
 */
export interface MiddlewareConfig {
  // Request ID
  requestId: {
    enabled: boolean;
    headerName?: string;
  };

  // Logger
  logger: {
    enabled: boolean;
    customPrintFn?: (message: string, ...rest: string[]) => void;
  };

  // OpenTelemetry
  telemetry: {
    enabled: boolean;
    serviceName?: string;
  };

  // CORS
  cors: {
    enabled: boolean;
    origin?: string | string[] | ((origin: string, c: Context<AppContext>) => string);
    credentials?: boolean;
    allowMethods?: string[];
    allowHeaders?: string[];
    exposeHeaders?: string[];
    maxAge?: number;
  };

  // Secure Headers
  secureHeaders: {
    enabled: boolean;
    strictMode?: boolean; // If true, use stricter security settings
  };

  // Compression (not needed for Cloudflare Workers, but useful for Node.js)
  compress: {
    enabled: boolean;
    encoding?: "gzip" | "deflate";
    threshold?: number;
  };
}

/**
 * Get middleware configuration from environment
 * Supports both Cloudflare Workers (c.env) and Node.js (process.env)
 */
export function getMiddlewareConfig(c?: Context<AppContext>): MiddlewareConfig {
  // Get environment variables
  let envVars: Env = {};
  if (c) {
    try {
      envVars = env<Env>(c) || {};
    } catch {
      // If env() fails, use empty object and fall back to process.env
    }
  }

  // Fallback to process.env for Node.js/local development
  if (typeof process !== "undefined" && process.env) {
    envVars = {
      ...envVars,
      NODE_ENV: (process.env.NODE_ENV as Env["NODE_ENV"]) || envVars.NODE_ENV,
      FRONTEND_URL: process.env.FRONTEND_URL || envVars.FRONTEND_URL,
    };
  }

  const isDevelopment =
    envVars.NODE_ENV === "development" ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development");
  const isProduction = !isDevelopment;

  // Get frontend URL
  const frontendUrl =
    envVars.FRONTEND_URL ||
    (typeof process !== "undefined" && process.env?.FRONTEND_URL) ||
    "http://localhost:5173";

  return {
    requestId: {
      enabled: true, // Always enabled for tracing
      headerName: "X-Request-Id",
    },

    logger: {
      enabled: true, // Always enabled
      // Custom print function can be added here if needed
    },

    telemetry: {
      enabled: isProduction, // Enable in production, can be enabled in dev too
      serviceName: "panya-api",
    },

    cors: {
      enabled: true, // Always enabled
      origin: frontendUrl,
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      exposeHeaders: [],
      maxAge: 86400, // 24 hours
    },

    secureHeaders: {
      enabled: true, // Always enabled for security
      strictMode: isProduction, // Stricter in production
    },

    compress: {
      enabled: false, // Disabled for Cloudflare Workers (auto-compresses)
      // Can be enabled for Node.js runtime
      encoding: "gzip",
      threshold: 1024,
    },
  };
}

/**
 * Default middleware configuration
 * Used when context is not available (e.g., during initialization)
 */
export const defaultMiddlewareConfig: MiddlewareConfig = {
  requestId: {
    enabled: true,
    headerName: "X-Request-Id",
  },
  logger: {
    enabled: true,
  },
  telemetry: {
    enabled: false,
    serviceName: "panya-api",
  },
  cors: {
    enabled: true,
    origin: "http://localhost:5173",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: [],
    maxAge: 86400,
  },
  secureHeaders: {
    enabled: true,
    strictMode: false,
  },
  compress: {
    enabled: false,
    encoding: "gzip",
    threshold: 1024,
  },
};
