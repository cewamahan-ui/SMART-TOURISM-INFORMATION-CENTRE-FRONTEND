import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cultureHubApi } from "@/lib/api";
import { KENYA_COUNTIES, KENYA_TOURISM_TYPES } from "@/lib/kenya-locations";
import { useState, useEffect } from "react";
import { Search, MapPin, Users, Heart, Star, Globe, ArrowLeft, Calendar, Clock, Info, Navigation, Utensils, Camera, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/culture-hub")({
  head: () => ({ meta: [{ title: "Culture Hub — SafariSmart" }] }),
  component: CultureHubPage,
});

// Static seed data shown when API has no entries yet
const SEED_HUBS = [
  {
    id: "seed-1",
    name: "Maasai Mara Cultural Village",
    county: "Narok",
    sub_county: "Narok South",
    ward: "Mara",
    tourism_type: "Cultural and Heritage Tourism",
    description: "Experience authentic Maasai culture, traditional dances, bead work and warrior ceremonies in the heart of the Mara ecosystem.",
    community_role: "The Maasai community manages all aspects of the cultural village, from tour guiding to craft production and performance.",
    community_benefits: "Revenue shared among 120 families; funds education, healthcare and conservation initiatives.",
    community_enterprises: [
      { type: "crafts", name: "Maasai Beadwork Collective", description: "Hand-crafted jewellery and ornaments" },
      { type: "food", name: "Enkang Dining Experience", description: "Traditional Maasai meals and fermented milk" },
      { type: "stalls", name: "Souvenir Market", description: "Locally made blankets, gourds and artwork" },
    ],
    activities: [
      { name: "Traditional Dance Performance", type: "cultural", description: "Adamu jumping ceremony and Esiyai dance", seasonal: false },
      { name: "Bead Jewellery Making", type: "craft", description: "Hands-on workshop with Maasai women", seasonal: false },
      { name: "Warrior Training Experience", type: "cultural", description: "Learn spear throwing and survival skills", seasonal: false },
      { name: "Sunrise Safari Walk", type: "adventure", description: "Guided walk with Maasai warriors at dawn", seasonal: false },
    ],
    visitor_capacity: 150,
    best_visiting_periods: "Year-round; July–October during wildebeest migration",
    image_url: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800",
    status: "active",
  },
  {
    id: "seed-2",
    name: "Kikuyu Heritage & Craft Centre",
    county: "Kiambu",
    sub_county: "Kikuyu",
    ward: "Kikuyu Township",
    tourism_type: "Cultural and Heritage Tourism",
    description: "A living museum celebrating Kikuyu traditions, agriculture, storytelling and the art of traditional homestead construction.",
    community_role: "Community elders lead heritage tours; youth groups manage the farm demonstrations and craft workshops.",
    community_benefits: "Provides income for 200+ artisans, cooks and guides; school bursary programme funded through entry fees.",
    community_enterprises: [
      { type: "food", name: "Mutura & Githeri Kitchen", description: "Traditional Kikuyu cuisine" },
      { type: "crafts", name: "Calabash & Pottery Workshop", description: "Handmade pottery and woven baskets" },
      { type: "stalls", name: "Agro-Tourism Farm Stand", description: "Fresh produce and herbal products" },
    ],
    activities: [
      { name: "Homestead Tour", type: "cultural", description: "Guided tour of traditional Kikuyu homestead", seasonal: false },
      { name: "Storytelling Evening", type: "cultural", description: "Folk tales and oral history by firelight", seasonal: false },
      { name: "Traditional Cuisine Cooking Class", type: "food", description: "Cook githeri, irio and arrowroot dishes", seasonal: false },
      { name: "Harvest Festival", type: "festival", description: "Annual celebration of the harvest season", seasonal: true },
    ],
    visitor_capacity: 80,
    best_visiting_periods: "Year-round",
    image_url: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800",
    status: "active",
  },
  {
    id: "seed-3",
    name: "Luo Fishing Community Heritage Site",
    county: "Kisumu",
    sub_county: "Kisumu Central",
    ward: "Market Milimani",
    tourism_type: "Community Tourism",
    description: "Discover the rich fishing culture of the Luo people on the shores of Lake Victoria. Experience traditional boat building, fishing techniques and lakeside ceremonies.",
    community_role: "Fisher folk associations oversee all tourist activities; elders provide cultural guidance and historical narratives.",
    community_benefits: "Supplements fishing income for 300 families; funds construction of community health centre.",
    community_enterprises: [
      { type: "food", name: "Lakeside Fish Grill", description: "Fresh tilapia and Nile perch grilled on open fire" },
      { type: "crafts", name: "Traditional Boat Workshop", description: "Miniature Luo fishing boat carvings" },
      { type: "stalls", name: "Lake Victoria Craft Market", description: "Beads, baskets and local art" },
    ],
    activities: [
      { name: "Traditional Fishing Expedition", type: "adventure", description: "Fish with local fishermen using traditional nets", seasonal: false },
      { name: "Boat Building Demonstration", type: "cultural", description: "Watch artisans craft traditional dugout canoes", seasonal: false },
      { name: "Ohangla Music & Dance", type: "cultural", description: "Traditional Luo music and dance performance", seasonal: false },
      { name: "Sunset Lake Cruise", type: "adventure", description: "Canoe cruise on Lake Victoria at sunset", seasonal: false },
    ],
    visitor_capacity: 60,
    best_visiting_periods: "Year-round; avoid rainy seasons (March–May, Oct–Nov)",
    image_url: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800",
    status: "active",
  },
  {
    id: "seed-4",
    name: "Mijikenda Sacred Kaya Forest Experience",
    county: "Kilifi",
    sub_county: "Kilifi North",
    ward: "Tezo",
    tourism_type: "Cultural and Heritage Tourism",
    description: "Explore the UNESCO-listed sacred Kaya forests, spiritual home of the Mijikenda people. Led by community elders, this experience combines ecology, tradition and spirituality.",
    community_role: "Kaya elders lead spiritual tours; community forest guards manage conservation. Women's groups provide traditional weaving demonstrations.",
    community_benefits: "Conservation fees support 15 Kaya communities; funds youth forest ranger training programme.",
    community_enterprises: [
      { type: "crafts", name: "Palm Weaving Workshop", description: "Traditional Mijikenda palm mats and baskets" },
      { type: "food", name: "Coconut & Cassava Kitchen", description: "Coastal cuisine using forest herbs and ingredients" },
      { type: "stalls", name: "Forest Medicine Stall", description: "Dried herbs and traditional remedies" },
    ],
    activities: [
      { name: "Kaya Forest Spiritual Walk", type: "cultural", description: "Guided walk with elders through sacred forest groves", seasonal: false },
      { name: "Traditional Medicine Tour", type: "cultural", description: "Learn about medicinal plants from community healers", seasonal: false },
      { name: "Giriama Dance Performance", type: "cultural", description: "Traditional Giriama music and chenda dance", seasonal: false },
      { name: "Birdwatching Trail", type: "adventure", description: "Over 200 bird species in the Kaya ecosystem", seasonal: false },
    ],
    visitor_capacity: 40,
    best_visiting_periods: "Year-round; June–September for birdwatching",
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    status: "active",
  },
  {
    id: "seed-5",
    name: "Turkana Cultural Heritage Village",
    county: "Turkana",
    sub_county: "Turkana Central",
    ward: "Lodwar Township",
    tourism_type: "Cultural and Heritage Tourism",
    description: "Immerse yourself in the traditions of the Turkana pastoralists. Visit traditional kraals, learn about nomadic lifestyles and witness ancient jewellery and body art traditions.",
    community_role: "Pastoralist families host tourists in their homesteads on a rotation basis, ensuring equitable income distribution.",
    community_benefits: "Tourism income has reduced dependence on livestock only; funds have built three community boreholes.",
    community_enterprises: [
      { type: "crafts", name: "Turkana Beads & Ornaments", description: "Elaborate traditional jewellery and body ornaments" },
      { type: "food", name: "Nomadic Food Experience", description: "Camel milk, roasted goat and traditional bread" },
      { type: "stalls", name: "Animal Hide Craft Stall", description: "Handmade leather goods and gourd decorations" },
    ],
    activities: [
      { name: "Camel Safari", type: "adventure", description: "Trek through Turkana landscapes on camelback", seasonal: false },
      { name: "Traditional Homestead Visit", type: "cultural", description: "Stay in a traditional Turkana homestead", seasonal: false },
      { name: "Akiwome Music Night", type: "cultural", description: "Traditional Turkana songs and storytelling", seasonal: false },
      { name: "Lake Turkana Sunset", type: "adventure", description: "Guided visit to the Jade Sea at sunset", seasonal: false },
    ],
    visitor_capacity: 30,
    best_visiting_periods: "October–March (drier months)",
    image_url: "https://images.unsplash.com/photo-1547234935-80c7145ec969?w=800",
    status: "active",
  },
  {
    id: "seed-6",
    name: "Swahili Old Town Living Heritage",
    county: "Mombasa",
    sub_county: "Mvita",
    ward: "Tudor",
    tourism_type: "Cultural and Heritage Tourism",
    description: "Walk through centuries of Swahili civilisation in the narrow streets of Old Town Mombasa. Community-led tours reveal architecture, cuisine and crafts of this UNESCO heritage city.",
    community_role: "Old Town residents serve as guides; craft families open their workshops; mosques and temples participate in the cultural programme.",
    community_benefits: "Tourism supports 500+ businesses; community fund maintains historical buildings and traditional crafts.",
    community_enterprises: [
      { type: "food", name: "Swahili Coast Kitchen", description: "Pilau, biryani, coconut fish curry and mandazi" },
      { type: "crafts", name: "Dhow Carving Atelier", description: "Miniature dhow models and carved chests" },
      { type: "stalls", name: "Spice & Jewellery Market", description: "Coastal spices, gold jewellery and kanga fabrics" },
    ],
    activities: [
      { name: "Old Town Walking Tour", type: "cultural", description: "Two-hour heritage walk through Fort Jesus and old streets", seasonal: false },
      { name: "Dhow Sunset Cruise", type: "adventure", description: "Traditional wooden dhow cruise in Mombasa harbour", seasonal: false },
      { name: "Taarab Music Performance", type: "cultural", description: "Live Swahili Taarab music at a community café", seasonal: false },
      { name: "Swahili Cooking Class", type: "food", description: "Cook authentic coastal dishes with a local family", seasonal: false },
    ],
    visitor_capacity: 100,
    best_visiting_periods: "Year-round; December–March for dhow sailing season",
    image_url: "https://images.unsplash.com/photo-1597495427396-d30f52c8b98a?w=800",
    status: "active",
  },
];

