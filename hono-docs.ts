import { defineConfig } from "@rcmade/hono-docs";

/**
 * Hono Docs Configuration
 * Auto-generates OpenAPI 3.0 specification from Hono route type definitions
 * 
 * Run: npm run docs:generate
 */
export default defineConfig({
  tsConfigPath: "./tsconfig.json",
  openApi: {
    openapi: "3.0.0",
    info: {
      title: "Panya API",
      version: "1.0.0",
      description: "API documentation for Panya language learning platform",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API Base URL",
      },
    ],
  },
  outputs: {
    openApiJson: "./openapi/openapi.json",
  },
  apis: [
    {
      name: "Health Routes",
      apiPrefix: "/health",
      appTypePath: "app/backend/routes/health.ts",
      api: [
        {
          api: "/",
          method: "get",
          summary: "Health check",
          description: "Returns the health status of the API",
          tag: ["Health"],
        },
        {
          api: "/ready",
          method: "get",
          summary: "Readiness check",
          description:
            "Checks if the service is ready to accept traffic (includes database check)",
          tag: ["Health"],
        },
        {
          api: "/live",
          method: "get",
          summary: "Liveness check",
          description: "Checks if the service is alive",
          tag: ["Health"],
        },
      ],
    },
    {
      name: "User Routes",
      apiPrefix: "/users",
      appTypePath: "app/backend/routes/users.ts",
      api: [
        {
          api: "/",
          method: "get",
          summary: "Get all users",
          description: "Retrieve a paginated list of users",
          tag: ["Users"],
        },
        {
          api: "/:id",
          method: "get",
          summary: "Get user by ID",
          description: "Retrieve a specific user by their ID",
          tag: ["Users"],
        },
        {
          api: "/",
          method: "post",
          summary: "Create user",
          description: "Create a new user",
          tag: ["Users"],
        },
        {
          api: "/:id",
          method: "put",
          summary: "Update user",
          description: "Update an existing user",
          tag: ["Users"],
        },
        {
          api: "/:id",
          method: "delete",
          summary: "Delete user",
          description: "Delete a user by ID",
          tag: ["Users"],
        },
      ],
    },
    {
      name: "Post Routes",
      apiPrefix: "/posts",
      appTypePath: "app/backend/routes/posts.ts",
      api: [
        {
          api: "/",
          method: "get",
          summary: "Get all posts",
          description: "Retrieve a paginated list of posts",
          tag: ["Posts"],
        },
        {
          api: "/:id",
          method: "get",
          summary: "Get post by ID",
          description: "Retrieve a specific post by its ID",
          tag: ["Posts"],
        },
        {
          api: "/",
          method: "post",
          summary: "Create post",
          description: "Create a new post",
          tag: ["Posts"],
        },
        {
          api: "/:id",
          method: "put",
          summary: "Update post",
          description: "Update an existing post",
          tag: ["Posts"],
        },
        {
          api: "/:id",
          method: "delete",
          summary: "Delete post",
          description: "Delete a post by ID",
          tag: ["Posts"],
        },
      ],
    },
  ],
});
