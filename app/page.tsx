import { listEvents } from "@/lib/eventStore";
import EventTracker from "@/components/EventTracker";

export default async function Home() {
  const events = await listEvents();
  return <EventTracker initialEvents={events} />;
}