function CultureHubPage() {
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCounty, setSelectedCounty] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedHub, setSelectedHub] = useState(null);

  useEffect(() => {
    cultureHubApi.list({ status: "active" })
      .then((res) => {
        const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setHubs(items.length > 0 ? items : SEED_HUBS);
      })
      .catch(() => setHubs(SEED_HUBS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = hubs.filter((h) => {
    const matchCounty = selectedCounty === "all" || h.county === selectedCounty;
    const matchType = selectedType === "all" || h.tourism_type === selectedType;
    const text = `${h.name} ${h.county} ${h.sub_county || ""} ${h.description || ""}`.toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    return matchCounty && matchType && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-12">
        <div className="eyebrow">Community & Culture</div>
        <h1 className="mt-3 font-display text-6xl leading-tight">
          Culture <span className="italic">Hub</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Explore Kenya's rich cultural heritage through community-led experiences. From Maasai warrior ceremonies
          to Swahili Old Town tours — discover authentic traditions across all 47 counties.
        </p>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap items-center gap-4 border-y border-border py-5">
          <label className="flex items-center gap-2 border-b border-border pb-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search culture hubs…"
              className="w-56 bg-transparent text-sm outline-none" />
          </label>

          <select value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}
            className="rounded-full border border-border bg-card px-4 py-2 text-xs uppercase tracking-widest text-foreground">
            <option value="all">All Counties</option>
            {KENYA_COUNTIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-full border border-border bg-card px-4 py-2 text-xs uppercase tracking-widest text-foreground">
            <option value="all">All Tourism Types</option>
            {KENYA_TOURISM_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Stats bar */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="text-center">
            <div className="font-display text-3xl">{hubs.length}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Culture Hubs</div>
          </div>
          <div className="text-center border-x border-border">
            <div className="font-display text-3xl">{new Set(hubs.map((h) => h.county)).size}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Counties</div>
          </div>
          <div className="text-center">
            <div className="font-display text-3xl">{hubs.reduce((acc, h) => acc + (h.activities?.length || 0), 0)}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Activities</div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-20 text-muted-foreground text-sm">Loading culture hubs…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
            No culture hubs found matching your filters.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((hub) => (
              <HubCard key={hub.id} hub={hub} onRead={() => setSelectedHub(hub)} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />

      {/* Article modal */}
      {selectedHub && (
        <HubArticle hub={selectedHub} onClose={() => setSelectedHub(null)} />
      )}
    </div>
  );
}

function HubCard({ hub, onRead }) {
  const activities = hub.activities || [];
  return (
    <article className="flex flex-col rounded-3xl border border-border bg-card overflow-hidden group transition hover:border-[var(--color-gold)]/60 hover:shadow-lg">
      <div className="relative h-52 overflow-hidden bg-muted shrink-0">
        {hub.image_url ? (
          <img src={hub.image_url} alt={hub.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[var(--color-gold)]/20 to-muted flex items-center justify-center">
            <Globe className="h-12 w-12 text-[var(--color-gold)]/40" />
          </div>
        )}
        {hub.tourism_type && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-[0.6rem] uppercase tracking-widest backdrop-blur-sm">
            {hub.tourism_type}
          </span>
        )}
        {hub.status === "active" && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[0.6rem] uppercase tracking-widest text-white">
            Active
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl leading-snug">{hub.name}</h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {[hub.county, hub.sub_county].filter(Boolean).join(", ")}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/75 line-clamp-3 flex-1">{hub.description}</p>

        {activities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {activities.slice(0, 2).map((a, i) => (
              <span key={i} className="rounded-full bg-muted/60 px-2.5 py-1 text-[0.62rem] uppercase tracking-widest text-muted-foreground">
                {a.name}
              </span>
            ))}
            {activities.length > 2 && (
              <span className="rounded-full border border-border px-2.5 py-1 text-[0.62rem] text-muted-foreground">
                +{activities.length - 2} more
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          {hub.visitor_capacity && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {hub.visitor_capacity} max
            </span>
          )}
          <button onClick={onRead}
            className="ml-auto rounded-full bg-[var(--color-gold)] px-4 py-1.5 text-[0.65rem] uppercase tracking-widest text-[var(--color-ink)] hover:brightness-110 transition">
            Read Article
          </button>
        </div>
      </div>
    </article>
  );
}

const ACTIVITY_COLORS = {
  cultural: "bg-purple-100 text-purple-700",
  craft: "bg-amber-100 text-amber-700",
  food: "bg-orange-100 text-orange-700",
  adventure: "bg-blue-100 text-blue-700",
  festival: "bg-rose-100 text-rose-700",
};

function HubArticle({ hub, onClose }) {
  const enterprises = hub.community_enterprises || [];
  const activities = hub.activities || [];

  // Close on Escape key
  const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" onKeyDown={handleKeyDown}>
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Scrollable article panel — sits above backdrop */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="relative min-h-full bg-background md:mx-12 md:my-10 md:rounded-3xl md:shadow-2xl lg:mx-24">

          {/* Header bar */}
          <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/95 px-6 py-4 backdrop-blur rounded-t-3xl">
            <button onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest hover:bg-muted transition">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Culture Hub
            </button>
            {hub.tourism_type && (
              <span className="rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-3 py-1 text-[0.62rem] uppercase tracking-widest text-[var(--color-gold)]">
                {hub.tourism_type}
              </span>
            )}
            <button onClick={onClose} className="ml-auto rounded-full border border-border p-1.5 hover:bg-muted transition">
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>

          <article className="mx-auto max-w-4xl px-6 py-10 pb-24">
            {/* Hero image */}
            {hub.image_url && (
              <div className="mb-8 h-80 w-full overflow-hidden rounded-3xl">
                <img src={hub.image_url} alt={hub.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
              </div>
            )}

            {/* Title & location */}
            <div className="mb-8 border-b border-border pb-8">
              <div className="eyebrow">Culture Hub · Community Story</div>
              <h1 className="mt-3 font-display text-5xl leading-tight">{hub.name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {[hub.county, hub.sub_county, hub.ward].filter(Boolean).join(", ")}
                </span>
                {hub.visitor_capacity && (
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Max {hub.visitor_capacity} visitors/day</span>
                )}
                {hub.best_visiting_periods && (
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {hub.best_visiting_periods}</span>
                )}
              </div>
            </div>

            {/* Quick-fact strip */}
            <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Camera, label: "Photography", value: "Permitted" },
                { icon: Utensils, label: "Local Food", value: enterprises.some(e => e.type === "food") ? "Available" : "Ask on-site" },
                { icon: Navigation, label: "County", value: hub.county || "Kenya" },
                { icon: Clock, label: "Duration", value: "2–6 hours" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
                  <Icon className="mx-auto mb-2 h-5 w-5 text-[var(--color-gold)]" />
                  <div className="text-[0.62rem] uppercase tracking-widest text-muted-foreground">{label}</div>
                  <div className="mt-1 text-sm font-medium">{value}</div>
                </div>
              ))}
            </div>

            {/* About */}
            <section className="mb-10">
              <h2 className="font-display text-3xl mb-4 flex items-center gap-2">
                <Info className="h-6 w-6 text-[var(--color-gold)]" /> About This Hub
              </h2>
              <p className="text-base leading-relaxed text-foreground/85">{hub.description}</p>
              {hub.county && (
                <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-5">
                  <p className="text-sm leading-relaxed text-foreground/75">
                    Located in <strong>{hub.county} County</strong>
                    {hub.sub_county ? `, ${hub.sub_county} Sub-County` : ""}, this community hub is one of Kenya's
                    grassroots-led cultural destinations, giving visitors direct access to local traditions, artisans,
                    and storytellers who have kept these practices alive for generations.
                  </p>
                </div>
              )}
            </section>

            {/* Community role + benefits side by side */}
            {(hub.community_role || hub.community_benefits) && (
              <section className="mb-10 grid gap-6 md:grid-cols-2">
                {hub.community_role && (
                  <div className="rounded-3xl border border-border bg-card p-6">
                    <h3 className="font-display text-xl mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-[var(--color-gold)]" /> Role of the Community
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/80">{hub.community_role}</p>
                  </div>
                )}
                {hub.community_benefits && (
                  <div className="rounded-3xl border border-border bg-card p-6">
                    <h3 className="font-display text-xl mb-3 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-[var(--color-gold)]" /> Community Impact
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/80">{hub.community_benefits}</p>
                  </div>
                )}
              </section>
            )}

            {/* Activities */}
            {activities.length > 0 && (
              <section className="mb-10">
                <h2 className="font-display text-3xl mb-5 flex items-center gap-2">
                  <Globe className="h-6 w-6 text-[var(--color-gold)]" /> Cultural Activities
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {activities.map((a, i) => (
                    <div key={i} className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-medium text-base">{a.name}</h4>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.6rem] uppercase tracking-widest ${ACTIVITY_COLORS[a.type] || "bg-muted text-muted-foreground"}`}>
                          {a.type}
                        </span>
                      </div>
                      {a.description && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a.description}</p>}
                      {a.seasonal && (
                        <div className="mt-2 flex items-center gap-1 text-[0.65rem] text-amber-600">
                          <Clock className="h-3 w-3" /> Seasonal — confirm dates before visit
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Enterprises */}
            {enterprises.length > 0 && (
              <section className="mb-10">
                <h2 className="font-display text-3xl mb-5 flex items-center gap-2">
                  <Star className="h-6 w-6 text-[var(--color-gold)]" /> Community Enterprises
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  All purchases and experiences here directly support the local community. Prices are set by community members.
                </p>
                <div className="space-y-4">
                  {enterprises.map((e, i) => (
                    <div key={i} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                      <span className="rounded-full bg-[var(--color-gold)]/15 px-3 py-1 text-[0.6rem] uppercase tracking-widest text-[var(--color-gold)] shrink-0 mt-0.5">
                        {e.type}
                      </span>
                      <div>
                        <div className="font-medium">{e.name}</div>
                        {e.description && <div className="mt-1 text-sm text-muted-foreground">{e.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Visitor tips */}
            <section className="mb-10">
              <h2 className="font-display text-3xl mb-5 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-[var(--color-gold)]" /> Visitor Guidelines
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { tip: "Dress modestly and respectfully — ask your guide about cultural dress codes before visiting." },
                  { tip: "Always ask permission before photographing community members, especially during ceremonies." },
                  { tip: "Arrive on time — community-led tours often start at fixed times and cannot be delayed." },
                  { tip: "Purchase crafts directly from artisans to ensure 100% of revenue stays in the community." },
                  { tip: "Carry small denomination cash — many community stalls do not accept cards or mobile money." },
                  { tip: "Listen to your guide: some areas or ceremonies may be restricted to initiated community members." },
                ].map(({ tip }, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-card px-5 py-4">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--color-gold)]/20 text-center text-[0.65rem] font-bold leading-5 text-[var(--color-gold)]">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-foreground/80">{tip}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Best visiting period */}
            {hub.best_visiting_periods && (
              <section className="rounded-3xl border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 p-6">
                <h3 className="font-display text-xl flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-[var(--color-gold)]" /> Best Time to Visit
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{hub.best_visiting_periods}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Always confirm opening days and special ceremony dates directly with the hub before travelling,
                  as schedules may change during public holidays or cultural observances.
                </p>
              </section>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
