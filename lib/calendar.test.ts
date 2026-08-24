import { describe, expect, it } from "vitest";
import { addYears, eventOccursInMonth, fiscalYearForDate, quartersForYear, startOfWeek } from "./calendar";

describe("calendar periods", () => {
  it("starts FY26 in October 2025 and maps quarters correctly", () => {
    expect(fiscalYearForDate("2025-10-01")).toBe(2026);
    expect(quartersForYear(2026, true)[0]).toMatchObject({ start: "2025-10-01", end: "2025-12-31" });
    expect(quartersForYear(2026, true)[1]).toMatchObject({ start: "2026-01-01", end: "2026-03-31" });
  });

  it("includes events that cross a month boundary in both months", () => {
    const event = { startDate: "2026-04-29", endDate: "2026-05-01" };
    expect(eventOccursInMonth(event, 2026, 3)).toBe(true);
    expect(eventOccursInMonth(event, 2026, 4)).toBe(true);
  });

  it("uses Sunday as the week boundary", () => {
    expect(startOfWeek("2026-05-13")).toBe("2026-05-10");
  });

  it("moves a cursor by exactly one calendar year", () => {
    expect(addYears("2026-05-04", 1)).toBe("2027-05-04");
    expect(addYears("2026-05-04", -1)).toBe("2025-05-04");
  });
});
