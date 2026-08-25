import { prisma } from "./prisma";
import { type Event, type EventStatus } from "@/data/events";

export async function listEvents(): Promise<Event[]> {
  const rows = await prisma.event.findMany({
    include: {
      attendingCustomers: {
        orderBy: { name: "asc" }
      }
    },
    orderBy: { startDate: "asc" }
  });

  return rows.map((event) => ({
    id: event.id,
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    location: {
      city: event.locationCity,
      state: event.locationState,
      venue: event.locationVenue ?? undefined,
      display: event.locationDisplay ?? undefined
    },
    organizingAssociation: event.organizingAssociation,
    sponsoringCustomer: event.sponsoringCustomer,
    organizingCustomer: event.organizingCustomer,
    managedBy: event.managedBy,
    attendingCustomers: event.attendingCustomers.map((customer) => customer.name),
    status: event.status as EventStatus,
    notes: event.notes,
    sourceUrl: event.sourceUrl,
    sourceSnippet: event.sourceSnippet,
    verifiedAt: event.verifiedAt,
    sourceStatus: event.sourceStatus as Event["sourceStatus"],
    locationDrift: event.locationDrift,
    attending: event.attending,
    headcount: event.headcount,
    registrationFee: event.registrationFee,
    registrationFeeUnverified: event.registrationFee != null && event.sourceStatus !== "unverified"
  }));
}
