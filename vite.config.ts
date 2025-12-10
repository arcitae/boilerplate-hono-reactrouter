import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from 'vite-tsconfig-paths';
import path from "path";

export default defineConfig({
  plugins: [
    // cloudflare({ viteEnvironment: { name: "ssr" } }),
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
});
