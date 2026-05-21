import React, { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth-context";
import {
  getBusinessProfile,
  getRegistrationStatus,
  getAttractions,
  getBusinessBookings,
  getDestinations,
} from "./dashboardApi";
import ProfilePanel from "./ProfilePanel";
import AttractionsPanel from "./AttractionsPanel";
import BookingsPanel from "./BookingsPanel";
import MetricsPanel from "./MetricsPanel";
import { LayoutDashboard, Bookmark, CalendarCheck, User } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "attractions", label: "Attractions", icon: Bookmark },
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
  { id: "profile", label: "Profile", icon: User },
];

export default function BusinessDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prof, reg, dests, bks] = await Promise.all([
        getBusinessProfile(),
        getRegistrationStatus(),
        getDestinations(),
        getBusinessBookings(),
      ]);
      setProfile(prof);
      setRegistration(reg);
      setDestinations(dests);
      setBookings(bks);
      if (prof?.id) {
        const atts = await getAttractions(prof.id);
        setAttractions(atts);
      } else {
        setAttractions([]);
      }
    } catch (e) {
      setError(e?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) loadData();
    else if (!authLoading && !user) setLoading(false);
  }, [authLoading, user, loadData]);

  const handleAttractionUpdate = useCallback(async () => {
    if (profile?.id) {
      const atts = await getAttractions(profile.id);
      setAttractions(atts);
    }
  }, [profile]);

  const handleProfileUpdate = useCallback(async (updated) => {
    setProfile(updated);
    if (updated?.id) {
      const atts = await getAttractions(updated.id);
      setAttractions(atts);
    } else {
      setAttractions([]);
    }
  }, []);

  const handleRegistrationUpdate = useCallback((reg) => {
    setRegistration(reg);
  }, []);

  // ── Not authenticated ────────────────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="h-20" />
        <section className="mx-auto max-w-4xl px-6 pt-16 text-center">
          <h1 className="font-display text-5xl">Sign in to access the Business Dashboard</h1>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-[var(--color-ink)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-cream)]"
          >
            Sign In
          </Link>
        </section>
        <SiteFooter />
      </div>
    );
  }

  const hasAccess = !!profile;
  const isPendingApproval = !profile && registration?.status === "pending";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-6xl px-6 pt-10 pb-20">
        {/* Page header */}
        <div className="border-b border-border pb-8">
          <div className="eyebrow">Business Owner</div>
          <h1 className="mt-3 font-display text-5xl leading-tight">
            {profile?.business_name || "Business Dashboard"}
          </h1>
          {profile && (
            <p className="mt-2 text-sm text-muted-foreground">
              {profile.business_type && (
                <span className="capitalize">{profile.business_type.replace(/_/g, " ")}</span>
              )}
              {profile.business_type && " · "}
              <span className={profile.verified ? "text-emerald-600" : "text-amber-600"}>
                {profile.verified ? "Verified" : "Pending verification"}
              </span>
            </p>
          )}
          {isPendingApproval && !loading && (
            <p className="mt-2 text-sm text-amber-600">
              Registration submitted — awaiting admin approval.
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={
                "flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs uppercase tracking-widest transition " +
                (activeTab === id
                  ? "border-b-2 border-[var(--color-gold)] text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              Loading dashboard…
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
              <button onClick={loadData} className="ml-3 underline text-red-700">Retry</button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* No profile & no registration on non-profile tabs → nudge to profile tab */}
              {!hasAccess && !isPendingApproval && activeTab !== "profile" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
                  <p className="text-sm text-amber-700">
                    You don&apos;t have a business profile yet.{" "}
                    <button
                      onClick={() => setActiveTab("profile")}
                      className="underline font-semibold"
                    >
                      Register your business to get started.
                    </button>
                  </p>
                </div>
              )}

              {/* Pending approval notice on non-profile tabs */}
              {isPendingApproval && activeTab !== "profile" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-6 text-center">
                  <p className="text-sm text-amber-700 font-medium">Your registration is pending admin approval.</p>
                  <p className="mt-1 text-xs text-amber-600">
                    Once approved, you'll be able to manage your attractions and view bookings.{" "}
                    <button onClick={() => setActiveTab("profile")} className="underline">Check status</button>
                  </p>
                </div>
              )}

              {/* Overview tab */}
              {activeTab === "overview" && hasAccess && (
                <div className="space-y-8">
                  <MetricsPanel attractions={attractions} bookings={bookings} />
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-display text-2xl">Recent Attractions</h2>
                      <button
                        onClick={() => setActiveTab("attractions")}
                        className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                      >
                        View all →
                      </button>
                    </div>
                    <AttractionsPanel
                      attractions={attractions.slice(0, 3)}
                      businessProfileId={profile.id}
                      destinations={destinations}
                      onUpdate={handleAttractionUpdate}
                    />
                  </div>
                </div>
              )}

              {/* Attractions tab */}
              {activeTab === "attractions" && (
                hasAccess ? (
                  <AttractionsPanel
                    attractions={attractions}
                    businessProfileId={profile.id}
                    destinations={destinations}
                    onUpdate={handleAttractionUpdate}
                  />
                ) : null
              )}

              {/* Bookings tab */}
              {activeTab === "bookings" && hasAccess && (
                <div>
                  <h2 className="mb-5 font-display text-2xl">Bookings</h2>
                  <BookingsPanel bookings={bookings} attractions={attractions} />
                </div>
              )}

              {/* Profile tab — always visible */}
              {activeTab === "profile" && (
                <ProfilePanel
                  profile={profile}
                  registration={registration}
                  onProfileUpdate={handleProfileUpdate}
                  onRegistrationUpdate={handleRegistrationUpdate}
                />
              )}
            </>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
