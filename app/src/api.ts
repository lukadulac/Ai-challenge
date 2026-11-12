import {
  activityUpdateResponseSchema,
  authResponseSchema,
  type ErrorCode,
  errorResponseSchema,
  type LoginRequest,
  planDetailSchema,
  type PlanInput,
  planSummarySchema,
  proposalResponseSchema,
  type RegisterRequest,
} from "backend/contract";
import { z } from "zod";

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode | "network_error",
    message: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
}

async function request<T>(path: string, schema: z.ZodType<T> | null, { method = "GET", body, token }: RequestOptions = {}) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) throw new ApiError("network_error", "Adresa servera nije podešena (EXPO_PUBLIC_API_URL u app/.env).");

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("network_error", "Server nije dostupan. Proveri vezu i pokušaj ponovo.");
  }

  if (response.status === 204) return undefined as T;
  const json: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const failure = errorResponseSchema.safeParse(json);
    if (failure.success) {
      const { code, message, fields } = failure.data.error;
      throw new ApiError(code, message, fields);
    }
    throw new ApiError("internal_error", "Došlo je do greške na serveru. Pokušaj ponovo.");
  }
  if (!schema) return undefined as T;
  // E.g. a Wi-Fi login page answering instead of the API, or an API that has changed shape.
  const result = schema.safeParse(json);
  if (!result.success) throw new ApiError("internal_error", "Server je vratio neočekivan odgovor. Pokušaj ponovo.");
  return result.data;
}

export function createApi(token: string | null, onUnauthorized: () => void) {
  async function authed<T>(path: string, schema: z.ZodType<T> | null, options: RequestOptions = {}) {
    try {
      return await request(path, schema, { ...options, token });
    } catch (error) {
      if (error instanceof ApiError && error.code === "unauthorized") onUnauthorized();
      throw error;
    }
  }

  return {
    register: (body: RegisterRequest) => request("/auth/register", authResponseSchema, { method: "POST", body }),
    login: (body: LoginRequest) => request("/auth/login", authResponseSchema, { method: "POST", body }),
    listPlans: () => authed("/plans", z.array(planSummarySchema)),
    getPlan: (planId: string) => authed(`/plans/${encodeURIComponent(planId)}`, planDetailSchema),
    propose: (input: PlanInput) => authed("/plans/proposal", proposalResponseSchema, { method: "POST", body: input }),
    createPlan: (input: PlanInput) => authed("/plans", planDetailSchema, { method: "POST", body: input }),
    setActivityCompleted: (planId: string, activityId: string, completed: boolean) =>
      authed(`/plans/${encodeURIComponent(planId)}/activities/${encodeURIComponent(activityId)}`, activityUpdateResponseSchema, {
        method: "PATCH",
        body: { completed },
      }),
    deletePlan: (planId: string) => authed<void>(`/plans/${encodeURIComponent(planId)}`, null, { method: "DELETE" }),
  };
}

export type Api = ReturnType<typeof createApi>;
