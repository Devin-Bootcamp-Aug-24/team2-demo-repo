"use client";

import { useEffect, useMemo, useState } from "react";
import { budgetPlans, type BudgetPlan } from "@/data/budget";
import { associationColors, type Event, type EventStatus } from "@/data/events";
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
import { calculateBudgetTotals, type BudgetTotals } from "@/lib/budget";

type View = "quarter" | "month" | "week";
type DatedEvent = Event & { startDate: string; endDate: string };
type Filters = { customer: string; association: string; owner: string; status: string; search: string };
type IconName = "calendar" | "search" | "chevron" | "plus" | "filter" | "location" | "users" | "close" | "arrow";
type BudgetEdits = Record<string, BudgetPlan>;

const emptyPlan: BudgetPlan = { registrationFee: null, headcount: 0, attending: false };
const planFor = (budget: BudgetEdits, id: string) => budget[id] ?? emptyPlan;
const budgetForEvents = (items: Event[]): BudgetEdits => Object.fromEntries(items.map((event) => [event.id, {
  ...emptyPlan,
  ...budgetPlans[event.id],
  attending: event.attending ?? budgetPlans[event.id]?.attending ?? false,
  headcount: event.headcount ?? budgetPlans[event.id]?.headcount ?? 0,
  registrationFee: event.registrationFee ?? budgetPlans[event.id]?.registrationFee ?? null
}]));

function storedBudgetFrom(value: unknown): BudgetEdits {
  if (
    value &&
    typeof value === "object" &&
    "plans" in value &&
    value.plans &&
    typeof value.plans === "object"
  ) {
    return value.plans as BudgetEdits;
  }
  return value as BudgetEdits;
}

const initialFilters: Filters = { customer: "All customers", association: "All associations", owner: "All owners", status: "All attendance postures", search: "" };
const customerOptions = (items: Event[]) => Array.from(new Set(items.flatMap((event) => [event.sponsoringCustomer, event.organizingCustomer, ...event.attendingCustomers]))).sort();
const associationOptions = (items: Event[]) => Array.from(new Set(items.map((event) => event.organizingAssociation))).sort();
const ownerOptions = (items: Event[]) => Array.from(new Set(items.map((event) => event.managedBy))).sort();

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
  return null;
}

function statusClass(status: EventStatus) {
  return status === "Confirmed" ? "bg-[#e5f4ef] text-[#14745c]" : status === "Tentative" ? "bg-[#fff3dc] text-[#9a6512]" : "bg-[#f9e9e7] text-[#ad4f49]";
}

function attendanceLabel(status: EventStatus): string {
  return status === "Confirmed" ? "Going" : status === "Tentative" ? "Considering" : "Not going";
}

function EventMeta({ event }: { event: Event }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6e7c8b]">
      {(event.location.city || event.location.display) && <span className="inline-flex items-center gap-1"><Icon name="location" size={12} />{event.location.display ?? `${event.location.city}, ${event.location.state}`}</span>}
      <span className="inline-flex items-center gap-1"><Icon name="users" size={12} />{event.attendingCustomers.length} attending</span>
    </div>
  );
}

function locationLabel(event: Event): string {
  if (event.location.display) return event.location.display;
  if (!event.location.city) return "";
  return `${event.location.city}, ${event.location.state}${event.location.venue ? ` · ${event.location.venue}` : ""}`;
}

