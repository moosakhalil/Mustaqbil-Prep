// Quick end-to-end database check: connects with both Neon URLs and runs a query.
import postgres from "postgres";

try {
  process.loadEnvFile(".env.local");
} catch {
  // variables may already be in the environment
}

function clean(raw) {
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}

for (const name of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
  const raw = process.env[name];
  if (!raw) {
    console.log(`${name}: MISSING`);
    process.exitCode = 1;
    continue;
  }
  const host = new URL(raw).host;
  const sql = postgres(clean(raw), { prepare: false, ssl: "require", max: 1 });
  try {
    const [row] = await sql`select current_database() as db, version() as v`;
    console.log(`${name}: OK (${host}) db=${row.db} ${row.v.split(",")[0]}`);
  } catch (e) {
    console.log(`${name}: FAILED (${host}) ${e.message}`);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}
