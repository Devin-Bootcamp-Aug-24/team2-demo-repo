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

The sample events and customer/owner assignments are illustrative sample data, not
verified schedules. Names are based on real federal conference formats where
appropriate; assignments, dates, and attendance are fabricated for demonstration.

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

`id`, `name`, `startDate`, `endDate`, `location` (city/state and optional venue),
`organizingAssociation`, `sponsoringCustomer`, `organizingCustomer`, `managedBy`,
`attendingCustomers`, `status` (`Confirmed`, `Tentative`, or `Declined`), and `notes`.

Lookup options for filters are derived from the event records at runtime. The
Add event control adds a record to React state only; it is intentionally not
persisted.

## Seed data and date math

- Seed records live in [`data/events.ts`](./data/events.ts).
- Fiscal quarter and week-boundary calculations live in
  [`lib/calendar.ts`](./lib/calendar.ts); FY starts on October 1.
- Date-overlap tests live in [`lib/calendar.test.ts`](./lib/calendar.test.ts).

Events appear in every month, quarter, or week period they overlap, including
records that cross a period boundary.