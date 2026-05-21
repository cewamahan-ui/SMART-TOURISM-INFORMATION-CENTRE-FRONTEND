import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, Polyline, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function OSMMapPanel({ title, address, latitude, longitude, zoom = 12 }) {
  const [destination, setDestination] = useState(null);
  const [destinationError, setDestinationError] = useState("");
  const [originText, setOriginText] = useState("");
  const [origin, setOrigin] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  const destinationCoords = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [latitude, longitude]);

  useEffect(() => {
    let cancelled = false;

    async function resolveDestination() {
      if (destinationCoords) {
        setDestination(destinationCoords);
        setDestinationError("");
        return;
      }

      const baseQuery = (address || title || "").trim();
      if (!baseQuery) {
        setDestinationError("Location details are unavailable.");
        return;
      }

      const queries = [
        baseQuery,
        `${baseQuery}, Kenya`,
      ];

      try {
        for (const query of queries) {
          const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
          const response = await fetch(url, {
            headers: { Accept: "application/json" },
          });
          const data = await response.json();
          if (cancelled) return;

          if (Array.isArray(data) && data.length > 0) {
            setDestination({ lat: Number(data[0].lat), lng: Number(data[0].lon) });
            setDestinationError("");
            return;
          }
        }

        setDestinationError("Could not geocode this attraction.");
      } catch {
        if (!cancelled) {
          setDestinationError("Could not geocode this attraction.");
        }
      }
    }

    resolveDestination();

    return () => {
      cancelled = true;
    };
  }, [address, destinationCoords, title]);

  const orsKey = import.meta.env?.VITE_OPENROUTESERVICE_API_KEY || "";

  const openDirectionsInBrowser = () => {
    if (!destination) {
      return;
    }

    const routeBase = "https://www.openstreetmap.org/directions";
    const destinationPart = `${destination.lat},${destination.lng}`;
    const routePart = origin?.lat && origin?.lng
      ? `${origin.lat},${origin.lng};${destinationPart}`
      : `${encodeURIComponent(originText || "Nairobi, Kenya")};${destinationPart}`;
    const url = `${routeBase}?engine=fossgis_osrm_car&route=${routePart}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const fetchDirections = async () => {
    setRouteLoading(true);
    setRouteError("");
    setRoute(null);

    try {
      if (!destination) {
        throw new Error("Destination not available yet.");
      }

      const originQuery = originText.trim();
      if (!originQuery) {
        throw new Error("Enter a starting location.");
      }

      const originResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(originQuery)}`,
        { headers: { Accept: "application/json" } }
      );
      const originData = await originResponse.json();
      if (!Array.isArray(originData) || originData.length === 0) {
        throw new Error("Could not geocode the starting location.");
      }

      const resolvedOrigin = {
        lat: Number(originData[0].lat),
        lng: Number(originData[0].lon),
      };
      setOrigin(resolvedOrigin);

      if (!orsKey) {
        throw new Error("OpenRouteService API key not configured.");
      }

      const routeResponse = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
        method: "POST",
        headers: {
          "Authorization": orsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            [resolvedOrigin.lng, resolvedOrigin.lat],
            [destination.lng, destination.lat],
          ],
        }),
      });

      if (!routeResponse.ok) {
        throw new Error("Failed to fetch directions from OpenRouteService.");
      }

      const routeData = await routeResponse.json();
      const coordinates = routeData?.features?.[0]?.geometry?.coordinates || [];
      const summary = routeData?.features?.[0]?.properties?.summary || {};

      setRoute({
        path: coordinates.map(([lng, lat]) => [lat, lng]),
        distanceKm: typeof summary.distance === "number" ? summary.distance / 1000 : null,
        durationMin: typeof summary.duration === "number" ? summary.duration / 60 : null,
      });
    } catch (error) {
      setRouteError(error?.message || "Unable to calculate directions.");
    } finally {
      setRouteLoading(false);
    }
  };

  const center = destination || { lat: -1.286389, lng: 36.817223 };

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
          OSM / Leaflet
        </span>
      </div>

      <div className="grid gap-4 border-b border-border px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-end">
        <label className="block">
          <span className="eyebrow">Start location for directions</span>
          <input
            value={originText}
            onChange={(e) => setOriginText(e.target.value)}
            placeholder="e.g. Nairobi, Kenya"
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--color-gold)]"
          />
        </label>
        <button
          type="button"
          onClick={fetchDirections}
          disabled={routeLoading || !destination}
          className="rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-xs uppercase tracking-widest text-[var(--color-cream)] disabled:opacity-60"
        >
          {routeLoading ? "Routing..." : "Get Directions"}
        </button>
        <button
          type="button"
          onClick={openDirectionsInBrowser}
          disabled={!destination}
          className="rounded-full border border-border bg-background px-5 py-2.5 text-xs uppercase tracking-widest text-foreground disabled:opacity-60"
        >
          Open in OSM
        </button>
      </div>

      <div className="relative h-[360px] w-full bg-muted/30">
        {destination ? (
          <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[destination.lat, destination.lng]} icon={defaultIcon}>
              <Popup>{title || "Attraction"}</Popup>
            </Marker>
            {origin ? (
              <Marker position={[origin.lat, origin.lng]} icon={defaultIcon}>
                <Popup>Starting point</Popup>
              </Marker>
            ) : null}
            {route?.path?.length ? <Polyline positions={route.path} pathOptions={{ color: "#c9a227", weight: 4 }} /> : null}
          </MapContainer>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-sm text-muted-foreground">
            {destinationError || "Loading map..."}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm text-muted-foreground">
        <span>{routeError || destinationError || ""}</span>
        {route?.distanceKm || route?.durationMin ? (
          <span>
            {route?.distanceKm ? `${route.distanceKm.toFixed(1)} km` : ""}
            {route?.distanceKm && route?.durationMin ? " · " : ""}
            {route?.durationMin ? `${Math.round(route.durationMin)} min` : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
}
