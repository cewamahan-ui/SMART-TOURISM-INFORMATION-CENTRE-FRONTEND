import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi, paymentsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/language/i18n-provider";
import { Calendar, CheckCircle2, Hotel, Bus, Package, MapPin, XCircle, Clock, CreditCard, Smartphone, X, Loader2 } from "lucide-react";
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
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold)] px-3 py-1 text-xs uppercase tracking-widest text-[var(--color-ink)] font-medium transition hover:brightness-95"
            >
              <CreditCard className="h-3 w-3" />
              Pay Now
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

      {showPayment && (
        <PaymentModal
          booking={booking}
          onClose={() => setShowPayment(false)}
          onPaid={() => {
            setShowPayment(false);
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
          }}
        />
      )}
    </div>
  );
}

// ── Payment Modal ──────────────────────────────────────────────────────────

function PaymentModal({ booking, onClose, onPaid }) {
  const { user } = useAuth();
  const [method, setMethod] = useState("mpesa");

  const amount = booking.total_cost ?? booking.total ?? booking.amount ?? 0;
  const title = booking.title || booking.destination_name || "Booking";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-xl text-foreground">Complete Payment</h2>
            <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-[240px]">{title}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Amount */}
        <div className="border-b border-border bg-muted/30 px-6 py-3 flex items-baseline gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Total Due</span>
          <span className="font-display text-2xl text-foreground ml-auto">${Number(amount).toFixed(2)}</span>
        </div>

        {/* Method tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setMethod("mpesa")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-widest font-medium transition border-b-2 ${
              method === "mpesa"
                ? "border-[var(--color-gold)] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            M-Pesa
          </button>
          <button
            onClick={() => setMethod("stripe")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-widest font-medium transition border-b-2 ${
              method === "stripe"
                ? "border-[var(--color-gold)] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Card
          </button>
        </div>

        {/* Panel */}
        <div className="p-6">
          {method === "mpesa" ? (
            <MpesaPanel booking={booking} amount={amount} user={user} onPaid={onPaid} />
          ) : (
            <StripePanel booking={booking} amount={amount} user={user} onPaid={onPaid} />
          )}
        </div>
      </div>
    </div>
  );
}

