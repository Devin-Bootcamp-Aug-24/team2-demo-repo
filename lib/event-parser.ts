const months: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
};

const stateNames: Record<string, string> = {
  "d.c.": "DC", alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR",
  california: "CA", colorado: "CO", florida: "FL", georgia: "GA", hawaii: "HI",
  illinois: "IL", maryland: "MD", massachusetts: "MA", missouri: "MO",
  nevada: "NV", newyork: "NY", northcarolina: "NC", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", tennessee: "TN", texas: "TX", utah: "UT",
  virginia: "VA", washington: "WA"
};

export type ParsedEventDate = {
  startDate: string;
  endDate: string;
  snippet: string;
};

export type ParsedLocation = {
  city: string;
  state: string;
  venue?: string;
  display?: string;
};

const monthPattern = "(?:January|February|March|April|May|June|July|August|September|October|November|December)";
const weekdayPattern = "(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)";

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function snippetFor(text: string, index: number, length: number): string {
  return text.slice(Math.max(0, index - 100), Math.min(text.length, index + length + 100)).replace(/\s+/g, " ").trim();
}

function makeDate(month: string, startDay: string, endDay: string, year: string, text: string, index: number, length: number): ParsedEventDate {
  const monthNumber = months[month.toLowerCase()];
  return {
    startDate: dateKey(Number(year), monthNumber, Number(startDay)),
    endDate: dateKey(Number(year), monthNumber, Number(endDay)),
    snippet: snippetFor(text, index, length)
  };
}

export function parseEventDate(text: string, targetYear: number): ParsedEventDate | null {
  const candidates: Array<ParsedEventDate & { index: number }> = [];
  const singleDatePattern = new RegExp(`${weekdayPattern},?\\s*(${monthPattern})\\s+(\\d{1,2}),\\s*(\\d{4})`, "gi");
  for (const match of Array.from(text.matchAll(singleDatePattern))) {
    if (Number(match[3]) !== targetYear) continue;
    const index = match.index ?? 0;
    candidates.push({
      startDate: dateKey(targetYear, months[match[1].toLowerCase()], Number(match[2])),
      endDate: dateKey(targetYear, months[match[1].toLowerCase()], Number(match[2])),
      snippet: snippetFor(text, index, match[0].length),
      index
    });
  }

  const longWeekdayPattern = new RegExp(`(${monthPattern})\\s+(\\d{1,2}),\\s*(\\d{4})\\s*[–-]\\s*${weekdayPattern},?\\s*(${monthPattern})\\s+(\\d{1,2}),\\s*(\\d{4})`, "gi");
  for (const match of Array.from(text.matchAll(longWeekdayPattern))) {
    if (Number(match[3]) !== targetYear || Number(match[6]) !== targetYear) continue;
    const index = match.index ?? 0;
    candidates.push({
      startDate: dateKey(targetYear, months[match[1].toLowerCase()], Number(match[2])),
      endDate: dateKey(targetYear, months[match[4].toLowerCase()], Number(match[5])),
      snippet: snippetFor(text, index, match[0].length),
      index
    });
  }

  const patterns = [
    new RegExp(`(${monthPattern})\\s+(\\d{1,2})\\s*[-–]\\s*(?:(?:${monthPattern})\\s+)?(\\d{1,2}),\\s*(\\d{4})`, "gi"),
    new RegExp(`(${monthPattern})\\s+(\\d{1,2})\\s+to\\s+(\\d{1,2}),\\s*(\\d{4})`, "gi"),
    new RegExp(`(\\d{1,2})\\s*[-–]\\s*(\\d{1,2})\\s+(${monthPattern})\\s+(\\d{4})`, "gi"),
    new RegExp(`(${monthPattern})\\s+(\\d{1,2})\\s*[-–]\\s*(\\d{1,2})\\s*[\\n\\r ]+(${String(targetYear)})`, "gi"),
    new RegExp(`(${monthPattern})\\s+(\\d{1,2})\\s*[-–]\\s*(\\d{1,2})`, "gi")
  ];

  for (const pattern of patterns) {
    for (const match of Array.from(text.matchAll(pattern))) {
      const index = match.index ?? 0;
      let parsed: ParsedEventDate;
      if (/^\d/.test(match[1])) {
        parsed = makeDate(match[3], match[1], match[2], match[4], text, index, match[0].length);
      } else if (match[4] && /^\d{4}$/.test(match[4])) {
        parsed = makeDate(match[1], match[2], match[3], match[4], text, index, match[0].length);
      } else {
        const before = text.slice(Math.max(0, index - 120), index);
        const after = text.slice(index + match[0].length, index + match[0].length + 12);
        if (!before.includes(String(targetYear)) || /\b20\d{2}\b/.test(after)) continue;
        parsed = makeDate(match[1], match[2], match[3], String(targetYear), text, index, match[0].length);
      }
      if (Number(parsed.startDate.slice(0, 4)) === targetYear) candidates.push({ ...parsed, index });
    }
  }

  const unique = candidates.filter((candidate, index, all) => all.findIndex((other) => other.startDate === candidate.startDate && other.endDate === candidate.endDate) === index);
  if (!unique.length) return null;
  return unique.sort((left, right) => Number(left.startDate === left.endDate) - Number(right.startDate === right.endDate) || left.index - right.index)[0];
}

