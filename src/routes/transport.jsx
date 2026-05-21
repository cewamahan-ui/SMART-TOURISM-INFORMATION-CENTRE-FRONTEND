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
    (r.name || r.destination || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredStations = stations.filter((s) =>
    (s.name || s.location || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredSchedules = schedules.filter((s) =>
    (s.route_name || s.departure || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
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

function parseTransportTab(value) {
  const tab = typeof value === "string" ? value.toLowerCase() : "routes";
  const allowed = new Set(["routes", "schedules", "stations"]);
  return allowed.has(tab) ? tab : "routes";
}

function RouteCard({ route }) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-border bg-card p-6 transition hover:border-[var(--color-gold)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-display text-xl">{route.name || t("transport.unnamedRoute")}</h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{route.origin} → {route.destination}</span>
            </div>
            {route.distance && (
              <div className="text-sm text-muted-foreground">
                Distance: {route.distance} km
              </div>
            )}
            {route.duration && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{route.duration}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center rounded-full bg-[var(--color-gold)]/20 px-3 py-1 text-xs uppercase tracking-widest text-[var(--color-ink)]">
            {route.status || t("transport.active")}
          </span>
        </div>
      </div>
    </div>
  );
}

function ScheduleCard({ schedule }) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-border bg-card p-6 transition hover:border-[var(--color-gold)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-display text-xl">
            {schedule.route_name || t("transport.schedule")}
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {schedule.departure || t("transport.dash")} → {schedule.arrival || t("transport.dash")}
              </span>
            </div>
            {schedule.available_seats !== undefined && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{schedule.available_seats} {t("transport.seatsAvailable")}</span>
              </div>
            )}
            {schedule.price && (
              <div className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="h-4 w-4" />
                <span>${schedule.price}</span>
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
  return (
    <div className="rounded-lg border border-border bg-card p-6 transition hover:border-[var(--color-gold)]">
      <h3 className="font-display text-lg">{station.name || t("transport.station")}</h3>
      <div className="mt-3 space-y-2">
        {station.location && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{station.location}</span>
          </div>
        )}
        {station.contact && (
          <div className="text-sm text-muted-foreground">
            📞 {station.contact}
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
  if (Array.isArray(v.routes)) return v.routes;
  return [];
}
