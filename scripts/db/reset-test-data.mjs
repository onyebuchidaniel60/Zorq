import path from "node:path";
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

loadEnv({ path: path.join(process.cwd(), ".env.local"), quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const tables = [
  "authorization_checks",
  "training_rounds",
  "training_runs",
  "job_participants",
  "licenses",
  "chain_transactions",
  "fl_jobs",
  "data_assets",
  "idempotency_records",
];

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  onnotice: () => undefined,
});

try {
  const before = {};
  for (const table of tables) {
    const [row] = await sql.unsafe(`select count(*)::int as count from "${table}"`);
    before[table] = row.count;
  }

  await sql.begin(async (tx) => {
    for (const table of tables) {
      await tx.unsafe(`delete from "${table}"`);
    }
  });

  const after = {};
  for (const table of tables) {
    const [row] = await sql.unsafe(`select count(*)::int as count from "${table}"`);
    after[table] = row.count;
  }

  console.log(JSON.stringify({ before, after }, null, 2));
  console.log("Test data cleared.");
} finally {
  await sql.end({ timeout: 5 });
}
