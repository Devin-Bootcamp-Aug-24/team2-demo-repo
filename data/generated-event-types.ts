export type SourceStatus = "confirmed" | "not-announced" | "fetch-failed";

export type GeneratedEventRecord = {
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
  status: "Confirmed" | "Tentative" | "Declined";
  notes: string;
  sourceUrl: string;
  sourceSnippet: string | null;
  verifiedAt: string | null;
  sourceStatus: SourceStatus;
  refreshError?: string;
};
