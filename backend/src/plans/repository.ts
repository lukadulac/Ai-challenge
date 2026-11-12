import type {
  Activity,
  ActivityType,
  ActivityUpdateResponse,
  PlanDetail,
  PlannedActivity,
  PlanSummary,
} from "../contract";
import type { Db } from "../db";

interface PlanRow {
  id: string;
  subject: string;
  exam_date: string;
  weekly_hours: number;
  created_at: Date | string;
  completed_activities: number;
  total_activities: number;
  completed_minutes: number;
  total_minutes: number;
}

interface ActivityRow {
  id: string;
  date: string;
  duration_minutes: number;
  type: ActivityType;
  completed: boolean;
}

// Dates are selected as text so neither driver turns them into local-time Date objects.
const selectPlansWithProgress = `
  select p.id, p.subject, to_char(p.exam_date, 'YYYY-MM-DD') as exam_date, p.weekly_hours, p.created_at,
         count(a.id)::int as total_activities,
         count(a.id) filter (where a.completed)::int as completed_activities,
         coalesce(sum(a.duration_minutes), 0)::int as total_minutes,
         coalesce(sum(a.duration_minutes) filter (where a.completed), 0)::int as completed_minutes
  from study_plans p
  left join activities a on a.study_plan_id = p.id`;

const toSummary = (row: PlanRow): PlanSummary => ({
  id: row.id,
  subject: row.subject,
  examDate: row.exam_date,
  weeklyHours: row.weekly_hours,
  progress: {
    completedActivities: row.completed_activities,
    totalActivities: row.total_activities,
    completedMinutes: row.completed_minutes,
    totalMinutes: row.total_minutes,
  },
});

const toActivity = (row: ActivityRow): Activity => ({
  id: row.id,
  date: row.date,
  durationMinutes: row.duration_minutes,
  type: row.type,
  completed: row.completed,
});

export function planRepository(db: Db) {
  async function findPlanRow(studentId: string, planId: string) {
    const { rows } = await db.query<PlanRow>(
      `${selectPlansWithProgress} where p.student_id = $1 and p.id = $2 group by p.id`,
      [studentId, planId],
    );
    return rows[0];
  }

  async function findPlan(studentId: string, planId: string): Promise<PlanDetail | undefined> {
    const plan = await findPlanRow(studentId, planId);
    if (!plan) return undefined;
    const { rows } = await db.query<ActivityRow>(
      `select id, to_char(date, 'YYYY-MM-DD') as date, duration_minutes, type, completed
       from activities where study_plan_id = $1 order by date`,
      [planId],
    );
    return { ...toSummary(plan), createdAt: new Date(plan.created_at).toISOString(), activities: rows.map(toActivity) };
  }

  return {
    findPlan,

    async listPlans(studentId: string): Promise<PlanSummary[]> {
      const { rows } = await db.query<PlanRow>(
        `${selectPlansWithProgress} where p.student_id = $1 group by p.id order by p.exam_date, p.created_at`,
        [studentId],
      );
      return rows.map(toSummary);
    },

    /**
     * Stores the Study Plan and its Activities in one statement, so it's all or nothing.
     * Returns undefined when the Student doesn't exist (e.g. a token outliving its account).
     */
    async createPlan(
      studentId: string,
      plan: { subject: string; examDate: string; weeklyHours: number },
      activities: PlannedActivity[],
    ): Promise<PlanDetail | undefined> {
      const { rows } = await db.query<{ id: string }>(
        `with plan as (
           insert into study_plans (student_id, subject, exam_date, weekly_hours)
           select $1::uuid, $2::text, $3::date, $4::int
           where exists (select 1 from students where id = $1::uuid)
           returning id
         ), inserted_activities as (
           insert into activities (study_plan_id, date, duration_minutes, type)
           select plan.id, a.date, a.duration_minutes, a.type
           from plan, unnest($5::date[], $6::int[], $7::text[]) as a (date, duration_minutes, type)
         )
         select id from plan`,
        [
          studentId,
          plan.subject,
          plan.examDate,
          plan.weeklyHours,
          activities.map((a) => a.date),
          activities.map((a) => a.durationMinutes),
          activities.map((a) => a.type),
        ],
      );
      const created = rows[0];
      return created && findPlan(studentId, created.id);
    },

    async setActivityCompleted(
      studentId: string,
      planId: string,
      activityId: string,
      completed: boolean,
    ): Promise<ActivityUpdateResponse | undefined> {
      const { rows } = await db.query<ActivityRow>(
        `update activities a set completed = $4
         from study_plans p
         where a.id = $3 and a.study_plan_id = $2 and p.id = a.study_plan_id and p.student_id = $1
         returning a.id, to_char(a.date, 'YYYY-MM-DD') as date, a.duration_minutes, a.type, a.completed`,
        [studentId, planId, activityId, completed],
      );
      const activity = rows[0];
      // The Study Plan may have been deleted between the update and this read.
      const plan = activity && (await findPlanRow(studentId, planId));
      if (!activity || !plan) return undefined;
      return { activity: toActivity(activity), progress: toSummary(plan).progress };
    },

    /** Returns whether there was such a Study Plan; its Activities cascade with it. */
    async deletePlan(studentId: string, planId: string): Promise<boolean> {
      const { rows } = await db.query(
        "delete from study_plans where id = $1 and student_id = $2 returning id",
        [planId, studentId],
      );
      return rows.length > 0;
    },
  };
}
