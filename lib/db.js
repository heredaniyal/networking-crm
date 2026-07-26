import { Pool } from "pg";

// Reuse the pool across hot reloads in dev instead of opening a new one per request.
const globalForPg = globalThis;

const pool =
  globalForPg._pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (!globalForPg._pgPool) {
  globalForPg._pgPool = pool;
}

export default pool;
