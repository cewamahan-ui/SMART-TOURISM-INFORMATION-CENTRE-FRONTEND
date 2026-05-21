import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { useI18n } from "@/language/i18n-provider";
import { MapPin, Users, Wifi, Utensils, Heart } from "lucide-react";
import { useState } from "react";
import lodge from "@/assets/attractions_images/lodge.jpg";
import tent from "@/assets/attractions_images/tent.jpg";
import migration from "@/assets/attractions_images/migration.jpg";

export const Route = createFileRoute("/accommodations")({
  head: () => ({ meta: [{ title: "Accommodations — SafariSmart" }] }),
  component: AccommodationsPage,
});

const FALLBACK_IMAGES = [lodge, tent, migration];
const FALLBACK_ACCOMMODATIONS = [
  {
    id: 1,
    name: "Tsavo Savannah Resort",
    location: "Tsavo East",
    price_per_night: 1250,
    rating: 4.8,
    reviews: 342,
    amenities: ["WiFi", "Restaurant", "Pool", "Spa"],
    image: lodge,
    rooms: 25,
  },
  {
    id: 2,
    name: "Mara River Camp",
    location: "Maasai Mara",
    price_per_night: 980,
    rating: 4.6,
    reviews: 218,
    amenities: ["WiFi", "Restaurant", "Bar"],
    image: tent,
    rooms: 18,
  },
  {
    id: 3,
    name: "Lake Nakuru Eco Lodge",
    location: "Lake Nakuru National Park",
    price_per_night: 720,
    rating: 4.7,
    reviews: 156,
    amenities: ["Restaurant", "Campfire"],
    image: migration,
    rooms: 12,
  },
];

function AccommodationsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const accommodationsQuery = useQuery({
    queryKey: ["accommodations"],
    queryFn: publicApi.accommodations,
    retry: false,
  });

  const accommodations = arrayify(accommodationsQuery.data) || FALLBACK_ACCOMMODATIONS;
  const filtered = accommodations.filter((a) =>
    (a.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-6xl px-6 pt-12">
        <div className="border-b border-border pb-8">
          <div className="eyebrow">{t("accommodations.eyebrow")}</div>
          <h1 className="mt-3 font-display text-6xl">{t("accommodations.title")}</h1>
          <p className="mt-3 text-muted-foreground">
            {t("accommodations.subtitle")}
          </p>
        </div>

        {/* Search */}
        <div className="mt-8 flex items-center gap-2 border-b border-border pb-3">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("accommodations.searchPlaceholder")}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {/* Price Filter */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-4">
          {["all", "budget", "luxury"].map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={
                "rounded-full px-4 py-2 text-xs uppercase tracking-widest transition " +
                (tab === tabKey
                  ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {tabKey === "all"
                ? t("accommodations.tabs.all")
                : tabKey === "budget"
                  ? t("accommodations.tabs.budget")
                  : t("accommodations.tabs.luxury")}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {accommodationsQuery.isLoading && (
            <p className="text-muted-foreground">{t("accommodations.loading")}</p>
          )}
          {filtered.map((acc, idx) => (
            <AccommodationCard key={acc.id ?? idx} accommodation={acc} idx={idx} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function AccommodationCard({ accommodation, idx }) {
  const { t } = useI18n();
  const img = accommodation.image || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];

  const amenities = accommodation.amenities || [];
  const amenityIcons = {
    WiFi: <Wifi className="h-4 w-4" />,
    Restaurant: <Utensils className="h-4 w-4" />,
    Pool: "🏊",
    Spa: "🧖",
    Bar: "🍷",
  };

  return (
    <article className="group rounded-lg border border-border overflow-hidden bg-card">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={img}
          alt={accommodation.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
        />
        <button className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[var(--color-cream)]/90 text-[var(--color-ink)] transition hover:bg-[var(--color-gold)]">
          <Heart className="h-4 w-4" />
        </button>
        {accommodation.rating && (
          <div className="absolute left-4 top-4 rounded-full bg-[var(--color-cream)]/90 px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
            ★ {accommodation.rating}
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="font-display text-xl leading-snug">{accommodation.name}</h3>
        
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {accommodation.location}
        </div>

        {accommodation.rooms && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {accommodation.rooms} {t("accommodations.roomsAvailable")}
          </div>
        )}

        {accommodation.reviews && (
          <p className="mt-2 text-xs text-muted-foreground">
            {accommodation.reviews} {t("accommodations.guestReviews")}
          </p>
        )}

        {amenities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {amenities.slice(0, 3).map((amenity, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
              >
                {amenityIcons[amenity] || amenity}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                +{amenities.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          {accommodation.price_per_night && (
            <div>
              <div className="eyebrow">{t("accommodations.from")}</div>
              <div className="font-display text-lg">
                ${accommodation.price_per_night}
              </div>
              <p className="text-xs text-muted-foreground">{t("accommodations.perNight")}</p>
            </div>
          )}
          <button className="rounded-full bg-[var(--color-gold)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-110">
            {t("accommodations.book")}
          </button>
        </div>
      </div>
    </article>
  );
}

function arrayify(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.items)) return v.items;
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.accommodations)) return v.accommodations;
  return [];
}
