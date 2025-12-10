# Backend API

This folder contains all backend code using Hono.

## Structure

- `routes/` - API route handlers
- `middleware/` - Hono middleware (auth, logging, etc.)
- `services/` - Business logic
- `schemas/` - Zod validation schemas
- `lib/` - Backend utilities (Prisma client, etc.)

## Usage

The main Hono app is exported from `index.ts` and imported in `workers/app.ts`.

## Important

- This code should NEVER be imported in frontend code
- All database operations happen here
- All API endpoints are defined here

