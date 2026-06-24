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

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function eventTag(dateStr: string): string {
  const eventDate = startOfDay(new Date(`${dateStr}T12:00:00`));
  const today = startOfDay(new Date());
  const diffDays = Math.round(
    (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";

  return eventDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatSessionDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function hostInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const sortedEvents = [...(events as Event[])].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
);

export function SessionCards() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {sortedEvents.map((event) => (
        <article
          key={event.id}
          className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">
                {eventTag(event.date)}
              </p>
              <p className="mt-2 text-sm text-muted">{event.time}</p>
            </div>
            <a
              href={event.joinLink}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-background"
              aria-label="Join session"
            >
              →
            </a>
          </div>

          <h2 className="mt-4 font-display text-2xl font-medium text-foreground">
            OM Chanting Circle
          </h2>
          <p className="mt-1 text-sm text-muted">
            With {event.hostedBy} · {event.hostLocation}
          </p>

          <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">
            {event.description}
          </p>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-xs font-medium text-foreground">
                {hostInitials(event.hostedBy)}
              </div>
              <div className="flex -space-x-2">
                {["G1", "G2", "G3"].map((label) => (
                  <div
                    key={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-border text-[10px] text-muted"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <span className="text-xs text-muted">+ guests</span>
            </div>
            <p className="text-xs text-muted">{formatSessionDate(event.date)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
