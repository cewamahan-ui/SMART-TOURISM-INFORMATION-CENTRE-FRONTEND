import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, DollarSign, Sparkles, Map, Users,
  Leaf, Clock, Calendar, Route as RouteIcon, Building2, Droplets, SignpostBig,
  CheckCircle, AlertCircle,
} from "lucide-react";
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
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="h-20" />
        <main className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-sm text-muted-foreground">Loading attraction details...</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!attraction) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="h-20" />
        <main className="mx-auto max-w-7xl px-6 py-20">
          <h1 className="font-display text-4xl">Attraction not found</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            This attraction could not be loaded. It may have been removed or the link is outdated.
          </p>
          <Link to="/explore" className="mt-8 inline-flex items-center gap-2 text-sm uppercase tracking-widest text-foreground underline underline-offset-8 decoration-[var(--color-gold)] decoration-2">
            <ArrowLeft className="h-4 w-4" /> Back to Explore
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const name = attraction._name;
  const description = attraction._description;
  const gallery = attraction._gallery;
  const rating = normalizeRating(attraction.rating ?? attraction.average_rating ?? attraction.stars);
  const fee = normalizeFee(attraction.fee ?? attraction.fees ?? attraction.entry_fee ?? attraction.price ?? attraction.starting_price);
  const latitude = attraction.latitude ?? attraction.lat ?? attraction.coordinates?.lat;
  const longitude = attraction.longitude ?? attraction.lng ?? attraction.coordinates?.lng;
  const shortDescription = attraction.short_description || attraction.summary || description;
  const rawHighlights = Array.isArray(attraction._highlights) ? attraction._highlights : [];
  const amenityList = Array.isArray(attraction.amenities) ? attraction.amenities : Array.isArray(attraction.features) ? attraction.features : [];

  // Location (Kenya admin units)
  const county = attraction.county;
  const subCounty = attraction.sub_county;
  const ward = attraction.ward;
  const locality = attraction.locality;
  const gpsCoords = attraction.gps_coordinates;
  const locationParts = [county, subCounty, ward, locality].filter(Boolean);
  const locationDisplay = locationParts.length > 0 ? locationParts.join(", ") : (attraction._location || "Kenya");
  const address = attraction.address || attraction.location_address || locationDisplay;

  // Experience highlights
  const uniqueFeatures = attraction.unique_features;
  const environmentalImpact = attraction.environmental_impact;
  const visitorCapacity = attraction.visitor_capacity;
  const typesOfExperiences = attraction.types_of_experiences;
  const avgTimeSpent = attraction.avg_time_spent;
  const bestVisitingPeriods = attraction.best_visiting_periods;
  const keyEvents = attraction.key_events;

  // Situational analysis
  const roadsCondition = attraction.roads_condition;
  const visitorCenterInfo = attraction.visitor_center_info;
  const waterSupply = attraction.water_supply;
  const signageInfo = attraction.signage_info;
  const fencingSecurity = attraction.fencing_security;
  const parkingArea = attraction.parking_area;
  const restAreas = attraction.rest_areas;
  const siteCurrentStatus = attraction.site_current_status;

  const hasSituationalAnalysis = roadsCondition || visitorCenterInfo || waterSupply || signageInfo ||
    fencingSecurity || parkingArea || restAreas || siteCurrentStatus;

  const hasExperienceHighlights = uniqueFeatures || environmentalImpact || visitorCapacity ||
    typesOfExperiences || avgTimeSpent || bestVisitingPeriods;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <Link to="/explore" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Explore
        </Link>

        <section className="mt-6 grid gap-10 lg:grid-cols-12">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <img src={gallery[0]} alt={name}
              onError={(e) => {
                const fallback = FALLBACK_IMAGES[0];
                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
              }}
              className="h-[460px] w-full rounded-3xl object-cover" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {gallery.slice(1, 4).map((src, idx) => (
                <img key={`${src}-${idx}`} src={src} alt={`${name} view ${idx + 2}`}
                  onError={(e) => {
                    const fallback = FALLBACK_IMAGES[(idx + 1) % FALLBACK_IMAGES.length];
                    if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                  }}
                  className="h-32 w-full rounded-2xl object-cover" />
              ))}
            </div>
          </div>

          {/* Basic info */}
          <div className="lg:col-span-5">
            <div className="eyebrow">{attraction.tourism_type || attraction.kind || "Attraction"}</div>
            <h1 className="mt-2 font-display text-5xl leading-tight">{name}</h1>

            {/* Location breadcrumb */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {county && <span className="font-medium text-foreground">{county}</span>}
              {subCounty && <><span>/</span><span>{subCounty}</span></>}
              {ward && <><span>/</span><span>{ward}</span></>}
              {!county && <span>{attraction._location || "Kenya"}</span>}
            </div>
            {locality && (
              <div className="mt-1 text-xs text-muted-foreground pl-5">{locality}</div>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {rating ? <span className="inline-flex items-center gap-1.5">Rating: {rating.toFixed(1)}/5</span> : null}
              {fee ? <span className="inline-flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> {fee}</span> : null}
              {visitorCapacity && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Max {visitorCapacity} visitors
                </span>
              )}
            </div>

            <p className="mt-6 text-base leading-relaxed text-foreground/85">{shortDescription}</p>

            {/* Experience highlights */}
            {(rawHighlights.length > 0 || amenityList.length > 0 || hasExperienceHighlights) && (
              <div className="mt-8 rounded-2xl border border-border bg-card p-5">
                <h2 className="font-display text-2xl">Experience Highlights</h2>
                <ul className="mt-4 space-y-3 text-sm text-foreground/85">
                  {uniqueFeatures && (
                    <ExperienceItem icon={<Sparkles className="h-4 w-4" />} label="Unique Features" value={uniqueFeatures} />
                  )}
                  {environmentalImpact && (
                    <ExperienceItem icon={<Leaf className="h-4 w-4" />} label="Environmental Impact & Conservation" value={environmentalImpact} />
                  )}
                  {visitorCapacity && (
                    <ExperienceItem icon={<Users className="h-4 w-4" />} label="Visitor Capacity" value={`${visitorCapacity} visitors (max sustainable)`} />
                  )}
                  {typesOfExperiences && (
                    <ExperienceItem icon={<Sparkles className="h-4 w-4" />} label="Types of Experiences" value={typesOfExperiences} />
                  )}
                  {avgTimeSpent && (
                    <ExperienceItem icon={<Clock className="h-4 w-4" />} label="Average Time at Site" value={avgTimeSpent} />
                  )}
                  {bestVisitingPeriods && (
                    <ExperienceItem icon={<Calendar className="h-4 w-4" />} label="Best Visiting Period" value={bestVisitingPeriods} />
                  )}
                  {keyEvents && (
                    <ExperienceItem icon={<Calendar className="h-4 w-4" />} label="Key Events & Festivals" value={keyEvents} />
                  )}
                  {rawHighlights.map((point, idx) => (
                    <li key={`${point}-${idx}`} className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-gold)]" />
                      <span>{point}</span>
                    </li>
                  ))}
                  {amenityList.length > 0 && amenityList.map((item, idx) => (
                    <li key={`${String(item)}-${idx}`} className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-gold)]" />
                      <span>{typeof item === "string" ? item : item.name || item.title || "Amenity"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Map + Info panels */}
        <section className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <OSMMapPanel title={name} address={address} latitude={latitude} longitude={longitude} />

            {/* Situational Analysis */}
            {hasSituationalAnalysis && (
              <div className="mt-8 rounded-3xl border border-border bg-card p-6">
                <h2 className="font-display text-2xl mb-5">Situational Analysis</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SituationCard icon={<RouteIcon className="h-5 w-5" />} label="Roads (Access & Condition)" value={roadsCondition} />
                  <SituationCard icon={<Building2 className="h-5 w-5" />} label="Visitor Centre / Info Kiosk" value={visitorCenterInfo} />
                  <SituationCard icon={<Droplets className="h-5 w-5" />} label="Water Supply" value={waterSupply} />
                  <SituationCard icon={<SignpostBig className="h-5 w-5" />} label="Signage & Interpretation" value={signageInfo} />
                  {fencingSecurity && <SituationCard icon={<CheckCircle className="h-5 w-5" />} label="Fencing & Security" value={fencingSecurity} />}
                  {parkingArea && <SituationCard icon={<MapPin className="h-5 w-5" />} label="Parking Area" value={parkingArea} />}
                  {restAreas && <SituationCard icon={<Users className="h-5 w-5" />} label="Rest Areas / Toilets" value={restAreas} />}
                  {siteCurrentStatus && (
                    <SituationCard
                      icon={siteCurrentStatus.toLowerCase().includes("active") ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
                      label="Site Current Status" value={siteCurrentStatus} />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Attraction information */}
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-2xl">Attraction Information</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <InfoRow label="County" value={county || "—"} />
                <InfoRow label="Sub-County" value={subCounty || "—"} />
                <InfoRow label="Ward" value={ward || "—"} />
                {locality && <InfoRow label="Locality" value={locality} />}
                {gpsCoords && <InfoRow label="GPS Coordinates" value={gpsCoords} />}
                <InfoRow label="Rating" value={rating ? `${rating.toFixed(1)}/5` : "Not available"} />
                <InfoRow label="Entry Fee" value={fee || "Not available"} />
                <InfoRow label="Category" value={(attraction.kind || attraction.type || attraction.category || "Attraction").replace(/_/g, " ")} />
                {attraction.tourism_type && <InfoRow label="Tourism Type" value={attraction.tourism_type} />}
                {attraction.tour_operators && <InfoRow label="Tour Operators" value={attraction.tour_operators} />}
                {attraction.distance_to_major_town && <InfoRow label="Distance to Town" value={attraction.distance_to_major_town} />}
              </dl>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-2xl">Description</h2>
              <p className="mt-4 text-sm leading-relaxed text-foreground/85">{shortDescription}</p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <Link to="/maps"
        className="fixed bottom-8 right-8 z-20 inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-5 py-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-ink)] shadow-lg transition hover:brightness-95"
        title="Browse attraction maps">
        <Map className="h-5 w-5" />
        Maps
      </Link>
    </div>
  );
}

function ExperienceItem({ icon, label, value }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-[var(--color-gold)]">{icon}</span>
      <div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}: </span>
        <span>{value}</span>
      </div>
    </li>
  );
}

function SituationCard({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm text-foreground max-w-[60%]">{value}</dd>
    </div>
  );
}

function unwrapEntity(payload) {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (payload && typeof payload === "object" && payload.data && typeof payload.data === "object") return payload.data;
  return payload;
}

function normalizeRating(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeFee(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") return `USD ${value}`;
  if (typeof value === "string") return value;
  return String(value);
}
