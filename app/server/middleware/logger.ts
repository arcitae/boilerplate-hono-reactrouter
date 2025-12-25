import type { Context, Next } from "hono";
import { logger } from "hono/logger";
import type { AppContext } from "../types/context.js";
import type { MiddlewareConfig } from "./config.js";

/**
 * Logger Middleware
 * 
 * Enhanced logging middleware with:
 * - Structured logging support
 * - Log level configuration
 * - Request ID integration
 * - Custom print functions
 * - Environment-based formatting
 */

/**
 * Log levels for structured logging
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Structured log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  method?: string;
  path?: string;
  status?: number;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Logger configuration
 * Extends base logger config with enhanced features
 */
export interface LoggerConfig {
  enabled: boolean;
  customPrintFn?: (message: string, ...rest: string[]) => void;
  level?: LogLevel;
  structured?: boolean;
  includeRequestId?: boolean;
}

/**
 * Create logger middleware
 * Logs HTTP requests with method, path, status, and response time
 * 
 * Features:
 * - Custom print function support
 * - Structured logging (optional)
 * - Log level filtering
 * - Request ID integration
 * 
 * Usage:
 * ```ts
 * const loggerMiddleware = createLoggerMiddleware({
 *   enabled: true,
 *   level: "info",
 *   structured: true,
 *   includeRequestId: true,
 * });
 * app.use("*", loggerMiddleware);
 * ```
 */
export function createLoggerMiddleware(
  config: MiddlewareConfig["logger"] | LoggerConfig
) {
  if (!config.enabled) {
    // Return no-op middleware if disabled
    return async (c: Context<AppContext>, next: Next) => {
      return next();
    };
  }

  // If custom print function is provided, use it
  if (config.customPrintFn) {
    return logger(config.customPrintFn);
  }

  // If structured logging is enabled, create structured logger
  if (config.structured) {
    return createStructuredLogger(config);
  }

  // Default logger
  return logger();
}

/**
 * Create structured logger middleware
 * Logs requests in structured JSON format
 */
function createStructuredLogger(config: LoggerConfig) {
  const logLevel = config.level || "info";
  const includeRequestId = config.includeRequestId !== false;

  return async (c: Context<AppContext>, next: Next) => {
    const start = Date.now();
    const requestId = c.get("requestId") || c.req.header("X-Request-Id");
    const method = c.req.method;
    const path = c.req.path;

    // Log request start
    if (shouldLog(logLevel, "debug")) {
      logStructured({
        level: "debug",
        message: "Request started",
        requestId: includeRequestId ? requestId : undefined,
        method,
        path,
      });
    }

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    // Determine log level based on status
    let level: LogLevel = "info";
    if (status >= 500) {
      level = "error";
    } else if (status >= 400) {
      level = "warn";
    }

    // Log request completion
    if (shouldLog(logLevel, level)) {
      logStructured({
        level,
        message: "Request completed",
        requestId: includeRequestId ? requestId : undefined,
        method,
        path,
        status,
        duration,
      });
    }
  };
}

/**
 * Check if a log level should be logged
 */
function shouldLog(configuredLevel: LogLevel, messageLevel: LogLevel): boolean {
  const levels: LogLevel[] = ["debug", "info", "warn", "error"];
  const configuredIndex = levels.indexOf(configuredLevel);
  const messageIndex = levels.indexOf(messageLevel);
  return messageIndex >= configuredIndex;
}

/**
 * Log structured entry
 * Outputs JSON-formatted log entry
 */
function logStructured(entry: LogEntry): void {
  entry.timestamp = new Date().toISOString();
  console.log(JSON.stringify(entry));
}

/**
 * Get request ID from context
 * Helper function to extract request ID for logging
 */
export function getRequestId(c: Context<AppContext>): string | undefined {
  return c.get("requestId") || c.req.header("X-Request-Id");
}

/**
 * Create custom logger with request ID
 * Returns a print function that includes request ID in logs
 */
export function createRequestIdLogger(
  c: Context<AppContext>
): (message: string, ...rest: string[]) => void {
  const requestId = getRequestId(c);
  const prefix = requestId ? `[${requestId}] ` : "";

  return (message: string, ...rest: string[]) => {
    console.log(prefix + message, ...rest);
  };
}
