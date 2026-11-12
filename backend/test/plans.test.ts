import { beforeAll, describe, expect, test } from "vitest";
import { z } from "zod";
import { activityUpdateResponseSchema, planDetailSchema, planSummarySchema } from "../src/contract";
import { bearer, createTestApi } from "./support";

let api: Awaited<ReturnType<typeof createTestApi>>;

beforeAll(async () => {
  api = await createTestApi();
});

const twoWeeks = { subject: "Matematika 1", today: "2026-11-12", examDate: "2026-11-26", weeklyHours: 6 };

describe("saving a Proposal as a Study Plan", () => {
  test("the saved Study Plan has exactly the Activities the Proposal showed, none completed", async () => {
    const token = await api.signUp();
    const proposal = await api.http().post("/plans/proposal").set(bearer(token)).send(twoWeeks);

    const res = await api.http().post("/plans").set(bearer(token)).send({ ...twoWeeks, subject: "  Matematika 1 " });

    expect(res.status).toBe(201);
    const plan = planDetailSchema.parse(res.body);
    expect(plan).toMatchObject({ subject: "Matematika 1", examDate: "2026-11-26", weeklyHours: 6 });
    expect(plan.activities.map(({ date, durationMinutes, type }) => ({ date, durationMinutes, type }))).toEqual(
      proposal.body.activities,
    );
    expect(plan.activities.every((activity) => !activity.completed)).toBe(true);
    expect(plan.progress).toEqual({ completedActivities: 0, totalActivities: 6, completedMinutes: 0, totalMinutes: 720 });
  });

  test("a Proposal on its own stores nothing", async () => {
    const token = await api.signUp();
    await api.http().post("/plans/proposal").set(bearer(token)).send(twoWeeks);

    const res = await api.http().get("/plans").set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("two Study Plans may name the same Subject", async () => {
    const token = await api.signUp();
    await api.http().post("/plans").set(bearer(token)).send(twoWeeks);

    const res = await api.http().post("/plans").set(bearer(token)).send({ ...twoWeeks, examDate: "2026-12-10" });

    expect(res.status).toBe(201);
    const list = await api.http().get("/plans").set(bearer(token));
    expect(list.body.map((plan: { subject: string }) => plan.subject)).toEqual(["Matematika 1", "Matematika 1"]);
  });

  test("a signed token whose Student doesn't exist (any more) can't save a Study Plan", async () => {
    // Same secret, different database: the token verifies but names no Student here.
    const otherDatabase = await createTestApi();
    const token = await otherDatabase.signUp();

    const res = await api.http().post("/plans").set(bearer(token)).send(twoWeeks);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthorized");
  });

  test("saving checks the same input rules as a Proposal", async () => {
    const token = await api.signUp();

    const res = await api.http().post("/plans").set(bearer(token)).send({ ...twoWeeks, weeklyHours: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ weeklyHours: "Broj sati nedeljno mora biti od 1 do 40." });
  });
});

describe("My Plans", () => {
  test("lists the Student's Study Plans by Exam Date, nearest first, then by when they were saved", async () => {
    const token = await api.signUp();
    const save = (subject: string, examDate: string) =>
      api.http().post("/plans").set(bearer(token)).send({ ...twoWeeks, subject, examDate });
    await save("Hemija", "2027-01-20");
    await save("Fizika", "2026-12-01");
    await save("Biologija", "2027-01-20");

    const res = await api.http().get("/plans").set(bearer(token));

    expect(res.status).toBe(200);
    expect(z.array(planSummarySchema).parse(res.body).map(({ subject, examDate }) => [subject, examDate])).toEqual([
      ["Fizika", "2026-12-01"],
      ["Hemija", "2027-01-20"],
      ["Biologija", "2027-01-20"],
    ]);
  });

  test("each Study Plan in the list carries its Progress", async () => {
    const token = await api.signUp();
    await api.http().post("/plans").set(bearer(token)).send(twoWeeks);

    const res = await api.http().get("/plans").set(bearer(token));

    expect(res.body[0].progress).toEqual({ completedActivities: 0, totalActivities: 6, completedMinutes: 0, totalMinutes: 720 });
  });

  test("a Student never sees another Student's Study Plans", async () => {
    const ana = await api.signUp();
    const marko = await api.signUp();
    await api.http().post("/plans").set(bearer(ana)).send(twoWeeks);

    const res = await api.http().get("/plans").set(bearer(marko));

    expect(res.body).toEqual([]);
  });
});

async function saveTwoWeekPlan(token: string) {
  const res = await api.http().post("/plans").set(bearer(token)).send(twoWeeks);
  return planDetailSchema.parse(res.body);
}

describe("a Study Plan", () => {
  test("opens with its Activities in date order", async () => {
    const token = await api.signUp();
    const saved = await saveTwoWeekPlan(token);

    const res = await api.http().get(`/plans/${saved.id}`).set(bearer(token));

    expect(res.status).toBe(200);
    expect(planDetailSchema.parse(res.body)).toEqual(saved);
    expect(saved.activities.map((a) => a.date)).toEqual([
      "2026-11-14",
      "2026-11-16",
      "2026-11-18",
      "2026-11-21",
      "2026-11-23",
      "2026-11-25",
    ]);
  });

  test("another Student's Study Plan looks like it doesn't exist", async () => {
    const owner = await api.signUp();
    const stranger = await api.signUp();
    const saved = await saveTwoWeekPlan(owner);

    const res = await api.http().get(`/plans/${saved.id}`).set(bearer(stranger));

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({ code: "not_found", message: "Plan nije pronađen." });
  });

  test("an id that isn't a valid Study Plan id is simply not found", async () => {
    const token = await api.signUp();

    const res = await api.http().get("/plans/not-a-uuid").set(bearer(token));

    expect(res.status).toBe(404);
  });
});

describe("marking Activities", () => {
  const mark = (token: string, planId: string, activityId: string, body: unknown) =>
    api.http().patch(`/plans/${planId}/activities/${activityId}`).set(bearer(token)).send(body as object);

  test("completing an Activity updates the Study Plan's Progress everywhere", async () => {
    const token = await api.signUp();
    const plan = await saveTwoWeekPlan(token);
    const first = plan.activities[0]!;

    const res = await mark(token, plan.id, first.id, { completed: true });

    expect(res.status).toBe(200);
    expect(activityUpdateResponseSchema.parse(res.body)).toEqual({
      activity: { ...first, completed: true },
      progress: { completedActivities: 1, totalActivities: 6, completedMinutes: 120, totalMinutes: 720 },
    });
    const detail = await api.http().get(`/plans/${plan.id}`).set(bearer(token));
    expect(detail.body.activities[0].completed).toBe(true);
    expect(detail.body.progress.completedActivities).toBe(1);
    const list = await api.http().get("/plans").set(bearer(token));
    expect(list.body[0].progress.completedMinutes).toBe(120);
  });

  test("unmarking a completed Activity takes it back out of Progress", async () => {
    const token = await api.signUp();
    const plan = await saveTwoWeekPlan(token);
    const first = plan.activities[0]!;
    await mark(token, plan.id, first.id, { completed: true });

    const res = await mark(token, plan.id, first.id, { completed: false });

    expect(res.body.activity.completed).toBe(false);
    expect(res.body.progress).toEqual({ completedActivities: 0, totalActivities: 6, completedMinutes: 0, totalMinutes: 720 });
  });

  test("the last Activity of a Study Plan can be completed ahead of time", async () => {
    const token = await api.signUp();
    const plan = await saveTwoWeekPlan(token);
    const last = plan.activities.at(-1)!;

    const res = await mark(token, plan.id, last.id, { completed: true });

    expect(res.status).toBe(200);
    expect(res.body.progress).toMatchObject({ completedActivities: 1, completedMinutes: 120 });
  });

  test("sending the same mark twice changes nothing the second time", async () => {
    const token = await api.signUp();
    const plan = await saveTwoWeekPlan(token);
    const first = plan.activities[0]!;
    const once = await mark(token, plan.id, first.id, { completed: true });

    const twice = await mark(token, plan.id, first.id, { completed: true });

    expect(twice.status).toBe(200);
    expect(twice.body).toEqual(once.body);
  });

  test("a mark without a true/false completed is refused", async () => {
    const token = await api.signUp();
    const plan = await saveTwoWeekPlan(token);

    const res = await mark(token, plan.id, plan.activities[0]!.id, { completed: "yes" });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("completed");
  });

  test("another Student's Activity can't be marked", async () => {
    const owner = await api.signUp();
    const stranger = await api.signUp();
    const plan = await saveTwoWeekPlan(owner);

    const res = await mark(stranger, plan.id, plan.activities[0]!.id, { completed: true });

    expect(res.status).toBe(404);
    const detail = await api.http().get(`/plans/${plan.id}`).set(bearer(owner));
    expect(detail.body.progress.completedActivities).toBe(0);
  });

  test("an Activity can only be marked through the Study Plan it belongs to", async () => {
    const token = await api.signUp();
    const planA = await saveTwoWeekPlan(token);
    const planB = await saveTwoWeekPlan(token);

    const res = await mark(token, planB.id, planA.activities[0]!.id, { completed: true });

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({ code: "not_found", message: "Aktivnost nije pronađena." });
  });

  test("an Activity id that isn't valid is simply not found", async () => {
    const token = await api.signUp();
    const plan = await saveTwoWeekPlan(token);

    const res = await mark(token, plan.id, "nope", { completed: true });

    expect(res.status).toBe(404);
  });
});

describe("deleting a Study Plan", () => {
  test("removes it from My Plans and takes its Activities with it", async () => {
    const token = await api.signUp();
    const plan = await saveTwoWeekPlan(token);

    const res = await api.http().delete(`/plans/${plan.id}`).set(bearer(token));

    expect(res.status).toBe(204);
    expect((await api.http().get(`/plans/${plan.id}`).set(bearer(token))).status).toBe(404);
    expect((await api.http().get("/plans").set(bearer(token))).body).toEqual([]);
    const markLeftover = await api
      .http()
      .patch(`/plans/${plan.id}/activities/${plan.activities[0]!.id}`)
      .set(bearer(token))
      .send({ completed: true });
    expect(markLeftover.status).toBe(404);
  });

  test("another Student can't delete it", async () => {
    const owner = await api.signUp();
    const stranger = await api.signUp();
    const plan = await saveTwoWeekPlan(owner);

    const res = await api.http().delete(`/plans/${plan.id}`).set(bearer(stranger));

    expect(res.status).toBe(404);
    expect((await api.http().get(`/plans/${plan.id}`).set(bearer(owner))).status).toBe(200);
  });

  test("an id that isn't valid is simply not found", async () => {
    const token = await api.signUp();

    const res = await api.http().delete("/plans/nope").set(bearer(token));

    expect(res.status).toBe(404);
  });
});
