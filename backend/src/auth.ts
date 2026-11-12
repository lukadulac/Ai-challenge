import bcrypt from "bcryptjs";
import { type RequestHandler, Router } from "express";
import jwt from "jsonwebtoken";
import { type AuthResponse, loginRequestSchema, registerRequestSchema, type Student } from "./contract";
import type { Db } from "./db";
import { ApiError, parseBody } from "./errors";

// A cost-10 hash of a discarded random password. Compared against when the email
// is unknown, so both kinds of failed sign-in take as long.
const unknownStudentHash = "$2b$10$d2cmhtrdeux6PZcY8P378e5c3dzrGMOaKyZ2i4D3pyoqjn8MgyHGS";

export function authRoutes(db: Db, jwtSecret: string) {
  const router = Router();

  const respondWithToken = (student: Student): AuthResponse => ({
    token: jwt.sign({}, jwtSecret, { subject: student.id, expiresIn: "30d", algorithm: "HS256" }),
    student,
  });

  router.post("/register", async (req, res) => {
    const { email, password } = parseBody(registerRequestSchema, req.body);
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await db.query<Student>(
      `insert into students (email, password_hash) values ($1, $2)
       on conflict do nothing
       returning id, email`,
      [email, passwordHash],
    );
    const student = rows[0];
    if (!student) throw new ApiError("email_taken", "Nalog sa ovim emailom već postoji.");
    res.status(201).json(respondWithToken(student));
  });

  router.post("/login", async (req, res) => {
    const { email, password } = parseBody(loginRequestSchema, req.body);
    const { rows } = await db.query<Student & { password_hash: string }>(
      "select id, email, password_hash from students where lower(email) = $1",
      [email],
    );
    const row = rows[0];
    const passwordMatches = await bcrypt.compare(password, row?.password_hash ?? unknownStudentHash);
    if (!row || !passwordMatches) throw new ApiError("invalid_credentials", "Pogrešan email ili lozinka.");
    res.json(respondWithToken({ id: row.id, email: row.email }));
  });

  return router;
}

declare global {
  namespace Express {
    interface Locals {
      studentId: string;
    }
  }
}

/** Resolves the signed-in Student from the bearer token into `res.locals.studentId`. */
export function requireStudent(jwtSecret: string): RequestHandler {
  return (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const studentId = token && verifiedSubject(token, jwtSecret);
    if (!studentId) throw new ApiError("unauthorized", "Prijavi se ponovo.");
    res.locals.studentId = studentId;
    next();
  };
}

function verifiedSubject(token: string, jwtSecret: string): string | undefined {
  try {
    return jwt.verify(token, jwtSecret, { algorithms: ["HS256"] }).sub as string | undefined;
  } catch {
    return undefined;
  }
}
