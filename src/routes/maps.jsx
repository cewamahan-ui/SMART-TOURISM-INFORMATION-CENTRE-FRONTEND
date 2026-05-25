import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Map, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OSMMapPanel } from "@/components/OSMMapPanel";
import { attractionsApi } from "@/lib/api";
import { normalizeExploreItems } from "@/lib/explore-catalog";
import { useI18n } from "@/language/i18n-provider";

export const Route = createFileRoute("/maps")({
  head: () => ({ meta: [{ title: "Maps — SafariSmart" }] }),
  component: MapsPage,
});

function MapsPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const attractionsQuery = useQuery({
    queryKey: ["maps-attractions"],
    queryFn: () => attractionsApi.list(),
    retry: false,
  });

  const attractions = useMemo(() => {
    return normalizeExploreItems([], attractionsQuery.data).filter((item) => !item._isFallback);
  }, [attractionsQuery.data]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return attractions.filter((item) => {
      if (!needle) return true;
      const haystack = `${item._name} ${item._location} ${item.address || ""} ${item.kind || ""} ${item.category || ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [attractions, query]);

  const selected = filtered[0] || attractions[0] || null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-7xl px-6 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <div className="eyebrow">{t("header.mapDirections")}</div>
            <h1 className="mt-3 font-display text-6xl">Attraction Maps</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Maps powered by the attractions already returned by the backend. Pick any attraction to view it on the map.
            </p>
          </div>

          <label className="flex w-full max-w-md items-center gap-2 rounded-full border border-border bg-card px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search attractions, locations, or categories"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
        </div>

        {attractionsQuery.isLoading && (
          <p className="mt-6 text-sm text-muted-foreground">Loading attraction maps from the backend...</p>
        )}

        {attractionsQuery.isError && (
          <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center">
            <Map className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="mt-4 font-display text-3xl">Could not load attractions</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {attractionsQuery.error?.message || "Unable to reach the backend. Make sure the server is running."}
            </p>
          </div>
        )}

        {!attractionsQuery.isLoading && !attractionsQuery.isError && filtered.length === 0 && (
          <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center">
            <Map className="mx-auto h-10 w-10 text-[var(--color-gold)]" />
            <h2 className="mt-4 font-display text-3xl">No approved attractions yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Attractions appear here once an admin approves them. Add attractions via the business dashboard and set their status to approved.
            </p>
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          {selected ? (
            <OSMMapPanel
              title={selected._name}
              address={selected.address || selected.location || selected._location}
              latitude={selected.latitude ?? selected.lat ?? selected.coordinates?.lat}
              longitude={selected.longitude ?? selected.lng ?? selected.coordinates?.lng}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          {filtered.map((attraction) => (
            <Link
              key={attraction._slug}
              to="/explore/$attractionId"
              params={{ attractionId: attraction._slug }}
              className="block rounded-3xl border border-border bg-card p-5 transition hover:border-[var(--color-gold)]"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-xl leading-tight">{attraction._name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{attraction._location}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
                    {attraction._description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}