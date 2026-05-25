import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery } from "@tanstack/react-query";
import { tourPackagesApi, bookingsApi } from "@/lib/api";
import { useI18n } from "@/language/i18n-provider";
import { useAuth } from "@/lib/auth-context";
import { Clock, Users, Zap, CheckCircle, X, CreditCard } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { CURRENCIES, CURRENCY_OPTIONS, CURRENCY_RATES } from "@/lib/currencies";

export const Route = createFileRoute("/tour-packages")({
  head: () => ({ meta: [{ title: "Tour Packages — SafariSmart" }] }),
  component: TourPackagesPage,
});

function TourPackagesPage() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [bookingPkg, setBookingPkg] = useState(null);

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
                <option key={cur} value={cur}>{CURRENCIES[cur].flag} {cur} — {CURRENCIES[cur].name}</option>
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
            <PackageCard key={pkg.id} pkg={pkg} t={t} currency={currency} onBook={() => setBookingPkg(pkg)} />
          ))}
        </div>
      </section>

      <SiteFooter />

      {bookingPkg && (
        <BookingModal pkg={bookingPkg} currency={currency} onClose={() => setBookingPkg(null)} />
      )}
    </div>
  );
}

function PackageCard({ pkg, t, currency, onBook }) {
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
          <button onClick={onBook}
            className="rounded-full bg-[var(--color-gold)] px-5 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-110">
            {t("tourPackages.book", "Book Package")}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingModal({ pkg, currency, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const priceUsd = Number(pkg.price_per_person || pkg.price || 0);
  const rate = CURRENCY_RATES[currency] || 1;
  const totalDisplay = (priceUsd * rate * participants).toLocaleString(undefined, { maximumFractionDigits: 0 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setSubmitting(true);
    try {
      await bookingsApi.createTour({
        package_id: pkg.id,
        participants: Number(participants),
        notes: notes.trim() || undefined,
      });
      toast.success("Booking created! Proceed to payment in My Bookings.");
      onClose();
      navigate({ to: "/bookings" });
    } catch (err) {
      toast.error(err?.message || "Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl leading-tight">{pkg.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground uppercase tracking-widest">
              {pkg.duration_days ? `${pkg.duration_days} days · ` : ""}
              {currency} {(priceUsd * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })} / person
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted ml-4 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!user && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You must be signed in to book a tour. You'll be redirected to login.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Number of Participants
            </label>
            <input
              type="number"
              min={1}
              max={pkg.max_group_size || pkg.max_participants || 20}
              value={participants}
              onChange={(e) => setParticipants(Math.max(1, Number(e.target.value)))}
              className="input-base w-32"
              required
            />
            {pkg.max_group_size && (
              <p className="mt-1 text-xs text-muted-foreground">Max {pkg.max_group_size} per booking</p>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Special Requests / Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-base resize-none w-full"
              placeholder="Dietary requirements, accessibility needs, preferred activities…"
            />
          </div>

          {/* Total */}
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Estimated Total</span>
            <span className="font-display text-xl">{currency} {totalDisplay}</span>
          </div>

          <p className="text-xs text-muted-foreground">
            A booking will be created in <strong>pending</strong> status. You can complete payment on the <strong>My Bookings</strong> page using M-Pesa or card.
          </p>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-gold)] px-5 py-2.5 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:opacity-60 hover:brightness-110 transition"
            >
              <CreditCard className="h-3.5 w-3.5" />
              {submitting ? "Creating booking…" : user ? "Confirm & Book" : "Sign in to Book"}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-full border border-border px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-muted">
              Cancel
            </button>
          </div>
        </form>
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
