import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { attractionsApi } from "@/lib/api";
import { useI18n } from "@/language/i18n-provider";
import { LANDING_PAGE_VIDEO } from "@/lib/media-assets";

export const Route = createFileRoute("/kiosk-preferences")({
  head: () => ({ meta: [{ title: "Kiosk Preferences — SafariSmart" }] }),
  component: KioskPreferencesPage,
});

const FALLBACK_CATEGORIES = [
  "culture",
  "wildlife",
  "food",
  "adventure",
  "nature",
  "history",
];

const CURRENCY_OPTIONS = ["USD", "KES", "EUR"];

function KioskPreferencesPage() {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const [days, setDays] = useState("3");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("USD");
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
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [formError, setFormError] = useState("");

  const attractionsQuery = useQuery({
    queryKey: ["kiosk-preference-categories"],
    queryFn: attractionsApi.list,
    retry: false,
  });

  const categories = useMemo(() => {
    const extracted = extractCategories(arrayify(attractionsQuery.data));
    return extracted.length > 0 ? extracted : FALLBACK_CATEGORIES;
  }, [attractionsQuery.data]);

  const toggleCategory = (category) => {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }
      return [...current, category];
    });
  };

  const submitPreferences = (event) => {
    event.preventDefault();
    const parsedDays = Number.parseInt(days, 10);
    const parsedBudget = Number.parseInt(budget, 10);

    if (!Number.isInteger(parsedDays) || parsedDays <= 0) {
      setFormError(t("preferences.daysError"));
      return;
    }

    if (!Number.isInteger(parsedBudget) || parsedBudget <= 0) {
      setFormError(t("preferences.budgetError"));
      return;
    }

    if (selectedCategories.length === 0) {
      setFormError(t("preferences.categoriesError"));
      return;
    }

    setFormError("");
    navigate({
      to: "/explore",
      search: {
        days: parsedDays,
        budget: budgetInUSD,
        currency,
        categories: selectedCategories.join(","),
        language,
      },
    });
  };

  return (
    <div className="relative min-h-screen text-foreground">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={LANDING_PAGE_VIDEO} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/65 to-black/80" />

      <section className="relative mx-auto max-w-5xl px-6 py-10 md:py-16">
        <div className="flex items-center justify-between gap-3 text-[var(--color-cream)]">
          <div>
            <div className="eyebrow !text-[var(--color-cream)]/70">{t("kiosk.brand")}</div>
            <h1 className="mt-3 font-display text-5xl md:text-6xl">{t("preferences.title")}</h1>
            <p className="mt-3 max-w-2xl text-[var(--color-cream)]/85">{t("preferences.subtitle")}</p>
          </div>
          <Link
            to="/"
            className="rounded-full border border-[var(--color-cream)]/45 px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-cream)] hover:bg-[var(--color-cream)]/10"
          >
            {t("preferences.back")}
          </Link>
        </div>

        <form onSubmit={submitPreferences} className="mt-8 rounded-3xl border border-[var(--color-cream)]/30 bg-black/75 p-6 text-[var(--color-cream)] shadow-2xl md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              <span className="eyebrow !text-[var(--color-cream)]/70">{t("preferences.days")}</span>
              <input
                value={days}
                onChange={(e) => setDays(e.target.value)}
                inputMode="numeric"
                className="mt-2 w-full rounded-xl border border-[var(--color-cream)]/30 bg-black/30 px-3 py-2 text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/50 focus:border-[var(--color-gold)]"
                placeholder={t("preferences.daysPlaceholder")}
              />
            </label>

            <label className="text-sm col-span-2">
              <span className="eyebrow !text-[var(--color-cream)]/70">{t("preferences.budget")}</span>
              <div className="flex gap-2 items-center mt-2">
                <input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-[var(--color-cream)]/30 bg-black/30 px-3 py-2 text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/50 focus:border-[var(--color-gold)]"
                  placeholder={t("preferences.budgetPlaceholder")}
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-xl border border-[var(--color-cream)]/30 bg-black/30 px-3 py-2 text-[var(--color-cream)] outline-none focus:border-[var(--color-gold)]"
                >
                  {CURRENCY_OPTIONS.map((code) => (
                    <option key={code} value={code} className="text-black">
                      {code}
                    </option>
                  ))}
                </select>
                {currency !== "USD" && budget && (
                  <span className="ml-2 text-xs text-[var(--color-cream)]/70">≈ {budgetInUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</span>
                )}
              </div>
            </label>
          </div>

          <div className="mt-6">
            <span className="eyebrow !text-[var(--color-cream)]/70">{t("preferences.categories")}</span>
            <p className="mt-1 text-sm text-[var(--color-cream)]/80">{t("preferences.pickOneOrMore")}</p>

            {attractionsQuery.isLoading && (
              <p className="mt-3 text-xs text-[var(--color-cream)]/70">{t("preferences.loadingCategories")}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => {
                const selected = selectedCategories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={
                      "rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition " +
                      (selected
                        ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-ink)]"
                        : "border-[var(--color-cream)]/30 text-[var(--color-cream)] hover:bg-[var(--color-cream)]/10")
                    }
                  >
                    {formatCategory(category)}
                  </button>
                );
              })}
            </div>
          </div>

          {formError && <p className="mt-4 text-sm text-red-300">{formError}</p>}

          <button
            type="submit"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-ink)] hover:brightness-95"
          >
            {t("preferences.continueExplore")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}

function arrayify(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.items)) return v.items;
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.results)) return v.results;
  return [];
}

function extractCategories(items) {
  const found = new Set();

  const add = (value) => {
    if (typeof value !== "string") return;
    const normalized = value.trim().toLowerCase();
    if (normalized) found.add(normalized);
  };

  items.forEach((item) => {
    add(item.category);
    add(item.type);
    add(item.kind);
    add(item.theme);

    if (Array.isArray(item.categories)) {
      item.categories.forEach(add);
    }

    if (Array.isArray(item.tags)) {
      item.tags.forEach(add);
    }
  });

  return [...found].sort((a, b) => a.localeCompare(b));
}

function formatCategory(value) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}
