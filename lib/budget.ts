import type { Event } from "../data/events";
import type { BudgetPlan } from "../data/budget";
import { quartersForYear, yearRange } from "./calendar";

export type BudgetMonthTotal = {
  label: string;
  start: string;
  end: string;
  total: number;
};

export type BudgetQuarterTotal = {
  label: string;
  start: string;
  end: string;
  total: number;
};

export type BudgetTotals = {
  months: BudgetMonthTotal[];
  quarters: BudgetQuarterTotal[];
  yearTotal: number;
  undatedTotal: number;
  undatedAttendingCount: number;
  attendingUnpricedCount: number;
};

export function eventCost(plan: BudgetPlan): number {
  return plan.attending && plan.registrationFee !== null ? plan.registrationFee * plan.headcount : 0;
}

export function calculateBudgetTotals(events: Event[], plans: Record<string, BudgetPlan>, year: number, fiscal: boolean): BudgetTotals {
  const quarters = quartersForYear(year, fiscal);
  const months = quarters.flatMap((quarter) => quarter.months);
  const range = yearRange(year, fiscal);
  const datedEvents = events.filter((event) => event.startDate && event.endDate);
  const eventsInYear = datedEvents.filter((event) => event.startDate! >= range.start && event.startDate! <= range.end);
  const totalForRange = (range: { start: string; end: string }) =>
    eventsInYear
      .filter((event) => event.startDate! >= range.start && event.startDate! <= range.end)
      .reduce((total, event) => total + eventCost(plans[event.id] ?? { registrationFee: null, headcount: 0, attending: false }), 0);
  const undatedEvents = events.filter((event) => !event.startDate || !event.endDate);
  const undatedTotal = undatedEvents.reduce((total, event) => total + eventCost(plans[event.id] ?? { registrationFee: null, headcount: 0, attending: false }), 0);
  const undatedAttendingCount = undatedEvents.filter((event) => plans[event.id]?.attending).length;
  const attendingUnpricedCount = [...eventsInYear, ...undatedEvents].filter((event) => {
    const plan = plans[event.id];
    return plan?.attending && plan.registrationFee === null;
  }).length;

  return {
    months: months.map((range) => ({
      label: new Date(`${range.start}T12:00:00`).toLocaleDateString("en-US", { month: "short" }),
      start: range.start,
      end: range.end,
      total: totalForRange(range)
    })),
    quarters: quarters.map((quarter) => ({
      label: quarter.label,
      start: quarter.start,
      end: quarter.end,
      total: totalForRange(quarter)
    })),
    yearTotal: eventsInYear.reduce((total, event) => total + eventCost(plans[event.id] ?? { registrationFee: null, headcount: 0, attending: false }), 0) + undatedTotal,
    undatedTotal,
    undatedAttendingCount,
    attendingUnpricedCount
  };
}
