import { z } from "zod";

/**
 * User validation schemas
 * These schemas are used for request validation and can be shared with frontend
 */

/**
 * Schema for creating a user
 */
export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").optional(),
});

/**
 * Schema for updating a user
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, "Name must not be empty").optional(),
  email: z.string().email("Invalid email address").optional(),
});

/**
 * Schema for user ID parameter
 */
export const userIdSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      throw new Error("Invalid user ID");
    }
    return num;
  }),
});

/**
 * Schema for query parameters (pagination, filtering, etc.)
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
});

/**
 * Type exports for use in route handlers
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParams = z.infer<typeof userIdSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
