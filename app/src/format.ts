import { addDays, daysBetween, toDayNumber } from "backend/contract";

const WEEKDAYS = ["Nedelja", "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota"];
const WEEKDAYS_SHORT = ["ned", "pon", "uto", "sre", "čet", "pet", "sub"];

const pad = (n: number) => String(n).padStart(2, "0");

/** A local `Date`'s calendar date, as `YYYY-MM-DD`. */
export const fromLocalDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Today's calendar date on this phone. */
export const localToday = () => fromLocalDate(new Date());

/** A calendar date as a local `Date` at noon, for the native date picker. */
export function toLocalDate(date: string): Date {
  return new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), 12);
}

export { addDays, daysBetween };

const weekdayIndex = (date: string) => new Date(toDayNumber(date) * 86_400_000).getUTCDay();

/** 26.11.2026. */
export const formatDate = (date: string) => `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}.`;

/** 26.11. */
export const formatShortDate = (date: string) => `${date.slice(8, 10)}.${date.slice(5, 7)}.`;

/** Sreda */
export const weekday = (date: string) => WEEKDAYS[weekdayIndex(date)]!;

/** sre */
export const weekdayShort = (date: string) => WEEKDAYS_SHORT[weekdayIndex(date)]!;

/** 2, 1,5 */
export const hoursNumber = (minutes: number) => String(minutes / 60).replace(".", ",");

/** 2 h, 1,5 h */
export const formatHours = (minutes: number) => `${hoursNumber(minutes)} h`;

/** Serbian counts: 1, 21, 31 … take the singular; everything else the plural. */
export const plural = (n: number, one: string, many: string) => (n % 10 === 1 && n % 100 !== 11 ? one : many);

export const activitiesWord = (n: number) => plural(n, "aktivnost", "aktivnosti");

export const activitiesCount = (n: number) => `${n} ${activitiesWord(n)}`;

/** još 8 dana, danas, prošao: how far off the exam is, for "Ispit 26.11.2026. · …". */
export function daysLeft(today: string, examDate: string): string {
  const days = daysBetween(today, examDate);
  if (days > 0) return `još ${days} ${plural(days, "dan", "dana")}`;
  return days === 0 ? "danas" : "prošao";
}

/** The same, standing on its own: još 8 dana, Ispit je danas, Ispit je prošao. */
export function daysLeftLabel(today: string, examDate: string): string {
  const days = daysBetween(today, examDate);
  if (days > 0) return daysLeft(today, examDate);
  return days === 0 ? "Ispit je danas" : "Ispit je prošao";
}

export const percent = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));
