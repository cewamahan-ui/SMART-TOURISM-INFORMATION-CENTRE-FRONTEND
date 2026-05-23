import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery } from "@tanstack/react-query";
import { attractionsApi } from "@/lib/api";
import { useI18n } from "@/language/i18n-provider";
import { MapPin, Star, Heart, Search, Filter } from "lucide-react";
import { useState } from "react";
import { ATTRACTION_IMAGES } from "@/lib/media-assets";

export const Route = createFileRoute("/attractions")({
  head: () => ({ meta: [{ title: "Attractions — SafariSmart" }] }),
  component: AttractionsPage,
});

const CATEGORIES = [
  "all",
  "wildlife",
  "national_park",
  "heritage_site",
  "beach",
  "adventure",
  "cultural",
  "ecotourism",
  "museum",
  "birdwatching",
];

function AttractionsPage() {
  const { t } = useI18n();
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const attractionsQuery = useQuery({
    queryKey: ["attractions-page"],
    queryFn: () => attractionsApi.list({ per_page: 50 }),
    retry: false,
  });

  const rawItems = arrayify(attractionsQuery.data);

  const filtered = rawItems.filter((a) => {
    const matchesSearch = !searchQuery ||
      (a.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === "all" || a.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-6xl px-6 pt-12">
        <div className="border-b border-border pb-8">
          <div className="eyebrow">Discover Kenya</div>
          <h1 className="mt-3 font-display text-6xl">Attractions</h1>
          <p className="mt-3 text-muted-foreground">
            Explore wildlife reserves, heritage sites, beaches, and more curated experiences across Kenya.
          </p>
        </div>

        {/* Search */}
        <div className="mt-8 flex items-center gap-2 border-b border-border pb-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attractions…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-border pb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={
                "rounded-full px-4 py-2 text-xs uppercase tracking-widest transition " +
                (category === cat
                  ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {cat === "all" ? "All" : cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        {attractionsQuery.isLoading && (
          <p className="text-muted-foreground">Loading attractions…</p>
        )}
        {!attractionsQuery.isLoading && filtered.length === 0 && (
          <div className="rounded border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No attractions found. Try a different search or category.</p>
          </div>
        )}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((attraction, idx) => (
            <AttractionCard
              key={attraction.id ?? idx}
              attraction={attraction}
              idx={idx}
            />
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function AttractionCard({ attraction, idx }) {
  const coverImg =
    (Array.isArray(attraction.media_urls) && attraction.media_urls[0]) ||
    attraction.image_url ||
    ATTRACTION_IMAGES[idx % ATTRACTION_IMAGES.length];

  const gallery = Array.isArray(attraction.media_urls) && attraction.media_urls.length > 1
    ? attraction.media_urls
    : null;

  const isVideo = (url) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url || "");

  return (
    <article className="group rounded-lg border border-border overflow-hidden bg-card">
      <div className="relative aspect-video overflow-hidden">
        {isVideo(coverImg) ? (
          <video
            src={coverImg}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={coverImg}
            alt={attraction.name}
            loading="lazy"
            onError={(e) => {
              const fb = ATTRACTION_IMAGES[idx % ATTRACTION_IMAGES.length];
              if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
            }}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
          />
        )}
        <button className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[var(--color-cream)]/90 text-[var(--color-ink)] transition hover:bg-[var(--color-gold)]">
          <Heart className="h-4 w-4" />
        </button>
        {attraction.avg_rating > 0 && (
          <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-[var(--color-cream)]/90 px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {Number(attraction.avg_rating).toFixed(1)}
          </div>
        )}
        {attraction.category && (
          <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-2.5 py-1 text-[0.62rem] uppercase tracking-widest text-white">
            {attraction.category.replace(/_/g, " ")}
          </div>
        )}
      </div>

      {/* Thumbnail strip for additional media */}
      {gallery && gallery.length > 1 && (
        <div className="flex gap-1 overflow-x-auto px-3 py-2 bg-muted/30">
          {gallery.slice(1, 4).map((url, i) => (
            <div key={i} className="h-10 w-14 shrink-0 rounded overflow-hidden border border-border">
              {isVideo(url) ? (
                <video src={url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
              ) : (
                <img src={url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          ))}
          {gallery.length > 4 && (
            <div className="h-10 w-14 shrink-0 rounded overflow-hidden border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
              +{gallery.length - 4}
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        <h3 className="font-display text-xl leading-snug">{attraction.name}</h3>

        {(attraction.destination_name || attraction.location) && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {attraction.destination_name || attraction.location}
          </div>
        )}

        {attraction.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {attraction.description}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          {attraction.entry_fee != null ? (
            <div>
              <div className="eyebrow text-xs">Entry Fee</div>
              <div className="font-display text-lg">
                {attraction.entry_fee === 0 ? "Free" : `KES ${Number(attraction.entry_fee).toLocaleString()}`}
              </div>
            </div>
          ) : (
            <div />
          )}
          <Link
            to="/explore/$attractionId"
            params={{ attractionId: attraction.id }}
            className="rounded-full bg-[var(--color-gold)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-110"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

function arrayify(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.items)) return v.items;
  return [];
}
