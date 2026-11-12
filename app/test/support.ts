import path from "node:path";
import {
  authResponseSchema,
  planDetailSchema,
  planSummarySchema,
  type PlanDetail,
  type PlanSummary,
} from "backend/contract";
import * as SecureStore from "expo-secure-store";
import { renderRouter } from "expo-router/testing-library";
import { SESSION_TOKEN_KEY } from "../src/session";

/** "Today" on the phone in every test: Wednesday 18 November 2026, mid-morning local time. */
export const TODAY = new Date(2026, 10, 18, 10, 0);

interface Reply {
  status: number;
  body?: unknown;
}
type Handler = (request: { body: any; params: Record<string, string> }) => Reply | Promise<Reply>;

/**
 * Stands in for the backend at the `fetch` boundary. Routes are "METHOD /path/:param";
 * unmatched requests fail the test. Every request the app sends is recorded.
 */
export function fakeServer() {
  const routes: { method: string; pattern: RegExp; keys: string[]; handler: Handler }[] = [];
  const requests: { method: string; path: string; body: any; authorization?: string }[] = [];

  global.fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    const headers = new Headers(init?.headers);
    requests.push({ method, path: url.pathname, body, authorization: headers.get("Authorization") ?? undefined });

    const route = routes.find((r) => r.method === method && r.pattern.test(url.pathname));
    if (!route) throw new Error(`fakeServer: no route for ${method} ${url.pathname}`);
    const values = route.pattern.exec(url.pathname)!.slice(1);
    const params = Object.fromEntries(route.keys.map((key, i) => [key, values[i]!]));
    const reply = await route.handler({ body, params });
    return {
      ok: reply.status >= 200 && reply.status < 300,
      status: reply.status,
      json: async () => reply.body,
    } as Response;
  }) as typeof fetch;

  return {
    requests,
    on(route: string, handler: Handler | Reply) {
      const [method, routePath] = route.split(" ") as [string, string];
      const keys: string[] = [];
      const pattern = new RegExp(
        `^${routePath.replace(/:(\w+)/g, (_, key) => {
          keys.push(key);
          return "([^/]+)";
        })}$`,
      );
      routes.unshift({ method, pattern, keys, handler: typeof handler === "function" ? handler : () => handler });
      return this;
    },
  };
}

export const failure = (status: number, code: string, message: string, fields?: Record<string, string>): Reply => ({
  status,
  body: { error: { code, message, ...(fields && { fields }) } },
});

// Canned bodies go through the contract schemas, so a fake can't drift from the real API.
export const authReply = (email = "ana@example.com"): Reply => ({
  status: 200,
  body: authResponseSchema.parse({
    token: "token-from-server",
    student: { id: "11111111-1111-4111-8111-111111111111", email },
  }),
});

export function planSummary(overrides: Partial<PlanSummary> & Pick<PlanSummary, "subject" | "examDate">): PlanSummary {
  return planSummarySchema.parse({
    id: "22222222-2222-4222-8222-222222222222",
    weeklyHours: 6,
    progress: { completedActivities: 0, totalActivities: 6, completedMinutes: 0, totalMinutes: 720 },
    ...overrides,
  });
}

/** Matematika 1, exam 26.11.2026: 14.11 completed, 16.11 missed, 18.11 today, three to come. */
export function mathPlan(overrides: Partial<PlanDetail> = {}): PlanDetail {
  const activity = (n: number, date: string, type: string, completed = false) => ({
    id: `33333333-3333-4333-8333-33333333333${n}`,
    date,
    durationMinutes: 120,
    type,
    completed,
  });
  return planDetailSchema.parse({
    id: "44444444-4444-4444-8444-444444444444",
    subject: "Matematika 1",
    examDate: "2026-11-26",
    weeklyHours: 6,
    createdAt: "2026-11-12T09:00:00.000Z",
    progress: { completedActivities: 1, totalActivities: 6, completedMinutes: 120, totalMinutes: 720 },
    activities: [
      activity(1, "2026-11-14", "learning", true),
      activity(2, "2026-11-16", "learning"),
      activity(3, "2026-11-18", "learning"),
      activity(4, "2026-11-21", "review"),
      activity(5, "2026-11-23", "review"),
      activity(6, "2026-11-25", "mock_exam"),
    ],
    ...overrides,
  });
}

/** Renders the real app (all routes) with the phone's clock fixed at TODAY. */
export async function renderApp({ signedIn = true, url = "/" } = {}) {
  if (signedIn) await SecureStore.setItemAsync(SESSION_TOKEN_KEY, "stored-token");
  jest.useFakeTimers({ now: TODAY });
  return renderRouter(path.join(__dirname, "..", "src", "app"), { initialUrl: url });
}
