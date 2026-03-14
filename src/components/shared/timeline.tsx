import type { TimelineEvent } from "@/types/domain";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="relative flex gap-4">
          <div className="relative flex w-8 justify-center">
            <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
            {index < events.length - 1 ? (
              <div className="absolute top-5 h-full w-px bg-rose-200" />
            ) : null}
          </div>
          <div className="rounded-[22px] border border-rose-100 bg-white px-4 py-3 shadow-sm">
            <p className="font-semibold text-ink">{event.label}</p>
            <p className="mt-1 text-sm text-muted">{event.detail}</p>
            <p className="mt-2 text-xs text-muted">{event.createdAt}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
