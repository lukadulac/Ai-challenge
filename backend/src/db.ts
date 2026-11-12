import pg from "pg";

// The one thing the backend needs from a database. A `pg` pool satisfies it in
// production and PGlite satisfies it in tests.
export interface Db {
  query<Row>(sql: string, params?: unknown[]): Promise<{ rows: Row[] }>;
}

/**
 * Supabase requires SSL. With Supabase's CA certificate the server's identity is
 * verified; without it the connection is encrypted but not verified.
 */
export function connectToPostgres(connectionString: string, caCertificate?: string): Db {
  const ssl = caCertificate ? { ca: caCertificate } : { rejectUnauthorized: false };
  const pool = new pg.Pool({ connectionString, ssl });
  // An idle connection dropped by the pooler must not crash the server; the pool replaces it.
  pool.on("error", (err) => console.error("Database connection lost:", err.message));
  return {
    query: async <Row>(sql: string, params?: unknown[]) => {
      const result = await pool.query(sql, params);
      return { rows: result.rows as Row[] };
    },
  };
}
