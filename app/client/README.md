# Frontend

This folder contains all React Router frontend code.

## Structure

- `routes/` - React Router route files
- `components/` - React components
- `root.tsx` - Root layout component
- `entry.server.tsx` - Server-side rendering entry point
- `app.css` - Global styles

## Usage

All frontend code should import from `@frontend/*` or use relative paths.

## Important

- Never import from `@backend/*` in frontend code
- Use `@shared/*` for shared utilities and types
- All API calls should go through React Router loaders/actions

