import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { getRuntimeKey } from "hono/adapter";
import type { AppContext } from "../types/context.js";

/**
 * Error response format
 */
type ErrorResponse = {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
};

/**
 * Global error handler middleware
 * Catches all errors and returns consistent error responses
 */
export async function errorHandler(
  c: Context<AppContext>,
  next: Next
): Promise<Response> {
  try {
    await next();
    return c.res;
  } catch (error) {
    // Log error details (in production, send to monitoring service)
    const isDevelopment = getRuntimeKey() !== "workerd" || 
                         (typeof process !== "undefined" && process.env.NODE_ENV === "development");

    if (isDevelopment) {
      console.error("Error:", error);
    }

    // Handle HTTPException (user-defined errors)
    if (error instanceof HTTPException) {
      const response: ErrorResponse = {
        error: {
          message: error.message,
          code: error.status.toString(),
          ...(isDevelopment && { details: error.cause }),
        },
        timestamp: new Date().toISOString(),
        path: c.req.path,
      };

      return c.json(response, error.status);
    }

    // Handle Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };
      
      // Handle specific Prisma error codes
      if (prismaError.code === "P2002") {
        return c.json(
          {
            error: {
              message: "A record with this value already exists",
              code: "UNIQUE_CONSTRAINT_VIOLATION",
            },
            timestamp: new Date().toISOString(),
            path: c.req.path,
          },
          409
        );
      }

      if (prismaError.code === "P2025") {
        return c.json(
          {
            error: {
              message: "Record not found",
              code: "NOT_FOUND",
            },
            timestamp: new Date().toISOString(),
            path: c.req.path,
          },
          404
        );
      }
    }

    // Handle validation errors (from Zod)
    if (error && typeof error === "object" && "issues" in error) {
      const validationError = error as { issues: Array<{ path: string[]; message: string }> };
      
      return c.json(
        {
          error: {
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            details: validationError.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
          timestamp: new Date().toISOString(),
          path: c.req.path,
        },
        400
      );
    }

    // Handle generic errors
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred";

    const response: ErrorResponse = {
      error: {
        message: isDevelopment ? message : "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
        ...(isDevelopment && error instanceof Error && { details: error.stack }),
      },
      timestamp: new Date().toISOString(),
      path: c.req.path,
    };

    return c.json(response, 500);
  }
}

/**
 * 404 Not Found handler
 * Should be registered as the last route
 */
export function notFoundHandler(c: Context<AppContext>) {
  return c.json(
    {
      error: {
        message: "Route not found",
        code: "NOT_FOUND",
      },
      timestamp: new Date().toISOString(),
      path: c.req.path,
    },
    404
  );
}
