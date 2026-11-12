import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string({ error: "is missing" })
    .regex(/^postgres(ql)?:\/\//, "must be a postgres:// connection string (Supabase → Connect → Session pooler)"),
  DATABASE_CA_CERT: z.string().optional(),
  JWT_SECRET: z.string({ error: "is missing" }).min(32, "must be at least 32 characters"),
  PORT: z.coerce.number().int().positive().default(3000),
});

export interface Config {
  databaseUrl: string;
  /** Path to Supabase's CA certificate; verifies the database's identity when set. */
  databaseCaCertPath?: string;
  jwtSecret: string;
  port: number;
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `  ${issue.path.join(".")} ${issue.message}`);
    throw new Error(`Invalid backend/.env (see backend/.env.example):\n${problems.join("\n")}`);
  }
  const { DATABASE_URL, DATABASE_CA_CERT, JWT_SECRET, PORT } = result.data;
  return { databaseUrl: DATABASE_URL, databaseCaCertPath: DATABASE_CA_CERT || undefined, jwtSecret: JWT_SECRET, port: PORT };
}
