import type { ErrorRequestHandler, RequestHandler } from "express";
import type { z } from "zod";
import type { ErrorCode } from "./contract";

const statusByCode: Record<ErrorCode, number> = {
  validation_failed: 400,
  invalid_credentials: 401,
  unauthorized: 401,
  not_found: 404,
  email_taken: 409,
  internal_error: 500,
};

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export function parseBody<Schema extends z.ZodType>(schema: Schema, body: unknown): z.output<Schema> {
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    fields[issue.path.join(".") || "body"] ??= issue.message;
  }
  throw new ApiError("validation_failed", "Proveri unete podatke.", fields);
}

export const notFound =(message = "Traženi podatak ne postoji.") => new ApiError("not_found", message);

export const unknownRoute: RequestHandler = () => {
  throw notFound();
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const error = toApiError(err);
  res.status(statusByCode[error.code]).json({
    error: { code: error.code, message: error.message, ...(error.fields && { fields: error.fields }) },
  });
};

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  // express.json() rejects bodies it can't read (malformed, too large, bad charset) with a 4xx.
  if (isBodyParserRejection(err)) return new ApiError("validation_failed", "Proveri unete podatke.");
  console.error(err);
  return new ApiError("internal_error", "Došlo je do greške na serveru. Pokušaj ponovo.");
}

function isBodyParserRejection(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const { type, status } = err as { type?: unknown; status?: unknown };
  return typeof type === "string" && typeof status === "number" && status >= 400 && status < 500;
}
