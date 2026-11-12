import { screen, userEvent } from "@testing-library/react-native";
import { proposalResponseSchema } from "backend/contract";
import { fakeServer, mathPlan, renderApp } from "./support";

// What the Planner proposes for 6 h a week from 18.11 to an exam on 02.12.2026.
const proposal = proposalResponseSchema.parse({
  activities: [
    { date: "2026-11-20", durationMinutes: 120, type: "learning" },
    { date: "2026-11-22", durationMinutes: 120, type: "learning" },
    { date: "2026-11-24", durationMinutes: 120, type: "learning" },
    { date: "2026-11-27", durationMinutes: 120, type: "review" },
    { date: "2026-11-29", durationMinutes: 120, type: "review" },
    { date: "2026-12-01", durationMinutes: 120, type: "mock_exam" },
  ],
  totalMinutes: 720,
});

const saved = mathPlan({ id: "55555555-5555-4555-8555-555555555555", subject: "Hemija", examDate: "2026-12-02" });

async function openNewPlan() {
  const server = fakeServer()
    .on("GET /plans", { status: 200, body: [] })
    .on("POST /plans/proposal", { status: 200, body: proposal })
    .on("POST /plans", { status: 201, body: saved })
    .on("GET /plans/:id", { status: 200, body: saved });
  await renderApp();
  const user = userEvent.setup();
  await user.press(await screen.findByRole("button", { name: "Napravi prvi plan" }));
  await screen.findByText("Novi plan");
  return { server, user };
}

test("the form starts with an exam two weeks out and 6 hours a week", async () => {
  await openNewPlan();

  expect(screen.getByRole("button", { name: /^Datum ispita/ })).toHaveTextContent(/Sreda, 02\.12\.2026\.\s*za 14 dana/);
  expect(screen.getByText("6 h")).toBeOnTheScreen();
  expect(screen.getByText("3 dana nedeljno po 2 h")).toBeOnTheScreen();
});

test("the Student gets a Proposal, then saves it and lands on the new Study Plan", async () => {
  const { server, user } = await openNewPlan();

  await user.type(screen.getByLabelText("Naziv predmeta"), "Hemija");
  await user.press(screen.getByRole("button", { name: "Prikaži predlog" }));

  expect(await screen.findByText("Predlog plana")).toBeOnTheScreen();
  expect(screen.getByText("6 aktivnosti · 12 h ukupno")).toBeOnTheScreen();
  expect(screen.getAllByText("Novo gradivo")).toHaveLength(3);
  expect(screen.getByText("Probni ispit")).toBeOnTheScreen();
  expect(screen.getByText("01.12.")).toBeOnTheScreen();
  const input = { subject: "Hemija", examDate: "2026-12-02", weeklyHours: 6, today: "2026-11-18" };
  expect(server.requests.find((r) => r.path === "/plans/proposal")?.body).toEqual(input);

  await user.press(screen.getByRole("button", { name: "Sačuvaj plan" }));

  expect(await screen.findByRole("header", { name: "Hemija" })).toBeOnTheScreen();
  expect(server.requests.find((r) => r.method === "POST" && r.path === "/plans")?.body).toEqual(input);
});

test("a missing Subject is caught on the phone and nothing is sent", async () => {
  const { server, user } = await openNewPlan();

  await user.press(screen.getByRole("button", { name: "Prikaži predlog" }));

  expect(await screen.findByText("Unesi naziv predmeta.")).toBeOnTheScreen();
  expect(server.requests.some((r) => r.path === "/plans/proposal")).toBe(false);
});

test("changing Weekly Hours clears the Proposal so an unseen plan can't be saved", async () => {
  const { user } = await openNewPlan();
  await user.type(screen.getByLabelText("Naziv predmeta"), "Hemija");
  await user.press(screen.getByRole("button", { name: "Prikaži predlog" }));
  await screen.findByText("Predlog plana");

  await user.press(screen.getByRole("button", { name: "Povećaj broj sati" }));

  expect(screen.queryByText("Predlog plana")).not.toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Sačuvaj plan" })).not.toBeOnTheScreen();
  expect(screen.getByText("7 h")).toBeOnTheScreen();
  expect(screen.getByText("4 dana nedeljno po 1,5–2 h")).toBeOnTheScreen();
});

test("a rule the server enforces is shown on its field", async () => {
  const { server, user } = await openNewPlan();
  server.on("POST /plans/proposal", {
    status: 400,
    body: { error: { code: "validation_failed", message: "Proveri unete podatke.", fields: { examDate: "Datum ispita može biti najkasnije za godinu dana." } } },
  });

  await user.type(screen.getByLabelText("Naziv predmeta"), "Hemija");
  await user.press(screen.getByRole("button", { name: "Prikaži predlog" }));

  expect(await screen.findByText("Datum ispita može biti najkasnije za godinu dana.")).toBeOnTheScreen();
});

test("a field's error goes away as soon as the Student fixes it", async () => {
  const { user } = await openNewPlan();
  await user.press(screen.getByRole("button", { name: "Prikaži predlog" }));
  await screen.findByText("Unesi naziv predmeta.");

  await user.type(screen.getByLabelText("Naziv predmeta"), "H");

  expect(screen.queryByText("Unesi naziv predmeta.")).not.toBeOnTheScreen();
});

test("a server error about something without its own field is still shown", async () => {
  const { server, user } = await openNewPlan();
  server.on("POST /plans/proposal", {
    status: 400,
    body: { error: { code: "validation_failed", message: "Proveri unete podatke.", fields: { today: "Neispravan današnji datum." } } },
  });

  await user.type(screen.getByLabelText("Naziv predmeta"), "Hemija");
  await user.press(screen.getByRole("button", { name: "Prikaži predlog" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Neispravan današnji datum.");
});
