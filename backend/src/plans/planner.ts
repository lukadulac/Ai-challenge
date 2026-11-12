import { type ActivityType, fromDayNumber, type PlannedActivity, toDayNumber, weeklyHalfHours } from "../contract";

export interface PlannerInput {
  today: string;
  examDate: string;
  weeklyHours: number;
}

/**
 * Lays out one Activity per study day, working backwards from the day before
 * the exam in 7-day blocks. See "Planner rules" in the spec.
 */
export function planActivities({ today, examDate, weeklyHours }: PlannerInput): PlannedActivity[] {
  const firstDay = toDayNumber(today);
  const lastDay = toDayNumber(examDate) - 1;
  const halfHoursByRank = weeklyHalfHours(weeklyHours);
  const daysPerWeek = halfHoursByRank.length;

  const studyDays: { day: number; halfHours: number }[] = [];
  for (let blockEnd = lastDay; blockEnd >= firstDay; blockEnd -= 7) {
    for (let slot = 0; slot < daysPerWeek; slot++) {
      const day = blockEnd - Math.floor((slot * 7) / daysPerWeek);
      if (day < firstDay) continue;
      // Slot 0 is the block's last day, so the highest slots come first in time.
      studyDays.push({ day, halfHours: halfHoursByRank[daysPerWeek - 1 - slot]! });
    }
  }
  studyDays.sort((a, b) => a.day - b.day);

  const types = activityTypes(studyDays.length);
  return studyDays.map(({ day, halfHours }, index) => ({
    date: fromDayNumber(day),
    durationMinutes: halfHours * 30,
    type: types[index]!,
  }));
}

function activityTypes(count: number): ActivityType[] {
  if (count === 1) return ["review"];
  if (count === 2) return ["learning", "review"];
  const mockExams = Math.max(1, roundTenths(count, 1));
  const reviews = Math.max(1, roundTenths(count, 3));
  const learning = count - reviews - mockExams;
  return [
    ...Array<ActivityType>(learning).fill("learning"),
    ...Array<ActivityType>(reviews).fill("review"),
    ...Array<ActivityType>(mockExams).fill("mock_exam"),
  ];
}

/** round(count × tenths / 10) with halves rounded up, in integer arithmetic. */
const roundTenths = (count: number, tenths: number) => Math.floor((count * tenths + 5) / 10);
