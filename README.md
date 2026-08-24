# Federal Events POC

An internal planning workspace for tracking federal (DoD and Intelligence Community)
customer and association events. The app rolls up one shared event list into fiscal
quarters, calendar months, and weeks, with the same customer, association, owner,
status, and free-text filters available in every view.

## What is included

- **Quarter view (default):** FY26 grouped into four quarter sections and month rows.
  Select a quarter or month to drill into the next view.
- **Month view:** Calendar grid with multi-day event bars color-coded by organizing
  association. Select a week row to open weekly detail.
- **Week view:** Seven day columns with event detail for the week.
- Fiscal-quarter/calendar-quarter toggle, previous/next cursor, shared filters, and
  an in-memory **Add event** demo action.

Event names, dates, and locations in the generated records are sourced from
official organizer or event-microsite pages. Locations are curated in the source
registry from the published page text rather than inferred from free-form prose.
Internal customer, owner, attendee, status, and notes assignments are demo values;
they are not claims published by the event organizers.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production checks:

```bash
npm run lint
npm run test
npm run build
```

## Data model

Each event has:

`id`, `name`, `startDate`, `endDate`, `location` (city/state, optional venue, or
display text), `organizingAssociation`, `sponsoringCustomer`,
`organizingCustomer`, `managedBy`, `attendingCustomers`, `status` (`Confirmed`,
`Tentative`, or `Declined`), and `notes`. Source metadata includes `sourceUrl`,
`sourceSnippet`, `verifiedAt`, and `sourceStatus`. `startDate` and `endDate` are
null for events whose dates are not announced.

Lookup options for filters are derived from the event records at runtime. The
Add event control adds a record to React state only; it is intentionally not
persisted.

## Sourced data and refresh workflow

- The source registry lives in [`data/source-registry.ts`](./data/source-registry.ts).
- The committed generated records live in
  [`data/generated-events.ts`](./data/generated-events.ts), and the UI-facing
  mapping is in [`data/events.ts`](./data/events.ts).
- Run `npm run refresh:events` to fetch every official source and regenerate the
  records. The intended production use is a weekly scheduled refresh.
- Every confirmed record stores its source URL, the raw date snippet, and a
  `verifiedAt` timestamp. Curated locations retain their source text; if a
  subsequent fetch no longer contains that text, the generated record is marked
  for location re-verification without rewriting the location. Events without an announced date remain in the
  **Dates TBA** tray and never appear on a calendar grid.
- Fetch and parse failures are distinct from an organizer not announcing a date.
  A failure never replaces a previously confirmed date; the last known good date,
  snippet, and verification timestamp are retained, and the refresh exits
  non-zero when a previously confirmed record cannot be refreshed.
- Plain HTTP is used by default. Sources marked `browser` use the existing
  Chrome DevTools Protocol endpoint at `http://localhost:29229`; the refresh
  script attaches to that browser and does not launch Chrome.
- The application follows a no-invented-date policy: no fallback or guessed
  conference dates are written.

## Date math

- Fiscal quarter and week-boundary calculations live in
  [`lib/calendar.ts`](./lib/calendar.ts); FY starts on October 1.
- Date-overlap tests live in [`lib/calendar.test.ts`](./lib/calendar.test.ts).

Events appear in every month, quarter, or week period they overlap, including
records that cross a period boundary.