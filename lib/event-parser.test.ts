import { describe, expect, it } from "vitest";
import { parseEventDate } from "./event-parser";

describe("event date parser", () => {
  it("parses a day-first range", () => {
    expect(parseEventDate("The AUSA Annual Meeting and Exposition will take place 12-14 October 2026.", 2026)).toMatchObject({ startDate: "2026-10-12", endDate: "2026-10-14" });
  });

  it("parses a month-first range", () => {
    expect(parseEventDate("May 17 - 19, 2027", 2027)).toMatchObject({ startDate: "2027-05-17", endDate: "2027-05-19" });
  });

  it("parses long weekday forms", () => {
    expect(parseEventDate("Monday, May 17, 2027 – Wednesday, May 19, 2027", 2027)).toMatchObject({ startDate: "2027-05-17", endDate: "2027-05-19" });
  });

  it("parses a date with the year on the next line", () => {
    expect(parseEventDate("APRIL 12–15\n2027", 2027)).toMatchObject({ startDate: "2027-04-12", endDate: "2027-04-15" });
  });

  it("parses month day to day", () => {
    expect(parseEventDate("September 20 to 22, 2027", 2027)).toMatchObject({ startDate: "2027-09-20", endDate: "2027-09-22" });
  });

  it("parses save-the-date prose", () => {
    expect(parseEventDate("We’ll see you May 3–6, 2027!", 2027)).toMatchObject({ startDate: "2027-05-03", endDate: "2027-05-06" });
  });

  it("uses an edition label to resolve a yearless date", () => {
    expect(parseEventDate("The 2027 Summit is taking place at the Kansas City Convention Center, Kansas City, MO, May 5-7.", 2027)).toMatchObject({ startDate: "2027-05-05", endDate: "2027-05-07" });
  });

  it("parses a repeated month in a date range", () => {
    expect(parseEventDate("April 13 – April 15, 2027 Washington, DC", 2027)).toMatchObject({ startDate: "2027-04-13", endDate: "2027-04-15" });
  });

  it("does not turn an old edition into a target-year date", () => {
    expect(parseEventDate("TechNet Indo-Pacific 2026 | October 26-29, 2026", 2027)).toBeNull();
  });
});
