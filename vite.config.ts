import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from 'vite-tsconfig-paths';
import path from "node:path";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  
  return {
    plugins: [
      // Cloudflare plugin - only active in production builds
      // In dev, React Router's dev server uses entry.server.tsx directly
      // The plugin is needed for production builds to Cloudflare Workers
      ...(isDev ? [] : [
        cloudflare({ 
          viteEnvironment: { name: "ssr" },
          configPath: "./wrangler.frontend.toml",
        })
      ]),
      tailwindcss(),
      reactRouter(), // reactRouter() already includes React support, no need for viteReact()
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
    resolve: {
      alias: {
        "@frontend": path.resolve(__dirname, "./app/frontend"),
        "@backend": path.resolve(__dirname, "./app/backend"),
        "@shared": path.resolve(__dirname, "./app/shared"),
      },
    },
    server: {
      hmr: {
        overlay: true,
      },
      // Proxy API requests to backend worker in development
      proxy: {
        "/api": {
          target: "http://localhost:8787",
          changeOrigin: true,
        },
      },
    },
    // Define environment variables for client-side
    define: {
      // BACKEND_URL will be available as import.meta.env.VITE_BACKEND_URL
      // Set this in .env.local or wrangler.frontend.toml
    },
    // Ensure backend code is not included in client bundle
    build: {
      rollupOptions: {
        external: (id) => {
          // Exclude backend code from client bundle
          if (
            id.includes("/app/backend/") ||
            id.startsWith("@backend/") ||
            id.includes("\\app\\backend\\") // Windows paths
          ) {
            return true;
          }
          return false;
        },
      },
    },
    // Optimize dependencies to exclude backend
    optimizeDeps: {
      exclude: ["@backend/*"],
    },
  };
});
