import { screen, userEvent, within } from "@testing-library/react-native";
import { fakeServer, planSummary, renderApp } from "./support";

const plans = [
  planSummary({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    subject: "Engleski jezik",
    examDate: "2026-11-10",
    progress: { completedActivities: 8, totalActivities: 8, completedMinutes: 960, totalMinutes: 960 },
  }),
  planSummary({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    subject: "Hemija",
    examDate: "2026-11-18",
  }),
  planSummary({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    subject: "Matematika 1",
    examDate: "2026-11-26",
    progress: { completedActivities: 1, totalActivities: 6, completedMinutes: 120, totalMinutes: 720 },
  }),
  planSummary({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    subject: "Fizika",
    examDate: "2026-12-09",
    progress: { completedActivities: 0, totalActivities: 21, completedMinutes: 0, totalMinutes: 2520 },
  }),
];

const card = (subject: string) => screen.getByRole("button", { name: new RegExp(`^${subject}`) });

test("upcoming exams come first in Exam Date order, then plans whose exam has passed", async () => {
  fakeServer().on("GET /plans", { status: 200, body: plans });
  await renderApp();

  await screen.findByText("Matematika 1");
  const subjects = screen.getAllByText(/^(Engleski jezik|Hemija|Matematika 1|Fizika)$/).map((el) => el.props.children);

  expect(subjects).toEqual(["Hemija", "Matematika 1", "Fizika", "Engleski jezik"]);
  expect(screen.getByText("Prošli ispiti")).toBeOnTheScreen();
});

test("each Study Plan shows days left and its Progress", async () => {
  fakeServer().on("GET /plans", { status: 200, body: plans });
  await renderApp();

  await screen.findByText("Matematika 1");

  expect(card("Matematika 1")).toHaveTextContent(/Ispit 26\.11\.2026\.\s*još 8 dana\s*1\/6 aktivnosti\s*17%/);
  expect(card("Fizika")).toHaveTextContent(/još 21 dan\s*0\/21 aktivnost\s*0%/);
  expect(card("Hemija")).toHaveTextContent(/Ispit je danas/);
  expect(card("Engleski jezik")).toHaveTextContent(/Ispit je prošao\s*8\/8 aktivnosti\s*100%/);
});

test("today's date heads the list", async () => {
  fakeServer().on("GET /plans", { status: 200, body: [] });
  await renderApp();

  expect(await screen.findByText("Sreda, 18.11.2026.")).toBeOnTheScreen();
});

test("an empty list invites the Student to make a first plan", async () => {
  fakeServer().on("GET /plans", { status: 200, body: [] });
  await renderApp();

  expect(await screen.findByText("Nemaš još nijedan plan")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Napravi prvi plan" })).toBeOnTheScreen();
});

test("when the server can't be reached the Student is told so and can try again", async () => {
  let reachable = false;
  fakeServer().on("GET /plans", () => {
    if (!reachable) throw new TypeError("Network request failed");
    return { status: 200, body: plans };
  });
  await renderApp();
  const user = userEvent.setup();

  expect(await screen.findByRole("alert")).toHaveTextContent("Server nije dostupan. Proveri vezu i pokušaj ponovo.");
  reachable = true;
  await user.press(screen.getByRole("button", { name: "Pokušaj ponovo" }));

  expect(await screen.findByText("Matematika 1")).toBeOnTheScreen();
  expect(within(card("Matematika 1")).getByText("17%")).toBeOnTheScreen();
});

test("a reply the app doesn't understand is reported in Serbian, not as a raw error", async () => {
  fakeServer().on("GET /plans", { status: 200, body: { unexpected: true } });
  await renderApp();

  expect(await screen.findByRole("alert")).toHaveTextContent("Server je vratio neočekivan odgovor. Pokušaj ponovo.");
});
