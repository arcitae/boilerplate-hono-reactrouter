/**
 * Middleware Registry
 * Centralized export point for all middleware
 * 
 * This module provides:
 * - Factory functions for creating middleware
 * - Configuration management
 * - Centralized middleware setup
 * 
 * Middleware is organized into logical groups:
 * - Base: Simple, configuration-based middleware (Request ID, CORS, Security Headers, Compression)
 * - Logger: Enhanced logging with structured logging, log levels, request ID integration
 * - Telemetry: Observability middleware (Traces, Metrics)
 */

// Configuration
export { getMiddlewareConfig, defaultMiddlewareConfig } from "./config.js";
export type { MiddlewareConfig } from "./config.js";

// Factory functions (orchestrator)
export {
  createRequestIdMiddleware,
  createLoggerMiddleware,
  createTelemetryMiddleware,
  createCorsMiddleware,
  createSecureHeadersMiddlewareFactory,
  createCompressMiddleware,
  applyMiddleware,
} from "./factory.js";

// Base middleware (Request ID, CORS, Security Headers, Compression)
export {
  createRequestIdMiddleware as createRequestIdMiddlewareBase,
  createCorsMiddleware as createCorsMiddlewareBase,
  createSecureHeadersMiddlewareFactory as createSecureHeadersMiddlewareFactoryBase,
  createCompressMiddleware as createCompressMiddlewareBase,
} from "./base.js";

// Logger middleware (Enhanced logging)
export {
  createLoggerMiddleware as createLoggerMiddlewareEnhanced,
  getRequestId,
  createRequestIdLogger,
} from "./logger.js";
export type { LogLevel, LogEntry, LoggerConfig } from "./logger.js";

// Telemetry middleware (Traces, Metrics)
export {
  createTelemetryMiddleware as createTelemetryMiddlewareEnhanced,
  createMetricsMiddleware,
  getTraceContext,
  createCustomSpan,
} from "./telemetry.js";
export type { TelemetryConfig } from "./telemetry.js";

// Security middleware
export {
  createSecureHeadersMiddleware,
  secureHeadersMiddleware,
} from "./security.js";
export type { SecureHeadersConfig } from "./security.js";

// Auth middleware
export { clerkAuth, createClerkMiddleware } from "./clerk.js";

// Error handling
export { errorHandler, notFoundHandler } from "./error-handler.js";

// Combine middleware utilities
export {
  createConditionalAuth,
  createAuthOrRateLimit,
  createAuthAndCheck,
  some,
  every,
  except,
} from "./combine.js";
