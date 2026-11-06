import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests only. "@/" means src/, as in the app.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"] },
});
