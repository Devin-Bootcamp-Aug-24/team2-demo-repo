const months: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
};

export type ParsedEventDate = {
  startDate: string;
  endDate: string;
  snippet: string;
};

const monthPattern = "(?:January|February|March|April|May|June|July|August|September|October|November|December)";

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
  const singleDatePattern = new RegExp(`(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\\s*(${monthPattern})\\s+(\\d{1,2}),\\s*(\\d{4})`, "gi");
  for (const match of Array.from(text.matchAll(singleDatePattern))) {
    if (Number(match[3]) !== targetYear) continue;
    const index = match.index ?? 0;
    const monthNumber = months[match[1].toLowerCase()];
    candidates.push({
      startDate: dateKey(targetYear, monthNumber, Number(match[2])),
      endDate: dateKey(targetYear, monthNumber, Number(match[2])),
      snippet: snippetFor(text, index, match[0].length),
      index
    });
  }
  const longWeekdayPattern = new RegExp(`(${monthPattern})\\s+(\\d{1,2}),\\s*(\\d{4})\\s*[–-]\\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\\s*(${monthPattern})\\s+(\\d{1,2}),\\s*(\\d{4})`, "gi");
  for (const match of Array.from(text.matchAll(longWeekdayPattern))) {
    if (Number(match[3]) !== targetYear || Number(match[6]) !== targetYear) continue;
    const index = match.index ?? 0;
    const startMonth = months[match[1].toLowerCase()];
    const endMonth = months[match[4].toLowerCase()];
    candidates.push({
      startDate: dateKey(targetYear, startMonth, Number(match[2])),
      endDate: dateKey(targetYear, endMonth, Number(match[5])),
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
      let parsed: ParsedEventDate | null = null;
      if (/^\d/.test(match[1])) {
        parsed = makeDate(match[3], match[1], match[2], match[4], text, index, match[0].length);
      } else if (match[4] && /^\d{4}$/.test(match[4])) {
        parsed = makeDate(match[1], match[2], match[3], match[4], text, index, match[0].length);
      } else if (match[5] && /^\d{4}$/.test(match[5])) {
        parsed = makeDate(match[1], match[2], match[3], match[5], text, index, match[0].length);
      } else if (match[4] && /^\d{4}$/.test(match[4])) {
        parsed = makeDate(match[1], match[2], match[3], match[4], text, index, match[0].length);
      } else {
        const context = text.slice(Math.max(0, index - 120), index + match[0].length + 120);
        const before = text.slice(Math.max(0, index - 120), index);
        const after = text.slice(index + match[0].length, index + match[0].length + 12);
        if (!before.includes(String(targetYear)) || /\b20\d{2}\b/.test(after)) continue;
        parsed = makeDate(match[1], match[2], match[3], String(targetYear), text, index, match[0].length);
      }
      if (parsed && Number(parsed.startDate.slice(0, 4)) === targetYear) candidates.push({ ...parsed, index });
    }
  }

  const unique = candidates.filter((candidate, index, all) => all.findIndex((other) => other.startDate === candidate.startDate && other.endDate === candidate.endDate) === index);
  if (!unique.length) return null;
  return unique.sort((left, right) => Number(left.startDate === left.endDate) - Number(right.startDate === right.endDate) || left.index - right.index)[0];
}

export function extractLocation(text: string, date: ParsedEventDate): { city: string; state: string; venue?: string; display?: string } {
  const known = [
    /Walter E\. Washington Convention Center \(WEWCC\)(?:, Washington, D\.C\.)?/i,
    /Gaylord Palms Resort & Convention Center, Kissimmee, FL/i,
    /The Ritz Carlton\s*[,/]?\s*1700 Tysons Blvd, McLean, VA/i,
    /Aurora, Colo\./i,
    /Gaylord National Resort & Convention Center National Harbor, Maryland/i,
    /Kansas City Convention Center, Kansas City, MO|Kansas City, MO/i,
    /Virtual and In-Person Event/i,
    /Washington, DC/i,
    /The Broadmoor, Colorado Springs, CO USA/i
  ];
  const context = date.snippet;
  for (const pattern of known) {
    const match = context.match(pattern);
    if (!match) continue;
    const value = match[0];
    if (/Walter/.test(value)) return { city: "Washington", state: "DC", venue: "Walter E. Washington Convention Center (WEWCC)" };
    if (/Gaylord Palms/.test(value)) return { city: "Kissimmee", state: "FL", venue: "Gaylord Palms Resort & Convention Center" };
    if (/Ritz Carlton/.test(value)) return { city: "McLean", state: "VA", venue: "The Ritz Carlton" };
    if (/Aurora/.test(value)) return { city: "Aurora", state: "CO" };
    if (/Gaylord National/.test(value)) return { city: "National Harbor", state: "MD", venue: "Gaylord National Resort & Convention Center" };
    if (/Kansas City/.test(value)) return { city: "Kansas City", state: "MO", venue: "Kansas City Convention Center" };
    if (/Virtual/.test(value)) return { city: "", state: "", display: "Virtual and In-Person Event" };
    if (/Broadmoor/.test(value)) return { city: "Colorado Springs", state: "CO", venue: "The Broadmoor" };
    return { city: "Washington", state: "DC" };
  }
  return { city: "", state: "" };
}
