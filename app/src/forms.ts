import type { z } from "zod";
import { ApiError } from "./api";

export type FieldErrors = Record<string, string>;

/** Validates a form with a contract schema, giving the first message per field on failure. */
export function validate<Schema extends z.ZodType>(
  schema: Schema,
  values: unknown,
): { data: z.output<Schema>; errors?: undefined } | { data?: undefined; errors: FieldErrors } {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    errors[String(issue.path[0] ?? "form")] ??= issue.message;
  }
  return { errors };
}

/**
 * Splits field errors into the ones a form shows next to its fields and, for anything
 * else (a field it has no input for), a message to show in its banner instead.
 */
export function splitFieldErrors(errors: FieldErrors, shownFields: readonly string[]) {
  const fields: FieldErrors = {};
  let banner: string | null = null;
  for (const [field, message] of Object.entries(errors)) {
    if (shownFields.includes(field)) fields[field] = message;
    else banner ??= message;
  }
  return { fields, banner };
}

/** What a form shows for a failed request: messages on its fields and/or one in its banner. */
export function describeFailure(error: unknown, shownFields: readonly string[]) {
  if (!(error instanceof ApiError)) return { fields: {}, banner: "Došlo je do greške. Pokušaj ponovo." };
  const { fields, banner } = splitFieldErrors(error.fields, shownFields);
  return { fields, banner: banner ?? (Object.keys(fields).length > 0 ? null : error.message) };
}

export const withoutField = (errors: FieldErrors, field: string): FieldErrors => {
  const { [field]: _removed, ...rest } = errors;
  return rest;
};
