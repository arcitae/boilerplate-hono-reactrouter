import type { Context, Next } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { env } from "hono/adapter";
import type { AppContext } from "../types/context.js";
import type { Env } from "../types/env.js";

/**
 * Secure headers configuration type
 * Based on hono/secure-headers options
 */
type SecureHeadersConfig = Parameters<typeof secureHeaders>[0];

/**
 * Get environment-based secure headers configuration
 * Different settings for development vs production
 */
function getSecureHeadersConfig(
  c: Context<AppContext>
): SecureHeadersConfig {
  const envVars = env<Env>(c);
  const isDevelopment =
    envVars.NODE_ENV === "development" ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development");

  // Base configuration (applies to all environments)
  const baseConfig: SecureHeadersConfig = {
    // Content Security Policy
    // In development, allow unsafe-inline for easier debugging
    // In production, stricter CSP
    contentSecurityPolicy: isDevelopment
      ? {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://cdn.jsdelivr.net", // Swagger UI CDN
            "https://unpkg.com", // Alternative CDN for Swagger UI
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https:",
            "https://cdn.jsdelivr.net", // Swagger UI styles
            "https://unpkg.com", // Alternative CDN for Swagger UI
          ],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
          fontSrc: ["'self'", "https:", "data:", "https://cdn.jsdelivr.net"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"],
        }
      : {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "https://cdn.jsdelivr.net", // Swagger UI CDN
            "https://unpkg.com", // Alternative CDN for Swagger UI
          ],
          styleSrc: [
            "'self'",
            "https:",
            "https://cdn.jsdelivr.net", // Swagger UI styles
            "https://unpkg.com", // Alternative CDN for Swagger UI
          ],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
          fontSrc: ["'self'", "https:", "data:", "https://cdn.jsdelivr.net"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"],
          upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS in production
        },

    // Cross-Origin Policies
    crossOriginEmbedderPolicy: false, // Can be enabled if needed for specific features
    crossOriginResourcePolicy: "same-origin",
    crossOriginOpenerPolicy: "same-origin",

    // Referrer Policy
    referrerPolicy: "strict-origin-when-cross-origin",

    // HSTS (HTTP Strict Transport Security)
    // Only in production (HTTPS required)
    strictTransportSecurity: isDevelopment
      ? false // Disable in development (may use HTTP)
      : "max-age=63072000; includeSubDomains; preload", // 2 years in production

    // X-Content-Type-Options
    xContentTypeOptions: "nosniff",

    // X-DNS-Prefetch-Control
    xDnsPrefetchControl: "off",

    // X-Download-Options
    xDownloadOptions: "noopen",

    // X-Frame-Options
    xFrameOptions: "SAMEORIGIN", // Allow same-origin framing

    // X-Permitted-Cross-Domain-Policies
    xPermittedCrossDomainPolicies: "none",

    // X-XSS-Protection (legacy, but still useful for older browsers)
    xXssProtection: "0", // Disabled (CSP handles XSS protection)
  };

  return baseConfig;
}

/**
 * Secure headers middleware factory
 * Creates middleware with environment-based configuration
 * 
 * Usage:
 * ```ts
 * app.use("*", createSecureHeadersMiddleware(c));
 * ```
 * 
 * Or use the factory:
 * ```ts
 * app.use("*", secureHeadersMiddleware);
 * ```
 */
export function createSecureHeadersMiddleware(c: Context<AppContext>) {
  const config = getSecureHeadersConfig(c);
  return secureHeaders(config);
}

/**
 * Secure headers middleware
 * Wrapper that automatically gets configuration from context
 * 
 * Usage:
 * ```ts
 * app.use("*", secureHeadersMiddleware);
 * ```
 */
export async function secureHeadersMiddleware(
  c: Context<AppContext>,
  next: Next
) {
  const middleware = createSecureHeadersMiddleware(c);
  return middleware(c, next);
}

/**
 * Type-safe secure headers configuration
 * Can be used to override default configuration
 */
export type { SecureHeadersConfig };
