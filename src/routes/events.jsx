import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "@/lib/api";
import { useI18n } from "@/language/i18n-provider";
import { Calendar, MapPin, Users } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Events — SafariSmart" }] }),
  component: EventsPage,
});

function EventsPage() {
  const { t } = useI18n();
  const [q, setQ] = useState("");

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: eventsApi.list,
    retry: false,
  });

  const rawEvents = extractList(eventsQuery.data);
  const events = rawEvents.filter((ev) =>
    !q || (ev.name || ev.title || "").toLowerCase().includes(q.toLowerCase()) ||
    (ev.description || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-5xl px-6 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <div className="eyebrow">{t("events.eyebrow", "What's On")}</div>
            <h1 className="mt-3 font-display text-6xl">{t("events.title", "Events")}</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {t("events.subtitle", "Upcoming experiences and cultural events across the region.")}
            </p>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("events.searchPlaceholder", "Search events\u2026")}
            className="w-64 rounded-full border border-border bg-background px-5 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"
          />
        </div>

        {eventsQuery.isLoading && (
          <p className="mt-12 text-sm text-muted-foreground">{t("events.loading", "Loading events\u2026")}</p>
        )}

        {!eventsQuery.isLoading && events.length === 0 && (
          <p className="mt-12 text-sm text-muted-foreground">{t("events.empty", "No upcoming events.")}</p>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <EventCard key={ev.id} ev={ev} t={t} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function EventCard({ ev, t }) {
  const price = ev.ticket_price ?? ev.price;
  const venue = ev.venue || ev.location || null;
  const formattedDate = ev.start_date
    ? new Date(ev.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;
  const formattedEndDate = ev.end_date
    ? new Date(ev.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;
  const dateRange = formattedDate && formattedEndDate && formattedEndDate !== formattedDate
    ? `${formattedDate} – ${formattedEndDate}`
    : formattedDate;

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition hover:border-[var(--color-gold)]">
      {ev.image_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={ev.image_url}
            alt={ev.name || ev.title || ""}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            crossOrigin="anonymous"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        {ev.status && (
          <div className="mb-2 inline-flex w-fit rounded-full bg-[var(--color-gold)]/15 px-2.5 py-0.5 text-[0.65rem] uppercase tracking-widest text-[var(--color-ink)]">
            {ev.status}
          </div>
        )}
        <h3 className="font-display text-xl leading-snug">{ev.name || ev.title || "Event"}</h3>
        {ev.organizer && (
          <p className="mt-1 text-xs text-muted-foreground">by {ev.organizer}</p>
        )}
        {ev.description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{ev.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {dateRange && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {dateRange}
            </span>
          )}
          {venue && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {venue}
            </span>
          )}
          {ev.max_capacity != null && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {ev.max_capacity}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-sm font-semibold">
            {price != null && price > 0
              ? `$${Number(price).toLocaleString()}`
              : t("events.free", "Free")}
          </span>
          {ev.details_url ? (
            <a
              href={ev.details_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[var(--color-gold)] px-4 py-1.5 text-xs uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-110"
            >
              {t("events.book", "Register")}
            </a>
          ) : (
            <button className="rounded-full bg-[var(--color-gold)] px-4 py-1.5 text-xs uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-110">
              {t("events.book", "Register")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function extractList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  return [];
}
