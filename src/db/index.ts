import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Neon's pooled connection runs through PgBouncer (transaction mode), so prepared statements are off.
// The driver does not do SCRAM channel binding, so that URL option is dropped before connecting.
function cleanUrl(raw: string) {
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

const client =
  globalForDb.pg ??
  postgres(cleanUrl(process.env.DATABASE_URL!), { prepare: false, ssl: "require", max: 5 });

if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
