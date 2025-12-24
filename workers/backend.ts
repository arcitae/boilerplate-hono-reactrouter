/**
 * Backend Cloudflare Worker Entry Point
 * Handles all API routes via Hono
 * 
 * This worker is completely separate from the frontend worker.
 * Frontend worker calls this via HTTP requests.
 */
export { default } from "../app/backend/index.js";

