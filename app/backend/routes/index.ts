import { Hono } from "hono";
import type { AppContext } from "../types/context.js";
import health from "./health.js";
import docs from "./docs.js";
import users from "./users.js";
import posts from "./posts.js";

/**
 * Main API routes aggregator
 * All routes are mounted under /api prefix
 */
const apiRoutes = new Hono<AppContext>()
  // Health check routes (no auth required)
  .route("/health", health)
  // Documentation routes (no auth required)
  .route("/docs", docs)
  // User routes (auth required)
  .route("/users", users)
  // Post routes (auth required)
  .route("/posts", posts);

export default apiRoutes;
export type ApiRoutesAppType = typeof apiRoutes;
