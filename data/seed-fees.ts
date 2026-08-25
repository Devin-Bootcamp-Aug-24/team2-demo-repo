// Per-person registration fees carried over from the hand-entered
// `registrationCost` values that lived on `data/events.ts` before the scraped
// data landed. NOBODY VERIFIED THESE against an organizer's registration page:
// they are starting points for planning, which is why the UI marks a fee from
// this file as unverified until someone confirms it. A `null` means we have no
// figure at all (either the old data had none, or it claimed $0, which we treat
// as unknown rather than as a claim that the event is free).
export const seedRegistrationFees: Record<string, number | null> = {
  "ausa-annual-meeting": null,
  "geoint-symposium": 1795,
  geogala: null,
  "dodiis-worldwide": 1050,
  "technet-indo-pacific": 795,
  west: 1195,
  "technet-cyber": 1095,
  "army-signal": 725,
  dafitc: 1295,
  dhits: 1025,
  "rocky-mountain-cyberspace": 895,
  "intelligence-national-security": 1450,
  "afa-warfare": 1100,
  "afa-air-space-cyber": 1250,
  "sea-air-space": 495,
  "aaaa-summit": 875,
  "sof-week": 1250,
  "modern-day-marine": 350,
  sofic: 1150,
  "space-symposium": 2495,
  "ndia-expeditionary-warfare": null
};