function normalizeState(value: string): string {
  return stateNames[value.toLowerCase().replace(/\s+/g, "")] ?? value.toUpperCase();
}

export function extractLocation(text: string, date: ParsedEventDate): ParsedLocation {
  const dateIndex = text.indexOf(date.snippet);
  const context = dateIndex >= 0
    ? text.slice(Math.max(0, dateIndex - 250), dateIndex + date.snippet.length + 350)
    : date.snippet;
  if (context.match(/\bVirtual and In-Person Event\b/i)) return { city: "", state: "", display: "Virtual and In-Person Event" };
  const cityStatePattern = /\b([A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,4}),\s*(D\.C\.|[A-Z]{2}|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Florida|Georgia|Hawaii|Illinois|Maryland|Massachusetts|Missouri|Nevada|New York|North Carolina|Ohio|Oklahoma|Oregon|Pennsylvania|Tennessee|Texas|Utah|Virginia|Washington)\b/gi;
  const cityStateMatches = Array.from(context.matchAll(cityStatePattern));
  const abbreviatedState = cityStateMatches.filter((match) => match[2].length <= 3);
  const cityState = (abbreviatedState.length ? abbreviatedState : cityStateMatches)[(abbreviatedState.length ? abbreviatedState : cityStateMatches).length - 1];
  if (!cityState) return { city: "", state: "" };

  const precedingState = context.slice(0, cityState.index ?? 0).match(/\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Florida|Georgia|Hawaii|Illinois|Maryland|Massachusetts|Missouri|Nevada|New York|North Carolina|Ohio|Oklahoma|Oregon|Pennsylvania|Tennessee|Texas|Utah|Virginia|Washington)\s+$/i);
  const city = `${precedingState?.[1] ? `${precedingState[1]} ` : ""}${cityState[1].trim()}`;
  const state = normalizeState(cityState[2]);
  const beforeCity = context.slice(0, cityState.index ?? 0);
  const venueContext = precedingState ? beforeCity.slice(0, -precedingState[0].length) : beforeCity;
  const addressVenue = venueContext.match(/(?:^|,\s*)((?:The )?[A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){1,8})\s+\d{2,5}\s+[^,]+,/);
  const fragments = venueContext.split(/[,.;]|\bat\b/i).map((fragment) => fragment.trim()).filter(Boolean);
  const candidate = fragments[fragments.length - 1]?.replace(/^the\s+/i, "").trim();
  const candidateVenue = candidate?.match(/((?:The\s+)?[A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,8}?\s+(?:Convention Center|Convention Centre|Resort|Hotel|Broadmoor|Center|Centre|Hall|Campus|Arena|Exposition|Ritz Carlton))/i)?.[1];
  const venue = addressVenue?.[1] ?? candidateVenue;
  return venue ? { city, state, venue: venue.trim() } : { city, state };
}
