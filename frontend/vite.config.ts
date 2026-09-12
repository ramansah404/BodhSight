import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Manual chunk names for heavy vendors
const VENDOR_CHUNKS: Record<string, string[]> = {
  "vendor-recharts": ["recharts"],
  "vendor-framer": ["framer-motion"],
  "vendor-lucide": ["lucide-react"],
  "vendor-export": ["xlsx", "jspdf", "html2canvas", "docx"],
  "vendor-react": ["react", "react-dom", "react-router-dom"],
};

function manualChunks(id: string): string | undefined {
  for (const [chunk, pkgs] of Object.entries(VENDOR_CHUNKS)) {
    if (pkgs.some((pkg) => id.includes(`/node_modules/${pkg}/`) || id.includes(`\\node_modules\\${pkg}\\`))) {
      return chunk;
    }
  }
  return undefined;
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
    // Warn only for chunks larger than 1MB (xlsx/jspdf will always be large)
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dev server HMR
  server: {
    warmup: {
      clientFiles: [
        "./src/App.tsx",
        "./src/components/layout/Layout.tsx",
        "./src/components/layout/Sidebar.tsx",
        "./src/pages/Dashboard.tsx",
      ],
    },
  },
});
