import { act, screen, userEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { failure, fakeServer, mathPlan, planSummary, renderApp } from "./support";

const plan = mathPlan();
const planUrl = `/plans/${plan.id}`;
const activity = (date: string) => screen.getByRole("checkbox", { name: new RegExp(`${date.slice(8, 10)}\\.${date.slice(5, 7)}\\.`) });
const progress = () => screen.getByLabelText(/^Napredak:/);

/**
 * The plan endpoints, keeping state like the real API. With `hold`, each PATCH is applied
 * when it arrives but its reply waits until the test releases it.
 */
function planServer({ outcome = "succeed", hold = false }: { outcome?: "succeed" | "fail"; hold?: boolean } = {}) {
  const completed = new Set(plan.activities.filter((a) => a.completed).map((a) => a.id));
  const current = () =>
    mathPlan({
      activities: plan.activities.map((a) => ({ ...a, completed: completed.has(a.id) })),
      progress: { completedActivities: completed.size, totalActivities: 6, completedMinutes: completed.size * 120, totalMinutes: 720 },
    });
  const held: (() => void)[] = [];
  const server = fakeServer()
    .on("GET /plans/:id", () => ({ status: 200, body: current() }))
    .on("PATCH /plans/:planId/activities/:activityId", ({ params, body }) => {
      let reply = failure(500, "internal_error", "Došlo je do greške na serveru.");
      if (outcome === "succeed") {
        if (body.completed) completed.add(params.activityId!);
        else completed.delete(params.activityId!);
        const updated = current();
        reply = { status: 200, body: { activity: updated.activities.find((a) => a.id === params.activityId), progress: updated.progress } };
      }
      return hold ? new Promise((resolve) => held.push(() => resolve(reply))) : reply;
    });
  return { server, held };
}

async function openPlan(options?: Parameters<typeof planServer>[0]) {
  const { server, held } = planServer(options);
  await renderApp({ url: planUrl });
  await screen.findByRole("header", { name: "Matematika 1" });
  return { server, held, user: userEvent.setup() };
}

test("a Study Plan shows its exam, its Progress, and which Activities are done, missed and today", async () => {
  await openPlan();

  expect(screen.getByText("Ispit 26.11.2026. · još 8 dana")).toBeOnTheScreen();
  expect(progress()).toHaveTextContent(/17%\s*1\/6\s*aktivnosti · 2 od 12 h/);
  expect(activity("2026-11-14")).toBeChecked();
  expect(activity("2026-11-14")).toHaveTextContent(/Završeno/);
  expect(activity("2026-11-16")).toHaveTextContent(/Novo gradivo\s*pon, 16\.11\.\s*Propušteno\s*2 h/);
  expect(activity("2026-11-18")).toHaveTextContent(/Danas/);
  expect(activity("2026-11-25")).toHaveTextContent(/Probni ispit\s*sre, 25\.11\.\s*2 h/);
  expect(activity("2026-11-25")).not.toBeChecked();
});

test("completing today's Activity updates Progress and tells the server", async () => {
  const { server, user } = await openPlan();

  await user.press(activity("2026-11-18"));

  expect(activity("2026-11-18")).toBeChecked();
  expect(progress()).toHaveTextContent(/2\/6\s*aktivnosti · 4 od 12 h/);
  const patch = server.requests.find((r) => r.method === "PATCH");
  expect(patch).toMatchObject({ path: `/plans/${plan.id}/activities/${plan.activities[2]!.id}`, body: { completed: true } });
  await act(() => jest.runAllTimersAsync());
  expect(activity("2026-11-18")).toBeChecked();
});

test("a future Activity can be completed ahead of time", async () => {
  const { user } = await openPlan();

  await user.press(activity("2026-11-25"));
  await act(() => jest.runAllTimersAsync());

  expect(activity("2026-11-25")).toBeChecked();
});

test("tapping a completed Activity unmarks it", async () => {
  const { server, user } = await openPlan();

  await user.press(activity("2026-11-14"));
  await act(() => jest.runAllTimersAsync());

  expect(activity("2026-11-14")).not.toBeChecked();
  expect(progress()).toHaveTextContent(/0\/6/);
  expect(server.requests.find((r) => r.method === "PATCH")?.body).toEqual({ completed: false });
});

test("when the server refuses a change it is rolled back and the Student is told", async () => {
  const { user } = await openPlan({ outcome: "fail" });

  await user.press(activity("2026-11-18"));

  expect(await screen.findByRole("alert")).toHaveTextContent("Promena nije sačuvana. Pokušaj ponovo.");
  expect(activity("2026-11-18")).not.toBeChecked();
  expect(progress()).toHaveTextContent(/1\/6/);
});

test("two quick taps that both fail leave neither Activity completed", async () => {
  const { held, user } = await openPlan({ outcome: "fail", hold: true });

  await user.press(activity("2026-11-18"));
  await user.press(activity("2026-11-21"));
  await waitFor(() => expect(held).toHaveLength(2));
  await act(async () => held[0]!());
  await act(async () => held[1]!());
  await act(() => jest.runAllTimersAsync());

  expect(activity("2026-11-18")).not.toBeChecked();
  expect(activity("2026-11-21")).not.toBeChecked();
  expect(progress()).toHaveTextContent(/1\/6/);
});

test("replies that arrive out of order still end with the right Progress", async () => {
  const { held, user } = await openPlan({ hold: true });

  await user.press(activity("2026-11-18"));
  await user.press(activity("2026-11-21"));
  await waitFor(() => expect(held).toHaveLength(2));
  // The server handled them in order (2/6, then 3/6), but the second reply reaches the phone first.
  await act(async () => held[1]!());
  await act(async () => held[0]!());
  await act(() => jest.runAllTimersAsync());

  expect(progress()).toHaveTextContent(/3\/6/);
  expect(activity("2026-11-18")).toBeChecked();
  expect(activity("2026-11-21")).toBeChecked();
});

test("deleting asks for confirmation, then returns to My Plans without the plan", async () => {
  let plans = [planSummary({ id: plan.id, subject: "Matematika 1", examDate: plan.examDate })];
  const server = fakeServer()
    .on("GET /plans", () => ({ status: 200, body: plans }))
    .on("GET /plans/:id", { status: 200, body: plan })
    .on("DELETE /plans/:id", () => {
      plans = [];
      return { status: 204 };
    });
  const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
    buttons?.find((button) => button.text === "Obriši")?.onPress?.();
  });
  await renderApp();
  const user = userEvent.setup();
  await user.press(await screen.findByRole("button", { name: /^Matematika 1/ }));

  await user.press(await screen.findByRole("button", { name: "Obriši plan" }));

  expect(alert).toHaveBeenCalledWith("Obrisati plan?", "„Matematika 1“ i sve njegove aktivnosti biće trajno obrisani.", expect.any(Array));
  expect(await screen.findByText("Nemaš još nijedan plan")).toBeOnTheScreen();
  expect(server.requests.some((r) => r.method === "DELETE" && r.path === planUrl)).toBe(true);
});

test("cancelling the confirmation keeps the plan", async () => {
  const { server, user } = await openPlan();
  jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
    buttons?.find((button) => button.text === "Otkaži")?.onPress?.();
  });

  await user.press(screen.getByRole("button", { name: "Obriši plan" }));

  expect(screen.getByRole("header", { name: "Matematika 1" })).toBeOnTheScreen();
  expect(server.requests.some((r) => r.method === "DELETE")).toBe(false);
});
