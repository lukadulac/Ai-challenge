// Calendar dates are `YYYY-MM-DD` strings. Arithmetic happens on whole days in
// UTC, so the machine's time zone can never shift a date.

const MS_PER_DAY = 86_400_000;

export function toDayNumber(date: string): number {
  // Date-only ISO strings parse as UTC midnight, and unlike Date.UTC, years 0–99 stay as written.
  return Date.parse(date) / MS_PER_DAY;
}

export function fromDayNumber(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromDayNumber(toDayNumber(date) + days);
}

export function daysBetween(from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from);
}
