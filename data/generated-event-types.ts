export type SourceStatus = "confirmed" | "not-announced" | "fetch-failed" | "unverified";
export type AttendanceStatus = "Confirmed" | "Tentative" | "Declined";

export type GeneratedEventRecord = {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  location: { city: string; state: string; venue?: string; display?: string };
  locationSourceText: string | null;
  locationDrift: boolean;
  organizingAssociation: string;
  sponsoringCustomer: string;
  organizingCustomer: string;
  managedBy: string;
  attendingCustomers: string[];
  status: AttendanceStatus;
  notes: string;
  sourceUrl: string;
  sourceSnippet: string | null;
  verifiedAt: string | null;
  sourceStatus: SourceStatus;
  refreshError?: string;
};
