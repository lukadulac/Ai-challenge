import { screen, userEvent } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { SESSION_TOKEN_KEY } from "../src/session";
import { authReply, failure, fakeServer, renderApp } from "./support";

test("a signed-out Student signs in and lands on My Plans", async () => {
  const server = fakeServer().on("POST /auth/login", authReply()).on("GET /plans", { status: 200, body: [] });
  await renderApp({ signedIn: false });
  const user = userEvent.setup();

  await user.type(await screen.findByLabelText("Email"), "ana@example.com");
  await user.type(screen.getByLabelText("Lozinka"), "lozinka123");
  await user.press(screen.getByRole("button", { name: "Prijavi se" }));

  expect(await screen.findByText("Nemaš još nijedan plan")).toBeOnTheScreen();
  expect(server.requests.find((r) => r.path === "/auth/login")?.body).toEqual({
    email: "ana@example.com",
    password: "lozinka123",
  });
  expect(server.requests.find((r) => r.path === "/plans")?.authorization).toBe("Bearer token-from-server");
});

test("a wrong email or password shows the server's message", async () => {
  fakeServer().on("POST /auth/login", failure(401, "invalid_credentials", "Pogrešan email ili lozinka."));
  await renderApp({ signedIn: false });
  const user = userEvent.setup();

  await user.type(await screen.findByLabelText("Email"), "ana@example.com");
  await user.type(screen.getByLabelText("Lozinka"), "pogresna");
  await user.press(screen.getByRole("button", { name: "Prijavi se" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Pogrešan email ili lozinka.");
});

test("an invalid email is caught on the phone before anything is sent", async () => {
  const server = fakeServer();
  await renderApp({ signedIn: false });
  const user = userEvent.setup();

  await user.type(await screen.findByLabelText("Email"), "nije-email");
  await user.type(screen.getByLabelText("Lozinka"), "lozinka123");
  await user.press(screen.getByRole("button", { name: "Prijavi se" }));

  expect(await screen.findByText("Unesi ispravnu email adresu.")).toBeOnTheScreen();
  expect(server.requests).toEqual([]);
});

test("a new Student registers from the Login screen and is signed in straight away", async () => {
  const server = fakeServer()
    .on("POST /auth/register", { ...authReply("novi@example.com"), status: 201 })
    .on("GET /plans", { status: 200, body: [] });
  await renderApp({ signedIn: false });
  const user = userEvent.setup();

  await user.press(await screen.findByRole("link", { name: "Registruj se" }));
  expect(await screen.findByText("Napravi nalog")).toBeOnTheScreen();
  await user.type(screen.getByLabelText("Email"), "novi@example.com");
  await user.type(screen.getByLabelText("Lozinka"), "lozinka123");
  await user.press(screen.getByRole("button", { name: "Registruj se" }));

  expect(await screen.findByText("Nemaš još nijedan plan")).toBeOnTheScreen();
  expect(server.requests[0]).toMatchObject({ path: "/auth/register", body: { email: "novi@example.com", password: "lozinka123" } });
});

test("registering with an email that is already taken flags the email field", async () => {
  fakeServer().on("POST /auth/register", failure(409, "email_taken", "Nalog sa ovim emailom već postoji."));
  await renderApp({ signedIn: false, url: "/register" });
  const user = userEvent.setup();

  await user.type(await screen.findByLabelText("Email"), "ana@example.com");
  await user.type(screen.getByLabelText("Lozinka"), "lozinka123");
  await user.press(screen.getByRole("button", { name: "Registruj se" }));

  expect(await screen.findByText("Nalog sa ovim emailom već postoji.")).toBeOnTheScreen();
  expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
});

test("a session the server no longer accepts sends the Student back to Login", async () => {
  fakeServer().on("GET /plans", failure(401, "unauthorized", "Prijavi se ponovo."));
  await renderApp();

  expect(await screen.findByRole("button", { name: "Prijavi se" })).toBeOnTheScreen();
  expect(await SecureStore.getItemAsync(SESSION_TOKEN_KEY)).toBeNull();
});

test("signing out returns to Login and forgets the stored session", async () => {
  fakeServer().on("GET /plans", { status: 200, body: [] });
  await renderApp();
  const user = userEvent.setup();

  await user.press(await screen.findByRole("button", { name: "Odjavi se" }));

  expect(await screen.findByRole("button", { name: "Prijavi se" })).toBeOnTheScreen();
  expect(await SecureStore.getItemAsync(SESSION_TOKEN_KEY)).toBeNull();
});

test("signing out works even when the phone's secure storage refuses to forget the token", async () => {
  fakeServer().on("GET /plans", { status: 200, body: [] });
  jest.spyOn(SecureStore, "deleteItemAsync").mockRejectedValueOnce(new Error("Keychain locked"));
  await renderApp();
  const user = userEvent.setup();

  await user.press(await screen.findByRole("button", { name: "Odjavi se" }));

  expect(await screen.findByRole("button", { name: "Prijavi se" })).toBeOnTheScreen();
});
