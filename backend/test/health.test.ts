import { expect, test } from "vitest";
import { createTestApi } from "./support";

test("the health check answers so a phone can tell the server is reachable", async () => {
  const api = await createTestApi();

  const res = await api.http().get("/health");

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });
});

test("an unknown route answers with the not_found error shape", async () => {
  const api = await createTestApi();

  const res = await api.http().get("/nope");

  expect(res.status).toBe(404);
  expect(res.body.error.code).toBe("not_found");
});
