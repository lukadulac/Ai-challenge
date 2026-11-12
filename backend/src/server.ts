import { existsSync, readFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app";
import { type Config, loadConfig } from "./config";
import { connectToPostgres } from "./db";

const envFile = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

let config: Config;
try {
  config = loadConfig(process.env);
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}

let caCertificate: string | undefined;
if (config.databaseCaCertPath) {
  // Relative paths are relative to backend/, where the .env file lives.
  const caPath = resolve(fileURLToPath(new URL("..", import.meta.url)), config.databaseCaCertPath);
  try {
    caCertificate = readFileSync(caPath, "utf8");
  } catch {
    console.error(
      `DATABASE_CA_CERT points to ${caPath}, which can't be read.\n` +
        "  It must be the file name of Supabase's downloaded CA certificate (e.g. prod-ca-2021.crt), not an API key.\n" +
        "  Leave it empty to connect without verifying the certificate.",
    );
    process.exit(1);
  }
} else {
  console.warn("DATABASE_CA_CERT isn't set: the database connection is encrypted but its certificate isn't verified.");
}

const db = connectToPostgres(config.databaseUrl, caCertificate);
try {
  await db.query("select 1 from students limit 1");
} catch (err) {
  const missingTable = (err as { code?: string }).code === "42P01";
  // Supabase's direct host (db.<ref>.supabase.co) is IPv6-only, so it often doesn't resolve.
  const directSupabaseHost = /@db\.[a-z0-9]+\.supabase\.co/.test(config.databaseUrl);
  console.error(
    missingTable
      ? "The database has no tables yet: run backend/db/schema.sql in the Supabase SQL editor first."
      : `Can't reach the database. Check DATABASE_URL in backend/.env.\n  ${(err as Error).message}` +
          (directSupabaseHost
            ? "\n  This is Supabase's Direct connection string; use the Session pooler one instead (Connect → Session pooler)."
            : ""),
  );
  process.exit(1);
}

createApp({ db, jwtSecret: config.jwtSecret }).listen(config.port, "0.0.0.0", () => {
  const lanAddresses = Object.values(networkInterfaces())
    .flat()
    .filter((address) => address?.family === "IPv4" && !address.internal)
    .map((address) => `http://${address!.address}:${config.port}`);
  console.log(`API listening on port ${config.port}.`);
  if (lanAddresses.length) console.log(`From a phone on the same Wi-Fi use: ${lanAddresses.join(" or ")}`);
});
