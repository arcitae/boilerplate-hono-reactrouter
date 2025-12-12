# Database Setup Guide

Follow these steps to set up your database:

## Step 1: Generate Prisma Client

This generates the TypeScript types for your database models:

```bash
npm run db:generate
```

## Step 2: Create Database Tables

You have two options:

### Option A: Push Schema (Recommended for Development)
This creates/updates tables directly from your schema without migrations:

```bash
npm run db:push
```

### Option B: Create Migration (Recommended for Production)
This creates a migration file that you can version control:

```bash
npm run db:migrate
```

**For now, use Option A (`db:push`) for quick setup.**

## Step 3: Seed the Database

This adds sample data (Alice, Bob, and their posts):

```bash
npm run db:seed
```

## Complete Setup Command

Run all three commands in sequence:

```bash
npm run db:generate && npm run db:push && npm run db:seed
```

## Verify Setup

After running the commands, you can verify everything is working:

1. **Check the database**:
   ```bash
   npm run db:studio
   ```
   This opens Prisma Studio where you can see your tables and data.

2. **Test the API**:
   - Navigate to `http://localhost:5173/users` - should show Alice and Bob
   - Navigate to `http://localhost:5173/posts` - should show 3 posts

## Troubleshooting

### Error: "DATABASE_URL is not set"
- Make sure you have a `.env.local` file with `DATABASE_URL`
- The format should be: `DATABASE_URL="postgresql://user:password@host:port/database"`

### Error: "Can't reach database server"
- Verify your database is running
- Check the connection string in `.env.local`
- For Prisma-hosted databases, get the connection string from the Prisma dashboard

### Error: "Prisma Client not generated"
- Run `npm run db:generate` first
- Make sure you're in the project root directory

## What Each Command Does

- **`db:generate`**: Generates Prisma Client TypeScript types from your schema
- **`db:push`**: Pushes your schema to the database (creates/updates tables)
- **`db:migrate`**: Creates a migration file and applies it to the database
- **`db:seed`**: Runs the seed script to populate sample data
- **`db:studio`**: Opens Prisma Studio (visual database browser)
