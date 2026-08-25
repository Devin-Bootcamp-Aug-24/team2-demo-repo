"use client";

import { useMemo, useState } from "react";
import { associationColors, events as seedEvents, type Event, type EventStatus } from "@/data/events";
import {
  addDays,
  addYears,
  endOfWeek,
  eventOccursInMonth,
  eventOccursInWeek,
  fiscalYearForDate,
  formatDateRange,
  monthLabel,
  monthRange,
  overlaps,
  parseDate,
  quartersForYear,
  startOfWeek,
} from "@/lib/calendar";

type View = "quarter" | "month" | "week";
type Filters = { customer: string; association: string; owner: string; status: string; search: string };
type IconName = "calendar" | "search" | "chevron" | "plus" | "filter" | "location" | "users" | "close" | "arrow" | "cost";

function formatRegistrationCost(cost?: number) {
  if (cost === undefined) return "Cost TBD";
  if (cost === 0) return "Free";
  return cost.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const initialFilters: Filters = { customer: "All customers", association: "All associations", owner: "All owners", status: "All statuses", search: "" };
const customerOptions = (items: Event[]) => Array.from(new Set(items.flatMap((event) => [event.sponsoringCustomer, event.organizingCustomer, ...event.attendingCustomers]))).sort();
const associationOptions = (items: Event[]) => Array.from(new Set(items.map((event) => event.organizingAssociation))).sort();
const ownerOptions = (items: Event[]) => Array.from(new Set(items.map((event) => event.managedBy))).sort();

const STAR_PATH = "M0,-26 L6.11,-8.41 L24.73,-8.03 L9.89,3.21 L15.28,21.03 L0,10.4 L-15.28,21.03 L-9.89,3.21 L-24.73,-8.03 L-6.11,-8.41 Z";
const STAR_POSITIONS = Array.from({ length: 9 }, (_, row) => {
  const columns = row % 2 === 0 ? [1, 3, 5, 7, 9, 11] : [2, 4, 6, 8, 10];
  return columns.map((column) => ({ left: (column / 12) * 100, top: ((row + 1) / 10) * 100 }));
}).flat();
const STRIPE_FADE = "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.45) 18%, #000 46%)";
const CANTON_FADE = "linear-gradient(to right, #000 62%, transparent 100%)";

function FlagBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-y-0 left-[12%] right-0"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(178,34,52,0.62) 0, rgba(178,34,52,0.62) 7.6923%, rgba(255,255,255,0.06) 7.6923%, rgba(255,255,255,0.06) 15.3846%)",
          maskImage: STRIPE_FADE,
          WebkitMaskImage: STRIPE_FADE
        }}
      />
      <div
        className="absolute inset-y-0 left-[12%] right-0"
        style={{ background: "linear-gradient(to right, rgba(9,25,45,0.9) 0%, rgba(9,25,45,0.5) 26%, rgba(9,25,45,0.12) 50%, rgba(9,25,45,0.4) 100%)" }}
      />
      <div
        className="absolute inset-y-0 left-0 w-[22%] bg-[#0f2748]"
        style={{ maskImage: CANTON_FADE, WebkitMaskImage: CANTON_FADE }}
      >
        {STAR_POSITIONS.map((star) => (
          <svg
            key={`${star.left}-${star.top}`}
            viewBox="-30 -30 60 60"
            className="absolute h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 opacity-60"
            style={{ left: `${star.left * 0.82}%`, top: `${star.top}%` }}
          >
            <path d={STAR_PATH} fill="#ffffff" />
          </svg>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[#b22234]" />
    </div>
  );
}

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "calendar") return <svg {...common}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 9h18" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>;
  if (name === "chevron") return <svg {...common}><path d="m9 5 7 7-7 7" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "filter") return <svg {...common}><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
  if (name === "location") return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  if (name === "users") return <svg {...common}><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM16 4.3a3.5 3.5 0 0 1 0 6.5M20 20v-1.5a3.5 3.5 0 0 0-2.4-3.3" /></svg>;
  if (name === "close") return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
  if (name === "cost") return <svg {...common}><path d="M12 3v18M16 7.5c0-1.7-1.8-2.5-4-2.5s-4 .9-4 2.6c0 3.7 8 1.9 8 5.6 0 1.7-1.8 2.6-4 2.6s-4-.9-4-2.6" /></svg>;
  return null;
}

