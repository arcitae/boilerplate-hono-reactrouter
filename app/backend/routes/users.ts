import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import type { AppContext } from "../types/context.js";
import { clerkAuth } from "../middleware/clerk.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  paginationSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "../schemas/user.js";

/**
 * User routes
 * Example CRUD operations for users
 * GET routes use optional auth (work without auth for development)
 * POST/PUT/DELETE routes require authentication
 */
const users = new Hono<AppContext>()
  // Get all users (with pagination)
  .get(
    "/",
    clerkAuth,
    zValidator("query", paginationSchema),
    async (c) => {
      const prisma = c.get("prisma");
      const { page = 1, limit = 10 } = c.req.valid("query");

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          include: {
            posts: true,
          },
          orderBy: {
            id: "asc",
          },
        }),
        prisma.user.count(),
      ]);

      return c.json({
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  )

  // Get user by ID
  .get(
    "/:id",
    clerkAuth,
    zValidator("param", userIdSchema),
    async (c) => {
      const prisma = c.get("prisma");
      const { id } = c.req.valid("param");

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          posts: true,
        },
      });

      if (!user) {
        throw new HTTPException(404, {
          message: "User not found",
        });
      }

      return c.json({ data: user });
    }
  )

  // Create user
  .post(
    "/",
    clerkAuth,
    zValidator("json", createUserSchema),
    async (c) => {
      const prisma = c.get("prisma");
      const data: CreateUserInput = c.req.valid("json");

      try {
        const user = await prisma.user.create({
          data,
          include: {
            posts: true,
          },
        });

        return c.json({ data: user }, 201);
      } catch (error) {
        // Handle unique constraint violation
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002"
        ) {
          throw new HTTPException(409, {
            message: "User with this email already exists",
          });
        }
        throw error;
      }
    }
  )

  // Update user
  .put(
    "/:id",
    clerkAuth,
    zValidator("param", userIdSchema),
    zValidator("json", updateUserSchema),
    async (c) => {
      const prisma = c.get("prisma");
      const { id } = c.req.valid("param");
      const data: UpdateUserInput = c.req.valid("json");

      try {
        const user = await prisma.user.update({
          where: { id },
          data,
          include: {
            posts: true,
          },
        });

        return c.json({ data: user });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2025"
        ) {
          throw new HTTPException(404, {
            message: "User not found",
          });
        }
        throw error;
      }
    }
  )

  // Delete user
  .delete(
    "/:id",
    clerkAuth,
    zValidator("param", userIdSchema),
    async (c) => {
      const prisma = c.get("prisma");
      const { id } = c.req.valid("param");

      try {
        await prisma.user.delete({
          where: { id },
        });

        return c.json({ message: "User deleted successfully" }, 200);
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2025"
        ) {
          throw new HTTPException(404, {
            message: "User not found",
          });
        }
        throw error;
      }
    }
  );

export default users;
export type UsersAppType = typeof users;
