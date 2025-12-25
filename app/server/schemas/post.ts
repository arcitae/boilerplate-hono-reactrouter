import { z } from "zod";

/**
 * Post validation schemas
 * These schemas are used for request validation and can be shared with frontend
 */

/**
 * Schema for creating a post
 */
export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  published: z.boolean().default(false),
  authorId: z.number().int().positive("Author ID must be a positive integer"),
});

/**
 * Schema for updating a post
 */
export const updatePostSchema = z.object({
  title: z.string().min(1, "Title must not be empty").optional(),
  content: z.string().optional(),
  published: z.boolean().optional(),
});

/**
 * Schema for post ID parameter
 */
export const postIdSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      throw new Error("Invalid post ID");
    }
    return num;
  }),
});

/**
 * Type exports for use in route handlers
 */
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostIdParams = z.infer<typeof postIdSchema>;