function statusClass(status: EventStatus) {
  return status === "Confirmed" ? "bg-[#e5f4ef] text-[#14745c]" : status === "Tentative" ? "bg-[#fff3dc] text-[#9a6512]" : "bg-[#f9e9e7] text-[#ad4f49]";
}

function EventMeta({ event }: { event: Event }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6e7c8b]">
      <span className="inline-flex items-center gap-1"><Icon name="location" size={12} />{event.location.city}, {event.location.state}</span>
      <span className="inline-flex items-center gap-1"><Icon name="users" size={12} />{event.attendingCustomers.length} attending</span>
      <span className="inline-flex items-center gap-1"><Icon name="cost" size={12} />{formatRegistrationCost(event.registrationCost)}</span>
    </div>
  );
}

function EventRow({ event, compact = false }: { event: Event; compact?: boolean }) {
  const color = associationColors[event.organizingAssociation] ?? "#63768a";
  return (
    <div className={`group flex items-start gap-3 border-b border-[#edf0f3] py-3 last:border-0 ${compact ? "px-1" : ""}`}>
      <div className="mt-1 h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-bold leading-tight text-[#1c2a39]">{event.name}</p>
            <p className="mt-1 text-[11px] font-semibold text-[#8793a0]">{formatDateRange(event.startDate, event.endDate, true)} <span className="mx-1 text-[#c3cbd2]">·</span> {event.organizingAssociation}</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusClass(event.status)}`}>{event.status}</span>
        </div>
        <EventMeta event={event} />
        {!compact && <p className="mt-2 text-[11px] text-[#8793a0]">Owner <strong className="text-[#536373]">{event.managedBy}</strong> <span className="mx-1 text-[#c3cbd2]">·</span> {event.sponsoringCustomer}</p>}
      </div>
    </div>
  );
}

function EmptyState({ text = "No events match these filters." }: { text?: string }) {
  return <div className="rounded-xl border border-dashed border-[#cfd8e1] bg-white px-5 py-8 text-center text-sm text-[#7d8a98]">{text}</div>;
}

function QuarterView({ year, fiscal, items, onDrill }: { year: number; fiscal: boolean; items: Event[]; onDrill: (date: string) => void }) {
  const quarters = quartersForYear(year, fiscal);
  return (
    <div className="space-y-5">
      {quarters.map((quarter, index) => {
        const quarterEvents = items.filter((event) => overlaps(event, quarter));
        return (
          <section key={quarter.start} className="overflow-hidden rounded-xl border border-[#e1e7ec] bg-white shadow-card">
            <button className="flex w-full items-center justify-between bg-[#f8fafb] px-5 py-4 text-left transition hover:bg-[#f0f5f7]" onClick={() => onDrill(quarter.start)}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0b1f3a] text-xs font-bold text-white">Q{index + 1}</span>
                <div><h2 className="display-font text-xl font-bold text-[#17212e]">{quarter.label}</h2><p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a96a1]">{formatDateRange(quarter.start, quarter.end, true)}</p></div>
              </div>
              <span className="flex items-center gap-2 text-xs font-bold text-[#5a7185]">{quarterEvents.length} events <Icon name="chevron" size={15} /></span>
            </button>
            <div className="divide-y divide-[#edf0f3]">
              {quarter.months.map((month) => {
                const monthEvents = items.filter((event) => overlaps(event, month));
                return (
                  <div key={month.start} className="px-5 py-3">
                    <button onClick={() => onDrill(month.start)} className="mb-2 flex items-center gap-2 text-left text-xs font-bold uppercase tracking-wider text-[#4e687d] hover:text-[#159a9c]">
                      {monthLabel(month.start)} <span className="text-[#aab5bf]">· {monthEvents.length}</span><Icon name="chevron" size={12} />
                    </button>
                    {monthEvents.length ? <div className="grid gap-x-6 md:grid-cols-2">{monthEvents.map((event) => <EventRow key={event.id} event={event} compact />)}</div> : <p className="pb-2 text-xs text-[#a6b0b9]">No events scheduled</p>}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MonthView({ anchor, items, onDrill }: { anchor: string; items: Event[]; onDrill: (date: string) => void }) {
  const date = parseDate(anchor);
  const first = startOfWeek(monthRange(date.getFullYear(), date.getMonth()).start);
  const last = endOfWeek(monthRange(date.getFullYear(), date.getMonth()).end);
  const weeks: string[] = [];
  for (let week = first; week <= last; week = addDays(week, 7)) weeks.push(week);
  const month = date.getMonth();
  return (
    <div className="overflow-hidden rounded-xl border border-[#e1e7ec] bg-white shadow-card">
      <div className="grid grid-cols-7 border-b border-[#e1e7ec] bg-[#f8fafb] text-center text-[10px] font-bold uppercase tracking-wider text-[#8a96a1]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="py-3">{day}</div>)}
      </div>
      <div className="divide-y divide-[#edf0f3]">
        {weeks.map((weekStart) => {
          const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
          const weekEvents = items.filter((event) => eventOccursInWeek(event, weekStart));
          return (
            <button key={weekStart} onClick={() => onDrill(weekStart)} className="group block min-h-[128px] w-full text-left transition hover:bg-[#fbfdfd]">
              <div className="grid grid-cols-7 text-left">
                {days.map((day, index) => {
                  const dayDate = parseDate(day);
                  const inMonth = dayDate.getMonth() === month;
                  return <div key={day} className={`border-r border-[#edf0f3] p-2 last:border-0 ${index === 0 ? "border-l-2 border-l-transparent group-hover:border-l-[#12b8b0]" : ""}`}><span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${inMonth ? "text-[#455565]" : "text-[#bec7cf]"}`}>{dayDate.getDate()}</span></div>;
                })}
              </div>
              <div className="grid min-h-[76px] grid-cols-7 gap-1 px-2 pb-2 pt-2">
                {weekEvents.slice(0, 4).map((event) => {
                  const startOffset = event.startDate < weekStart ? 0 : parseDate(event.startDate).getDay();
                  const endOffset = event.endDate > addDays(weekStart, 6) ? 6 : parseDate(event.endDate).getDay();
                  const span = Math.max(1, endOffset - startOffset + 1);
                  return <div key={event.id} className="event-bar" style={{ gridColumn: `${startOffset + 1} / span ${span}`, backgroundColor: associationColors[event.organizingAssociation] ?? "#63768a" }}>{event.name}</div>;
                })}
                {weekEvents.length > 4 && <span className="col-span-7 pl-1 text-[10px] font-bold text-[#708292]">+{weekEvents.length - 4} more events</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ anchor, items }: { anchor: string; items: Event[] }) {
  const weekStart = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const weekEvents = items.filter((event) => eventOccursInWeek(event, weekStart));
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e1e7ec] bg-white shadow-card scrollbar-thin">
      <div className="min-w-[890px]">
        <div className="grid grid-cols-[230px_repeat(7,minmax(90px,1fr))] border-b border-[#e1e7ec] bg-[#f8fafb]">
          <div className="p-4 text-[10px] font-bold uppercase tracking-wider text-[#8a96a1]">Event detail</div>
          {days.map((day) => <div key={day} className="border-l border-[#e5ebef] p-3 text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-[#8a96a1]">{parseDate(day).toLocaleDateString("en-US", { weekday: "short" })}</p><p className="mt-1 text-lg font-bold text-[#26384a]">{parseDate(day).getDate()}</p></div>)}
        </div>
        {weekEvents.length ? weekEvents.map((event) => {
          const startIndex = Math.max(0, days.indexOf(event.startDate) >= 0 ? days.indexOf(event.startDate) : 0);
          const endIndex = Math.min(6, days.indexOf(event.endDate) >= 0 ? days.indexOf(event.endDate) : 6);
          return (
            <div key={event.id} className="grid min-h-[120px] grid-cols-[230px_repeat(7,minmax(90px,1fr))] border-b border-[#edf0f3] last:border-0">
              <div className="p-4"><div className="flex items-start gap-2"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: associationColors[event.organizingAssociation] ?? "#63768a" }} /><div><p className="text-xs font-bold leading-snug text-[#1c2a39]">{event.name}</p><p className="mt-1 text-[10px] font-semibold text-[#8793a0]">{event.organizingAssociation} · {event.status}</p><p className="mt-2 text-[10px] leading-relaxed text-[#708292]"><strong>{formatDateRange(event.startDate, event.endDate, true)}</strong><br />{event.location.city}, {event.location.state}{event.location.venue ? ` · ${event.location.venue}` : ""}<br />Sponsor: {event.sponsoringCustomer}<br />Organizer: {event.organizingCustomer}<br />Owner: {event.managedBy}<br />Registration: {formatRegistrationCost(event.registrationCost)}<br />Attending: {event.attendingCustomers.join(", ")}<br />{event.notes}</p></div></div></div>
              {days.map((day, index) => <div key={day} className={`border-l border-[#edf0f3] ${index >= startIndex && index <= endIndex ? "bg-[#f2fbfa]" : ""}`} />)}
            </div>
          );
        }) : <div className="p-10"><EmptyState /></div>}
      </div>
    </div>
  );
}

