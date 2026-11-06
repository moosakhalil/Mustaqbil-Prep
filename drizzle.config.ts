import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load .env.local by itself
try {
  process.loadEnvFile(".env.local");
} catch {
  // fine in CI, where variables come from the environment
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./drizzle",
  // Migrations use the direct (un-pooled) connection
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! },
  schemaFilter: ["public"],
});
