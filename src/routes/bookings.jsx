import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/language/i18n-provider";
import { Calendar, CheckCircle2, Hotel, Bus, Package, MapPin, XCircle, Clock, CreditCard, Smartphone, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "Bookings — SafariSmart" }] }),
  component: BookingsPage,
});

const STATUS_STYLES = {
  pending:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  refunded:  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const TYPE_ICON = {
  hotel:     <Hotel className="h-4 w-4" />,
  tour:      <MapPin className="h-4 w-4" />,
  transport: <Bus className="h-4 w-4" />,
  activity:  <Package className="h-4 w-4" />,
};

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />
      <section className="mx-auto max-w-5xl px-6 pt-12 pb-24">
        <div className="border-b border-border pb-8">
          <div className="eyebrow">{t("bookings.eyebrow")}</div>
          <h1 className="mt-3 font-display text-6xl">{t("bookings.title")}</h1>
        </div>

        {!user && (
          <div className="mt-12 rounded border border-border bg-card p-10 text-center">
            <h3 className="font-display text-3xl">{t("bookings.signInPrompt")}</h3>
            <Link
              to="/login"
              className="mt-6 inline-flex rounded-full bg-[var(--color-ink)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-cream)]"
            >
              {t("common.signIn")}
            </Link>
          </div>
        )}

        {user && q.isLoading && (
          <p className="mt-12 text-muted-foreground">{t("bookings.loading")}</p>
        )}

        {user && !q.isLoading && list.length === 0 && (
          <div className="mt-12 rounded border border-dashed border-border p-10 text-center">
            <h3 className="font-display text-3xl">{t("bookings.emptyTitle")}</h3>
            <p className="mt-3 text-muted-foreground">{t("bookings.emptyBody")}</p>
            <Link
              to="/accommodations"
              className="mt-6 inline-flex rounded-full bg-[var(--color-gold)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-ink)]"
            >
              Browse Accommodations
            </Link>
          </div>
        )}

        {user && list.length > 0 && (
          <div className="mt-10 space-y-6">
            {list.map((b, i) => (
              <BookingCard key={b.id ?? i} booking={b} index={i} />
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function BookingCard({ booking, index }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi.cancel(booking.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setConfirmCancel(false);
      toast.success("Booking cancelled successfully");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to cancel booking. Please try again.");
      setConfirmCancel(false);
    },
  });

  const status = (booking.status || "pending").toLowerCase();
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const canCancel = status !== "cancelled" && status !== "completed" && status !== "refunded";
  const canPay = status === "pending";
  const items = Array.isArray(booking.items) ? booking.items : [];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header row */}
      <div className="flex flex-wrap items-start gap-4 p-6">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
            {TYPE_ICON[booking.type] ?? <Package className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-xl leading-snug truncate">
              {formatBookingTitle(booking, t)}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatBookingDate(booking, t)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="eyebrow text-xs">{t("bookings.total")}</div>
            <div className="font-display text-lg">{formatBookingTotal(booking)}</div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.62rem] uppercase tracking-widest font-medium ${statusStyle}`}
          >
            {status === "confirmed" || status === "completed"
              ? <CheckCircle2 className="h-3 w-3" />
              : status === "cancelled"
              ? <XCircle className="h-3 w-3" />
              : <Clock className="h-3 w-3" />}
            {status}
          </span>
        </div>
      </div>

      {/* Ref row */}
      <div className="border-t border-border px-6 py-3 flex items-center justify-between bg-muted/30">
        <span className="font-mono text-xs text-muted-foreground">
          {formatBookingReference(booking, index)}
        </span>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition"
            >
              {expanded ? "Hide" : "Show"} {items.length} item{items.length !== 1 ? "s" : ""}
            </button>
          )}
          {canPay && (
            <button
              onClick={() => setShowPayment(true)}
              className="flex items-center gap-1.5 rounded-full bg-[var(--color-gold)] px-3 py-1 text-xs uppercase tracking-widest text-[var(--color-ink)] hover:brightness-110 transition"
            >
              <CreditCard className="h-3 w-3" /> Pay Now
            </button>
          )}
          {canCancel && (
            confirmCancel ? (
              <span className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Cancel this booking?</span>
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="text-red-500 hover:underline font-medium"
                >
                  {cancelMutation.isPending ? "Cancelling…" : "Yes, cancel"}
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="text-muted-foreground hover:underline"
                >
                  No
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmCancel(true)}
                className="text-xs text-muted-foreground hover:text-destructive transition"
              >
                Cancel booking
              </button>
            )
          )}
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          booking={booking}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
          }}
        />
      )}

      {/* Items breakdown */}
      {expanded && items.length > 0 && (
        <div className="border-t border-border divide-y divide-border/50">
          {items.map((item, idx) => (
            <div key={item.id ?? idx} className="flex items-start justify-between px-6 py-3 text-sm">
              <div>
                <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium capitalize mr-2">
                  {(item.target_type || "item").replace(/_/g, " ")}
                </span>
                {item.notes && (
                  <span className="text-muted-foreground">{item.notes}</span>
                )}
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="text-xs text-muted-foreground">
                  {item.quantity} × ${item.price_at_booking}
                </div>
                <div className="font-medium">${item.subtotal ?? (item.quantity * item.price_at_booking)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ booking, onClose, onSuccess }) {
  const { user } = useAuth();
  const [method, setMethod] = useState("mpesa");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState("choose"); // choose | pending | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [mpesaRef, setMpesaRef] = useState(null);
  const pollRef = useRef(null);

  const amountKes = booking.total_cost ? Number(booking.total_cost) : 0;
  const amountUsd = Math.max(1, Math.round(amountKes / 130));
  const amountCents = amountUsd * 100;

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function pollStatus(reference) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await bookingsApi.pollMpesaStatus(reference);
        const st = (res?.status || res?.data?.status || "").toLowerCase();
        if (st === "success" || st === "completed") {
          clearInterval(pollRef.current);
          setStep("success");
          toast.success("Payment confirmed! Booking approved.");
          setTimeout(() => onSuccess(), 1500);
        } else if (st === "failed") {
          clearInterval(pollRef.current);
          setStep("error");
          setErrorMsg("Payment was declined. Please try again.");
        }
      } catch {
        // keep polling
      }
    }, 3000);
    // Stop polling after 3 minutes
    setTimeout(() => {
      clearInterval(pollRef.current);
      if (step === "pending") {
        setStep("error");
        setErrorMsg("Payment timed out. Please check your M-Pesa messages and try again.");
      }
    }, 180000);
  }

  async function handleMpesa(e) {
    e.preventDefault();
    if (!phone.trim()) { toast.error("Enter your M-Pesa phone number"); return; }
    setPaying(true);
    setErrorMsg("");
    try {
      const res = await bookingsApi.payMpesa(booking.id, {
        phone_number: phone.trim(),
        amount: amountKes || 100,
        user_id: user?.id,
      });
      const ref = res?.reference || res?.data?.reference;
      const isMock = res?.mock || res?.data?.mock;
      setMpesaRef(ref);
      if (isMock) {
        setStep("success");
        toast.success("Payment confirmed (dev mode)! Booking approved.");
        setTimeout(() => onSuccess(), 1500);
      } else {
        setStep("pending");
        toast.info("STK Push sent — check your phone to approve payment.");
        if (ref) pollStatus(ref);
      }
    } catch (err) {
      setStep("error");
      setErrorMsg(err?.message || "Payment initiation failed. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  async function handleStripe(e) {
    e.preventDefault();
    setPaying(true);
    setErrorMsg("");
    try {
      const res = await bookingsApi.payStripe(booking.id, {
        amount: amountCents,
        currency: "usd",
        user_id: user?.id,
      });
      const clientSecret = res?.clientSecret || res?.data?.clientSecret;
      // In dev (mock), the booking is auto-confirmed server-side.
      // In prod with real Stripe, redirect to Stripe checkout or use Stripe.js.
      if (clientSecret?.includes("_secret_mock")) {
        setStep("success");
        toast.success("Payment confirmed (dev mode)! Booking approved.");
        setTimeout(() => onSuccess(), 1500);
      } else {
        // Real Stripe: inform user to complete payment via Stripe.
        setStep("success");
        toast.success("Payment initiated. Your booking will be confirmed once payment is processed.");
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      setStep("error");
      setErrorMsg(err?.message || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl">Pay for Booking</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted text-muted-foreground">✕</button>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Booking</span>
            <span className="font-mono text-xs">{booking.reference_number || booking.id?.slice(0, 8)}</span>
          </div>
          <div className="mt-1 flex justify-between font-semibold">
            <span>Amount Due</span>
            <span>KES {amountKes > 0 ? amountKes.toLocaleString() : "—"}</span>
          </div>
        </div>

        {step === "choose" && (
          <>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setMethod("mpesa")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm transition ${method === "mpesa" ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 font-medium" : "border-border hover:border-[var(--color-gold)]/50"}`}
              >
                <Smartphone className="h-4 w-4" /> M-Pesa
              </button>
              <button
                onClick={() => setMethod("stripe")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm transition ${method === "stripe" ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 font-medium" : "border-border hover:border-[var(--color-gold)]/50"}`}
              >
                <CreditCard className="h-4 w-4" /> Card (Stripe)
              </button>
            </div>

            {method === "mpesa" && (
              <form onSubmit={handleMpesa} className="space-y-4">
                <div>
                  <label className="eyebrow mb-1 block text-xs">M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0712345678 or 254712345678"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">An STK Push will be sent to this number.</p>
                </div>
                <button
                  type="submit"
                  disabled={paying}
                  className="w-full rounded-full bg-[var(--color-gold)] py-2.5 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paying ? <><Loader2 className="h-4 w-4 animate-spin" /> Initiating…</> : "Pay with M-Pesa"}
                </button>
              </form>
            )}

            {method === "stripe" && (
              <form onSubmit={handleStripe} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You will be charged <strong>${amountUsd} USD</strong> via Stripe.
                  {amountKes > 0 && ` (≈ KES ${amountKes.toLocaleString()})`}
                </p>
                <button
                  type="submit"
                  disabled={paying}
                  className="w-full rounded-full bg-[var(--color-ink)] py-2.5 text-xs uppercase tracking-widest text-[var(--color-cream)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paying ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : "Pay with Card"}
                </button>
              </form>
            )}
          </>
        )}

        {step === "pending" && (
          <div className="py-6 text-center space-y-3">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[var(--color-gold)]" />
            <p className="font-display text-xl">Waiting for Payment</p>
            <p className="text-sm text-muted-foreground">Check your phone and approve the M-Pesa request. This page will update automatically.</p>
            {mpesaRef && <p className="font-mono text-xs text-muted-foreground">Ref: {mpesaRef}</p>}
          </div>
        )}

        {step === "success" && (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
            <p className="font-display text-xl">Payment Confirmed!</p>
            <p className="text-sm text-muted-foreground">Your booking has been approved.</p>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4">
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMsg}
            </div>
            <button
              onClick={() => { setStep("choose"); setErrorMsg(""); }}
              className="w-full rounded-full border border-border py-2.5 text-xs uppercase tracking-widest hover:bg-muted"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function arrayify(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.items)) return v.items;
  if (Array.isArray(v.data)) return v.data;
  if (v.data && Array.isArray(v.data.data)) return v.data.data;
  if (Array.isArray(v.bookings)) return v.bookings;
  return [];
}

function formatBookingReference(booking, index) {
  if (booking.reference_number) return booking.reference_number;
  return `#${String(booking.id ?? index).slice(0, 8).toUpperCase()}`;
}

function formatBookingTitle(booking, t) {
  if (booking.title || booking.destination_name)
    return booking.title || booking.destination_name;
  const items = Array.isArray(booking.items) ? booking.items : [];
  if (items.length > 0) {
    const firstItem = items[0];
    const targetType = firstItem?.target_type;
    const notes = firstItem?.notes;
    if (notes) return notes.split("—")[0].trim() || notes;
    if (targetType === "accommodation") return "Accommodation Stay";
    if (targetType === "tour_package") return "Tour Package";
    if (targetType === "transport") return "Transport Booking";
    if (targetType === "attraction") return "Attraction Visit";
    if (targetType) return `${String(targetType).replace(/_/g, " ")} booking`;
  }
  if (booking.type) {
    const typeLabels = { hotel: "Hotel Stay", tour: "Tour Package", transport: "Transport", activity: "Activity" };
    return typeLabels[booking.type] || `${String(booking.type).replace(/_/g, " ")} booking`;
  }
  return t("bookings.defaultExpedition");
}

function formatBookingDate(booking, t) {
  const dateValue = booking.start_date || booking.created_at;
  if (!dateValue) return t("bookings.tbd");
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatBookingTotal(booking) {
  const total = booking.total_cost ?? booking.total ?? booking.amount;
  if (total === null || total === undefined || total === "") return "—";
  return `$${Number(total).toFixed(2)}`;
}
