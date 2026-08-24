import { generatedEvents } from "@/data/generated-events";
import type { AttendanceStatus, SourceStatus } from "@/data/generated-event-types";

export type EventStatus = AttendanceStatus;
export type { SourceStatus } from "@/data/generated-event-types";

export type Event = {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  location: { city: string; state: string; venue?: string; display?: string };
  organizingAssociation: string;
  sponsoringCustomer: string;
  organizingCustomer: string;
  managedBy: string;
  attendingCustomers: string[];
  status: EventStatus;
  notes: string;
  sourceUrl: string;
  sourceSnippet: string | null;
  verifiedAt: string | null;
  sourceStatus: SourceStatus;
};

export const events: Event[] = generatedEvents;

export const associationColors: Record<string, string> = {
  AFCEA: "#159a9c",
  AUSA: "#9f6d35",
  AFA: "#5066a5",
  NDIA: "#e37451",
  INSA: "#7867a8",
  USGIF: "#1d8777",
  "Navy League": "#2f7295",
  AAAA: "#697c3d",
  USSOCOM: "#8b5e3c",
  MCAA: "#a55570",
  "USSF Association": "#395b8e",
  "Space Foundation": "#5c7aa0",
  DIA: "#3d6b9e",
  "AFCEA / USNI": "#277d89"
};