function initialAnchor(items: Event[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const confirmed = items
    .filter((event): event is DatedEvent => event.sourceStatus === "confirmed" && Boolean(event.startDate && event.endDate))
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
  return confirmed.find((event) => event.startDate >= today)?.startDate ?? confirmed[0]?.startDate ?? today;
}

function BudgetControls({ event, plan, onChange }: { event: Event; plan: BudgetPlan; onChange: (patch: Partial<BudgetPlan>) => void }) {
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-[#f8fafb] p-2">
      <label className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#536677]">
        <input type="checkbox" checked={plan.attending} onChange={(e) => onChange({ attending: e.target.checked })} className="h-3.5 w-3.5 accent-[#159a9c]" />
        Attending
      </label>
      <label className="flex items-center gap-1 text-[10px] font-bold text-[#536677]">
        People
        <input aria-label={`${event.name} headcount`} type="number" min="0" step="1" value={plan.headcount || ""} onChange={(e) => onChange({ headcount: Math.max(0, Number.parseInt(e.target.value, 10) || 0) })} className="field w-16 px-2 py-1 text-[11px]" />
      </label>
      <label className="flex items-center gap-1 text-[10px] font-bold text-[#536677]">
        Fee/person
        <span className="text-[#8b98a4]">$</span>
        <input aria-label={`${event.name} registration fee`} type="number" min="0" step="1" placeholder="TBA" value={plan.registrationFee ?? ""} onChange={(e) => {
          const value = e.target.value.trim();
          onChange({ registrationFee: value === "" ? null : Math.max(0, Number(value) || 0) });
        }} className="field w-20 px-2 py-1 text-[11px]" />
        {event.registrationFeeUnverified && plan.registrationFee != null && <span className="text-[10px] font-semibold text-[#9a6512]">unverified</span>}
      </label>
    </div>
  );
}

function EventRow({ event, compact = false, plan, onBudgetChange }: { event: Event; compact?: boolean; plan: BudgetPlan; onBudgetChange: (patch: Partial<BudgetPlan>) => void }) {
  const color = associationColors[event.organizingAssociation] ?? "#63768a";
  return (
    <div className={`group flex items-start gap-3 border-b border-[#edf0f3] py-3 last:border-0 ${compact ? "px-1" : ""}`}>
      <div className="mt-1 h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-bold leading-tight text-[#1c2a39]">{event.name}</p>
          <p className="mt-1 text-[11px] font-semibold text-[#8793a0]">{event.startDate && event.endDate ? formatDateRange(event.startDate, event.endDate, true) : "Dates TBA"} <span className="mx-1 text-[#c3cbd2]">·</span> {event.organizingAssociation}{event.sourceStatus === "unverified" && <span className="ml-1 text-[#9a6512]">· date not source-verified</span>}</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusClass(event.status)}`}>Attendance: {attendanceLabel(event.status)}</span>
        </div>
        <EventMeta event={event} />
        {!compact && <p className="mt-2 text-[11px] text-[#8793a0]">Owner <strong className="text-[#536373]">{event.managedBy}</strong> <span className="mx-1 text-[#c3cbd2]">·</span> {event.sponsoringCustomer}</p>}
        <BudgetControls event={event} plan={plan} onChange={onBudgetChange} />
      </div>
    </div>
  );
}

function EmptyState({ text = "No events match these filters." }: { text?: string }) {
  return <div className="rounded-xl border border-dashed border-[#cfd8e1] bg-white px-5 py-8 text-center text-sm text-[#7d8a98]">{text}</div>;
}

function QuarterView({ year, fiscal, items, budget, onBudgetChange, onDrill }: { year: number; fiscal: boolean; items: DatedEvent[]; budget: BudgetEdits; onBudgetChange: (id: string, patch: Partial<BudgetPlan>) => void; onDrill: (date: string) => void }) {
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
                    {monthEvents.length ? <div className="grid gap-x-6 md:grid-cols-2">{monthEvents.map((event) => <EventRow key={event.id} event={event} compact plan={planFor(budget, event.id)} onBudgetChange={(patch) => onBudgetChange(event.id, patch)} />)}</div> : <p className="pb-2 text-xs text-[#a6b0b9]">No events scheduled</p>}
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

function MonthView({ anchor, items, onDrill }: { anchor: string; items: DatedEvent[]; onDrill: (date: string) => void }) {
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

function WeekView({ anchor, items, budget, onBudgetChange }: { anchor: string; items: DatedEvent[]; budget: BudgetEdits; onBudgetChange: (id: string, patch: Partial<BudgetPlan>) => void }) {
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
          const plan = planFor(budget, event.id);
          const startIndex = Math.max(0, days.indexOf(event.startDate) >= 0 ? days.indexOf(event.startDate) : 0);
          const endIndex = Math.min(6, days.indexOf(event.endDate) >= 0 ? days.indexOf(event.endDate) : 6);
          return (
            <div key={event.id} className="grid min-h-[120px] grid-cols-[230px_repeat(7,minmax(90px,1fr))] border-b border-[#edf0f3] last:border-0">
              <div className="p-4"><div className="flex items-start gap-2"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: associationColors[event.organizingAssociation] ?? "#63768a" }} /><div><p className="text-xs font-bold leading-snug text-[#1c2a39]">{event.name}</p><p className="mt-1 text-[10px] font-semibold text-[#8793a0]">{event.organizingAssociation} · Attendance: {attendanceLabel(event.status)}</p><div className="mt-2 text-[10px] leading-relaxed text-[#708292]"><strong>{formatDateRange(event.startDate, event.endDate, true)}</strong><br />{locationLabel(event)}<br />Sponsor: {event.sponsoringCustomer}<br />Organizer: {event.organizingCustomer}<br />Owner: {event.managedBy}<br />Attending: {event.attendingCustomers.join(", ")}<br />Registration fee: {plan.registrationFee == null ? "TBA" : currency.format(plan.registrationFee)}{event.registrationFeeUnverified && plan.registrationFee != null && <span className="ml-1 font-semibold text-[#9a6512]">(unverified)</span>}<br />{event.notes}<br />{event.sourceStatus === "unverified" && <span className="font-semibold text-[#9a6512]">Date not source-verified<br /></span>}{event.sourceUrl && <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#138c89] hover:underline">Official source</a>}{event.verifiedAt && <span> · Verified {new Date(event.verifiedAt).toLocaleDateString("en-US")}</span>}</div><BudgetControls event={event} plan={plan} onChange={(patch) => onBudgetChange(event.id, patch)} /></div></div></div>
              {days.map((day, index) => <div key={day} className={`border-l border-[#edf0f3] ${index >= startIndex && index <= endIndex ? "bg-[#f2fbfa]" : ""}`} />)}
            </div>
          );
        }) : <div className="p-10"><EmptyState /></div>}
      </div>
    </div>
  );
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function BudgetPanel({ year, fiscal, totals }: { year: number; fiscal: boolean; totals: BudgetTotals }) {
  return (
    <aside className="rounded-xl border border-[#dce4ea] bg-white p-4 shadow-card lg:sticky lg:top-5">
      <div className="mb-3">
        <p className="eyebrow text-[#159a9c]">Budget planning</p>
        <h2 className="display-font mt-1 text-xl font-bold text-[#17212e]">{fiscal ? "FY" : "Calendar year"} {year}</h2>
        <p className="mt-1 text-[11px] text-[#7b8996]">Totals follow the events currently shown by your filters.</p>
      </div>
      <div className="space-y-1 text-xs">
        {totals.months.map((month, index) => (
          <div key={month.start}>
            <div className="flex items-center justify-between py-1 text-[#536677]"><span>{month.label}</span><strong>{currency.format(month.total)}</strong></div>
            {(index + 1) % 3 === 0 && <div className="flex items-center justify-between border-t border-[#edf0f3] py-2 font-bold text-[#26384a]"><span>{totals.quarters[(index + 1) / 3 - 1].label} subtotal</span><span>{currency.format(totals.quarters[(index + 1) / 3 - 1].total)}</span></div>}
          </div>
        ))}
      </div>
      {totals.undatedAttendingCount > 0 && <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#d6c99f] pt-3 text-xs text-[#7d6d45]"><span>Dates TBA (attending)</span><strong>{currency.format(totals.undatedTotal)}</strong></div>}
      {totals.attendingUnpricedCount > 0 && <p className="mt-3 rounded-lg bg-[#fff8e8] px-3 py-2 text-[11px] font-semibold leading-relaxed text-[#85651f]">{totals.attendingUnpricedCount} {totals.attendingUnpricedCount === 1 ? "event" : "events"} attending, fee not yet published</p>}
      <div className="mt-3 flex items-center justify-between border-t-2 border-[#172f4d] pt-3 text-sm font-bold text-[#17212e]"><span>Year total</span><span>{currency.format(totals.yearTotal)}</span></div>
    </aside>
  );
}

function AddEventModal({ onClose, onAdd }: { onClose: () => void; onAdd: (event: Event) => void }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("2026-04-06");
  const [endDate, setEndDate] = useState("2026-04-06");
  const [status, setStatus] = useState<EventStatus>("Tentative");
  const [association, setAssociation] = useState("AFCEA");
  const [location, setLocation] = useState("Washington, DC");
  const submit = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!name.trim()) return;
    const [city, state = ""] = location.split(",").map((value) => value.trim());
    onAdd({ id: `demo-${Date.now()}`, name, startDate, endDate, status, organizingAssociation: association, location: { city, state }, sponsoringCustomer: "Department of Defense CIO", organizingCustomer: "Department of Defense CIO", managedBy: "Demo owner", attendingCustomers: ["Department of Defense CIO"], notes: "Added in-memory during this demo session.", sourceUrl: "", sourceSnippet: null, verifiedAt: null, sourceStatus: "unverified", registrationFee: null });
    onClose();
  };
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#081b31]/50 p-4"><form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="eyebrow text-[#159a9c]">Demo only</p><h2 className="display-font mt-1 text-2xl font-bold">Add an event</h2><p className="mt-1 text-xs text-[#7b8996]">This event is demo-only; budget inputs are saved locally.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-[#7b8996] hover:bg-[#f1f4f6]"><Icon name="close" /></button></div><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="label">Event name</span><input required value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Mission event name" /></label><label><span className="label">Start date</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="field" /></label><label><span className="label">End date</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="field" /></label><label><span className="label">Association</span><select value={association} onChange={(e) => setAssociation(e.target.value)} className="field">{Object.keys(associationColors).map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="label">Attendance posture</span><select aria-label="Attendance posture" value={status} onChange={(e) => setStatus(e.target.value as EventStatus)} className="field"><option value="Confirmed">Going</option><option value="Tentative">Considering</option><option value="Declined">Not going</option></select></label><label className="sm:col-span-2"><span className="label">Location</span><input value={location} onChange={(e) => setLocation(e.target.value)} className="field" placeholder="City, ST" /></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-bold text-[#647585] hover:bg-[#f1f4f6]">Cancel</button><button className="rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-bold text-white hover:bg-[#193756]">Add event</button></div></form></div>;
}

