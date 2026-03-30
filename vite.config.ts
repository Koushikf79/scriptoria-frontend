import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || "https://scriptoria-backend-yc6g.onrender.com";
  const wsUrl = apiUrl.replace(/^https/, "wss").replace(/^http/, "ws");

  return {
    server: {
      host: "::",
      port: 5173,
      hmr: {
        overlay: false,
      },
      proxy: {
        // Proxy API requests to backend
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path,
        },
        // Proxy WebSocket connections to backend
        '/ws': {
          target: wsUrl,
          ws: true,
          rewrite: (path) => path,
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
