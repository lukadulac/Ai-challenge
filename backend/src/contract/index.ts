import { z } from "zod";
import { daysBetween } from "./calendar";

export * from "./calendar";

export const errorCodeSchema = z.enum([
  "validation_failed",
  "invalid_credentials",
  "unauthorized",
  "not_found",
  "email_taken",
  "internal_error",
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const errorResponseSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

const emailSchema = z.string({ error: "Unesi email adresu." }).trim().toLowerCase().pipe(z.email({ error: "Unesi ispravnu email adresu." }));

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: "Unesi lozinku." })
    .min(8, "Lozinka mora imati najmanje 8 znakova.")
    // bcrypt only looks at the first 72 bytes, and letters like č take two bytes in UTF-8.
    .refine(
      (password) => new TextEncoder().encode(password).length <= 72,
      "Lozinka može imati najviše 72 znaka (č, ć, š, ž i đ se računaju kao dva).",
    ),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

// Sign-in doesn't enforce the password rules, so any mismatch is just "wrong email or password".
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Unesi lozinku." }).min(1, "Unesi lozinku."),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const studentSchema = z.object({
  id: z.uuid(),
  email: z.string(),
});
export type Student = z.infer<typeof studentSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  student: studentSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const planLimits = {
  maxSubjectLength: 100,
  minWeeklyHours: 1,
  maxWeeklyHours: 40,
  maxDaysToExam: 365,
} as const;

/** How many days a week the Planner schedules for these Weekly Hours: about 2 h a day, at most every day. */
export const studyDaysPerWeek = (weeklyHours: number) => Math.min(7, Math.ceil(weeklyHours / 2));

/**
 * The half-hours each study day of a full week gets, earliest day first: the week's
 * half-hours split evenly, with any leftover going to the earliest days.
 */
export function weeklyHalfHours(weeklyHours: number): number[] {
  const days = studyDaysPerWeek(weeklyHours);
  const base = Math.floor((weeklyHours * 2) / days);
  const extra = (weeklyHours * 2) % days;
  return Array.from({ length: days }, (_, rank) => base + (rank < extra ? 1 : 0));
}

const weeklyHoursRange =`Broj sati nedeljno mora biti od ${planLimits.minWeeklyHours} do ${planLimits.maxWeeklyHours}.`;

/** What the Student enters for a Proposal, plus "today" as the phone sees it. */
export const planInputSchema = z
  .object({
    subject: z
      .string({ error: "Unesi naziv predmeta." })
      .trim()
      .min(1, "Unesi naziv predmeta.")
      .max(planLimits.maxSubjectLength, `Naziv predmeta može imati najviše ${planLimits.maxSubjectLength} znakova.`),
    examDate: z.iso.date({ error: "Izaberi ispravan datum ispita." }),
    weeklyHours: z
      .number({ error: "Unesi broj sati nedeljno." })
      .int("Broj sati nedeljno mora biti ceo broj.")
      .min(planLimits.minWeeklyHours, weeklyHoursRange)
      .max(planLimits.maxWeeklyHours, weeklyHoursRange),
    today: z.iso.date({ error: "Neispravan današnji datum." }),
  })
  .superRefine(({ today, examDate }, ctx) => {
    const daysToExam = daysBetween(today, examDate);
    if (daysToExam < 1) {
      ctx.addIssue({ code: "custom", path: ["examDate"], message: "Datum ispita mora biti najranije sutra." });
    } else if (daysToExam > planLimits.maxDaysToExam) {
      ctx.addIssue({ code: "custom", path: ["examDate"], message: "Datum ispita može biti najkasnije za godinu dana." });
    }
  });
export type PlanInput = z.infer<typeof planInputSchema>;

export const activityTypeSchema = z.enum(["learning", "review", "mock_exam"]);
export type ActivityType = z.infer<typeof activityTypeSchema>;

export const plannedActivitySchema = z.object({
  date: z.iso.date(),
  durationMinutes: z.number().int(),
  type: activityTypeSchema,
});
export type PlannedActivity = z.infer<typeof plannedActivitySchema>;

export const proposalResponseSchema = z.object({
  activities: z.array(plannedActivitySchema),
  totalMinutes: z.number().int(),
});
export type ProposalResponse = z.infer<typeof proposalResponseSchema>;

export const progressSchema = z.object({
  completedActivities: z.number().int(),
  totalActivities: z.number().int(),
  completedMinutes: z.number().int(),
  totalMinutes: z.number().int(),
});
export type Progress = z.infer<typeof progressSchema>;

export const activitySchema = plannedActivitySchema.extend({
  id: z.uuid(),
  completed: z.boolean(),
});
export type Activity = z.infer<typeof activitySchema>;

export const planSummarySchema = z.object({
  id: z.uuid(),
  subject: z.string(),
  examDate: z.iso.date(),
  weeklyHours: z.number().int(),
  progress: progressSchema,
});
export type PlanSummary = z.infer<typeof planSummarySchema>;

export const planDetailSchema = planSummarySchema.extend({
  createdAt: z.iso.datetime(),
  activities: z.array(activitySchema),
});
export type PlanDetail = z.infer<typeof planDetailSchema>;

/** Sets the Activity to this state rather than toggling, so a repeated request is harmless. */
export const activityUpdateRequestSchema = z.object({
  completed: z.boolean({ error: "Neispravna oznaka aktivnosti." }),
});
export type ActivityUpdateRequest = z.infer<typeof activityUpdateRequestSchema>;

export const activityUpdateResponseSchema = z.object({
  activity: activitySchema,
  progress: progressSchema,
});
export type ActivityUpdateResponse = z.infer<typeof activityUpdateResponseSchema>;
