import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from "path";
import { fileURLToPath } from "node:url";

const filesNeedToExclude = ["src/assets/rawunits.json"];

const filesPathToExclude = filesNeedToExclude.map((src) => {
  return fileURLToPath(new URL(src, import.meta.url));
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "/loag-tabs/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    manifest: true,
    rollupOptions: {
      external: [
        ...filesPathToExclude
      ],
    },
  }
})