function MpesaPanel({ booking, amount, user, onPaid }) {
  const [phone, setPhone] = useState(user?.phone || "");
  const [stage, setStage] = useState("form"); // form | pending | success | failed
  const [reference, setReference] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const startPolling = (ref) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const result = await paymentsApi.mpesa.getStatus(ref);
        const s = result?.status ?? result?.data?.status;
        if (s === "success" || s === "succeeded" || s === "completed") {
          clearInterval(pollRef.current);
          setStage("success");
          toast.success("Payment successful! Your booking is confirmed.");
          setTimeout(onPaid, 1500);
        } else if (s === "failed") {
          clearInterval(pollRef.current);
          setStage("failed");
          setStatusMsg("Payment was not completed. Please try again.");
        }
      } catch {
        // keep polling
      }
      if (attempts >= 20) {
        clearInterval(pollRef.current);
        setStage("failed");
        setStatusMsg("Payment timed out. Check your M-Pesa messages and try again.");
      }
    }, 3000);
  };

  const handlePay = async () => {
    const raw = phone.trim().replace(/\s+/g, "");
    if (!raw) { toast.error("Enter your M-Pesa phone number"); return; }

    // Normalise to 254XXXXXXXXX
    let normalised = raw.startsWith("+") ? raw.slice(1) : raw;
    if (normalised.startsWith("0")) normalised = "254" + normalised.slice(1);
    if (!/^254[17]\d{8}$/.test(normalised)) {
      toast.error("Enter a valid Kenyan phone number (e.g. 0712 345 678)");
      return;
    }

    setStage("pending");
    try {
      const result = await paymentsApi.mpesa.pay({
        phone_number: normalised,
        amount: Number(amount),
        booking_id: booking.id,
      });
      const ref = result?.reference ?? result?.data?.reference;
      const isMock = result?.mock ?? result?.data?.mock;
      setReference(ref);

      if (isMock) {
        setStage("success");
        toast.success("Payment accepted (dev mode). Booking confirmed.");
        setTimeout(onPaid, 1500);
      } else {
        setStatusMsg("Check your phone for the M-Pesa STK prompt and enter your PIN.");
        startPolling(ref);
      }
    } catch (err) {
      setStage("form");
      toast.error(err?.message || "Failed to initiate M-Pesa payment");
    }
  };

  if (stage === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <p className="font-display text-xl text-foreground">Payment Successful</p>
        <p className="text-sm text-muted-foreground">Your booking has been confirmed.</p>
      </div>
    );
  }

  if (stage === "failed") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="font-display text-xl text-foreground">Payment Failed</p>
        <p className="text-sm text-muted-foreground">{statusMsg}</p>
        <button onClick={() => setStage("form")} className="mt-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest hover:bg-muted transition">
          Try Again
        </button>
      </div>
    );
  }

  if (stage === "pending") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--color-gold)]" />
        <p className="font-display text-lg text-foreground">Waiting for M-Pesa…</p>
        <p className="text-sm text-muted-foreground">{statusMsg || "Processing your payment."}</p>
        {reference && (
          <p className="font-mono text-xs text-muted-foreground">Ref: {reference}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        An STK push will be sent to your Safaricom number. Enter your M-Pesa PIN when prompted.
      </p>
      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">M-Pesa Phone Number</span>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <span className="text-sm text-muted-foreground select-none">🇰🇪</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712 345 678"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </label>
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Amount (KES)</span>
        <span className="font-display text-lg text-foreground">{Number(amount).toLocaleString()}</span>
      </div>
      <button
        onClick={handlePay}
        className="w-full rounded-full bg-[var(--color-gold)] py-3 text-xs uppercase tracking-widest font-medium text-[var(--color-ink)] transition hover:brightness-95"
      >
        Pay with M-Pesa
      </button>
    </div>
  );
}

function StripePanel({ booking, amount, user, onPaid }) {
  const [stage, setStage] = useState("form"); // form | pending | success | failed
  const [intentId, setIntentId] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  const handlePay = async () => {
    setStage("pending");
    try {
      const result = await paymentsApi.stripe.createIntent({
        amount: Math.round(Number(amount) * 100), // cents
        currency: "usd",
        metadata: { booking_id: booking.id },
      });
      const id = result?.paymentIntentId ?? result?.data?.paymentIntentId;
      setIntentId(id);
      setStage("success");
      toast.success("Payment intent created. Complete payment via your card processor.");
      setTimeout(onPaid, 2000);
    } catch (err) {
      setStage("failed");
      setErrMsg(err?.message || "Failed to initiate card payment.");
    }
  };

  if (stage === "pending") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--color-gold)]" />
        <p className="text-sm text-muted-foreground">Creating payment intent…</p>
      </div>
    );
  }

  if (stage === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <p className="font-display text-xl text-foreground">Payment Initiated</p>
        <p className="text-sm text-muted-foreground">Your card payment has been initiated and is being processed.</p>
        {intentId && <p className="font-mono text-xs text-muted-foreground">Intent: {intentId}</p>}
      </div>
    );
  }

  if (stage === "failed") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="font-display text-xl text-foreground">Payment Failed</p>
        <p className="text-sm text-muted-foreground">{errMsg}</p>
        <button onClick={() => setStage("form")} className="mt-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest hover:bg-muted transition">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pay securely with your Visa, Mastercard, or American Express card.
      </p>
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Total (USD)</span>
        <span className="font-display text-lg text-foreground">${Number(amount).toFixed(2)}</span>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
        <CreditCard className="h-4 w-4 shrink-0" />
        Card details are processed securely via Stripe
      </div>
      <button
        onClick={handlePay}
        className="w-full rounded-full bg-foreground py-3 text-xs uppercase tracking-widest font-medium text-background transition hover:opacity-90"
      >
        Pay ${Number(amount).toFixed(2)} with Card
      </button>
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
