import type { Context, Next } from "hono";
import { httpInstrumentationMiddleware } from "@hono/otel";
import type { AppContext } from "../types/context.js";
import type { MiddlewareConfig } from "./config.js";

/**
 * Telemetry Middleware
 * 
 * Observability and monitoring middleware including:
 * - Distributed tracing (OpenTelemetry)
 * - Metrics collection (future)
 * - Performance monitoring
 * - Error tracking
 * 
 * This module groups all telemetry-related middleware together
 * for better organization and extensibility.
 */

/**
 * Telemetry configuration
 */
export interface TelemetryConfig extends MiddlewareConfig["telemetry"] {
  /**
   * Sampling rate (0.0 to 1.0)
   * 1.0 = sample all requests
   * 0.5 = sample 50% of requests
   * 0.0 = sample no requests
   */
  samplingRate?: number;

  /**
   * Custom trace exporters
   * Can be used to send traces to custom backends
   */
  exporters?: unknown[];

  /**
   * Enable metrics collection
   * Future: Add metrics middleware
   */
  enableMetrics?: boolean;
}

/**
 * Create OpenTelemetry middleware
 * Tracks distributed traces across services
 * 
 * Features:
 * - Distributed tracing
 * - Service name configuration
 * - Environment-based enable/disable
 * - Sampling configuration (future)
 * - Custom exporters (future)
 * 
 * Usage:
 * ```ts
 * const telemetryMiddleware = createTelemetryMiddleware({
 *   enabled: true,
 *   serviceName: "panya-api",
 *   samplingRate: 1.0,
 * });
 * app.use("*", telemetryMiddleware);
 * ```
 */
export function createTelemetryMiddleware(config: TelemetryConfig) {
  if (!config.enabled) {
    // Return no-op middleware if disabled
    return async (c: Context<AppContext>, next: Next) => {
      return next();
    };
  }

  // Create OpenTelemetry middleware
  // Note: Sampling and custom exporters can be added in the future
  // when @hono/otel supports these features
  return httpInstrumentationMiddleware({
    serviceName: config.serviceName || "panya-api",
  });
}

/**
 * Create metrics middleware
 * Collects and exports metrics (future implementation)
 * 
 * Planned features:
 * - Request count metrics
 * - Response time metrics
 * - Error rate metrics
 * - Custom business metrics
 * 
 * This is a placeholder for future metrics implementation
 */
export function createMetricsMiddleware(
  config: { enabled: boolean }
): (c: Context<AppContext>, next: Next) => Promise<Response> {
  if (!config.enabled) {
    // Return no-op middleware if disabled
    return async (c: Context<AppContext>, next: Next) => {
      return next();
    };
  }

  // TODO: Implement metrics collection
  // This will collect:
  // - Request count per endpoint
  // - Response time histograms
  // - Error rates
  // - Custom business metrics
  return async (c: Context<AppContext>, next: Next) => {
    // Placeholder: Just pass through for now
    return next();
  };
}

/**
 * Get trace context from request
 * Helper function to extract trace context for custom instrumentation
 */
export function getTraceContext(c: Context<AppContext>): {
  traceId?: string;
  spanId?: string;
} {
  // Extract trace context from headers (W3C Trace Context format)
  const traceParent = c.req.header("traceparent");
  if (traceParent) {
    // Parse traceparent header: version-trace-id-parent-id-trace-flags
    const parts = traceParent.split("-");
    if (parts.length >= 4) {
      return {
        traceId: parts[1],
        spanId: parts[2],
      };
    }
  }

  return {};
}

/**
 * Create custom span
 * Helper function to create custom spans for business logic
 * 
 * Usage:
 * ```ts
 * const span = createCustomSpan(c, "database-query");
 * // ... perform operation ...
 * span.end();
 * ```
 */
export function createCustomSpan(
  c: Context<AppContext>,
  name: string
): { end: () => void } {
  // TODO: Implement custom span creation
  // This will integrate with OpenTelemetry to create custom spans
  return {
    end: () => {
      // Placeholder
    },
  };
}
