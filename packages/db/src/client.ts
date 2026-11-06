import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

type DatabaseState = {
  sql: Sql;
  db: Database;
};

const globalForDb = globalThis as unknown as {
  __zorqDb?: DatabaseState;
};

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return url;
}

export function getDb(): Database {
  if (!globalForDb.__zorqDb) {
    const sql = postgres(connectionString(), {
      prepare: false,
      max: 1,
      idle_timeout: 30,
      connect_timeout: 30,
      onnotice: () => undefined,
    });
    globalForDb.__zorqDb = {
      sql,
      db: drizzle(sql, { schema }),
    };
  }

  return globalForDb.__zorqDb.db;
}

export function getSql(): Sql {
  getDb();
  const state = globalForDb.__zorqDb;
  if (!state) {
    throw new Error("Database was not initialised");
  }
  return state.sql;
}

export async function closeDb(): Promise<void> {
  const state = globalForDb.__zorqDb;
  if (!state) {
    return;
  }
  globalForDb.__zorqDb = undefined;
  await state.sql.end({ timeout: 5 });
}

export type { Database };
export * from "./schema";
