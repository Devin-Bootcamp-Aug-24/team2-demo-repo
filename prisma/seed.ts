import { PrismaClient } from "@prisma/client";
import { events } from "../data/events";

const prisma = new PrismaClient();

async function main() {
  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: { registrationCost: event.registrationCost ?? null },
      create: {
        id: event.id,
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        locationCity: event.location.city,
        locationState: event.location.state,
        locationVenue: event.location.venue ?? null,
        organizingAssociation: event.organizingAssociation,
        sponsoringCustomer: event.sponsoringCustomer,
        organizingCustomer: event.organizingCustomer,
        managedBy: event.managedBy,
        status: event.status,
        notes: event.notes,
        registrationCost: event.registrationCost ?? null,
        attendingCustomers: {
          create: event.attendingCustomers.map((name) => ({ name })),
        },
      },
    });
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
