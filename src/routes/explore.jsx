import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Outlet, useLocation } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attractionsApi, publicApi, recommendationsApi, favoritesApi } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState, useMemo } from "react";
import { Search, MapPin, Heart, Moon, Sun, Map, Home, Globe } from "lucide-react";
import { useI18n } from "@/language/i18n-provider";
import { arrayify, collectCategoryText, FALLBACK_IMAGES, normalizeExploreItems } from "@/lib/explore-catalog";
import { getStoredTheme, setStoredTheme } from "@/lib/theme";
import { CURRENCIES, CURRENCY_OPTIONS, CURRENCY_RATES } from "@/lib/currencies";

export const Route = createFileRoute("/explore")({
  validateSearch: (search) => ({
    days: safeInt(search.days),
    budget: safeInt(search.budget),
    currency: parseCurrency(search.currency),
    categories: parseCategories(search.categories || search.category),
    language: typeof search.language === "string" ? search.language : "",
  }),
  head: () => ({ meta: [{ title: "Explore — SafariSmart" }] }),
  component: ExplorePage,
});

const TABS = ["all", "attractions", "accommodations", "luxury", "expeditions", "conservation"];

function ExplorePage() {
  const location = useLocation();
  const isNested = /^\/explore\/[^/]+/.test(location.pathname);

  // All hooks must run unconditionally before any early return
  const search = Route.useSearch();
  const { t } = useI18n();
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState("light");
  const [budget, setBudget] = useState(search.budget || "");
  const [currency, setCurrency] = useState(search.currency || "USD");

  const queryClient = useQueryClient();

  const recsQuery = useQuery({
    queryKey: ["recommendations"],
    queryFn: recommendationsApi.get,
    enabled: !!user,
    retry: false,
  });

  const favsQuery = useQuery({
    queryKey: ["favorites"],
    queryFn: favoritesApi.list,
    enabled: !!user,
    retry: false,
  });

  const favMap = useMemo(() => {
    const raw = favsQuery.data;
    let list = [];
    if (Array.isArray(raw)) list = raw;
    else if (Array.isArray(raw?.data)) list = raw.data;
    else if (Array.isArray(raw?.data?.data)) list = raw.data.data;
    const map = {};
    list.forEach((f) => {
      const aid = f.attraction_id || f.attraction?.id;
      if (aid) map[String(aid)] = f.id;
    });
    return map;
  }, [favsQuery.data]);

  const addFavMutation = useMutation({
    mutationFn: (attractionId) => favoritesApi.add(attractionId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["favorites"] }); toast.success("Added to favourites"); },
    onError: () => toast.error("Could not add favourite"),
  });

  const removeFavMutation = useMutation({
    mutationFn: (entryId) => favoritesApi.remove(entryId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["favorites"] }); toast.success("Removed from favourites"); },
    onError: () => toast.error("Could not remove favourite"),
  });

  const budgetInUSD = useMemo(() => {
    if (!budget) return "";
    const rate = CURRENCY_RATES[currency] ?? 1;
    return Number(budget) / rate;
  }, [budget, currency]);

  const aq = useQuery({ queryKey: ["attractions"], queryFn: attractionsApi.list, retry: false });
  const accomQ = useQuery({ queryKey: ["public-accommodations"], queryFn: publicApi.accommodations, retry: false });

  useEffect(() => { setTheme(getStoredTheme()); }, []);

  if (isNested) return <Outlet />;

  // Normalize attractions
  const attractionItems = normalizeExploreItems([], aq.data).map((it) => ({ ...it, _itemType: "attraction" }));

  // Normalize accommodations
  const rawAccoms = (() => {
    const raw = accomQ.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.accommodations)) return raw.accommodations;
    return [];
  })();
  const accommodationItems = rawAccoms.map((a) => ({
    ...a,
    _itemType: "accommodation",
    _name: a.name || a.hotel_name || a.title || "Accommodation",
    _location: [a.county, a.sub_county, a.ward, a.location, a.city, a.address].filter(Boolean).join(", ") || "Kenya",
    _gallery: [a.image_url, ...(Array.isArray(a.media_urls) ? a.media_urls : [])].filter(Boolean),
    _slug: String(a.id || ""),
    kind: "Accommodation",
    price: a.price_per_night || a.starting_price || a.price,
  }));

  const allItems = tab === "attractions"
    ? attractionItems
    : tab === "accommodations"
    ? accommodationItems
    : [...attractionItems, ...accommodationItems];

  const filtered = allItems
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      // Tab filters
      if (tab === "luxury") {
        const price = Number(item.price || item.starting_price || 0);
        if (price < 500) return false;
      }
      if (tab === "expeditions") {
        const text = `${item.kind || ""}`.toLowerCase();
        if (!text.includes("tour") && !text.includes("safari") && !text.includes("adventure") && !text.includes("expedition")) return false;
      }
      if (tab === "conservation") {
        const text = `${item.kind || ""} ${collectCategoryText(item)}`.toLowerCase();
        if (!text.includes("conservation") && !text.includes("eco") && !text.includes("wildlife") && !text.includes("national park")) return false;
      }

      const text = `${item._name || item.name || item.title || ""} ${item.kind || ""} ${item._location || item.location || item.region || ""} ${collectCategoryText(item)}`.toLowerCase();
      const searchText = q.toLowerCase();
      const price = Number(item.price || item.starting_price || 0);
      const budgetMatch = !budgetInUSD || !price || price <= budgetInUSD;
      return text.includes(searchText) && budgetMatch;
    })
    .sort((left, right) => {
      const categories = search.categories || [];
      const leftScore = getPreferenceScore(left.item, categories);
      const rightScore = getPreferenceScore(right.item, categories);
      if (leftScore !== rightScore) return rightScore - leftScore;
      return left.index - right.index;
    })
    .map(({ item }) => item);

  const usingFallback = arrayify(aq.data).length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-7xl px-6 pt-12">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => {
              const next = theme === "dark" ? "light" : "dark";
              setTheme(next);
              setStoredTheme(next);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/85 px-4 py-2 text-xs uppercase tracking-widest text-foreground backdrop-blur transition hover:bg-accent">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? t("kiosk.lightMode") : t("kiosk.darkMode")}
          </button>
        </div>

        <div className="eyebrow">{t("explore.eyebrow")}</div>
        <h1 className="mt-3 font-display text-6xl leading-tight">
          {t("explore.titleLead")} <span className="italic">{t("explore.titleAccent")}</span>
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">{t("explore.subtitle")}</p>

        {/* Preferences bar */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("explore.personalized")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-foreground">
            <span>{search.days ? `${search.days} ${t("explore.daysUnit")}` : t("explore.anyDuration")}</span>
            <span>
              <input type="number" min="1" value={budget} onChange={(e) => setBudget(e.target.value)}
                placeholder={t("explore.budgetUpTo")} className="w-24 rounded border border-border px-2 py-1 text-sm" />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="ml-2 rounded border border-border px-2 py-1 text-sm">
                {CURRENCY_OPTIONS.map(cur => (
                  <option key={cur} value={cur}>{CURRENCIES[cur].flag} {cur}</option>
                ))}
              </select>
              {currency !== "USD" && budget && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ≈ ${budgetInUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </span>
              )}
            </span>
            <span>{search.categories?.length ? `${t("explore.categoryLabel")}: ${search.categories.join(", ")}` : t("explore.anyCategory")}</span>
          </div>
        </div>

        {/* Recommendations strip — only shown when logged in and recs are available */}
        {user && arrayifyRecs(recsQuery.data).length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Heart className="h-4 w-4 text-[var(--color-gold)]" />
              <span className="eyebrow">Recommended for You</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {arrayifyRecs(recsQuery.data).slice(0, 8).map((item, idx) => {
                const img = item.image_url || item.image || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
                const name = item.name || item.title || "Attraction";
                const id = item.id;
                return (
                  <Link
                    key={id ?? idx}
                    to="/explore/$attractionId"
                    params={{ attractionId: id }}
                    className="group shrink-0 w-44 overflow-hidden rounded-2xl border border-border bg-card transition hover:border-[var(--color-gold)]"
                  >
                    <img
                      src={img}
                      alt={name}
                      className="h-28 w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(e) => { if (e.currentTarget.src !== FALLBACK_IMAGES[0]) e.currentTarget.src = FALLBACK_IMAGES[0]; }}
                    />
                    <div className="p-3">
                      <p className="text-xs font-semibold leading-snug line-clamp-2">{name}</p>
                      {item.county && (
                        <p className="mt-1 flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />{item.county}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-y border-border py-5">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tItem) => (
              <button key={tItem} onClick={() => setTab(tItem)}
                className={"rounded-full px-4 py-2 text-xs uppercase tracking-widest transition " +
                  (tab === tItem ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
                {tItem === "all" ? "All" :
                 tItem === "attractions" ? "Attractions" :
                 tItem === "accommodations" ? "Accommodations" :
                 t(`explore.tabs.${tItem}`) || tItem}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 border-b border-border pb-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={t("explore.searchPlaceholder")}
              className="w-64 bg-transparent text-sm outline-none" />
          </label>
        </div>

        {usingFallback && !aq.isLoading && (
          <p className="mt-4 text-xs text-muted-foreground">{t("explore.fallbackNotice")}</p>
        )}
      </section>

      {/* Culture Hub callout */}
      <section className="mx-auto max-w-7xl px-6 pt-10">
        <Link to="/culture-hub"
          className="flex items-center gap-6 rounded-2xl border border-[var(--color-gold)]/40 bg-gradient-to-r from-[var(--color-gold)]/10 to-transparent p-5 transition hover:border-[var(--color-gold)]/70 group">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--color-gold)]/20">
            <Globe className="h-6 w-6 text-[var(--color-gold)]" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-[var(--color-gold)]">New</p>
            <h3 className="font-display text-xl text-foreground">Culture Hub</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Explore community-led cultural experiences across Kenya's 47 counties — crafts, food, festivals and more.
            </p>
          </div>
          <span className="text-xs uppercase tracking-widest text-foreground opacity-60 group-hover:opacity-100 transition">
            Explore →
          </span>
        </Link>
      </section>

      {/* Card grid */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        {filtered.length === 0 && !aq.isLoading && !accomQ.isLoading ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
            No results found. Try adjusting your search or filters.
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((it, idx) => (
              <Card key={`${it._itemType || "item"}-${it.id ?? idx}-${idx}`} item={it} idx={idx}
                isFavorited={user ? !!favMap[String(it.id)] : false}
                onFavoriteToggle={user ? () => {
                  if (favMap[String(it.id)]) removeFavMutation.mutate(it.id);
                  else addFavMutation.mutate(it.id);
                } : null}
              />
            ))}
          </div>
        )}
      </section>

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

function Card({ item, idx, isFavorited, onFavoriteToggle }) {
  const { t } = useI18n();
  const img = item._gallery?.[0] || item.image || item.image_url || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
  const name = item._name || item.name || item.title || t("explore.untitledExperience");
  const place = item._location || item.location || item.region || item.city || t("explore.defaultLocation");
  const rating = normalizeRating(item.rating ?? item.average_rating ?? item.stars);
  const fee = item.fee ?? item.fees ?? item.entry_fee ?? item.price ?? item.starting_price;
  const price = item.price || item.starting_price || item.price_per_night;
  const slug = item._slug;
  const isAccom = item._itemType === "accommodation";

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img src={img} alt={name} loading="lazy"
          onError={(e) => {
            const fallback = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
            if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        <button
          onClick={() => onFavoriteToggle && onFavoriteToggle(favEntry)}
          title={isFavorited ? "Remove from favourites" : "Add to favourites"}
          className={"absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-background/90 transition hover:bg-accent " + (isFavorited ? "text-red-500" : "text-foreground hover:text-accent-foreground")}>
          <Heart className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
        </button>
        <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[0.62rem] uppercase tracking-widest text-foreground">
          {isAccom ? <span className="flex items-center gap-1"><Home className="h-3 w-3" /> Accommodation</span> : (item.kind || t("explore.defaultKind"))}
        </span>
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl leading-snug">{name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {place}
          </p>
          {(rating || fee) && (
            <div className="mt-2 flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-widest text-muted-foreground">
              {rating ? <span className="rounded-full border border-border px-2.5 py-1">Rating {rating.toFixed(1)}/5</span> : null}
              {fee ? <span className="rounded-full border border-border px-2.5 py-1">{formatFee(fee)}</span> : null}
            </div>
          )}
        </div>
        {price && (
          <div className="text-right">
            <div className="eyebrow">{t("explore.from")}</div>
            <div className="font-display text-lg">${price}</div>
          </div>
        )}
      </div>
      {isAccom ? (
        <Link to="/accommodations"
          className="mt-4 inline-block text-xs uppercase tracking-widest text-foreground underline underline-offset-8 decoration-[var(--color-gold)] decoration-2">
          View Accommodations →
        </Link>
      ) : (
        <Link to="/explore/$attractionId" params={{ attractionId: slug }}
          className="mt-4 inline-block text-xs uppercase tracking-widest text-foreground underline underline-offset-8 decoration-[var(--color-gold)] decoration-2">
          {t("common.explore")} →
        </Link>
      )}
    </article>
  );
}

function safeInt(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function parseCategories(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).toLowerCase()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return [];
}

function parseCurrency(value) {
  const code = typeof value === "string" ? value.toUpperCase() : "USD";
  const allowed = new Set(["USD", "KES", "GBP", "EUR"]);
  return allowed.has(code) ? code : "USD";
}

function normalizeRating(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatFee(value) {
  if (value === null || value === undefined || value === "") return "Fee unavailable";
  if (typeof value === "number") return `Fee ${value}`;
  return String(value);
}

function getPreferenceScore(item, categories) {
  if (!Array.isArray(categories) || categories.length === 0) return 0;
  const text = `${item._name || item.name || item.title || ""} ${item.kind || ""} ${item._location || item.location || ""} ${collectCategoryText(item)}`.toLowerCase();
  return categories.reduce((score, category) => {
    const needle = String(category || "").toLowerCase().trim();
    return !needle ? score : text.includes(needle) ? score + 1 : score;
  }, 0);
}

function arrayifyRecs(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.recommendations)) return v.recommendations;
  if (Array.isArray(v.items)) return v.items;
  return [];
}
