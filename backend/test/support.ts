import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import request from "supertest";
import { createApp } from "../src/app";

const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");

export async function createTestApi({ jwtSecret = "test-secret-0123456789abcdef0123456789" } = {}) {
  const db = new PGlite();
  await db.exec(schema);
  const app = createApp({ db, jwtSecret });
  const http = () => request(app);
  let students = 0;

  /** Registers a fresh Student and returns their bearer token. */
  async function signUp(): Promise<string> {
    students += 1;
    const res = await http().post("/auth/register").send({ email: `student${students}@example.com`, password: "lozinka123" });
    return res.body.token;
  }

  return { http, signUp };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
