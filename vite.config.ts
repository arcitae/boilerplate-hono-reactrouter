import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from 'vite-tsconfig-paths';
import path from "node:path";

export default defineConfig(() => {
  return {
    plugins: [
      // Cloudflare plugin - only active in production builds
      // In dev, React Router's dev server uses entry.server.tsx directly
      // The plugin is needed for production builds to Cloudflare Workers
      cloudflare({ 
        viteEnvironment: { name: "ssr" },
        configPath: "./wrangler.jsonc",
      }),
      tailwindcss(),
      reactRouter(), // reactRouter() already includes React support, no need for viteReact()
      viteTsConfigPaths(),
    ],
    resolve: {
      alias: {
        "@frontend": path.resolve(__dirname, "./app/client"),
        "@backend": path.resolve(__dirname, "./app/server"),
        "@shared": path.resolve(__dirname, "./app/shared"),
      },
    },
    server: {
      hmr: {
        overlay: true,
      },
      // Proxy API requests to backend worker in development
      // proxy: {
      //   "/api": {
      //     target: "http://localhost:8787",
      //     changeOrigin: true,
      //   },
      // },
    },
    // Define environment variables for client-side
    define: {
      // BACKEND_URL will be available as import.meta.env.VITE_BACKEND_URL
      // Set this in .env.local or wrangler.frontend.toml
    },
    // Note: We don't mark backend as external here because:
    // 1. The worker build (SSR) needs backend code bundled
    // 2. The client build naturally won't include it if client code doesn't import it
    // 3. If needed, we can add client-specific exclusions later
    build: {
      rollupOptions: {
        // No external dependencies - let Vite handle code splitting naturally
      },
    },
  };
});
