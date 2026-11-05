import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(currentDir, "../../../.env.local"), quiet: true });

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL_UNPOOLED or DATABASE_URL is not configured");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => undefined });
const db = drizzle(sql);

try {
  await migrate(db, { migrationsFolder: path.join(currentDir, "../migrations") });
  console.log("Database migrations applied");
} catch (error) {
  console.error(
    "Database migration failed",
    error instanceof Error ? error.message : "unknown error",
  );
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
