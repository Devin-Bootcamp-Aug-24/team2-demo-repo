import { describe, expect, it } from "vitest";
import type { Event } from "../data/events";
import type { BudgetPlan } from "../data/budget";
import { calculateBudgetTotals, eventCost } from "./budget";

function event(id: string, startDate: string | null, endDate: string | null): Event {
  return {
    id,
    name: id,
    startDate,
    endDate,
    location: { city: "", state: "" },
    organizingAssociation: "AFCEA",
    sponsoringCustomer: "Customer",
    organizingCustomer: "Customer",
    managedBy: "Owner",
    attendingCustomers: [],
    status: "Tentative",
    notes: "",
    sourceUrl: "",
    sourceSnippet: null,
    verifiedAt: null,
    sourceStatus: "confirmed"
  };
}

const plan = (registrationFee: number | null, headcount: number, attending = true): BudgetPlan => ({ registrationFee, headcount, attending });

describe("budget calculations", () => {
  it("calculates an attending event cost and ignores unpriced, absent, or zero-headcount plans", () => {
    expect(eventCost(plan(500, 3))).toBe(1500);
    expect(eventCost(plan(null, 3))).toBe(0);
    expect(eventCost(plan(500, 3, false))).toBe(0);
    expect(eventCost(plan(500, 0))).toBe(0);
  });

  it("rolls up month, quarter, and year totals without double counting", () => {
    const events = [
      event("jan", "2027-01-10", "2027-01-12"),
      event("boundary", "2027-03-31", "2027-04-02"),
      event("undated", null, null)
    ];
    const totals = calculateBudgetTotals(events, { jan: plan(100, 2), boundary: plan(500, 1), undated: plan(900, 1) }, 2027, false);
    expect(totals.months.find((month) => month.start === "2027-01-01")?.total).toBe(200);
    expect(totals.months.find((month) => month.start === "2027-03-01")?.total).toBe(500);
    expect(totals.months.find((month) => month.start === "2027-04-01")?.total).toBe(0);
    expect(totals.quarters.find((quarter) => quarter.label === "Q1")?.total).toBe(700);
    expect(totals.yearTotal).toBe(1600);
    expect(totals.undatedTotal).toBe(900);
    expect(totals.undatedAttendingCount).toBe(1);
  });

  it("attributes an October event to the correct fiscal or calendar quarter", () => {
    const events = [event("october", "2027-10-01", "2027-10-03")];
    const plans = { october: plan(100, 1) };
    expect(calculateBudgetTotals(events, plans, 2028, true).quarters[0].total).toBe(100);
    expect(calculateBudgetTotals(events, plans, 2027, false).quarters[3].total).toBe(100);
  });

  it("tracks attending events without published fees", () => {
    const events = [event("priced", "2027-05-01", "2027-05-01"), event("unpriced", "2027-06-01", "2027-06-01")];
    const totals = calculateBudgetTotals(events, { priced: plan(100, 1), unpriced: plan(null, 2) }, 2027, false);
    expect(totals.attendingUnpricedCount).toBe(1);
    expect(totals.yearTotal).toBe(100);
  });
});