export default function EventTracker({ initialEvents }: { initialEvents: Event[] }) {
  const [items, setItems] = useState<Event[]>(initialEvents);
  const [budget, setBudget] = useState<BudgetEdits>(() => budgetForEvents(initialEvents));
  const [budgetLoaded, setBudgetLoaded] = useState(false);
  const [view, setView] = useState<View>("quarter");
  const [anchor, setAnchor] = useState(() => initialAnchor(initialEvents));
  const [fiscal, setFiscal] = useState(true);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("federal-events-budget");
        if (stored) {
          const parsed = JSON.parse(stored) as BudgetEdits | { plans?: BudgetEdits };
          const storedBudget = storedBudgetFrom(parsed);
          setBudget({ ...budgetForEvents(initialEvents), ...storedBudget });
          setItems((current) => current.map((event) => storedBudget[event.id]
            ? { ...event, registrationFeeUnverified: false }
            : event));
        }
      } catch {
        // Ignore malformed or unavailable local storage and use the seed values.
      } finally {
        setBudgetLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialEvents]);
  useEffect(() => {
    if (budgetLoaded) {
      try {
        window.localStorage.setItem("federal-events-budget", JSON.stringify(budget));
      } catch {
        // Ignore unavailable local storage; edits still work for this session.
      }
    }
  }, [budget, budgetLoaded]);
  const date = parseDate(anchor);
  const filteredItems = useMemo(() => items.filter((event) => {
    const customerMatch = filters.customer === "All customers" || [event.sponsoringCustomer, event.organizingCustomer, ...event.attendingCustomers].includes(filters.customer);
    const associationMatch = filters.association === "All associations" || event.organizingAssociation === filters.association;
    const ownerMatch = filters.owner === "All owners" || event.managedBy === filters.owner;
    const statusMatch = filters.status === "All attendance postures" || event.status === filters.status;
    const search = filters.search.toLowerCase();
    const textMatch = !search || [event.name, event.notes, event.location.city, event.location.state, event.location.display, event.organizingAssociation, ...event.attendingCustomers].join(" ").toLowerCase().includes(search);
    return customerMatch && associationMatch && ownerMatch && statusMatch && textMatch;
  }).sort((left, right) => (left.startDate ?? "9999-12-31").localeCompare(right.startDate ?? "9999-12-31") || left.name.localeCompare(right.name)), [filters, items]);
  const datedItems = filteredItems.filter((event): event is DatedEvent => Boolean(event.startDate && event.endDate));
  const tbaItems = filteredItems.filter((event) => !event.startDate || !event.endDate);
  const options = { customers: customerOptions(items), associations: associationOptions(items), owners: ownerOptions(items) };
  const cursorYear = fiscal ? fiscalYearForDate(anchor) : date.getFullYear();
  const budgetTotals = useMemo(() => calculateBudgetTotals(filteredItems, budget, cursorYear, fiscal), [budget, cursorYear, filteredItems, fiscal]);
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
  const onBudgetChange = (id: string, patch: Partial<BudgetPlan>) => {
    setBudget((current) => ({ ...current, [id]: { ...planFor(current, id), ...patch } }));
    if ("registrationFee" in patch) {
      setItems((current) => current.map((event) => event.id === id
        ? { ...event, registrationFeeUnverified: false, registrationFee: patch.registrationFee }
        : event));
    }
  };
  const activeFilterCount = [filters.customer, filters.association, filters.owner, filters.status].filter((value) => !value.startsWith("All")).length + (filters.search ? 1 : 0);
  return (
    <main className="min-h-screen">
      <header className="bg-[#0b1f3a] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#12b8b0] shadow-lg shadow-[#12b8b0]/20"><Icon name="calendar" size={21} /></div><div><p className="eyebrow text-[#77d8d2]">Mission planning</p><h1 className="display-font text-2xl font-bold tracking-tight">Federal events</h1></div></div>
            <div className="flex items-center gap-3"><span className="hidden text-xs text-[#9eb3c6] sm:inline">Internal team workspace</span><button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#f4b740] px-3 py-2 text-xs font-bold text-[#17212e] transition hover:bg-[#ffca5b]"><Icon name="plus" size={15} /> Add event</button><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#284563] text-xs font-bold">MC</div></div>
          </div>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow text-[#7791a8]">Customer & association coverage</p><h2 className="mt-1 text-sm font-semibold text-[#e7edf2]">One calendar for every federal conversation</h2></div><div className="flex items-center rounded-lg border border-[#35516b] bg-[#102a47] p-1">{(["quarter", "month", "week"] as View[]).map((value) => <button key={value} onClick={() => setView(value)} className={`rounded-md px-4 py-2 text-xs font-bold capitalize transition ${view === value ? "bg-white text-[#17304c] shadow" : "text-[#a6bacb] hover:text-white"}`}>{value}</button>)}</div></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-semibold text-[#708292]"><span className="text-[#9ba8b4]">Workspace</span><Icon name="chevron" size={13} /><span className="text-[#26384a]">{breadcrumb}</span></div><div className="flex items-center gap-2"><button onClick={() => setFiscal(!fiscal)} className="rounded-lg border border-[#d6dfe6] bg-white px-3 py-2 text-xs font-bold text-[#536677] shadow-sm hover:border-[#9cb2c0]">{fiscal ? "Fiscal quarters" : "Calendar quarters"} <span className="ml-1 text-[#12a49d]">↔</span></button><button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold shadow-sm ${showFilters || activeFilterCount ? "border-[#159a9c] bg-[#effafa] text-[#137e7c]" : "border-[#d6dfe6] bg-white text-[#536677]"}`}><Icon name="filter" size={14} /> Filters {activeFilterCount > 0 && <span className="rounded-full bg-[#159a9c] px-1.5 py-0.5 text-[9px] text-white">{activeFilterCount}</span>}</button></div></div>
        {showFilters && <div className="mb-5 rounded-xl border border-[#dce4ea] bg-white p-4 shadow-card"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-[#526b7d]">Filter events</p><button onClick={clearFilters} className="text-xs font-bold text-[#159a9c] hover:underline">Clear all</button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label><span className="label">Customer</span><select value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} className="field">{["All customers", ...options.customers].map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="label">Association</span><select value={filters.association} onChange={(e) => setFilters({ ...filters, association: e.target.value })} className="field">{["All associations", ...options.associations].map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="label">Managed by</span><select value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })} className="field">{["All owners", ...options.owners].map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="label">Attendance posture</span><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field"><option value="All attendance postures">All attendance postures</option><option value="Confirmed">Going</option><option value="Tentative">Considering</option><option value="Declined">Not going</option></select></label></div></div>}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-3"><button onClick={() => goCursor(-1)} className="rounded-lg border border-[#d6dfe6] bg-white p-2 text-[#526b7d] shadow-sm hover:bg-[#f0f5f7]"><span className="sr-only">Previous</span>‹</button><h2 className="display-font min-w-[150px] text-2xl font-bold text-[#17212e]">{title}</h2><button onClick={() => goCursor(1)} className="rounded-lg border border-[#d6dfe6] bg-white p-2 text-[#526b7d] shadow-sm hover:bg-[#f0f5f7]"><span className="sr-only">Next</span>›</button></div><p className="mt-1 text-xs text-[#83909c]">{filteredItems.length} of {items.length} events shown · {view === "quarter" ? "Annual roll-up" : view === "month" ? "Month at a glance" : "Weekly mission detail"}</p></div><div className="relative"><Icon name="search" size={15} /><input aria-label="Search events" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-64 border-b border-[#cfd9e1] bg-transparent py-2 pl-7 pr-2 text-sm outline-none placeholder:text-[#9ca9b5] focus:border-[#159a9c]" placeholder="Search events..." /></div></div>
        <div className="mb-5 lg:hidden">
          <details className="sticky top-3 z-10 rounded-xl border border-[#dce4ea] bg-white shadow-card">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold text-[#26384a]"><span>Budget · {fiscal ? "FY" : "Calendar year"} {cursorYear}</span><span>{currency.format(budgetTotals.yearTotal)}</span></summary>
            <div className="border-t border-[#edf0f3] p-3"><BudgetPanel year={cursorYear} fiscal={fiscal} totals={budgetTotals} /></div>
          </details>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>{filteredItems.length === 0 ? <EmptyState /> : view === "quarter" ? <><QuarterView year={cursorYear} fiscal={fiscal} items={datedItems} budget={budget} onBudgetChange={onBudgetChange} onDrill={drillMonth} />{tbaItems.length > 0 && <section className="mt-5 rounded-xl border border-dashed border-[#d6c99f] bg-[#fffdf6] p-5"><div className="mb-3 flex items-center justify-between"><div><p className="eyebrow text-[#9a741a]">Source status</p><h2 className="display-font mt-1 text-xl font-bold text-[#3b3525]">Dates TBA</h2></div><span className="rounded-full bg-[#fff0c9] px-2 py-1 text-[10px] font-bold text-[#906814]">{tbaItems.length} not scheduled</span></div><div className="grid gap-3 md:grid-cols-2">{tbaItems.map((event) => <div key={event.id} className="rounded-lg border border-[#eee4c7] bg-white p-3"><p className="font-bold text-[#273746]">{event.name}</p><p className="mt-1 text-[11px] text-[#7d6d45]">{event.organizingAssociation} · Not yet announced by organizer</p><a href={event.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] font-semibold text-[#138c89] hover:underline">Check official source</a><BudgetControls event={event} plan={planFor(budget, event.id)} onChange={(patch) => onBudgetChange(event.id, patch)} /></div>)}</div></section>}</> : view === "month" ? <MonthView anchor={anchor} items={datedItems} onDrill={drillWeek} /> : <WeekView anchor={anchor} items={datedItems} budget={budget} onBudgetChange={onBudgetChange} />}</div>
          <div className="hidden lg:block"><BudgetPanel year={cursorYear} fiscal={fiscal} totals={budgetTotals} /></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#83909c]"><div><span className="mr-3 font-bold text-[#526b7d]">Association key</span>{Array.from(new Set(items.map((event) => event.organizingAssociation))).sort().map((name) => <span key={name} className="mr-3 inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: associationColors[name] ?? "#63768a" }} />{name}</span>)}</div><p>Official sources · Refresh weekly</p></div>
      </div>
      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onAdd={(event) => { setItems((current) => [event, ...current]); setBudget((current) => ({ ...current, [event.id]: { registrationFee: null, headcount: 0, attending: event.status === "Confirmed" } })); }} />}
    </main>
  );
}
