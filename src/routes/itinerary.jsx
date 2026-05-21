import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/language/i18n-provider";
import { itinerariesApi } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Calendar, MapPin, Sparkles, Plus, X, ChevronDown, QrCode } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
export const Route = createFileRoute("/itinerary")({
    head: () => ({ meta: [{ title: "Itinerary — SafariSmart" }] }),
    component: ItineraryPage,
});
const SAMPLE = [
  { day: 1, title: "Arrival · Maasai Mara", detail: "Private transfer to camp + sunset lookout over the reserve.", time: "16:00", stops: [] },
  { day: 2, title: "Mara Balloon Safari at Dawn", detail: "Sunrise flight above the plains, followed by a bush breakfast.", time: "05:30", stops: [] },
  { day: 3, title: "Migration Crossing Watch", detail: "Full-day expedition with a local Maasai tracker.", time: "06:00", stops: [] },
  { day: 4, title: "Lake Nakuru Conservation Walk", detail: "Behind-the-scenes with local conservation guides and rhino zones.", time: "09:00", stops: [] },
  { day: 5, title: "Departure", detail: "Final game drive + transfer to Wilson Airport, Nairobi.", time: "11:00", stops: [] },
];
const INTERESTS = [
  "museum", "heritage_site", "national_park", "wildlife", "beach",
  "cultural", "restaurant", "shopping", "viewpoint", "adventure",
  "gastronomy", "health_wellness", "ecotourism", "birdwatching",
];
function ItineraryPage() {
  const { user } = useAuth();
  const { language, t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    destination: "Nairobi",
    duration_days: 5,
    interests: ["wildlife", "cultural"],
    budget: 1000,
    currency: "USD",
    pace: "moderate",
    accessibility_required: false,
  });
  const [formError, setFormError] = useState("");

    const KES_PER_USD = 130;
    const KES_PER_EUR = 141;

    const budgetInKES = useMemo(() => {
      const raw = Number(form.budget) || 0;
      if (form.currency === "KES") return Math.round(raw);
      if (form.currency === "USD") return Math.round(raw * KES_PER_USD);
      if (form.currency === "EUR") return Math.round(raw * KES_PER_EUR);
      return Math.round(raw);
    }, [form.budget, form.currency]);

    // Classify budget into backend-expected levels
    // < 15,000 KES = low, 15k–75k = medium, >75k = high
    const budgetLevel = useMemo(() => {
      if (!budgetInKES) return "medium";
      if (budgetInKES < 15000) return "low";
      if (budgetInKES <= 75000) return "medium";
      return "high";
    }, [budgetInKES]);

    const BUDGET_LEVEL_LABELS = { low: "Budget", medium: "Mid-range", high: "Luxury" };
    const BUDGET_LEVEL_COLORS = {
      low: "text-blue-600 border-blue-300 bg-blue-50",
      medium: "text-amber-600 border-amber-300 bg-amber-50",
      high: "text-emerald-600 border-emerald-300 bg-emerald-50",
    };
  const itinerariesQuery = useQuery({
    queryKey: ["itineraries"],
    queryFn: itinerariesApi.list,
    enabled: !!user,
    retry: false,
  });
  const itineraries = extractItineraries(itinerariesQuery.data);
  const activeItineraryId = selectedId || itineraries[0]?.id || null;
  const itineraryDetailQuery = useQuery({
    queryKey: ["itinerary", activeItineraryId],
    queryFn: () => itinerariesApi.get(activeItineraryId),
    enabled: !!user && !!activeItineraryId,
    retry: false,
  });
  const handleGenerate = () => {
    // Validate required fields
    if (!form.destination || typeof form.destination !== "string" || form.destination.trim().length < 2) {
      setFormError("Please enter a valid destination.");
      return;
    }
    if (!form.duration_days || isNaN(form.duration_days) || form.duration_days < 1) {
      setFormError("Please enter a valid duration (at least 1 day).");
      return;
    }
    if (!form.budget || isNaN(Number(form.budget)) || Number(form.budget) < 1) {
      setFormError("Please enter a valid budget (positive integer).");
      return;
    }
    if (!form.interests || !Array.isArray(form.interests) || form.interests.length === 0) {
      setFormError("Please select at least one interest.");
      return;
    }
    setFormError("");
    generateMutation.mutate();
    setShowForm(false);
  };
  const generateMutation = useMutation({
    mutationFn: () => {
      const payload = {
        destination: form.destination,
        duration_days: form.duration_days,
        interests: form.interests,
        budget_level: budgetLevel,
        pace: form.pace,
        accessibility_required: form.accessibility_required,
        language: language || "en",
      };
      return itinerariesApi.generate(payload);
    },
    onSuccess: (result) => {
      const generated = unwrapEntity(result);
      if (generated?.id) {
        setSelectedId(generated.id);
      }
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      queryClient.setQueryData(["itinerary", generated?.id], generated);
      toast.success(t("itinerary.generatedSuccess", "A new itinerary is ready."));
    },
    onError: (error) => {
      toast.error(error?.message || t("itinerary.generatedError", "Unable to generate itinerary right now."));
    },
  });
  const activeItinerary = unwrapEntity(generateMutation.data) || unwrapEntity(itineraryDetailQuery.data);
  const days = normalizeDays(activeItinerary?.days);
  const usingSample = !user || !activeItinerary || days.length === 0;
  const visibleDays = usingSample ? SAMPLE : days;
    return (<div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20"/>
      <section className="mx-auto max-w-6xl px-6 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <div className="eyebrow">{t("itinerary.eyebrow")}</div>
            <h1 className="mt-3 font-display text-6xl leading-tight">
              {t("itinerary.titleLead")} <span className="italic">{t("itinerary.titleAccent")}</span>
            </h1>
            <p className="mt-3 text-muted-foreground">
              {user ? `${t("itinerary.curatedFor")} ${user.full_name ?? user.email}` : t("itinerary.sample")}
            </p>
          </div>
          <button
            onClick={() => user && setShowForm((f) => !f)}
            disabled={!user || generateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-5 py-2.5 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60">
            <Sparkles className="h-4 w-4"/>
            {generateMutation.isPending
              ? t("itinerary.generating", "Generating\u2026")
              : showForm
              ? t("itinerary.generateForm.cancel", "Cancel")
              : t("itinerary.generateAi")}
            <ChevronDown className={"h-3.5 w-3.5 transition-transform " + (showForm ? "rotate-180" : "")}/>
          </button>
        </div>

        {user && showForm && (
          <div className="mt-6 rounded-3xl border border-[var(--color-gold)]/30 bg-card p-6">
            {formError && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl">{t("itinerary.generateForm.title", "Plan Your Itinerary")}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4"/></button>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="eyebrow">{t("itinerary.generateForm.destination", "Destination")}</span>
                <input type="text" value={form.destination}
                  onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"/>
              </label>
              <label className="block">
                <span className="eyebrow">{t("itinerary.generateForm.duration", "Duration (days)")}</span>
                <input type="number" min="1" max="30" value={form.duration_days}
                  onChange={(e) => setForm((f) => ({ ...f, duration_days: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)) }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"/>
              </label>
              <label className="block">
                <span className="eyebrow">{t("itinerary.generateForm.budget", "Budget")}</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value === "" ? "" : parseInt(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"
                    placeholder="Enter your budget"
                  />
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="mt-1 rounded-lg border border-border bg-background px-2 py-2 text-sm outline-none focus:border-[var(--color-gold)]"
                  >
                    <option value="USD">USD</option>
                    <option value="KES">KES</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {form.currency !== "KES" && <span>≈ KES {budgetInKES.toLocaleString()}</span>}
                  {form.budget > 0 && (
                    <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-widest font-semibold ${BUDGET_LEVEL_COLORS[budgetLevel]}`}>
                      {BUDGET_LEVEL_LABELS[budgetLevel]}
                    </span>
                  )}
                </div>
              </label>
              <label className="block">
                <span className="eyebrow">{t("itinerary.generateForm.pace", "Pace")}</span>
                <select value={form.pace} onChange={(e) => setForm((f) => ({ ...f, pace: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]">
                  <option value="relaxed">{t("itinerary.generateForm.relaxed", "Relaxed")}</option>
                  <option value="moderate">{t("itinerary.generateForm.moderate", "Moderate")}</option>
                  <option value="intensive">{t("itinerary.generateForm.intensive", "Intensive")}</option>
                </select>
              </label>
            </div>
            <div className="mt-5">
              <div className="eyebrow mb-3">{t("itinerary.generateForm.interests", "Interests")}</div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <button key={interest} type="button"
                    onClick={() => setForm((f) => ({ ...f, interests: f.interests.includes(interest) ? f.interests.filter((x) => x !== interest) : [...f.interests, interest] }))}
                    className={"rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition " + (form.interests.includes(interest) ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-ink)]" : "border-border text-muted-foreground hover:border-[var(--color-gold)]/50")}>
                    {interest.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" checked={form.accessibility_required}
                  onChange={(e) => setForm((f) => ({ ...f, accessibility_required: e.target.checked }))}
                  className="h-4 w-4 rounded border-border"/>
                {t("itinerary.generateForm.accessibility", "Accessibility required")}
              </label>
              <button onClick={handleGenerate}
                disabled={generateMutation.isPending || form.interests.length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-6 py-2.5 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:opacity-60">
                <Sparkles className="h-4 w-4"/>
                {generateMutation.isPending ? t("itinerary.generating", "Generating\u2026") : t("itinerary.generateForm.generate", "Generate")}
              </button>
            </div>
          </div>
        )}

        {user && (<div className="mt-8 grid gap-6 lg:grid-cols-[18rem,1fr]">
            <aside className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl">{t("itinerary.savedTitle", "Saved itineraries")}</h2>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{itineraries.length}</span>
              </div>
              {itinerariesQuery.isLoading && <p className="mt-4 text-sm text-muted-foreground">{t("itinerary.loadingSaved", "Loading itineraries…")}</p>}
              {!itinerariesQuery.isLoading && itineraries.length === 0 && (<p className="mt-4 text-sm text-muted-foreground">{t("itinerary.emptySaved", "Generate your first itinerary to see it here.")}</p>)}
              <div className="mt-4 space-y-3">
                {itineraries.map((itinerary) => (<button key={itinerary.id} onClick={() => setSelectedId(itinerary.id)} className={"w-full rounded-2xl border px-4 py-3 text-left transition " +
                    (activeItineraryId === itinerary.id
                      ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10"
                      : "border-border hover:border-[var(--color-gold)]/50") }>
                    <div className="font-medium text-foreground">{itinerary.title || t("itinerary.untitled", "Untitled itinerary")}</div>
                    <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{formatStatus(itinerary.status)}</div>
                  </button>))}
              </div>
            </aside>

            <div>
              {activeItinerary?.title && (<div className="mb-8 rounded-3xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div>
                      <div className="eyebrow">{t("itinerary.activeLabel", "Active itinerary")}</div>
                      <h2 className="mt-2 font-display text-3xl">{activeItinerary.title}</h2>
                      <div className="mt-1 text-sm text-muted-foreground">{formatStatus(activeItinerary.status)}</div>
                    </div>
                    {activeItinerary.qr_code_url && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="rounded-xl border border-border bg-white p-2.5 shadow-sm">
                          <QRCode
                            value={activeItinerary.qr_code_url}
                            size={96}
                            bgColor="#ffffff"
                            fgColor="#17130d"
                          />
                        </div>
                        <p className="flex items-center gap-1 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                          <QrCode className="h-3 w-3" />
                          {t("itinerary.scanToPhone", "Scan to open on phone")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>)}
            </div>
          </div>)}

        {usingSample && !user && (<p className="mt-8 text-sm text-muted-foreground">{t("itinerary.sampleFallback", "Showing a sample itinerary until you sign in or generate one from the backend.")}</p>)}

        {usingSample && user && !itinerariesQuery.isLoading && (<p className="mt-8 text-sm text-muted-foreground">{t("itinerary.emptyGenerated", "You do not have any saved itineraries yet. Use Generate with AI to create one from the backend.")}</p>)}

        <ol className="mt-12 space-y-10">
          {visibleDays.map((d, i) => (<li key={d.day} className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-2">
                <div className="eyebrow">{t("itinerary.day")}</div>
                <div className="font-display text-6xl leading-none">{d.day.toString().padStart(2, "0")}</div>
              </div>
              <div className="md:col-span-9 border-l border-border pl-6">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5"/> {d.time || t("itinerary.flexibleTime", "Flexible schedule")}
                  <span>·</span>
                  <MapPin className="h-3.5 w-3.5"/> {t("itinerary.location")}
                </div>
                <h3 className="mt-2 font-display text-3xl">{d.title}</h3>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{d.detail}</p>
                {Array.isArray(d.stops) && d.stops.length > 0 && (<div className="mt-4 flex flex-wrap gap-2">
                  {d.stops.map((stop, stopIndex) => (<span key={`${stop.name}-${stopIndex}`} className="rounded-full border border-border px-3 py-1 text-[0.62rem] uppercase tracking-widest text-muted-foreground">
                        {stop.name}
                      </span>))}
                  </div>)}
              </div>
              <div className="md:col-span-1 md:text-right"/>
            </li>))}
        </ol>

        {usingSample && (<button className="mt-14 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-xs uppercase tracking-widest opacity-70">
            <Plus className="h-4 w-4"/> {t("itinerary.addDay")}
          </button>)}

        {!user && (<div className="mt-16 rounded border border-border bg-card p-8">
            <h3 className="font-display text-2xl">{t("itinerary.saveTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("itinerary.saveBody")}
            </p>
            <Link to="/register" className="mt-5 inline-flex rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-xs uppercase tracking-widest text-[var(--color-cream)]">
              {t("itinerary.createAccount")}
            </Link>
          </div>)}
      </section>
      <SiteFooter />
    </div>);
}
    function extractItineraries(payload) {
      if (!payload)
        return [];
      if (Array.isArray(payload))
        return payload;
      if (Array.isArray(payload.data))
        return payload.data;
      if (payload.data && Array.isArray(payload.data.data))
        return payload.data.data;
      return [];
    }
    function unwrapEntity(payload) {
      if (!payload)
        return null;
      if (Array.isArray(payload))
        return payload[0] || null;
      if (payload && typeof payload === "object" && payload.data && typeof payload.data === "object")
        return payload.data;
      return payload;
    }

    function normalizeDays(days) {
      if (!Array.isArray(days))
        return [];
      return days.map((day, index) => ({
        day: day.day_number ?? day.day ?? index + 1,
        title: day.day_title || day.title || `Day ${index + 1}`,
        detail: day.narrative || day.detail || "",
        time: day.time || "",
        stops: Array.isArray(day.attractions)
          ? day.attractions.map((item) => ({
            name: item.name || item.attraction_name || item.title || "Attraction",
          }))
          : [],
      }));
    }
    function formatStatus(status) {
      if (!status)
        return "draft";
      return String(status).replace(/_/g, " ");
    }
