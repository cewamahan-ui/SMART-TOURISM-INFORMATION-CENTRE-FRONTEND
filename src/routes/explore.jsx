import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Outlet, useLocation } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery } from "@tanstack/react-query";
import { attractionsApi } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { Search, MapPin, Heart, Moon, Sun, Map } from "lucide-react";
import { useI18n } from "@/language/i18n-provider";
import { arrayify, collectCategoryText, FALLBACK_IMAGES, normalizeExploreItems } from "@/lib/explore-catalog";
import { getStoredTheme, setStoredTheme } from "@/lib/theme";

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

const TABS = ["all", "luxury", "expeditions", "conservation"];

function ExplorePage() {
    const location = useLocation();
    if (/^\/explore\/[^/]+/.test(location.pathname)) {
      return <Outlet />;
    }

    const search = Route.useSearch();
    const { t } = useI18n();
    const [tab, setTab] = useState("all");
    const [q, setQ] = useState("");
    const [theme, setTheme] = useState("light");
    const [budget, setBudget] = useState(search.budget || "");
    const [currency, setCurrency] = useState(search.currency || "USD");

    // Static currency rates (replace with live API if needed)
    const CURRENCY_RATES = {
      USD: 1,
      KES: 130,
      EUR: 0.92,
    };
    const budgetInUSD = useMemo(() => {
      if (!budget) return "";
      if (currency === "USD") return Number(budget);
      if (currency === "KES") return Number(budget) / CURRENCY_RATES.KES;
      if (currency === "EUR") return Number(budget) / CURRENCY_RATES.EUR;
      return Number(budget);
    }, [budget, currency]);
    const aq = useQuery({ queryKey: ["attractions"], queryFn: attractionsApi.list, retry: false });

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

    const apiCount = arrayify(aq.data).length;
    const usingFallback = apiCount === 0;
    const list = normalizeExploreItems([], aq.data);
    const filtered = list
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const text = `${item.name || item.title || ""} ${item.kind || ""} ${item.location || item.region || ""} ${collectCategoryText(item)}`.toLowerCase();
        const searchText = q.toLowerCase();
        const price = Number(item.price || item.starting_price || 0);
        // Convert price to USD for comparison
        const priceInUSD = price;
        const budgetMatch = !budgetInUSD || !priceInUSD || priceInUSD <= budgetInUSD;
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

    return (<div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20"/>

      <section className="mx-auto max-w-7xl px-6 pt-12">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => {
                const next = theme === "dark" ? "light" : "dark";
                setTheme(next);
                setStoredTheme(next);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/85 px-4 py-2 text-xs uppercase tracking-widest text-foreground backdrop-blur transition hover:bg-accent"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? t("kiosk.lightMode") : t("kiosk.darkMode")}
          </button>
        </div>
        <div className="eyebrow">{t("explore.eyebrow")}</div>
        <h1 className="mt-3 font-display text-6xl leading-tight">
          {t("explore.titleLead")} <span className="italic">{t("explore.titleAccent")}</span>
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          {t("explore.subtitle")}
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("explore.personalized")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-foreground">
            <span>{search.days ? `${search.days} ${t("explore.daysUnit")}` : t("explore.anyDuration")}</span>
            <span>
              <input
                type="number"
                min="1"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder={t("explore.budgetUpTo")}
                className="w-24 rounded border border-border px-2 py-1 text-sm"
              />
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="ml-2 rounded border border-border px-2 py-1 text-sm"
              >
                <option value="USD">USD</option>
                <option value="KES">KES</option>
                <option value="EUR">EUR</option>
              </select>
              {currency !== "USD" && budget && (
                <span className="ml-2 text-xs text-muted-foreground">≈ ${budgetInUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</span>
              )}
            </span>
            <span>{search.categories?.length ? `${t("explore.categoryLabel")}: ${search.categories.join(", ")}` : t("explore.anyCategory")}</span>
            {search.language ? <span>{t("explore.languageLabel")}: {search.language}</span> : null}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-y border-border py-5">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tItem) => (<button key={tItem} onClick={() => setTab(tItem)} className={"rounded-full px-4 py-2 text-xs uppercase tracking-widest transition " +
                (tab === tItem
                  ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground")}>
                {t(`explore.tabs.${tItem}`)}
              </button>))}
          </div>
          <label className="flex items-center gap-2 border-b border-border pb-1">
            <Search className="h-4 w-4 text-muted-foreground"/>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("explore.searchPlaceholder")} className="w-64 bg-transparent text-sm outline-none"/>
          </label>
        </div>

        {usingFallback && !aq.isLoading && (<p className="mt-4 text-xs text-muted-foreground">
            {t("explore.fallbackNotice")}
          </p>)}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it, idx) => (<Card key={(it.id ?? idx) + "-" + idx} item={it} idx={idx}/>))}
        </div>
      </section>

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

function Card({ item, idx }) {
  const { t } = useI18n();
    const img = item._gallery?.[0] || item.image || item.image_url || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
  const name = item._name || item.name || item.title || t("explore.untitledExperience");
  const place = item._location || item.location || item.region || item.city || t("explore.defaultLocation");
  const rating = normalizeRating(item.rating ?? item.average_rating ?? item.stars);
  const fee = item.fee ?? item.fees ?? item.entry_fee ?? item.price ?? item.starting_price;
    const price = item.price || item.starting_price;
    const slug = item._slug;
    return (<article className="group">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={img}
          alt={name}
          loading="lazy"
          onError={(e) => {
            const fallback = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
            if (e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <button className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground transition hover:bg-accent hover:text-accent-foreground">
          <Heart className="h-4 w-4"/>
        </button>
        <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[0.62rem] uppercase tracking-widest text-foreground">
          {item.kind || t("explore.defaultKind")}
        </span>
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl leading-snug">{name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3"/> {place}
          </p>
          {(rating || fee) && (
            <div className="mt-2 flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-widest text-muted-foreground">
              {rating ? <span className="rounded-full border border-border px-2.5 py-1">Rating {rating.toFixed(1)}/5</span> : null}
              {fee ? <span className="rounded-full border border-border px-2.5 py-1">{formatFee(fee)}</span> : null}
            </div>
          )}
        </div>
        {price && (<div className="text-right">
            <div className="eyebrow">{t("explore.from")}</div>
            <div className="font-display text-lg">${price}</div>
          </div>)}
      </div>
        <Link to="/explore/$attractionId" params={{ attractionId: slug }} className="mt-4 inline-block text-xs uppercase tracking-widest text-foreground underline underline-offset-8 decoration-[var(--color-gold)] decoration-2">
        {t("common.explore")} →
        </Link>
    </article>);
}

function safeInt(value) {
    const parsed = Number.parseInt(String(value || ""), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function parseCategories(value) {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).toLowerCase()).filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean);
    }

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
  if (value === null || value === undefined || value === "") {
    return "Fee unavailable";
  }

  if (typeof value === "number") {
    return `Fee ${value}`;
  }

  return String(value);
}

function getPreferenceScore(item, categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return 0;
  }

  const text = `${item.name || item.title || ""} ${item.kind || ""} ${item.location || item.region || ""} ${collectCategoryText(item)}`.toLowerCase();

  return categories.reduce((score, category) => {
    const needle = String(category || "").toLowerCase().trim();
    if (!needle) {
      return score;
    }

    return text.includes(needle) ? score + 1 : score;
  }, 0);
}
