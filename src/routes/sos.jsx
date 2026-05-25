import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Phone, MapPin, ShieldAlert, Radio, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getToken, publicApi } from "@/lib/api";

const SOS_CATEGORIES = [
  { value: "medical",           label: "Medical Emergency",    emoji: "🏥" },
  { value: "wildlife",          label: "Wildlife Encounter",   emoji: "🦁" },
  { value: "lost",              label: "Lost / Stranded",      emoji: "🗺️" },
  { value: "vehicle_breakdown", label: "Vehicle Breakdown",    emoji: "🚗" },
  { value: "weather",           label: "Severe Weather",       emoji: "⛈️" },
  { value: "crime",             label: "Crime / Security",     emoji: "🚨" },
  { value: "other",             label: "Other Emergency",      emoji: "⚠️" },
];

export const Route = createFileRoute("/sos")({
  head: () => ({ meta: [{ title: "Emergency Response — SafariSmart" }] }),
  component: SosPage,
});

function SosPage() {
  const [triggered, setTriggered] = useState(false);
  const [sending, setSending] = useState(false);
  const [coords, setCoords] = useState(null);
  const [coordsError, setCoordsError] = useState("");
  const [category, setCategory] = useState("medical");
  const holdTimer = useRef(null);

  const contactsQuery = useQuery({
    queryKey: ["emergency-contacts"],
    queryFn: publicApi.emergencyContacts,
    retry: false,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setCoordsError("Geolocation not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoordsError("Could not determine your location. Enable location access and reload."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const dispatchSOS = async () => {
    if (triggered || sending) return;

    const token = getToken();
    if (!token) {
      toast.error("You must be logged in to send an SOS alert.");
      return;
    }

    if (!coords) {
      toast.error(coordsError || "Waiting for GPS fix — try again in a moment.");
      return;
    }

    setSending(true);
    try {
      await api("/api/v1/sos", {
        method: "POST",
        json: { lat: coords.lat, lng: coords.lng, severity: "high", category },
      });
      setTriggered(true);
      toast.success("Signal sent · Unit Alpha-01 dispatched", { duration: 6000 });
    } catch (err) {
      toast.error(err?.message || "Failed to send SOS. Try calling directly.");
    } finally {
      setSending(false);
    }
  };

  const handleMouseDown = () => {
    holdTimer.current = setTimeout(dispatchSOS, 1500);
  };

  const handleMouseUp = () => {
    clearTimeout(holdTimer.current);
  };

  const coordLabel = coords
    ? `${Math.abs(coords.lat).toFixed(4)}° ${coords.lat < 0 ? "S" : "N"} · ${Math.abs(coords.lng).toFixed(4)}° ${coords.lng < 0 ? "W" : "E"}`
    : coordsError || "Acquiring GPS…";

  return (
    <div className="min-h-screen bg-[oklch(0.18_0.02_30)] text-[var(--color-cream)]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="eyebrow !text-white/70">← SafariSmart</Link>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-destructive">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> Live channel
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="eyebrow !text-white/60">Kenya Emergency Operations</div>
        <h1 className="mt-3 font-display text-7xl leading-[0.95]">
          SOS<br /><span className="italic text-destructive">Emergency</span>
        </h1>
        <p className="mt-4 max-w-xl text-white/70">
          A confirmed emergency alert dispatches the nearest field unit, notifies your guide,
          and shares your live coordinates with the Kenya Operations Hub.
        </p>
        <p className="mt-2 text-xs text-white/40 uppercase tracking-widest">
          Hold button for 1.5 seconds to confirm dispatch
        </p>

        {/* Category selector */}
        <div className="mt-10">
          <p className="mb-3 text-xs uppercase tracking-widest text-white/50">Type of Emergency</p>
          <div className="flex flex-wrap gap-2">
            {SOS_CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                disabled={triggered || sending}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition disabled:opacity-40 ${
                  category === c.value
                    ? "border-destructive bg-destructive/20 text-[var(--color-cream)]"
                    : "border-white/20 text-white/60 hover:border-white/40 hover:text-white/80"
                }`}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <button
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              disabled={sending || triggered}
              className="group relative grid aspect-square w-full max-w-md place-items-center rounded-full border-4 border-destructive/40 bg-destructive/10 transition hover:border-destructive disabled:opacity-70"
            >
              <span className="absolute inset-6 rounded-full bg-destructive/20 transition group-hover:bg-destructive/30" />
              <span className="absolute inset-12 rounded-full bg-destructive transition group-active:scale-95" />
              <span className="relative font-display text-5xl tracking-widest text-[var(--color-cream)]">
                {triggered ? "SENT" : sending ? "..." : "HOLD"}
              </span>
            </button>
            <p className="mt-4 text-xs uppercase tracking-widest text-white/50">
              Press and hold to confirm
            </p>
          </div>

          <div className="md:col-span-5 space-y-4">
            <Tile icon={MapPin} label="Your Coordinates" value={coordLabel} />

            {contactsQuery.isLoading && (
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading emergency contacts…
              </div>
            )}

            {arrayifyContacts(contactsQuery.data).length > 0
              ? arrayifyContacts(contactsQuery.data).slice(0, 4).map((contact, idx) => (
                  <Tile
                    key={contact.id ?? idx}
                    icon={contact.type === "police" ? ShieldAlert : contact.type === "medical" ? AlertTriangle : Phone}
                    label={contact.name || contact.title || contact.type || "Emergency Contact"}
                    value={contact.phone || contact.phone_number || contact.contact || "—"}
                    href={contact.phone ? `tel:${contact.phone}` : undefined}
                  />
                ))
              : !contactsQuery.isLoading && (
                  <>
                    <Tile icon={Phone} label="Kenya Emergency" value="999 / 112" href="tel:999" />
                    <Tile icon={ShieldAlert} label="Kenya Police" value="+254 20 341 4020" href="tel:+254203414020" />
                    <Tile icon={AlertTriangle} label="Ambulance (AMREF)" value="+254 20 600 2299" href="tel:+254206002299" />
                  </>
                )
            }
          </div>
        </div>
      </section>
    </div>
  );
}

function Tile({ icon: Icon, label, value, href }) {
  const inner = (
    <>
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-gold)]" />
      <div className="min-w-0">
        <div className="eyebrow !text-white/50">{label}</div>
        <div className="mt-1 font-display text-xl truncate">{value}</div>
      </div>
    </>
  );
  if (href) {
    return (
      <a href={href} className="flex items-start gap-4 rounded border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition">
        {inner}
      </a>
    );
  }
  return (
    <div className="flex items-start gap-4 rounded border border-white/10 bg-white/5 p-5">
      {inner}
    </div>
  );
}

function arrayifyContacts(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.contacts)) return v.contacts;
  if (Array.isArray(v.items)) return v.items;
  return [];
}
