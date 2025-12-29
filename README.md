# Hono + React Router + Vite + ShadCN UI on Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/react-router-hono-fullstack-template)
![Build modern full-stack apps with Hono, React Router, and ShadCN UI on Cloudflare Workers](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/24c5a7dd-e1e3-43a9-b912-d78d9a4293bc/public)

<!-- dash-content-start -->

A modern full-stack template powered by [Cloudflare Workers](https://workers.cloudflare.com/), using [Hono](https://hono.dev/) for backend APIs, [React Router](https://reactrouter.com/) for frontend routing, and [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components styled with [Tailwind CSS](https://tailwindcss.com/).

Built with the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/) for optimized static asset delivery and seamless local development. React is configured in single-page app (SPA) mode via Workers.

A perfect starting point for building interactive, styled, and edge-deployed SPAs with minimal configuration.

## Features

- ⚡ Full-stack app on Cloudflare Workers
- 🔁 Hono for backend API endpoints
- 🧭 React Router for client-side routing
- 🎨 ShadCN UI with Tailwind CSS for components and styling
- 🧱 File-based route separation
- 🚀 Zero-config Vite build for Workers
- 🛠️ Automatically deploys with Wrangler
- 🔎 Built-in Observability to monitor your Worker
<!-- dash-content-end -->

## Tech Stack

- **Frontend**: React + React Router + ShadCN UI
  - SPA architecture powered by React Router
  - Includes accessible, themeable UI from ShadCN
  - Styled with utility-first Tailwind CSS
  - Built and optimized with Vite

- **Backend**: Hono on Cloudflare Workers
  - API routes defined and handled via Hono in `/api/*`
  - Supports REST-like endpoints, CORS, and middleware

- **Deployment**: Cloudflare Workers via Wrangler
  - Vite plugin auto-bundles frontend and backend together
  - Deployed worldwide on Cloudflare’s edge network

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (React Router dev server - recommended)
npm run dev

# Or test Cloudflare Workers environment
npm run dev:server
```

### Deployment

```bash
# Build and deploy to Cloudflare Workers
npm run deploy
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## Architecture

This template uses a **single Cloudflare Worker** that handles both:
- **Frontend routes** (React Router) - All non-API routes
- **Backend API routes** (Hono) - All `/api/*` routes

**Benefits:**
- ✅ Zero-latency API calls from server-side loaders (direct function calls)
- ✅ Same-origin requests (no CORS needed)
- ✅ Simplified deployment and configuration
- ✅ Single worker to manage

See [SEPARATE_WORKERS_SETUP.md](./SEPARATE_WORKERS_SETUP.md) for architecture details.

## Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Local development setup
- [SEPARATE_WORKERS_SETUP.md](./SEPARATE_WORKERS_SETUP.md) - Architecture overview

## Resources

- 🧩 [Hono on Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- 📦 [Vite Plugin for Cloudflare](https://developers.cloudflare.com/workers/vite-plugin/)
- 🛠 [Wrangler CLI reference](https://developers.cloudflare.com/workers/wrangler/)
- 🎨 [shadcn/ui](https://ui.shadcn.com)
- 💨 [Tailwind CSS Documentation](https://tailwindcss.com/)
- 🔀 [React Router Docs](https://reactrouter.com/)
