import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, DollarSign, Sparkles, Map } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OSMMapPanel } from "@/components/OSMMapPanel";
import { attractionsApi } from "@/lib/api";
import { FALLBACK_IMAGES, normalizeExploreItems } from "@/lib/explore-catalog";

export const Route = createFileRoute("/explore/$attractionId")({
    head: () => ({ meta: [{ title: "Attraction Details — SafariSmart" }] }),
    component: AttractionDetailPage,
});

function AttractionDetailPage() {
    const { attractionId } = Route.useParams();
  const singleAttractionQuery = useQuery({
    queryKey: ["attraction", attractionId],
    queryFn: () => attractionsApi.get(attractionId),
    enabled: Boolean(attractionId),
    retry: false,
  });
    const aq = useQuery({ queryKey: ["attractions"], queryFn: attractionsApi.list, retry: false });

  const directAttractionRaw = unwrapEntity(singleAttractionQuery.data);
  const directAttraction = directAttractionRaw
    ? normalizeExploreItems([], [directAttractionRaw])[0]
    : null;
  const items = normalizeExploreItems([], aq.data);
  const attraction = directAttraction || items.find((item) => item._slug === attractionId);

  if ((singleAttractionQuery.isLoading || aq.isLoading) && !attraction) {
        return (<div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20"/>
      <main className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm text-muted-foreground">Loading attraction details...</p>
      </main>
      <SiteFooter />
    </div>);
    }

    if (!attraction) {
        return (<div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20"/>
      <main className="mx-auto max-w-7xl px-6 py-20">
        <h1 className="font-display text-4xl">Attraction not found</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          This attraction could not be loaded. It may have been removed or the link is outdated.
        </p>
        <Link to="/explore" className="mt-8 inline-flex items-center gap-2 text-sm uppercase tracking-widest text-foreground underline underline-offset-8 decoration-[var(--color-gold)] decoration-2">
          <ArrowLeft className="h-4 w-4"/> Back to Explore
        </Link>
      </main>
      <SiteFooter />
    </div>);
    }

    const name = attraction._name;
    const location = attraction._location;
    const description = attraction._description;
    const gallery = attraction._gallery;
    const rating = normalizeRating(attraction.rating ?? attraction.average_rating ?? attraction.stars);
    const fee = normalizeFee(attraction.fee ?? attraction.fees ?? attraction.entry_fee ?? attraction.price ?? attraction.starting_price);
    const address = attraction.address || attraction.location_address || attraction.map_address || location;
    const latitude = attraction.latitude ?? attraction.lat ?? attraction.coordinates?.lat;
    const longitude = attraction.longitude ?? attraction.lng ?? attraction.coordinates?.lng;
    const shortDescription = attraction.short_description || attraction.summary || description;
    const rawHighlights = Array.isArray(attraction._highlights) ? attraction._highlights : [];
    const amenityList = Array.isArray(attraction.amenities) ? attraction.amenities : Array.isArray(attraction.features) ? attraction.features : [];

    return (<div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20"/>

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <Link to="/explore" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4"/> Back to Explore
        </Link>

        <section className="mt-6 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <img
              src={gallery[0]}
              alt={name}
              onError={(e) => {
                const fallback = FALLBACK_IMAGES[0];
                if (e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback;
                }
              }}
              className="h-[460px] w-full rounded-3xl object-cover"
            />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {gallery.slice(1, 4).map((src, idx) => (<img
                key={`${src}-${idx}`}
                src={src}
                alt={`${name} view ${idx + 2}`}
                onError={(e) => {
                  const fallback = FALLBACK_IMAGES[(idx + 1) % FALLBACK_IMAGES.length];
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                className="h-32 w-full rounded-2xl object-cover"
              />))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="eyebrow">{attraction.kind || "Attraction"}</div>
            <h1 className="mt-2 font-display text-5xl leading-tight">{name}</h1>

            <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {location}</span>
              {rating ? (<span className="inline-flex items-center gap-1.5">Rating: {rating.toFixed(1)}/5</span>) : null}
              {fee ? (<span className="inline-flex items-center gap-1.5"><DollarSign className="h-4 w-4"/> Fee {fee}</span>) : null}
            </div>

            <p className="mt-6 text-base leading-relaxed text-foreground/85">{shortDescription}</p>

            <div className="mt-8 rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-2xl">Experience highlights</h2>
              <ul className="mt-4 space-y-3 text-sm text-foreground/85">
                {rawHighlights.map((point, idx) => (<li key={`${point}-${idx}`} className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-gold)]"/>
                    <span>{point}</span>
                  </li>))}
                {amenityList.length > 0 && amenityList.map((item, idx) => (<li key={`${String(item)}-${idx}`} className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-gold)]"/>
                    <span>{typeof item === "string" ? item : item.name || item.title || "Amenity"}</span>
                  </li>))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <OSMMapPanel title={name} address={address} latitude={latitude} longitude={longitude} />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-2xl">Attraction information</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <InfoRow label="Location" value={location} />
                <InfoRow label="Address" value={address} />
                <InfoRow label="Rating" value={rating ? `${rating.toFixed(1)}/5` : "Not available"} />
                <InfoRow label="Fee" value={fee || "Not available"} />
                <InfoRow label="Kind" value={attraction.kind || attraction.type || "Attraction"} />
              </dl>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-2xl">Short description</h2>
              <p className="mt-4 text-sm leading-relaxed text-foreground/85">{shortDescription}</p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <Link
        to="/maps"
        className="fixed bottom-8 right-8 z-20 inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-5 py-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-ink)] shadow-lg transition hover:brightness-95"
        title="Browse attraction maps"
      >
        <Map className="h-5 w-5" />
        Maps
      </Link>
    </div>);
}

function unwrapEntity(payload) {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    return payload[0] || null;
  }

  if (payload && typeof payload === "object" && payload.data && typeof payload.data === "object") {
    return payload.data;
  }

  return payload;
}

function normalizeRating(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeFee(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "number") {
    return `USD ${value}`;
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm text-foreground">{value}</dd>
    </div>
  );
}