function AddEventModal({ onClose, onAdd }: { onClose: () => void; onAdd: (event: Event) => void }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("2026-04-06");
  const [endDate, setEndDate] = useState("2026-04-06");
  const [status, setStatus] = useState<EventStatus>("Tentative");
  const [association, setAssociation] = useState("AFCEA");
  const [location, setLocation] = useState("Washington, DC");
  const [registrationCost, setRegistrationCost] = useState("");
  const submit = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!name.trim()) return;
    const [city, state = ""] = location.split(",").map((value) => value.trim());
    onAdd({ id: `demo-${Date.now()}`, name, startDate, endDate, status, organizingAssociation: association, location: { city, state }, sponsoringCustomer: "Department of Defense CIO", organizingCustomer: "Department of Defense CIO", managedBy: "Demo owner", attendingCustomers: ["Department of Defense CIO"], registrationCost: registrationCost.trim() === "" ? undefined : Number(registrationCost), notes: "Added in-memory during this demo session." });
    onClose();
  };
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#081b31]/50 p-4"><form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="eyebrow text-[#159a9c]">Demo only</p><h2 className="display-font mt-1 text-2xl font-bold">Add an event</h2><p className="mt-1 text-xs text-[#7b8996]">This event lives in memory and resets on refresh.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-[#7b8996] hover:bg-[#f1f4f6]"><Icon name="close" /></button></div><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="label">Event name</span><input required value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Mission event name" /></label><label><span className="label">Start date</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="field" /></label><label><span className="label">End date</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="field" /></label><label><span className="label">Association</span><select value={association} onChange={(e) => setAssociation(e.target.value)} className="field">{associationOptions(seedEvents).map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="label">Status</span><select value={status} onChange={(e) => setStatus(e.target.value as EventStatus)} className="field"><option>Confirmed</option><option>Tentative</option><option>Declined</option></select></label><label><span className="label">Location</span><input value={location} onChange={(e) => setLocation(e.target.value)} className="field" placeholder="City, ST" /></label><label><span className="label">Registration cost (USD)</span><input type="number" min="0" step="1" value={registrationCost} onChange={(e) => setRegistrationCost(e.target.value)} className="field" placeholder="e.g. 1250" /></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-bold text-[#647585] hover:bg-[#f1f4f6]">Cancel</button><button className="rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-bold text-white hover:bg-[#193756]">Add event</button></div></form></div>;
}

