import { beforeAll, describe, expect, test } from "vitest";
import { authResponseSchema } from "../src/contract";
import { createTestApi } from "./support";

let api: Awaited<ReturnType<typeof createTestApi>>;

const tooLongPassword = "Lozinka može imati najviše 72 znaka (č, ć, š, ž i đ se računaju kao dva).";

beforeAll(async () => {
  api = await createTestApi();
});

describe("registration", () => {
  test("a Student registers and is signed in straight away", async () => {
    const res = await api.http().post("/auth/register").send({ email: "ana@example.com", password: "lozinka123" });

    expect(res.status).toBe(201);
    const body = authResponseSchema.parse(res.body);
    expect(body.student.email).toBe("ana@example.com");
    expect(body.token).not.toBe("");
  });

  test("an email is stored trimmed and lower-cased", async () => {
    const res = await api.http().post("/auth/register").send({ email: "  Marko@Example.COM ", password: "lozinka123" });

    expect(res.status).toBe(201);
    expect(res.body.student.email).toBe("marko@example.com");
  });

  test("an email that is already registered, in any case, is refused", async () => {
    await api.http().post("/auth/register").send({ email: "jelena@example.com", password: "lozinka123" });

    const res = await api.http().post("/auth/register").send({ email: "Jelena@Example.com", password: "drugalozinka" });

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({ code: "email_taken", message: "Nalog sa ovim emailom već postoji." });
  });

  test("an invalid email is refused with a message on the email field", async () => {
    const res = await api.http().post("/auth/register").send({ email: "nije-email", password: "lozinka123" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_failed");
    expect(res.body.error.fields).toEqual({ email: "Unesi ispravnu email adresu." });
  });

  test("a password shorter than 8 characters is refused", async () => {
    const res = await api.http().post("/auth/register").send({ email: "kratka@example.com", password: "1234567" });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ password: "Lozinka mora imati najmanje 8 znakova." });
  });

  test("a password of exactly 8 characters is accepted", async () => {
    const res = await api.http().post("/auth/register").send({ email: "osam@example.com", password: "12345678" });

    expect(res.status).toBe(201);
  });

  test("a password longer than 72 characters is refused", async () => {
    const res = await api.http().post("/auth/register").send({ email: "duga@example.com", password: "a".repeat(73) });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ password: tooLongPassword });
  });

  test("letters with diacritics count twice towards the password limit, and the message says so", async () => {
    // 37 × "č" is 37 characters but 74 bytes, over bcrypt's 72-byte limit.
    const res = await api.http().post("/auth/register").send({ email: "kvacice@example.com", password: "č".repeat(37) });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ password: tooLongPassword });
  });

  test("a body too large to read is refused as a validation failure, not a server error", async () => {
    const res = await api.http().post("/auth/login").send({ email: "velika@example.com", password: "a".repeat(200_000) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_failed");
  });

  test("a body that isn't JSON is refused as a validation failure", async () => {
    const res = await api.http().post("/auth/register").set("Content-Type", "application/json").send("{nope");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_failed");
  });
});

describe("sign-in", () => {
  test("a registered Student signs in with their email in any case", async () => {
    await api.http().post("/auth/register").send({ email: "petar@example.com", password: "lozinka123" });

    const res = await api.http().post("/auth/login").send({ email: "PETAR@example.com", password: "lozinka123" });

    expect(res.status).toBe(200);
    const body = authResponseSchema.parse(res.body);
    expect(body.student.email).toBe("petar@example.com");
  });

  test("a wrong password and an unknown email get the identical answer", async () => {
    await api.http().post("/auth/register").send({ email: "mila@example.com", password: "lozinka123" });

    const wrongPassword = await api.http().post("/auth/login").send({ email: "mila@example.com", password: "pogresna123" });
    const unknownEmail = await api.http().post("/auth/login").send({ email: "niko@example.com", password: "lozinka123" });

    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body).toEqual({ error: { code: "invalid_credentials", message: "Pogrešan email ili lozinka." } });
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  test("a short password at sign-in is just wrong credentials, not a rule violation", async () => {
    const res = await api.http().post("/auth/login").send({ email: "mila@example.com", password: "123" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("invalid_credentials");
  });
});
