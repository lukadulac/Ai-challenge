import { Router } from "express";
import { z } from "zod";
import { activityUpdateRequestSchema, planInputSchema, type ProposalResponse } from "../contract";
import type { Db } from "../db";
import { ApiError, notFound, parseBody } from "../errors";
import { planActivities } from "./planner";
import { planRepository } from "./repository";

const planNotFound = () => notFound("Plan nije pronađen.");
const activityNotFound = () => notFound("Aktivnost nije pronađena.");

const uuidSchema = z.uuid();

/** Path ids that aren't UUIDs can't name anything, and would make Postgres throw. */
function validId(id: string | undefined, onInvalid: () => Error): string {
  const result = uuidSchema.safeParse(id);
  if (!result.success) throw onInvalid();
  return result.data;
}

export function planRoutes(db: Db) {
  const router = Router();
  const plans = planRepository(db);

  router.get("/:planId", async (req, res) => {
    const plan = await plans.findPlan(res.locals.studentId, validId(req.params.planId, planNotFound));
    if (!plan) throw planNotFound();
    res.json(plan);
  });

  router.patch("/:planId/activities/:activityId", async (req, res) => {
    const planId = validId(req.params.planId, planNotFound);
    const activityId = validId(req.params.activityId, activityNotFound);
    const { completed } = parseBody(activityUpdateRequestSchema, req.body);
    const update = await plans.setActivityCompleted(res.locals.studentId, planId, activityId, completed);
    if (!update) throw activityNotFound();
    res.json(update);
  });

  router.delete("/:planId", async (req, res) => {
    const deleted = await plans.deletePlan(res.locals.studentId, validId(req.params.planId, planNotFound));
    if (!deleted) throw planNotFound();
    res.status(204).end();
  });

  router.post("/proposal", (req, res) => {
    const activities = planActivities(parseBody(planInputSchema, req.body));
    const proposal: ProposalResponse = {
      activities,
      totalMinutes: activities.reduce((sum, activity) => sum + activity.durationMinutes, 0),
    };
    res.json(proposal);
  });

  router.get("/", async (_req, res) => {
    res.json(await plans.listPlans(res.locals.studentId));
  });

  router.post("/", async (req, res) => {
    const input = parseBody(planInputSchema, req.body);
    // Recomputed here rather than taken from the client, so it always matches the Proposal.
    const plan = await plans.createPlan(res.locals.studentId, input, planActivities(input));
    if (!plan) throw new ApiError("unauthorized", "Prijavi se ponovo.");
    res.status(201).json(plan);
  });

  return router;
}