export default function EventTracker({ initialEvents }: { initialEvents: Event[] }) {
  const [items, setItems] = useState<Event[]>(initialEvents);
  const [view, setView] = useState<View>("quarter");
  const [anchor, setAnchor] = useState("2026-05-04");
  const [fiscal, setFiscal] = useState(true);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const date = parseDate(anchor);
  const filteredItems = useMemo(() => items.filter((event) => {
    const customerMatch = filters.customer === "All customers" || [event.sponsoringCustomer, event.organizingCustomer, ...event.attendingCustomers].includes(filters.customer);
    const associationMatch = filters.association === "All associations" || event.organizingAssociation === filters.association;
    const ownerMatch = filters.owner === "All owners" || event.managedBy === filters.owner;
    const statusMatch = filters.status === "All statuses" || event.status === filters.status;
    const search = filters.search.toLowerCase();
    const textMatch = !search || [event.name, event.notes, event.location.city, event.location.state, event.organizingAssociation, ...event.attendingCustomers].join(" ").toLowerCase().includes(search);
    return customerMatch && associationMatch && ownerMatch && statusMatch && textMatch;
  }).sort((left, right) => left.startDate.localeCompare(right.startDate) || left.name.localeCompare(right.name)), [filters, items]);
  const options = { customers: customerOptions(items), associations: associationOptions(items), owners: ownerOptions(items) };
  const cursorYear = fiscal ? fiscalYearForDate(anchor) : date.getFullYear();
  const title = view === "quarter" ? `${fiscal ? "FY" : ""}${cursorYear}` : monthLabel(anchor);
  const breadcrumb = view === "quarter" ? `${fiscal ? "FY" : "Calendar"}${cursorYear}` : view === "month" ? `${fiscal ? `FY${cursorYear} › ` : ""}${monthLabel(anchor)}` : `${fiscal ? `FY${cursorYear} › ` : ""}${monthLabel(anchor)} › ${formatDateRange(startOfWeek(anchor), endOfWeek(anchor))}`;
  const goCursor = (direction: number) => {
    if (view === "quarter") setAnchor(addYears(anchor, direction));
    if (view === "month") setAnchor(`${date.getFullYear()}-${String(date.getMonth() + direction + 1).padStart(2, "0")}-01`);
    if (view === "week") setAnchor(addDays(startOfWeek(anchor), direction * 7));
  };
  const drillMonth = (dateValue: string) => { setAnchor(dateValue); setView("month"); };
  const drillWeek = (dateValue: string) => { setAnchor(dateValue); setView("week"); };
  const clearFilters = () => setFilters(initialFilters);
  const activeFilterCount = [filters.customer, filters.association, filters.owner, filters.status].filter((value) => !value.startsWith("All")).length + (filters.search ? 1 : 0);
  return (
    <main className="min-h-screen">
      <header className="relative overflow-hidden bg-[#0b1f3a] text-white">
        <FlagBackdrop />
        <div className="relative mx-auto max-w-[1440px] px-5 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#12b8b0] shadow-lg shadow-[#12b8b0]/20"><Icon name="calendar" size={21} /></div><div><p className="eyebrow text-[#77d8d2]">Mission planning</p><h1 className="display-font text-2xl font-bold tracking-tight">Federal events</h1></div></div>
            <div className="flex items-center gap-3"><span className="hidden text-xs text-[#9eb3c6] sm:inline">Internal team workspace</span><button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#f4b740] px-3 py-2 text-xs font-bold text-[#17212e] transition hover:bg-[#ffca5b]"><Icon name="plus" size={15} /> Add event</button><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#284563] text-xs font-bold">MC</div></div>
          </div>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow text-[#7791a8]">Customer & association coverage</p><h2 className="mt-1 text-sm font-semibold text-[#e7edf2]">One calendar for every federal conversation</h2></div><div className="flex items-center rounded-lg border border-[#35516b] bg-[#102a47] p-1">{(["quarter", "month", "week"] as View[]).map((value) => <button key={value} onClick={() => setView(value)} className={`rounded-md px-4 py-2 text-xs font-bold capitalize transition ${view === value ? "bg-white text-[#17304c] shadow" : "text-[#a6bacb] hover:text-white"}`}>{value}</button>)}</div></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-semibold text-[#708292]"><span className="text-[#9ba8b4]">Workspace</span><Icon name="chevron" size={13} /><span className="text-[#26384a]">{breadcrumb}</span></div><div className="flex items-center gap-2"><button onClick={() => setFiscal(!fiscal)} className="rounded-lg border border-[#d6dfe6] bg-white px-3 py-2 text-xs font-bold text-[#536677] shadow-sm hover:border-[#9cb2c0]">{fiscal ? "Fiscal quarters" : "Calendar quarters"} <span className="ml-1 text-[#12a49d]">↔</span></button><button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold shadow-sm ${showFilters || activeFilterCount ? "border-[#159a9c] bg-[#effafa] text-[#137e7c]" : "border-[#d6dfe6] bg-white text-[#536677]"}`}><Icon name="filter" size={14} /> Filters {activeFilterCount > 0 && <span className="rounded-full bg-[#159a9c] px-1.5 py-0.5 text-[9px] text-white">{activeFilterCount}</span>}</button></div></div>
        {showFilters && <div className="mb-5 rounded-xl border border-[#dce4ea] bg-white p-4 shadow-card"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-[#526b7d]">Filter events</p><button onClick={clearFilters} className="text-xs font-bold text-[#159a9c] hover:underline">Clear all</button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label><span className="label">Customer</span><select value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} className="field">{["All customers", ...options.customers].map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="label">Association</span><select value={filters.association} onChange={(e) => setFilters({ ...filters, association: e.target.value })} className="field">{["All associations", ...options.associations].map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="label">Managed by</span><select value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })} className="field">{["All owners", ...options.owners].map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="label">Status</span><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field"><option>All statuses</option><option>Confirmed</option><option>Tentative</option><option>Declined</option></select></label></div></div>}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-3"><button onClick={() => goCursor(-1)} className="rounded-lg border border-[#d6dfe6] bg-white p-2 text-[#526b7d] shadow-sm hover:bg-[#f0f5f7]"><span className="sr-only">Previous</span>‹</button><h2 className="display-font min-w-[150px] text-2xl font-bold text-[#17212e]">{title}</h2><button onClick={() => goCursor(1)} className="rounded-lg border border-[#d6dfe6] bg-white p-2 text-[#526b7d] shadow-sm hover:bg-[#f0f5f7]"><span className="sr-only">Next</span>›</button></div><p className="mt-1 text-xs text-[#83909c]">{filteredItems.length} of {items.length} events shown · {view === "quarter" ? "Annual roll-up" : view === "month" ? "Month at a glance" : "Weekly mission detail"}</p></div><div className="relative"><Icon name="search" size={15} /><input aria-label="Search events" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-64 border-b border-[#cfd9e1] bg-transparent py-2 pl-7 pr-2 text-sm outline-none placeholder:text-[#9ca9b5] focus:border-[#159a9c]" placeholder="Search events..." /></div></div>
        {filteredItems.length === 0 ? <EmptyState /> : view === "quarter" ? <QuarterView year={cursorYear} fiscal={fiscal} items={filteredItems} onDrill={drillMonth} /> : view === "month" ? <MonthView anchor={anchor} items={filteredItems} onDrill={drillWeek} /> : <WeekView anchor={anchor} items={filteredItems} />}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#83909c]"><div><span className="mr-3 font-bold text-[#526b7d]">Association key</span>{Array.from(new Set(items.map((event) => event.organizingAssociation))).sort().map((name) => <span key={name} className="mr-3 inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: associationColors[name] }} />{name}</span>)}</div><p>Data refresh: demo seed · Last updated today</p></div>
      </div>
      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onAdd={(event) => setItems((current) => [event, ...current])} />}
    </main>
  );
}
