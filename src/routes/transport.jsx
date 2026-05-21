import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery } from "@tanstack/react-query";
import { transportApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/language/i18n-provider";
import { MapPin, Clock, Users, DollarSign, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/transport")({
  validateSearch: (search) => ({
    tab: parseTransportTab(search.tab),
  }),
  head: () => ({ meta: [{ title: "Transport — SafariSmart" }] }),
  component: TransportPage,
});

function TransportPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const tab = search.tab;
  const [searchQuery, setSearchQuery] = useState("");

  const routesQuery = useQuery({
    queryKey: ["transport-routes"],
    queryFn: transportApi.routes.list,
    retry: false,
  });

  const stationsQuery = useQuery({
    queryKey: ["transport-stations"],
    queryFn: transportApi.stations.list,
    retry: false,
  });

  const schedulesQuery = useQuery({
    queryKey: ["transport-schedules"],
    queryFn: transportApi.schedules.list,
    retry: false,
  });

  const routes = arrayify(routesQuery.data);
  const stations = arrayify(stationsQuery.data);
  const schedules = arrayify(schedulesQuery.data);

  const filteredRoutes = routes.filter((r) =>
    (r.type || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStations = stations.filter((s) =>
    (s.name || s.city || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSchedules = schedules.filter((s) =>
    searchQuery === "" ||
    String(s.price || "").includes(searchQuery) ||
    formatTime(s.departure_time).includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-6xl px-6 pt-12">
        <div className="border-b border-border pb-8">
          <div className="eyebrow">{t("transport.eyebrow")}</div>
          <h1 className="mt-3 font-display text-6xl">{t("transport.title")}</h1>
          <p className="mt-3 text-muted-foreground">
            {t("transport.subtitle")}
          </p>
        </div>

        {/* Search */}
        <div className="mt-8 flex items-center gap-2 border-b border-border pb-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("transport.searchPlaceholder")}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-4">
          {["routes", "schedules", "stations"].map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => {
                navigate({
                  to: "/transport",
                  search: (prev) => ({ ...prev, tab: tabKey }),
                });
              }}
              className={
                "rounded-full px-4 py-2 text-xs uppercase tracking-widest transition " +
                (tab === tabKey
                  ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {tabKey === "routes"
                ? t("transport.tabs.routes")
                : tabKey === "schedules"
                  ? t("transport.tabs.schedules")
                  : t("transport.tabs.stations")}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        {tab === "routes" && (
          <div className="space-y-4">
            {routesQuery.isLoading && <p className="text-muted-foreground">{t("transport.loadingRoutes")}</p>}
            {filteredRoutes.length === 0 && !routesQuery.isLoading && (
              <p className="text-muted-foreground">{t("transport.noRoutes")}</p>
            )}
            {filteredRoutes.map((route, idx) => (
              <RouteCard key={route.id ?? idx} route={route} />
            ))}
          </div>
        )}

        {tab === "schedules" && (
          <div className="space-y-4">
            {schedulesQuery.isLoading && (
              <p className="text-muted-foreground">{t("transport.loadingSchedules")}</p>
            )}
            {filteredSchedules.length === 0 && !schedulesQuery.isLoading && (
              <p className="text-muted-foreground">{t("transport.noSchedules")}</p>
            )}
            {filteredSchedules.map((schedule, idx) => (
              <ScheduleCard key={schedule.id ?? idx} schedule={schedule} />
            ))}
          </div>
        )}

        {tab === "stations" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stationsQuery.isLoading && (
              <p className="text-muted-foreground">{t("transport.loadingStations")}</p>
            )}
            {filteredStations.length === 0 && !stationsQuery.isLoading && (
              <p className="text-muted-foreground">{t("transport.noStations")}</p>
            )}
            {filteredStations.map((station, idx) => (
              <StationCard key={station.id ?? idx} station={station} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function formatTime(isoString) {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function formatDate(isoString) {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return isoString;
  }
}

function parseTransportTab(value) {
  const tab = typeof value === "string" ? value.toLowerCase() : "routes";
  const allowed = new Set(["routes", "schedules", "stations"]);
  return allowed.has(tab) ? tab : "routes";
}

function RouteCard({ route }) {
  const { t } = useI18n();
  const typeLabel = route.type
    ? route.type.charAt(0).toUpperCase() + route.type.slice(1)
    : t("transport.unnamedRoute");
  const statusLabel = route.is_active ? t("transport.active") : t("transport.inactive");

  return (
    <div className="rounded-lg border border-border bg-card p-6 transition hover:border-[var(--color-gold)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-display text-xl">{typeLabel}</h3>
          <div className="mt-3 space-y-2">
            {route.duration_minutes && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{route.duration_minutes} min</span>
              </div>
            )}
            {route.base_fare != null && (
              <div className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="h-4 w-4" />
                <span>
                  {t("transport.from")} KES {route.base_fare.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span
            className={
              "inline-flex items-center rounded-full px-3 py-1 text-xs uppercase tracking-widest " +
              (route.is_active
                ? "bg-[var(--color-gold)]/20 text-[var(--color-ink)]"
                : "bg-muted text-muted-foreground")
            }
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function ScheduleCard({ schedule }) {
  const { t } = useI18n();
  const depDate = formatDate(schedule.departure_time);
  const depTime = formatTime(schedule.departure_time);
  const arrTime = formatTime(schedule.arrival_time);

  return (
    <div className="rounded-lg border border-border bg-card p-6 transition hover:border-[var(--color-gold)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-display text-xl">
            {depDate}
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {depTime} → {arrTime}
              </span>
            </div>
            {schedule.available_seats !== undefined && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{schedule.available_seats} {t("transport.seatsAvailable")}</span>
              </div>
            )}
            {schedule.price != null && (
              <div className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="h-4 w-4" />
                <span>KES {Number(schedule.price).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
        <button className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-cream)] transition hover:brightness-110">
          {t("transport.book")}
        </button>
      </div>
    </div>
  );
}

function StationCard({ station }) {
  const { t } = useI18n();
  const locationLabel = [station.city, station.region, station.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-lg border border-border bg-card p-6 transition hover:border-[var(--color-gold)]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg">{station.name || t("transport.station")}</h3>
        {station.type && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
            {station.type}
          </span>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {locationLabel && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{locationLabel}</span>
          </div>
        )}
        {station.street && (
          <div className="text-sm text-muted-foreground pl-6">{station.street}</div>
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
  if (Array.isArray(v.routes)) return v.routes;
  return [];
}
