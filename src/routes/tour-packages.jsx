import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery } from "@tanstack/react-query";
import { tourPackagesApi } from "@/lib/api";
import { useI18n } from "@/language/i18n-provider";
import { Clock, Users, Zap, CheckCircle } from "lucide-react";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/tour-packages")({
  head: () => ({ meta: [{ title: "Tour Packages — SafariSmart" }] }),
  component: TourPackagesPage,
});


const CURRENCY_OPTIONS = ["USD", "KES", "EUR"];
const CURRENCY_RATES = {
  USD: 1,
  KES: 130,
  EUR: 0.92,
};

function TourPackagesPage() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [currency, setCurrency] = useState("USD");

  const packagesQuery = useQuery({
    queryKey: ["tour-packages"],
    queryFn: tourPackagesApi.list,
    retry: false,
  });

  const rawPackages = extractList(packagesQuery.data);
  const packages = rawPackages.filter((pkg) =>
    !q ||
    (pkg.name || "").toLowerCase().includes(q.toLowerCase()) ||
    (pkg.description || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-5xl px-6 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <div className="eyebrow">{t("tourPackages.eyebrow", "Curated Journeys")}</div>
            <h1 className="mt-3 font-display text-6xl">{t("tourPackages.title", "Tour Packages")}</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {t("tourPackages.subtitle", "All-inclusive safari, cultural, and adventure packages.")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("tourPackages.searchPlaceholder", "Search packages\u2026")}
              className="w-64 rounded-full border border-border bg-background px-5 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"
            />
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-32 rounded border border-border px-2 py-1 text-sm"
            >
              {CURRENCY_OPTIONS.map(cur => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          </div>
        </div>

        {packagesQuery.isLoading && (
          <p className="mt-12 text-sm text-muted-foreground">{t("tourPackages.loading", "Loading packages\u2026")}</p>
        )}

        {!packagesQuery.isLoading && packages.length === 0 && (
          <p className="mt-12 text-sm text-muted-foreground">{t("tourPackages.empty", "No packages found.")}</p>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} t={t} currency={currency} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function PackageCard({ pkg, t, currency }) {
  const inclusions = Array.isArray(pkg.inclusions)
    ? pkg.inclusions
    : typeof pkg.inclusions === "string"
    ? pkg.inclusions.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Convert price to selected currency
  const price = Number(pkg.price_per_person);
  const priceInCurrency = useMemo(() => {
    if (!price) return "";
    if (!currency || !CURRENCY_RATES[currency]) return price;
    return price * CURRENCY_RATES[currency];
  }, [price, currency]);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition hover:border-[var(--color-gold)]">
      {pkg.image_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img src={pkg.image_url} alt={pkg.name || ""} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl leading-snug">{pkg.name || "Tour Package"}</h3>
        {pkg.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{pkg.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {pkg.duration_days != null && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {pkg.duration_days} {t("tourPackages.days", "days")}
            </span>
          )}
          {pkg.max_group_size != null && (
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {t("tourPackages.groupSize", "Max group")} {pkg.max_group_size}
            </span>
          )}
          {pkg.difficulty_level && (
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              {pkg.difficulty_level}
            </span>
          )}
        </div>

        {inclusions.length > 0 && (
          <ul className="mt-4 space-y-1">
            {inclusions.slice(0, 4).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-gold)]" />
                {item}
              </li>
            ))}
            {inclusions.length > 4 && (
              <li className="text-xs text-muted-foreground">+{inclusions.length - 4} more</li>
            )}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between pt-5">
          {pkg.price_per_person != null && (
            <div>
              <span className="text-xs text-muted-foreground">{t("tourPackages.from", "From")} </span>
              <span className="text-lg font-semibold">{currency} {priceInCurrency.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span className="text-xs text-muted-foreground"> / {t("tourPackages.perPerson", "person")}</span>
              {currency !== "USD" && (
                <span className="ml-2 text-xs text-muted-foreground">(≈ ${price.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD)</span>
              )}
            </div>
          )}
          <button className="rounded-full bg-[var(--color-gold)] px-5 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-110">
            {t("tourPackages.book", "Book Package")}
          </button>
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
