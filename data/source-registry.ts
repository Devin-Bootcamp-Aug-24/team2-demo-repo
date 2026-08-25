export type FetchStrategy = "plain" | "browser";

export type CuratedLocation = {
  city: string;
  state: string;
  venue?: string;
  display?: string;
  sourceText: string;
};

export type SourceRegistryEntry = {
  id: string;
  name: string;
  association: string;
  sourceUrl: string;
  fetchStrategy: FetchStrategy;
  editionYear: number;
  parseDates?: boolean;
  dateAnchor?: string;
  location?: CuratedLocation;
};

export const sourceRegistry: SourceRegistryEntry[] = [
  { id: "ausa-annual-meeting", name: "AUSA Annual Meeting and Exposition", association: "AUSA", sourceUrl: "https://meetings.ausa.org/annual/2026/index.cfm", fetchStrategy: "plain", editionYear: 2026, location: { city: "Washington", state: "DC", venue: "Walter E. Washington Convention Center (WEWCC)", sourceText: "Walter E. Washington Convention Center (WEWCC), Washington, D.C." } },
  { id: "geoint-symposium", name: "GEOINT Symposium 2027", association: "USGIF", sourceUrl: "https://usgif.org/geoint-symposium/2027-symposium/", fetchStrategy: "plain", editionYear: 2027, location: { city: "Kissimmee", state: "FL", venue: "Gaylord Palms Resort & Convention Center", sourceText: "Gaylord Palms Resort & Convention Center, Kissimmee, FL" } },
  { id: "geogala", name: "GEOGala 2026", association: "USGIF", sourceUrl: "https://usgif.org/event/geogala-2026/", fetchStrategy: "plain", editionYear: 2026, location: { city: "McLean", state: "VA", venue: "The Ritz Carlton", sourceText: "The Ritz Carlton / 1700 Tysons Blvd, McLean, VA" } },
  { id: "dodiis-worldwide", name: "DoDIIS Worldwide", association: "DIA", sourceUrl: "https://www.dia.mil/", fetchStrategy: "browser", editionYear: 2027 },
  // AFCEA has not published FY2027 microsites yet, so these point to its official
  // event index or the prior-year microsite rather than an invented future URL.
  { id: "technet-indo-pacific", name: "TechNet Indo-Pacific", association: "AFCEA", sourceUrl: "https://events.afcea.org/TIP26/Public/Enter.aspx", fetchStrategy: "plain", editionYear: 2027 },
  { id: "west", name: "WEST", association: "AFCEA / USNI", sourceUrl: "https://www.afcea.org/events", fetchStrategy: "plain", editionYear: 2027 },
  { id: "technet-cyber", name: "TechNet Cyber", association: "AFCEA", sourceUrl: "https://www.afcea.org/events", fetchStrategy: "plain", editionYear: 2027 },
  { id: "army-signal", name: "Army Signal Conference", association: "AFCEA", sourceUrl: "https://www.afcea.org/events", fetchStrategy: "plain", editionYear: 2027 },
  { id: "dafitc", name: "DAFITC", association: "AFCEA", sourceUrl: "https://www.afcea.org/events", fetchStrategy: "plain", editionYear: 2027 },
  { id: "dhits", name: "Defense Health Information Technology Symposium", association: "AFCEA", sourceUrl: "https://www.afcea.org/events", fetchStrategy: "plain", editionYear: 2027 },
  { id: "rocky-mountain-cyberspace", name: "Rocky Mountain Cyberspace Symposium", association: "AFCEA", sourceUrl: "https://www.afcea.org/events", fetchStrategy: "plain", editionYear: 2027 },
  { id: "intelligence-national-security", name: "AFCEA/INSA Intelligence and National Security Summit", association: "INSA", sourceUrl: "https://intelsummit.org/", fetchStrategy: "plain", editionYear: 2027 },
  { id: "afa-warfare", name: "2027 Warfare Symposium", association: "AFA", sourceUrl: "https://www.afa.org/afa-warfare-symposium/", fetchStrategy: "plain", editionYear: 2027, location: { city: "Aurora", state: "CO", sourceText: "Aurora, Colo." } },
  { id: "afa-air-space-cyber", name: "2027 Air, Space & Cyber Conference", association: "AFA", sourceUrl: "https://www.afa.org/events/", fetchStrategy: "plain", editionYear: 2027, dateAnchor: "2027 Air, Space & Cyber Conference", location: { city: "", state: "", display: "Virtual and In-Person Event", sourceText: "Virtual and In-Person Event" } },
  { id: "sea-air-space", name: "Sea-Air-Space 2027", association: "Navy League", sourceUrl: "https://seaairspace.org/", fetchStrategy: "plain", editionYear: 2027, location: { city: "National Harbor", state: "MD", venue: "Gaylord National Resort & Convention Center", sourceText: "Gaylord National Resort & Convention Center National Harbor, Maryland" } },
  { id: "aaaa-summit", name: "2027 Army Aviation Warfighting Summit", association: "AAAA", sourceUrl: "https://www.quad-a.org/", fetchStrategy: "plain", editionYear: 2027, location: { city: "Kansas City", state: "MO", venue: "Kansas City Convention Center", sourceText: "Kansas City Convention Center, Kansas City, MO" } },
  { id: "sof-week", name: "SOF Week", association: "USSOCOM", sourceUrl: "https://sofweek.org/", fetchStrategy: "plain", editionYear: 2027 },
  { id: "modern-day-marine", name: "Modern Day Marine", association: "MCAA", sourceUrl: "https://marinemilitaryexpos.com/", fetchStrategy: "plain", editionYear: 2027, location: { city: "Washington", state: "DC", sourceText: "Washington, DC" } },
  // SOFIC is represented through SOF Week; no separate published SOFIC date exists.
  { id: "sofic", name: "SOFIC", association: "USSOCOM", sourceUrl: "https://sofweek.org/", fetchStrategy: "plain", editionYear: 2027, parseDates: false },
  { id: "space-symposium", name: "41st Space Symposium", association: "Space Foundation", sourceUrl: "https://www.spacesymposium.org/", fetchStrategy: "browser", editionYear: 2027, location: { city: "Colorado Springs", state: "CO", venue: "The Broadmoor", sourceText: "The Broadmoor, Colorado Springs, CO USA" } },
  { id: "ndia-expeditionary-warfare", name: "NDIA Expeditionary Warfare Conference", association: "NDIA", sourceUrl: "https://www.ndia.org/events", fetchStrategy: "browser", editionYear: 2027 }
];
