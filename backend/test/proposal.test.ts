import { beforeAll, describe, expect, test } from "vitest";
import { addDays, daysBetween, proposalResponseSchema } from "../src/contract";
import { bearer, createTestApi } from "./support";

let api: Awaited<ReturnType<typeof createTestApi>>;
let token: string;

beforeAll(async () => {
  api = await createTestApi();
  token = await api.signUp();
});

const propose = (input: Record<string, unknown>) =>
  api.http().post("/plans/proposal").set(bearer(token)).send({ subject: "Matematika 1", ...input });

describe("worked examples from the spec", () => {
  test("6 weekly hours over two weeks: three 2 h days a week, Learning then Review then Mock Exam", async () => {
    const res = await propose({ today: "2026-11-12", examDate: "2026-11-26", weeklyHours: 6 });

    expect(res.status).toBe(200);
    expect(proposalResponseSchema.parse(res.body)).toEqual({
      activities: [
        { date: "2026-11-14", durationMinutes: 120, type: "learning" },
        { date: "2026-11-16", durationMinutes: 120, type: "learning" },
        { date: "2026-11-18", durationMinutes: 120, type: "learning" },
        { date: "2026-11-21", durationMinutes: 120, type: "review" },
        { date: "2026-11-23", durationMinutes: 120, type: "review" },
        { date: "2026-11-25", durationMinutes: 120, type: "mock_exam" },
      ],
      totalMinutes: 720,
    });
  });

  test("an exam tomorrow gets a single Review Activity today", async () => {
    const res = await propose({ today: "2026-11-12", examDate: "2026-11-13", weeklyHours: 3 });

    expect(res.body).toEqual({
      activities: [{ date: "2026-11-12", durationMinutes: 90, type: "review" }],
      totalMinutes: 90,
    });
  });

  test("5 weekly hours: a full week gets 2 h, 1.5 h, 1.5 h, and a partial week keeps only its later days", async () => {
    // Last study day 11-19. The full week (11-13 … 11-19) studies on 11-15, 11-17, 11-19;
    // the partial week before it would study on 11-08, 11-10, 11-12, of which only 11-12 is not in the past.
    const res = await propose({ today: "2026-11-12", examDate: "2026-11-20", weeklyHours: 5 });

    expect(res.body).toEqual({
      activities: [
        { date: "2026-11-12", durationMinutes: 90, type: "learning" },
        { date: "2026-11-15", durationMinutes: 120, type: "learning" },
        { date: "2026-11-17", durationMinutes: 90, type: "review" },
        { date: "2026-11-19", durationMinutes: 90, type: "mock_exam" },
      ],
      totalMinutes: 390,
    });
  });
});

test("dates in years before 100 stay in their own century", async () => {
  const res = await propose({ today: "0099-12-31", examDate: "0100-01-05", weeklyHours: 6 });

  expect(res.status).toBe(200);
  expect(res.body.activities.at(-1).date).toBe("0100-01-04");
});

