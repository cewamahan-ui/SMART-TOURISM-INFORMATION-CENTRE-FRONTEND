import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { publicApi, bookingsApi } from "@/lib/api";
import { useI18n } from "@/language/i18n-provider";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { MapPin, Users, Wifi, Utensils, Heart, CalendarDays, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import lodge from "@/assets/attractions_images/lodge.jpg";
import tent from "@/assets/attractions_images/tent.jpg";
import migration from "@/assets/attractions_images/migration.jpg";

export const Route = createFileRoute("/accommodations")({
  head: () => ({ meta: [{ title: "Accommodations — SafariSmart" }] }),
  component: AccommodationsPage,
});

const FALLBACK_IMAGES = [lodge, tent, migration];
const FALLBACK_ACCOMMODATIONS = [
  {
    id: "fallback-1",
    name: "Tsavo Savannah Resort",
    location: "Tsavo East",
    price_per_night: 1250,
    rating: 4.8,
    reviews: 342,
    amenities: ["WiFi", "Restaurant", "Pool", "Spa"],
    image: lodge,
    rooms: [],
    room_count: 25,
  },
  {
    id: "fallback-2",
    name: "Mara River Camp",
    location: "Maasai Mara",
    price_per_night: 980,
    rating: 4.6,
    reviews: 218,
    amenities: ["WiFi", "Restaurant", "Bar"],
    image: tent,
    rooms: [],
    room_count: 18,
  },
  {
    id: "fallback-3",
    name: "Lake Nakuru Eco Lodge",
    location: "Lake Nakuru National Park",
    price_per_night: 720,
    rating: 4.7,
    reviews: 156,
    amenities: ["Restaurant", "Campfire"],
    image: migration,
    rooms: [],
    room_count: 12,
  },
];

function today() {
  return new Date().toISOString().split("T")[0];
}
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
function nightsBetween(from, to) {
  const diff = (new Date(to) - new Date(from)) / 86400000;
  return Math.max(1, Math.round(diff));
}

function AccommodationsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingTarget, setBookingTarget] = useState(null);

  const accommodationsQuery = useQuery({
    queryKey: ["accommodations"],
    queryFn: publicApi.accommodations,
    retry: false,
  });

  const rawAccommodations = arrayify(accommodationsQuery.data);
  const accommodations =
    rawAccommodations.length > 0 ? rawAccommodations : FALLBACK_ACCOMMODATIONS;

  const filtered = accommodations
    .filter((a) =>
      (a.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((a) => {
      const price = a.price_per_night ?? a.min_price;
      if (tab === "budget") return price != null && price < 200;
      if (tab === "luxury") return price != null && price >= 500;
      return true;
    });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-6xl px-6 pt-12">
        <div className="border-b border-border pb-8">
          <div className="eyebrow">{t("accommodations.eyebrow")}</div>
          <h1 className="mt-3 font-display text-6xl">{t("accommodations.title")}</h1>
          <p className="mt-3 text-muted-foreground">
            {t("accommodations.subtitle")}
          </p>
        </div>

        {/* Search */}
        <div className="mt-8 flex items-center gap-2 border-b border-border pb-3">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("accommodations.searchPlaceholder")}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {/* Price Filter */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-4">
          {["all", "budget", "luxury"].map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={
                "rounded-full px-4 py-2 text-xs uppercase tracking-widest transition " +
                (tab === tabKey
                  ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {tabKey === "all"
                ? t("accommodations.tabs.all")
                : tabKey === "budget"
                  ? t("accommodations.tabs.budget")
                  : t("accommodations.tabs.luxury")}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {accommodationsQuery.isLoading && (
            <p className="text-muted-foreground">{t("accommodations.loading")}</p>
          )}
          {filtered.map((acc, idx) => (
            <AccommodationCard
              key={acc.id ?? idx}
              accommodation={acc}
              idx={idx}
              onBook={() => setBookingTarget(acc)}
            />
          ))}
        </div>
      </section>

      {bookingTarget && (
        <BookingModal
          accommodation={bookingTarget}
          onClose={() => setBookingTarget(null)}
        />
      )}

      <SiteFooter />
    </div>
  );
}

function AccommodationCard({ accommodation, idx, onBook }) {
  const { t } = useI18n();
  const img =
    accommodation.image_url ||
    accommodation.image ||
    FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];

  const amenities = accommodation.amenities || [];
  const amenityIcons = {
    WiFi: <Wifi className="h-4 w-4" />,
    Restaurant: <Utensils className="h-4 w-4" />,
    Pool: "🏊",
    Spa: "🧖",
    Bar: "🍷",
  };

  return (
    <article className="group rounded-lg border border-border overflow-hidden bg-card">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={img}
          alt={accommodation.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
        />
        <button className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[var(--color-cream)]/90 text-[var(--color-ink)] transition hover:bg-[var(--color-gold)]">
          <Heart className="h-4 w-4" />
        </button>
        {accommodation.rating && (
          <div className="absolute left-4 top-4 rounded-full bg-[var(--color-cream)]/90 px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
            ★ {accommodation.rating}
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="font-display text-xl leading-snug">{accommodation.name}</h3>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {accommodation.location}
        </div>

        {(accommodation.room_count ?? accommodation.rooms?.length) ? (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {accommodation.room_count ?? accommodation.rooms?.length}{" "}
            {t("accommodations.roomsAvailable")}
          </div>
        ) : null}

        {accommodation.reviews && (
          <p className="mt-2 text-xs text-muted-foreground">
            {accommodation.reviews} {t("accommodations.guestReviews")}
          </p>
        )}

        {amenities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {amenities.slice(0, 3).map((amenity, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
              >
                {amenityIcons[amenity] || amenity}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                +{amenities.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          {(accommodation.price_per_night ?? accommodation.min_price) != null && (
            <div>
              <div className="eyebrow">{t("accommodations.from")}</div>
              <div className="font-display text-lg">
                ${accommodation.price_per_night ?? accommodation.min_price}
              </div>
              <p className="text-xs text-muted-foreground">{t("accommodations.perNight")}</p>
            </div>
          )}
          <button
            onClick={onBook}
            className="rounded-full bg-[var(--color-gold)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-110"
          >
            {t("accommodations.book")}
          </button>
        </div>
      </div>
    </article>
  );
}

function BookingModal({ accommodation, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const rooms = Array.isArray(accommodation.rooms) ? accommodation.rooms : [];
  const defaultRoom = rooms[0] ?? null;

  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(addDays(today(), 2));
  const [selectedRoom, setSelectedRoom] = useState(defaultRoom?.id ?? "");
  const [bookingResult, setBookingResult] = useState(null);

  const nights = nightsBetween(checkIn, checkOut);
  const roomObj = rooms.find((r) => r.id === selectedRoom) ?? defaultRoom;
  const pricePerNight = roomObj?.base_price ?? accommodation.price_per_night ?? 0;
  const total = pricePerNight * nights;

  const mutation = useMutation({
    mutationFn: (payload) => bookingsApi.create(payload),
    onSuccess: (data) => {
      setBookingResult({ ok: true, data });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => {
      setBookingResult({ ok: false, message: err?.message || "Booking failed. Please try again." });
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;
    const payload = {
      type: "hotel",
      items: [
        {
          target_type: "accommodation",
          target_id: accommodation.id,
          quantity: nights,
          notes: roomObj
            ? `${roomObj.name} — ${nights} night(s), check-in ${checkIn}`
            : `${nights} night(s), check-in ${checkIn}`,
        },
      ],
    };
    mutation.mutate(payload);
  }

  const isOpen = true;

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{accommodation.name}</DialogTitle>
          {accommodation.location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {accommodation.location}
            </p>
          )}
        </DialogHeader>

        {!user ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">Sign in to book this accommodation.</p>
            <Link
              to="/login"
              className="mt-4 inline-flex rounded-full bg-[var(--color-ink)] px-6 py-2 text-xs uppercase tracking-widest text-[var(--color-cream)]"
              onClick={onClose}
            >
              Sign In
            </Link>
          </div>
        ) : bookingResult?.ok ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
            <p className="font-display text-xl">Booking Created!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Reference: <span className="font-mono">{bookingResult.data?.reference_number ?? "—"}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Total: <strong>KES {(total * 130).toLocaleString()}</strong> for {nights} night{nights !== 1 ? "s" : ""}
            </p>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-700/30 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
              Your booking is <strong>pending</strong> — complete payment to confirm it.
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/bookings"
                className="rounded-full bg-[var(--color-gold)] px-5 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)]"
                onClick={onClose}
              >
                Pay Now
              </Link>
              <button
                onClick={onClose}
                className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-widest"
              >
                Pay Later
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {bookingResult?.ok === false && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {bookingResult.message}
              </div>
            )}

            {/* Room type selector */}
            {rooms.length > 0 && (
              <div>
                <label className="eyebrow mb-1 block text-xs">Room Type</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — ${r.base_price}/night
                      {r.capacity ? ` (up to ${r.capacity} guests)` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="eyebrow mb-1 block text-xs">Check-in</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={checkIn}
                    min={today()}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (e.target.value >= checkOut)
                        setCheckOut(addDays(e.target.value, 1));
                    }}
                    className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="eyebrow mb-1 block text-xs">Check-out</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={checkOut}
                    min={addDays(checkIn, 1)}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{nights} night{nights !== 1 ? "s" : ""}</span>
                <span>${pricePerNight} / night</span>
              </div>
              <div className="mt-1 flex justify-between font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-widest transition hover:bg-muted"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-full bg-[var(--color-gold)] px-6 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-110 disabled:opacity-50"
              >
                {mutation.isPending ? "Booking…" : "Confirm Booking"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function arrayify(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.items)) return v.items;
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.accommodations)) return v.accommodations;
  return [];
}
