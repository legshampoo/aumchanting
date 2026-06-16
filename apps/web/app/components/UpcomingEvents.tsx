import events from "../data/events.json";

type Event = {
  id: string;
  date: string;
  time: string;
  joinLink: string;
  hostedBy: string;
  hostLocation: string;
  description: string;
};

function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const sortedEvents = [...(events as Event[])].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
);

export function UpcomingEvents() {
  return (
    <section className="w-full text-center">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Upcoming Events
      </h2>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Scheduled OM chanting circles hosted by practitioners around the world.
        Join a live session led by an experienced guide in their local time zone.
      </p>

      <ul className="mt-8 flex flex-col gap-4 text-left">
        {sortedEvents.map((event) => (
          <li
            key={event.id}
            className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-zinc-950 dark:text-zinc-50">
                  {formatDate(event.date)}
                </p>
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                  {event.time}
                </p>
              </div>
              <a
                href={event.joinLink}
                className="inline-flex h-9 w-28 shrink-0 cursor-pointer items-center justify-center rounded-full bg-zinc-950 text-sm text-white dark:bg-zinc-50 dark:text-zinc-950"
              >
                Join event
              </a>
            </div>

            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-500">Hosted by</dt>
                <dd className="font-medium text-zinc-950 dark:text-zinc-50">
                  {event.hostedBy}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-500">Location</dt>
                <dd className="font-medium text-zinc-950 dark:text-zinc-50">
                  {event.hostLocation}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {event.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
