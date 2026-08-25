import { PrismaClient } from "@prisma/client";
import { eventAssignments } from "../data/event-assignments";
import { generatedEvents } from "../data/generated-events";
import { manualEvents } from "../data/manual-events";
import { seedRegistrationFees } from "../data/seed-fees";
import type { Event } from "../data/events";

const prisma = new PrismaClient();

async function seedEvent(event: Event, registrationFee: number | null, attending: boolean) {
  await prisma.event.upsert({
    where: { id: event.id },
    update: {
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      locationCity: event.location.city,
      locationState: event.location.state,
      locationVenue: event.location.venue ?? null,
      locationDisplay: event.location.display ?? null,
      organizingAssociation: event.organizingAssociation,
      sponsoringCustomer: event.sponsoringCustomer,
      organizingCustomer: event.organizingCustomer,
      managedBy: event.managedBy,
      status: event.status,
      notes: event.notes,
      sourceUrl: event.sourceUrl,
      sourceSnippet: event.sourceSnippet,
      verifiedAt: event.verifiedAt,
      sourceStatus: event.sourceStatus,
      locationDrift: event.locationDrift ?? false,
      attending,
      headcount: 0,
      registrationFee
    },
    create: {
      id: event.id,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      locationCity: event.location.city,
      locationState: event.location.state,
      locationVenue: event.location.venue ?? null,
      locationDisplay: event.location.display ?? null,
      organizingAssociation: event.organizingAssociation,
      sponsoringCustomer: event.sponsoringCustomer,
      organizingCustomer: event.organizingCustomer,
      managedBy: event.managedBy,
      status: event.status,
      notes: event.notes,
      sourceUrl: event.sourceUrl,
      sourceSnippet: event.sourceSnippet,
      verifiedAt: event.verifiedAt,
      sourceStatus: event.sourceStatus,
      locationDrift: event.locationDrift ?? false,
      attending,
      headcount: 0,
      registrationFee
    }
  });

  await prisma.attendingCustomer.deleteMany({ where: { eventId: event.id } });
  if (event.attendingCustomers.length > 0) {
    await prisma.attendingCustomer.createMany({
      data: event.attendingCustomers.map((name) => ({ eventId: event.id, name }))
    });
  }
}

async function main() {
  for (const generated of generatedEvents) {
    const assignment = eventAssignments[generated.id];
    if (!assignment) {
      throw new Error(`Missing event assignment for generated event ${generated.id}`);
    }
    const registrationFee = seedRegistrationFees[generated.id] ?? null;
    await seedEvent(
      {
        ...generated,
        sponsoringCustomer: assignment.sponsoringCustomer,
        organizingCustomer: assignment.organizingCustomer,
        managedBy: assignment.managedBy,
        attendingCustomers: assignment.attendingCustomers,
        status: assignment.status,
        notes: assignment.notes,
        registrationFee,
        registrationFeeUnverified: registrationFee != null
      },
      registrationFee,
      assignment.status === "Confirmed"
    );
  }

  for (const event of manualEvents) {
    await seedEvent(event, event.registrationFee ?? null, event.status === "Confirmed");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
