import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import type { AppContext } from "../types/context.js";
import { clerkAuth } from "../middleware/clerk.js";
import {
  createPostSchema,
  updatePostSchema,
  postIdSchema,
  type CreatePostInput,
  type UpdatePostInput,
} from "../schemas/post.js";
import { paginationSchema } from "../schemas/user.js";

/**
 * Post routes
 * Example CRUD operations for posts
 * All routes require authentication
 */
const posts = new Hono<AppContext>()
  // Get all posts (with pagination)
  .get(
    "/",
    clerkAuth,
    zValidator("query", paginationSchema),
    async (c) => {
      const prisma = c.get("prisma");
      const { page = 1, limit = 10 } = c.req.valid("query");

      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          skip,
          take: limit,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            id: "desc",
          },
        }),
        prisma.post.count(),
      ]);

      return c.json({
        data: posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  )

  // Get post by ID
  .get(
    "/:id",
    clerkAuth,
    zValidator("param", postIdSchema),
    async (c) => {
      const prisma = c.get("prisma");
      const { id } = c.req.valid("param");

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!post) {
        throw new HTTPException(404, {
          message: "Post not found",
        });
      }

      return c.json({ data: post });
    }
  )

  // Create post
  .post(
    "/",
    clerkAuth,
    zValidator("json", createPostSchema),
    async (c) => {
      const prisma = c.get("prisma");
      const data: CreatePostInput = c.req.valid("json");

      try {
        // Verify author exists
        const author = await prisma.user.findUnique({
          where: { id: data.authorId },
        });

        if (!author) {
          throw new HTTPException(404, {
            message: "Author not found",
          });
        }

        const post = await prisma.post.create({
          data,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return c.json({ data: post }, 201);
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error;
        }
        throw error;
      }
    }
  )

  // Update post
  .put(
    "/:id",
    clerkAuth,
    zValidator("param", postIdSchema),
    zValidator("json", updatePostSchema),
    async (c) => {
      const prisma = c.get("prisma");
      const { id } = c.req.valid("param");
      const data: UpdatePostInput = c.req.valid("json");

      try {
        const post = await prisma.post.update({
          where: { id },
          data,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return c.json({ data: post });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2025"
        ) {
          throw new HTTPException(404, {
            message: "Post not found",
          });
        }
        throw error;
      }
    }
  )

  // Delete post
  .delete(
    "/:id",
    clerkAuth,
    zValidator("param", postIdSchema),
    async (c) => {
      const prisma = c.get("prisma");
      const { id } = c.req.valid("param");

      try {
        await prisma.post.delete({
          where: { id },
        });

        return c.json({ message: "Post deleted successfully" }, 200);
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2025"
        ) {
          throw new HTTPException(404, {
            message: "Post not found",
          });
        }
        throw error;
      }
    }
  );

export default posts;
export type PostsAppType = typeof posts;
