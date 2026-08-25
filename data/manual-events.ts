import type { Event } from "./events";

export const manualEvents: Event[] = [
  {
    id: "evt-034",
    name: "Mitchell Institute Aerospace Nation: Gen. Kevin B. Schneider",
    startDate: "2026-07-27",
    endDate: "2026-07-27",
    location: { city: "Arlington", state: "VA" },
    organizingAssociation: "Mitchell Institute",
    sponsoringCustomer: "U.S. Air Force",
    organizingCustomer: "Pacific Air Forces",
    managedBy: "Maya Chen",
    attendingCustomers: ["U.S. Air Force", "Pacific Air Forces", "U.S. Indo-Pacific Command"],
    status: "Confirmed",
    notes: "Mitchell Institute is tracked separately as an affiliate of the Air & Space Forces Association.",
    sourceUrl: "",
    sourceSnippet: null,
    verifiedAt: null,
    sourceStatus: "unverified",
    registrationFee: null,
    registrationFeeUnverified: false
  },
  {
    id: "evt-035",
    name: "Reagan National Defense Forum (RNDF)",
    startDate: "2025-12-06",
    endDate: "2025-12-06",
    location: { city: "Simi Valley", state: "CA", venue: "Ronald Reagan Presidential Library" },
    organizingAssociation: "Reagan Foundation",
    sponsoringCustomer: "Office of the Secretary of Defense",
    organizingCustomer: "Ronald Reagan Presidential Foundation & Institute",
    managedBy: "Evan Brooks",
    attendingCustomers: ["Office of the Secretary of Defense", "U.S. Army", "U.S. Navy", "U.S. Air Force"],
    status: "Confirmed",
    notes: "Annual bipartisan national defense forum, typically held in December.",
    sourceUrl: "",
    sourceSnippet: null,
    verifiedAt: null,
    sourceStatus: "unverified",
    registrationFee: null,
    registrationFeeUnverified: false
  }
];
