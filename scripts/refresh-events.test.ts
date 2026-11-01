import { describe, expect, it } from "vitest";
import { sourceRegistry } from "../data/source-registry";
import { generatedEvents } from "../data/generated-events";
import { manualEvents } from "../data/manual-events";
import { anchoredText, locationMayHaveChanged, recordFor, refreshExitCode } from "./refresh-events";
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

  it("does not borrow another event's date from a shared index page", () => {
    const index = "08 Feb Rocky Mountain Cyberspace Symposium 2027 (RMCS27) The Broadmoor Hotel, Colorado Springs, CO Monday, February 8, 2027 to Thursday, February 11, 2027 Acquisition";
    expect(anchoredText(index, { dateAnchor: "WEST 2027" })).toBeNull();
    const anchored = anchoredText(index, { dateAnchor: "Rocky Mountain Cyberspace Symposium 2027" });
    expect(parseEventDate(anchored!, 2027)).toMatchObject({ startDate: "2027-02-08", endDate: "2027-02-11" });
  });

  it("requires a date anchor for every source that shares a URL", () => {
    const counts = new Map<string, number>();
    for (const source of sourceRegistry) if (source.parseDates !== false) counts.set(source.sourceUrl, (counts.get(source.sourceUrl) ?? 0) + 1);
    const unanchoredShared = sourceRegistry.filter((source) => source.parseDates !== false && counts.get(source.sourceUrl)! > 1 && !source.dateAnchor);
    expect(unanchoredShared.map((source) => source.id)).toEqual([]);
  });

  it("refreshes only source-registry records, never manual events", () => {
    const sourceIds = new Set(sourceRegistry.map((source) => source.id));
    expect(manualEvents.every((event) => !sourceIds.has(event.id))).toBe(true);
    expect(sourceRegistry.map((source) => source.id)).not.toContain("evt-034");
    expect(sourceRegistry.map((source) => source.id)).not.toContain("evt-035");
  });
});
