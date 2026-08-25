import type { Event } from "@/data/events";

export type DateRange = { start: string; end: string };
export type Quarter = DateRange & { label: string; shortLabel: string; months: DateRange[] };

const DAY = 86_400_000;

export function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(value: string | Date, amount: number): string {
  const date = typeof value === "string" ? parseDate(value) : new Date(value);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

export function addYears(value: string | Date, amount: number): string {
  const date = typeof value === "string" ? parseDate(value) : new Date(value);
  date.setFullYear(date.getFullYear() + amount);
  return dateKey(date);
}

export function startOfWeek(value: string): string {
  const date = parseDate(value);
  date.setDate(date.getDate() - date.getDay());
  return dateKey(date);
}

export function endOfWeek(value: string): string {
  return addDays(startOfWeek(value), 6);
}

export function overlaps(event: Pick<Event, "startDate" | "endDate">, range: DateRange): boolean {
  return Boolean(event.startDate && event.endDate && event.startDate <= range.end && event.endDate >= range.start);
}

export function monthRange(year: number, month: number): DateRange {
  return {
    start: dateKey(new Date(year, month, 1, 12)),
    end: dateKey(new Date(year, month + 1, 0, 12))
  };
}

export function fiscalYearForDate(value: string): number {
  const date = parseDate(value);
  return date.getMonth() >= 9 ? date.getFullYear() + 1 : date.getFullYear();
}

export function fiscalYearStart(fiscalYear: number): string {
  return dateKey(new Date(fiscalYear - 1, 9, 1, 12));
}

export function yearRange(year: number, fiscal: boolean): DateRange {
  return fiscal
    ? { start: fiscalYearStart(year), end: dateKey(new Date(year, 8, 30, 12)) }
    : { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function quartersForYear(year: number, fiscal: boolean): Quarter[] {
  const firstMonth = fiscal ? 9 : 0;
  return [0, 1, 2, 3].map((index) => {
    const startMonth = firstMonth + index * 3;
    const startDate = new Date(fiscal ? year - 1 : year, startMonth, 1, 12);
    const endDate = new Date(fiscal ? year - 1 : year, startMonth + 3, 0, 12);
    const months = [0, 1, 2].map((monthOffset) => monthRange(startDate.getFullYear(), startDate.getMonth() + monthOffset));
    return {
      start: dateKey(startDate),
      end: dateKey(endDate),
      label: `Q${index + 1}`,
      shortLabel: `Q${index + 1}`,
      months
    };
  });
}

export function monthLabel(value: string, format: "long" | "short" = "long"): string {
  return parseDate(value).toLocaleDateString("en-US", { month: format, year: "numeric" });
}

export function formatDateRange(start: string, end: string, includeYear = false): string {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (includeYear) options.year = "numeric";
  if (start === end) return startDate.toLocaleDateString("en-US", options);
  if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) {
    return `${startDate.toLocaleDateString("en-US", { month: "short" })} ${startDate.getDate()}–${endDate.getDate()}${includeYear ? `, ${startDate.getFullYear()}` : ""}`;
  }
  return `${startDate.toLocaleDateString("en-US", options)}–${endDate.toLocaleDateString("en-US", options)}`;
}

export function daysBetween(start: string, end: string): number {
  return Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / DAY);
}

export function eventOccursInMonth(event: Pick<Event, "startDate" | "endDate">, year: number, month: number): boolean {
  return overlaps(event, monthRange(year, month));
}

export function eventOccursInWeek(event: Pick<Event, "startDate" | "endDate">, weekStart: string): boolean {
  return overlaps(event, { start: weekStart, end: addDays(weekStart, 6) });
}
