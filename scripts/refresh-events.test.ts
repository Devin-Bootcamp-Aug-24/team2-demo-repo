import { describe, expect, it } from "vitest";
import { sourceRegistry } from "../data/source-registry";
import { generatedEvents } from "../data/generated-events";
import { manualEvents } from "../data/manual-events";
import { dateSourceText, locationMayHaveChanged, recordFor, refreshExitCode } from "./refresh-events";
import { parseEventDate } from "../lib/event-parser";

describe("refresh safety", () => {
  it("retains the last known good dates and reports a failed refresh", () => {
    const previous = generatedEvents.find((event) => event.id === "ausa-annual-meeting");
    const entry = sourceRegistry.find((source) => source.id === "ausa-annual-meeting");
    expect(previous).toBeDefined();
    expect(entry).toBeDefined();

    const refreshed = recordFor(entry!, previous, "2026-08-24T00:00:00.000Z", "an unparseable page", "fetch-failed", null, undefined, "HTTP 503");

    expect(refreshed.startDate).toBe(previous!.startDate);
    expect(refreshed.endDate).toBe(previous!.endDate);
    expect(refreshed.sourceSnippet).toBe(previous!.sourceSnippet);
    expect(refreshed.verifiedAt).toBe(previous!.verifiedAt);
    expect(refreshed.sourceStatus).toBe("fetch-failed");
    expect(refreshExitCode(1)).toBe(1);
  });

  it("flags location drift without rewriting the curated location", () => {
    const location = sourceRegistry.find((source) => source.id === "ausa-annual-meeting")!.location!;
    expect(locationMayHaveChanged("Walter E. Washington Convention Center (WEWCC), Washington, D.C.", location)).toBe(false);
    expect(locationMayHaveChanged("The event location is now announced separately.", location)).toBe(true);
  });

  it("refreshes only source-registry records, never manual events", () => {
    const sourceIds = new Set(sourceRegistry.map((source) => source.id));
    expect(manualEvents.every((event) => !sourceIds.has(event.id))).toBe(true);
    expect(sourceRegistry.map((source) => source.id)).not.toContain("evt-034");
    expect(sourceRegistry.map((source) => source.id)).not.toContain("evt-035");
  });

  it("never attributes another event's date from a shared index page", () => {
    const afceaIndex = "Featured Events 26 Oct TechNet Indo-Pacific Hilton Hawaiian Village, Honolulu, HI Monday, October 26, 2026 to Thursday, October 29, 2026 Cyber Defense Technology Emerging Leader 08 Feb Rocky Mountain Cyberspace Symposium 2027 (RMCS27) The Broadmoor Hotel, Colorado Springs, CO Monday, February 8, 2027 to Thursday, February 11, 2027 Acquisition";
    const west = sourceRegistry.find((source) => source.id === "west")!;
    const rmcs = sourceRegistry.find((source) => source.id === "rocky-mountain-cyberspace")!;
    expect(dateSourceText(afceaIndex, west)).toBeNull();
    expect(parseEventDate(dateSourceText(afceaIndex, rmcs)!, rmcs.editionYear)).toMatchObject({ startDate: "2027-02-08", endDate: "2027-02-11" });
  });
});