describe("input rules", () => {
  const valid = { today: "2026-11-12", examDate: "2026-11-26", weeklyHours: 6 };

  test.each([
    ["today", "2026-11-12", "Datum ispita mora biti najranije sutra."],
    ["in the past", "2026-11-01", "Datum ispita mora biti najranije sutra."],
    ["366 days away", "2027-11-13", "Datum ispita može biti najkasnije za godinu dana."],
    ["not a real date", "2026-02-30", "Izaberi ispravan datum ispita."],
    ["missing", undefined, "Izaberi ispravan datum ispita."],
  ])("an Exam Date %s is refused", async (_case, examDate, message) => {
    const res = await propose({ ...valid, examDate });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: "validation_failed", fields: { examDate: message } });
  });

  test("an Exam Date exactly 365 days away is accepted", async () => {
    const res = await propose({ ...valid, examDate: "2027-11-12" });

    expect(res.status).toBe(200);
  });

  test.each([
    [0, "Broj sati nedeljno mora biti od 1 do 40."],
    [41, "Broj sati nedeljno mora biti od 1 do 40."],
    [2.5, "Broj sati nedeljno mora biti ceo broj."],
    ["6", "Unesi broj sati nedeljno."],
  ])("Weekly Hours of %j are refused", async (weeklyHours, message) => {
    const res = await propose({ ...valid, weeklyHours });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ weeklyHours: message });
  });

  test.each([1, 40])("Weekly Hours of %i are accepted", async (weeklyHours) => {
    const res = await propose({ ...valid, weeklyHours });

    expect(res.status).toBe(200);
  });

  test.each([
    ["empty", "", "Unesi naziv predmeta."],
    ["only spaces", "   ", "Unesi naziv predmeta."],
    ["101 characters", "a".repeat(101), "Naziv predmeta može imati najviše 100 znakova."],
    ["missing", undefined, "Unesi naziv predmeta."],
  ])("a Subject that is %s is refused", async (_case, subject, message) => {
    const res = await propose({ ...valid, subject });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ subject: message });
  });

  test("a Subject of 100 characters is accepted", async () => {
    const res = await propose({ ...valid, subject: "a".repeat(100) });

    expect(res.status).toBe(200);
  });
});

describe("invariants over a grid of inputs", () => {
  // The second "today" makes the plans cross 29 February 2028.
  const todays = ["2026-11-12", "2028-02-20"];
  const daysToExam = [1, 6, 7, 8, 15, 30, 365];
  const weeklyHours = Array.from({ length: 40 }, (_, i) => i + 1);
  const typeOrder = { learning: 0, review: 1, mock_exam: 2 };

  test.each(todays.flatMap((today) => daysToExam.map((days) => [today, days] as const)))(
    "today %s, exam in %i days, every Weekly Hours from 1 to 40",
    async (today, days) => {
      const examDate = addDays(today, days);
      const lastStudyDay = addDays(examDate, -1);

      for (const hours of weeklyHours) {
        const res = await propose({ today, examDate, weeklyHours: hours });
        const { activities, totalMinutes } = proposalResponseSchema.parse(res.body);
        const context = `weeklyHours=${hours}`;
        const dates = activities.map((a) => a.date);

        expect(dates.every((date) => date >= today && date <= lastStudyDay), context).toBe(true);
        expect(dates, context).toEqual([...new Set(dates)].sort());
        expect(dates.at(-1), context).toBe(lastStudyDay);
        expect(activities.every((a) => a.durationMinutes % 30 === 0 && a.durationMinutes >= 60), context).toBe(true);
        expect(totalMinutes, context).toBe(activities.reduce((sum, a) => sum + a.durationMinutes, 0));

        const ranks = activities.map((a) => typeOrder[a.type]);
        expect(ranks, context).toEqual([...ranks].sort());

        // Every 7-day block counted back from the last study day that lies wholly from today on.
        const fullBlocks = Math.floor((daysBetween(today, lastStudyDay) + 1) / 7);
        for (let block = 0; block < fullBlocks; block++) {
          const minutes = activities
            .filter((a) => Math.floor(daysBetween(a.date, lastStudyDay) / 7) === block)
            .reduce((sum, a) => sum + a.durationMinutes, 0);
          expect(minutes, `${context} block=${block}`).toBe(hours * 60);
        }
      }
    },
  );
});

describe("access", () => {
  const input = { subject: "Fizika", today: "2026-11-12", examDate: "2026-11-26", weeklyHours: 6 };

  test("a Proposal needs a signed-in Student", async () => {
    const res = await api.http().post("/plans/proposal").send(input);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthorized");
  });

  test("a malformed token is refused", async () => {
    const res = await api.http().post("/plans/proposal").set(bearer("not-a-jwt")).send(input);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthorized");
  });

  test("a token issued by a different server is refused", async () => {
    const otherServer = await createTestApi({ jwtSecret: "a-different-secret-0123456789abcdef0123" });
    const foreignToken = await otherServer.signUp();

    const res = await api.http().post("/plans/proposal").set(bearer(foreignToken)).send(input);

    expect(res.status).toBe(401);
  });
});
