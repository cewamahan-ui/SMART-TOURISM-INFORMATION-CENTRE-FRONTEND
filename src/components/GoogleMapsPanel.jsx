import { useEffect, useMemo, useRef, useState } from "react";

let googleMapsScriptPromise = null;

function loadGoogleMaps(apiKey) {
  if (typeof window === "undefined" || !apiKey) {
    return Promise.resolve(false);
  }

  if (window.google?.maps) {
    return Promise.resolve(true);
  }

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Google Maps script failed to load"));
      document.head.appendChild(script);
    });
  }

  return googleMapsScriptPromise;
}

export function GoogleMapsPanel({ title, address, latitude, longitude, zoom = 12 }) {
  const mapRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || "";

  const coords = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [latitude, longitude]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const available = await loadGoogleMaps(apiKey).catch(() => false);
      if (cancelled) return;
      setIsReady(Boolean(available));

      if (!available || !mapRef.current) {
        return;
      }

      const center = coords || { lat: -1.286389, lng: 36.817223 };
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
      });

      new window.google.maps.Marker({
        map,
        position: center,
        title: title || "Attraction",
      });
    }

    initMap();

    return () => {
      cancelled = true;
    };
  }, [apiKey, coords, title, zoom]);

  const fallbackQuery = encodeURIComponent(address || title || "Kenya attraction");
  const fallbackEmbedSrc = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=${zoom}&output=embed`
    : `https://www.google.com/maps?q=${fallbackQuery}&z=${zoom}&output=embed`;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-display text-2xl">Location Map</h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            {address || title || "Map view"}
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          {isReady ? "Google Maps API" : "Map Preview"}
        </span>
      </div>

      <div className="relative h-[360px] w-full bg-muted/30">
        {isReady ? (
          <div ref={mapRef} className="h-full w-full" />
        ) : (
          <iframe
            title={title || "Location map"}
            src={fallbackEmbedSrc}
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
