import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/language/i18n-provider";
import { Calendar, CheckCircle2 } from "lucide-react";
export const Route = createFileRoute("/bookings")({
    head: () => ({ meta: [{ title: "Bookings — SafariSmart" }] }),
    component: BookingsPage,
});
function BookingsPage() {
    const { user } = useAuth();
  const { t } = useI18n();
    const q = useQuery({
        queryKey: ["bookings"],
        queryFn: bookingsApi.list,
        enabled: !!user,
        retry: false,
    });
    const list = arrayify(q.data);
    return (<div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20"/>
      <section className="mx-auto max-w-6xl px-6 pt-12">
        <div className="border-b border-border pb-8">
          <div className="eyebrow">{t("bookings.eyebrow")}</div>
          <h1 className="mt-3 font-display text-6xl">{t("bookings.title")}</h1>
        </div>

        {!user && (<div className="mt-12 rounded border border-border bg-card p-10 text-center">
            <h3 className="font-display text-3xl">{t("bookings.signInPrompt")}</h3>
            <Link to="/login" className="mt-6 inline-flex rounded-full bg-[var(--color-ink)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-cream)]">
              {t("common.signIn")}
            </Link>
          </div>)}

        {user && q.isLoading && <p className="mt-12 text-muted-foreground">{t("bookings.loading")}</p>}

        {user && !q.isLoading && list.length === 0 && (<div className="mt-12 rounded border border-dashed border-border p-10 text-center">
            <h3 className="font-display text-3xl">{t("bookings.emptyTitle")}</h3>
            <p className="mt-3 text-muted-foreground">{t("bookings.emptyBody")}</p>
            <Link to="/explore" className="mt-6 inline-flex rounded-full bg-[var(--color-gold)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-ink)]">
              {t("bookings.emptyCta")}
            </Link>
          </div>)}

        {user && list.length > 0 && (<div className="mt-10 divide-y divide-border">
            {list.map((b, i) => (<div key={b.id ?? i} className="grid grid-cols-12 gap-6 py-8">
                <div className="col-span-2">
                  <div className="eyebrow">{t("bookings.ref")}</div>
                  <div className="font-mono text-sm">{formatBookingReference(b, i)}</div>
                </div>
                <div className="col-span-6">
                  <h3 className="font-display text-2xl">{formatBookingTitle(b, t)}</h3>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3"/> {formatBookingDate(b, t)}
                  </p>
                </div>
                <div className="col-span-2">
                  <div className="eyebrow">{t("bookings.total")}</div>
                  <div className="font-display text-lg">{formatBookingTotal(b)}</div>
                </div>
                <div className="col-span-2 text-right">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-3 py-1 text-[0.62rem] uppercase tracking-widest text-[var(--color-cream)]">
                    <CheckCircle2 className="h-3 w-3"/> {formatBookingStatus(b, t)}
                  </span>
                </div>
              </div>))}
          </div>)}
      </section>
      <SiteFooter />
    </div>);
}
function arrayify(v) {
    if (!v)
        return [];
    if (Array.isArray(v))
        return v;
    if (Array.isArray(v.items))
        return v.items;
    if (Array.isArray(v.data))
        return v.data;
  if (v.data && Array.isArray(v.data.data))
    return v.data.data;
    if (Array.isArray(v.bookings))
        return v.bookings;
    return [];
}
function formatBookingReference(booking, index) {
  if (booking.reference_number)
    return booking.reference_number;
  return `#${String(booking.id ?? index).slice(0, 8).toUpperCase()}`;
}
function formatBookingTitle(booking, t) {
  if (booking.title || booking.destination_name)
    return booking.title || booking.destination_name;
  if (Array.isArray(booking.items) && booking.items.length > 0) {
    const firstType = booking.items[0]?.target_type;
    if (firstType) {
      return `${String(firstType).replace(/_/g, " ")} booking`;
    }
  }
  if (booking.type) {
    return `${String(booking.type).replace(/_/g, " ")} booking`;
  }
  return t("bookings.defaultExpedition");
}
function formatBookingDate(booking, t) {
  const dateValue = booking.start_date || booking.created_at;
  if (!dateValue)
    return t("bookings.tbd");
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime()))
    return String(dateValue);
  return date.toLocaleDateString();
}
function formatBookingTotal(booking) {
  const total = booking.total_cost ?? booking.total ?? booking.amount;
  if (total === null || total === undefined || total === "")
    return "—";
  return `$${total}`;
}
function formatBookingStatus(booking, t) {
  if (!booking.status)
    return t("bookings.confirmed");
  return String(booking.status).replace(/_/g, " ");
}
