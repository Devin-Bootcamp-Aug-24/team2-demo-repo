import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sourceRegistry, type SourceRegistryEntry } from "../data/source-registry";
import { eventAssignments } from "../data/event-assignments";
import { extractLocation, parseEventDate } from "../lib/event-parser";
import type { GeneratedEventRecord, SourceStatus } from "../data/generated-event-types";
import WebSocket from "ws";

type CdpMessage = { id?: number; method?: string; result?: unknown };
type PreviousRecord = GeneratedEventRecord;

const generatedPath = join(process.cwd(), "data", "generated-events.ts");
const targetYear = 2027;

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|section|article|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPlain(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "User-Agent": "fed-events-refresh/1.0" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return htmlToText(await response.text());
}

function sendCdp(ws: WebSocket, method: string, params: Record<string, unknown> = {}): Promise<CdpMessage> {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1_000_000_000);
    const timer = setTimeout(() => reject(new Error(`CDP timeout for ${method}`)), 20_000);
    const onMessage = (raw: WebSocket.RawData) => {
      const message = JSON.parse(raw.toString()) as CdpMessage;
      if (message.id !== id) return;
      clearTimeout(timer);
      ws.off("message", onMessage);
      resolve(message);
    };
    ws.on("message", onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function fetchInBrowser(url: string): Promise<string> {
  const targets = await fetch("http://localhost:29229/json/list").then((response) => response.json()) as Array<{ type: string; webSocketDebuggerUrl?: string }>;
  const target = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
  if (!target?.webSocketDebuggerUrl) throw new Error("No existing Chrome page available at CDP endpoint");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise<void>((resolve, reject) => {
    ws.once("open", resolve);
    ws.once("error", reject);
  });
  await sendCdp(ws, "Page.navigate", { url });
  await new Promise((resolve) => setTimeout(resolve, 4_000));
  const result = await sendCdp(ws, "Runtime.evaluate", { expression: "document.body.innerText", returnByValue: true });
  ws.close();
  const value = (result.result as { result?: { value?: unknown } } | undefined)?.result?.value;
  if (typeof value !== "string" || !value.trim()) throw new Error("Browser returned an empty page");
  return value.replace(/\s+/g, " ").trim();
}

function loadPrevious(): PreviousRecord[] {
  if (!existsSync(generatedPath)) return [];
  const source = readFileSync(generatedPath, "utf8");
  const match = source.match(/export const generatedEvents: GeneratedEventRecord\[\] = (\[[\s\S]*\]);/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]) as PreviousRecord[];
  } catch {
    throw new Error(`Could not parse ${generatedPath}; refusing to overwrite it`);
  }
}

function statusLabel(status: SourceStatus): string {
  return status === "confirmed" ? "dates confirmed from source" : status === "not-announced" ? "not yet announced by organizer" : "fetch failed";
}

function hasUsableDates(record: PreviousRecord | undefined): record is PreviousRecord & { startDate: string; endDate: string } {
  return Boolean(record?.sourceStatus === "confirmed" && record.startDate && record.endDate && /^\d{4}-\d{2}-\d{2}$/.test(record.startDate) && /^\d{4}-\d{2}-\d{2}$/.test(record.endDate));
}

function recordFor(entry: SourceRegistryEntry, previous: PreviousRecord | undefined, now: string, text: string, status: SourceStatus, error?: string): GeneratedEventRecord {
  const parsed = status === "confirmed" ? parseEventDate(text, entry.editionYear) : null;
  const assignment = eventAssignments[entry.id] ?? eventAssignments["dodiis-worldwide"];
  if (parsed) {
    return {
      ...entryToRecord(entry, assignment),
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      location: extractLocation(text, parsed),
      sourceUrl: entry.sourceUrl,
      sourceSnippet: parsed.snippet,
      verifiedAt: now,
      sourceStatus: "confirmed",
      status: "Confirmed"
    };
  }
  if (hasUsableDates(previous)) {
    return { ...previous, sourceUrl: entry.sourceUrl, sourceStatus: status, refreshError: error };
  }
  return {
    ...entryToRecord(entry, assignment),
    sourceUrl: entry.sourceUrl,
    sourceSnippet: null,
    verifiedAt: null,
    sourceStatus: status,
    status: "Tentative",
    refreshError: error
  };
}

function entryToRecord(entry: SourceRegistryEntry, assignment: typeof eventAssignments[string]): GeneratedEventRecord {
  return {
    id: entry.id,
    name: entry.name,
    startDate: null,
    endDate: null,
    location: { city: "", state: "" },
    organizingAssociation: entry.association,
    ...assignment,
    sourceUrl: entry.sourceUrl,
    sourceSnippet: null,
    verifiedAt: null,
    sourceStatus: "not-announced",
    status: "Tentative"
  };
}

async function main() {
  const previous = new Map(loadPrevious().map((record) => [record.id, record]));
  const now = new Date().toISOString();
  const records: GeneratedEventRecord[] = [];
  let failures = 0;

  for (const entry of sourceRegistry) {
    let text = "";
    let sourceStatus: SourceStatus = "not-announced";
    let error: string | undefined;
    const previousRecord = previous.get(entry.id);
    try {
      text = entry.fetchStrategy === "browser" ? await fetchInBrowser(entry.sourceUrl) : await fetchPlain(entry.sourceUrl);
      const anchorIndex = entry.dateAnchor ? text.lastIndexOf(entry.dateAnchor) : -1;
      const sourceText = anchorIndex >= 0 ? text.slice(anchorIndex) : text;
      const parsed = entry.parseDates === false ? null : parseEventDate(sourceText, entry.editionYear);
      sourceStatus = parsed ? "confirmed" : hasUsableDates(previousRecord) ? "fetch-failed" : "not-announced";
      if (!parsed && hasUsableDates(previousRecord)) {
        error = "No target-year date could be parsed; retained the previous confirmed date";
        failures += 1;
      }
      text = sourceText;
    } catch (caught) {
      sourceStatus = "fetch-failed";
      error = caught instanceof Error ? caught.message : String(caught);
      if (previous.get(entry.id)?.sourceStatus === "confirmed") failures += 1;
    }
    const record = recordFor(entry, previous.get(entry.id), now, text, sourceStatus, error);
    records.push(record);
    const old = previous.get(entry.id);
    const change = record.startDate !== old?.startDate || record.endDate !== old?.endDate || record.sourceStatus !== old?.sourceStatus ? "changed" : "unchanged";
    const dates = record.startDate && record.endDate ? `${record.startDate} to ${record.endDate}` : "Dates TBA";
    console.log(`${entry.name}: ${statusLabel(record.sourceStatus)} — ${dates} (${change})${error ? ` — ${error}` : ""}`);
  }

  const output = `import type { GeneratedEventRecord } from "./generated-event-types";\n\nexport const generatedEvents: GeneratedEventRecord[] = ${JSON.stringify(records, null, 2)};\n`;
  writeFileSync(generatedPath, output);
  console.log(`\nWrote ${records.length} records to ${generatedPath}`);
  if (failures) {
    console.error(`${failures} previously confirmed event(s) failed to refresh; retained their last known good dates.`);
    process.exitCode = 1;
  }
}

void main();
