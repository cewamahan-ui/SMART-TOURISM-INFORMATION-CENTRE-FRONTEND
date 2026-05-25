import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/language/i18n-provider";
import { itinerariesApi, attractionsApi } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Calendar, MapPin, Sparkles, Plus, X, ChevronDown, QrCode, Clock, Coffee, Sunset, Star, Info, PenLine, Trash2, Search, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { CURRENCIES, CURRENCY_OPTIONS, CURRENCY_RATES } from "@/lib/currencies";
export const Route = createFileRoute("/itinerary")({
    head: () => ({ meta: [{ title: "Itinerary — SafariSmart" }] }),
    component: ItineraryPage,
});
const SAMPLE = [
  {
    day: 1, title: "Arrival · Maasai Mara", time: "16:00", location: "Maasai Mara, Narok County",
    detail: "Your safari begins the moment you land. A private 4×4 meets you at Wilson Airport for the scenic 5-hour drive into the heart of the Mara. En route, watch for roadside wildlife and breathtaking escarpment views.",
    morning: "Depart Nairobi via scenic Narok highway. Stop at the Great Rift Valley viewpoint for panoramic photos.",
    afternoon: "Arrive at camp. Meet your guide and settle into your accommodation overlooking the savannah.",
    evening: "Sunset drinks at the lookout point followed by a welcome dinner under the stars with live cultural music.",
    highlights: ["First sighting of the open savannah", "Welcome Maasai warrior ceremony at camp", "Sundowner over the Mara River"],
    tips: "Pack a light jacket — evenings in the Mara can be cool even during dry season. Bring binoculars for arrival wildlife spotting.",
    meals: "Lunch at Narok town · Welcome dinner at camp",
    stops: [{ name: "Rift Valley Viewpoint" }, { name: "Maasai Mara Gate" }],
  },
  {
    day: 2, title: "Mara Balloon Safari at Dawn", time: "05:30", location: "Maasai Mara",
    detail: "Rise before the sun for one of Africa's most iconic experiences: a hot-air balloon drift over the Mara plains as the golden light breaks the horizon. Follow wildebeest herds from above, spot sleeping lions, and witness the savannah wake up.",
    morning: "Pre-dawn pick-up for balloon launch at 06:00. 1.5-hour flight covering 20–30 km over the plains. Traditional champagne bush breakfast upon landing.",
    afternoon: "Afternoon game drive focusing on the Mara Triangle — prime territory for big cat sightings including cheetah and leopard.",
    evening: "Bush sundowner at a scenic kopje, sharing stories from the day with your guide.",
    highlights: ["Aerial view of wildebeest migration trails", "Champagne breakfast in the bush", "Afternoon big-cat game drive"],
    tips: "The balloon flight is weather-dependent — your guide will confirm the evening before. Bring a warm layer for the pre-dawn start.",
    meals: "Champagne bush breakfast · Picnic lunch · Dinner at camp",
    estimated_cost: "Est. balloon: $450/person",
  },
  {
    day: 3, title: "Migration Crossing Watch", time: "06:00", location: "Mara River, Kenya–Tanzania Border",
    detail: "Today is dedicated to witnessing one of nature's greatest spectacles — the wildebeest river crossing. Spend a full day at Mara River crossing points with a seasoned Maasai tracker who reads animal patterns to predict crossing locations.",
    morning: "Early start to reach prime river positions before the wildebeest herds gather. Your tracker will read herd movements and guide you to the optimal vantage point.",
    afternoon: "Picnic lunch in the field. Continue monitoring river crossings — the drama often peaks in early afternoon when temperatures drive herds to water.",
    evening: "Cultural visit to a traditional Maasai manyatta village. Learn about the boma structure, cattle culture, and warrior traditions.",
    highlights: ["Witnessing wildebeest river crossing live", "Nile crocodile activity at the crossing", "Meeting Maasai elders and children at the village"],
    tips: "Patience is key — crossings are unpredictable. Bring snacks, a good hat, and sunscreen. Avoid standing or making noise near the river bank.",
    meals: "Packed field lunch · Village cultural dinner",
    stops: [{ name: "Mara River Crossing Point" }, { name: "Maasai Village" }, { name: "Keekorok Area" }],
  },
  {
    day: 4, title: "Lake Nakuru Conservation Walk", time: "09:00", location: "Lake Nakuru National Park",
    detail: "Transfer north to Lake Nakuru — a UNESCO-recognized Biosphere Reserve and the flamingo capital of the world. Walk with conservation rangers through rhino sanctuary zones and learn about Kenya's pioneering black rhino protection programme.",
    morning: "Morning departure from Mara (approx. 4 hours). Stop at Thomson's Falls in Nyahururu for a short walk and refreshments.",
    afternoon: "Ranger-led walking safari through the rhino sanctuary. Get within 50 metres of white rhino in their natural habitat.",
    evening: "Lakeside sundowner watching thousands of lesser flamingos turn the water pink at dusk.",
    highlights: ["Walking safari with conservation rangers", "Black and white rhino in the wild", "Pink flamingo flocks at the lake shore"],
    tips: "Walking safaris require closed-toe shoes and neutral-coloured clothing. Photography from ground level gives dramatic results here.",
    meals: "Lunch at Thomson's Falls Lodge · Dinner at Nakuru hotel",
    stops: [{ name: "Thomson's Falls" }, { name: "Lake Nakuru Rhino Sanctuary" }, { name: "Baboon Cliff Viewpoint" }],
  },
  {
    day: 5, title: "Departure Day", time: "07:00", location: "Nairobi",
    detail: "Your final morning offers one last chance to breathe in the Kenyan air. Enjoy a leisurely breakfast with sweeping views, then your driver guides you back to Nairobi in time for afternoon or evening flights.",
    morning: "Farewell breakfast at the lodge. Final walk around the grounds with your naturalist guide to observe resident birdlife.",
    afternoon: "Scenic return drive to Nairobi passing through the fertile highlands. Optional stop at a Kikuyu craft market.",
    highlights: ["Final bird walk with your naturalist", "Craft market for last-minute souvenirs", "Certificate of Safari completion presented at departure"],
    tips: "Allow at least 4 hours from Nakuru to JKIA, plus check-in time. Your driver will ensure you arrive with time to spare.",
    meals: "Farewell breakfast · Light lunch en route",
    stops: [{ name: "Nakuru Town Market" }, { name: "Nairobi — Wilson / JKIA Airport" }],
  },
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
  const [showCustomCreate, setShowCustomCreate] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [addDayForm, setAddDayForm] = useState(null);
  const [attractionPicker, setAttractionPicker] = useState(null);
  const [attractionSearch, setAttractionSearch] = useState("");

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
  const createMutation = useMutation({
    mutationFn: (payload) => itinerariesApi.create(payload),
    onSuccess: (result) => {
      const created = unwrapEntity(result);
      if (created?.id) setSelectedId(created.id);
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      setShowCustomCreate(false);
      setCustomTitle("");
      toast.success("Custom itinerary created.");
    },
    onError: (e) => toast.error(e?.message || "Could not create itinerary."),
  });

  const addDayMutation = useMutation({
    mutationFn: (payload) => itinerariesApi.days.add(activeItineraryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", activeItineraryId] });
      setAddDayForm(null);
      toast.success("Day added.");
    },
    onError: (e) => toast.error(e?.message || "Could not add day."),
  });

  const removeDayMutation = useMutation({
    mutationFn: (dayId) => itinerariesApi.days.remove(activeItineraryId, dayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", activeItineraryId] });
      toast.success("Day removed.");
    },
    onError: (e) => toast.error(e?.message || "Could not remove day."),
  });

  const addAttractionMutation = useMutation({
    mutationFn: ({ dayId, payload }) => itinerariesApi.days.addAttraction(activeItineraryId, dayId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", activeItineraryId] });
      setAttractionPicker(null);
      setAttractionSearch("");
      toast.success("Attraction added.");
    },
    onError: (e) => toast.error(e?.message || "Could not add attraction."),
  });

  const removeAttractionMutation = useMutation({
    mutationFn: ({ dayId, entryId }) => itinerariesApi.days.removeAttraction(activeItineraryId, dayId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", activeItineraryId] });
      toast.success("Attraction removed.");
    },
    onError: (e) => toast.error(e?.message || "Could not remove attraction."),
  });

  const attractionsPickerQuery = useQuery({
    queryKey: ["attractions-picker", attractionSearch],
    queryFn: () => attractionsApi.list({ search: attractionSearch, per_page: 20 }),
    enabled: !!attractionPicker,
    staleTime: 30_000,
  });
  const pickerAttractions = (() => {
    const d = attractionsPickerQuery.data;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.data)) return d.data;
    if (d.data && Array.isArray(d.data.data)) return d.data.data;
    return [];
  })();

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
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { if (user) { setShowForm((f) => !f); setShowCustomCreate(false); } }}
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
            {user && (
              <button
                onClick={() => { setShowCustomCreate((f) => !f); setShowForm(false); }}
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)] px-5 py-2.5 text-xs uppercase tracking-widest text-[var(--color-ink)] hover:bg-[var(--color-gold)]/10 transition disabled:opacity-60">
                <PenLine className="h-4 w-4"/>
                {showCustomCreate ? "Cancel" : "Build Custom"}
              </button>
            )}
          </div>
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
                    {CURRENCY_OPTIONS.map(cur => (
                      <option key={cur} value={cur}>{CURRENCIES[cur].flag} {cur}</option>
                    ))}
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

        {user && showCustomCreate && (
          <div className="mt-6 rounded-3xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl">Create Custom Itinerary</h2>
              <button onClick={() => setShowCustomCreate(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4"/></button>
            </div>
            <label className="block">
              <span className="eyebrow">Title</span>
              <input type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Nairobi Weekend Trip"
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]" autoFocus/>
            </label>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => customTitle.trim() && createMutation.mutate({ title: customTitle.trim() })}
                disabled={!customTitle.trim() || createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-6 py-2.5 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:opacity-60">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <PenLine className="h-4 w-4"/>}
                {createMutation.isPending ? "Creating…" : "Create Itinerary"}
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

        {attractionPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setAttractionPicker(null)}>
            <div className="relative w-full max-w-lg rounded-3xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-xl">Add Attraction · Day {attractionPicker.dayNum}</h3>
                <button onClick={() => setAttractionPicker(null)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4"/></button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/>
                <input type="text" value={attractionSearch} onChange={(e) => setAttractionSearch(e.target.value)}
                  placeholder="Search attractions…"
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]" autoFocus/>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {attractionsPickerQuery.isLoading && (
                  <p className="flex items-center justify-center gap-2 py-6 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin"/> Searching…
                  </p>
                )}
                {!attractionsPickerQuery.isLoading && pickerAttractions.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">No attractions found. Try a different search term.</p>
                )}
                {pickerAttractions.map((a) => (
                  <button key={a.id}
                    onClick={() => addAttractionMutation.mutate({ dayId: attractionPicker.dayId, payload: { attraction_id: a.id } })}
                    disabled={addAttractionMutation.isPending}
                    className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left transition hover:border-[var(--color-gold)]/50 disabled:opacity-60">
                    {(a.thumbnail_url || a.cover_image_url) && (
                      <img src={a.thumbnail_url || a.cover_image_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover"/>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{a.name || a.title}</div>
                      {(a.category || a.type) && <div className="text-xs text-muted-foreground">{a.category || a.type}</div>}
                    </div>
                    {addAttractionMutation.isPending && <Loader2 className="ml-auto h-3.5 w-3.5 shrink-0 animate-spin"/>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <ol className="mt-12 space-y-6">
          {visibleDays.map((d, i) => (
            <li key={d.day} className="rounded-3xl border border-border bg-card overflow-hidden">
              {/* Day header */}
              <div className="flex items-center gap-5 bg-gradient-to-r from-[var(--color-gold)]/10 to-transparent border-b border-border px-6 py-4">
                <div className="shrink-0 text-center">
                  <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">{t("itinerary.day")}</div>
                  <div className="font-display text-4xl leading-none">{d.day.toString().padStart(2, "0")}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-2xl leading-tight">{d.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {d.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {d.time}</span>}
                    {d.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {d.location}</span>}
                    {d.duration && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {d.duration}</span>}
                  </div>
                </div>
                {!usingSample && d.raw_id && (
                  <button onClick={() => removeDayMutation.mutate(d.raw_id)}
                    disabled={removeDayMutation.isPending}
                    title="Remove day"
                    className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                    <Trash2 className="h-4 w-4"/>
                  </button>
                )}
              </div>

              <div className="p-6 space-y-5">
                {/* Main narrative */}
                {d.detail && (
                  <p className="text-sm leading-relaxed text-foreground/85">{d.detail}</p>
                )}

                {/* Morning / Afternoon / Evening breakdown */}
                {(d.morning || d.afternoon || d.evening) && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {d.morning && (
                      <div className="rounded-2xl border border-border bg-amber-50/50 dark:bg-amber-900/10 p-4">
                        <div className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">
                          <Coffee className="h-3 w-3" /> Morning
                        </div>
                        <p className="text-xs leading-relaxed text-foreground/80">{d.morning}</p>
                      </div>
                    )}
                    {d.afternoon && (
                      <div className="rounded-2xl border border-border bg-sky-50/50 dark:bg-sky-900/10 p-4">
                        <div className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-widest text-sky-700 dark:text-sky-400 mb-2">
                          <Sparkles className="h-3 w-3" /> Afternoon
                        </div>
                        <p className="text-xs leading-relaxed text-foreground/80">{d.afternoon}</p>
                      </div>
                    )}
                    {d.evening && (
                      <div className="rounded-2xl border border-border bg-purple-50/50 dark:bg-purple-900/10 p-4">
                        <div className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-widest text-purple-700 dark:text-purple-400 mb-2">
                          <Sunset className="h-3 w-3" /> Evening
                        </div>
                        <p className="text-xs leading-relaxed text-foreground/80">{d.evening}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Highlights */}
                {d.highlights && d.highlights.length > 0 && (
                  <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 p-4">
                    <div className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-widest text-[var(--color-gold)] mb-2">
                      <Star className="h-3 w-3" /> Highlights
                    </div>
                    <ul className="space-y-1">
                      {d.highlights.map((h, hi) => (
                        <li key={hi} className="flex items-start gap-2 text-xs text-foreground/80">
                          <span className="mt-0.5 shrink-0 text-[var(--color-gold)]">·</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tips */}
                {d.tips && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 px-4 py-3 flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-600" />
                    <p className="text-xs leading-relaxed text-foreground/80"><span className="font-medium text-blue-700 dark:text-blue-400">Tip: </span>{d.tips}</p>
                  </div>
                )}

                {/* Meals */}
                {d.meals && (
                  <div className="flex flex-wrap gap-2">
                    {(typeof d.meals === "string" ? [d.meals] : d.meals).map((m, mi) => (
                      <span key={mi} className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/30 px-2.5 py-1 text-[0.62rem] uppercase tracking-widest text-orange-700 dark:text-orange-400">
                        <Coffee className="h-2.5 w-2.5" /> {m}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stops / attractions */}
                {Array.isArray(d.stops) && d.stops.length > 0 ? (
                  <div>
                    <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-2">Stops & Attractions</div>
                    <div className="flex flex-wrap gap-2">
                      {d.stops.map((stop, si) => (
                        <span key={`${stop.name}-${si}`} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[0.62rem] uppercase tracking-widest text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5 shrink-0"/>
                          {stop.name}
                          {!usingSample && d.raw_id && stop.id && (
                            <button onClick={() => removeAttractionMutation.mutate({ dayId: d.raw_id, entryId: stop.id })}
                              disabled={removeAttractionMutation.isPending}
                              className="ml-0.5 transition hover:text-red-500">
                              <X className="h-2.5 w-2.5"/>
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {!usingSample && d.raw_id && (
                      <button onClick={() => { setAttractionPicker({ dayId: d.raw_id, dayNum: d.day }); setAttractionSearch(""); }}
                        className="mt-3 inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-widest text-muted-foreground transition hover:text-[var(--color-gold)]">
                        <Plus className="h-3 w-3"/> Add Attraction
                      </button>
                    )}
                  </div>
                ) : (
                  !usingSample && d.raw_id && (
                    <button onClick={() => { setAttractionPicker({ dayId: d.raw_id, dayNum: d.day }); setAttractionSearch(""); }}
                      className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-[0.65rem] uppercase tracking-widest text-muted-foreground transition hover:border-[var(--color-gold)]/50 hover:text-[var(--color-gold)]">
                      <Plus className="h-3.5 w-3.5"/> Add Attractions to This Day
                    </button>
                  )
                )}

                {/* Cost estimate */}
                {d.estimated_cost && (
                  <div className="text-right">
                    <span className="text-[0.62rem] uppercase tracking-widest text-muted-foreground">Est. cost: </span>
                    <span className="text-sm font-medium">{d.estimated_cost}</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        {usingSample && (
          <button className="mt-14 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-xs uppercase tracking-widest opacity-70">
            <Plus className="h-4 w-4"/> {t("itinerary.addDay")}
          </button>
        )}

        {!usingSample && user && activeItinerary && (
          <div className="mt-8">
            {addDayForm ? (
              <div className="rounded-3xl border border-[var(--color-gold)]/30 bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-xl">Add New Day</h3>
                  <button onClick={() => setAddDayForm(null)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4"/></button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="eyebrow">Day Number</span>
                    <input type="number" min="1" value={addDayForm.day_number}
                      onChange={(e) => setAddDayForm((f) => ({ ...f, day_number: parseInt(e.target.value) || 1 }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"/>
                  </label>
                  <label className="block">
                    <span className="eyebrow">Title (optional)</span>
                    <input type="text" value={addDayForm.title || ""}
                      onChange={(e) => setAddDayForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. City Exploration"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"/>
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="eyebrow">Notes (optional)</span>
                  <textarea value={addDayForm.narrative || ""} rows={3}
                    onChange={(e) => setAddDayForm((f) => ({ ...f, narrative: e.target.value }))}
                    placeholder="What's planned for this day?"
                    className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"/>
                </label>
                <div className="mt-4 flex justify-end gap-3">
                  <button onClick={() => setAddDayForm(null)}
                    className="rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest hover:bg-muted">Cancel</button>
                  <button onClick={() => addDayMutation.mutate(addDayForm)}
                    disabled={addDayMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-5 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:opacity-60">
                    {addDayMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Plus className="h-3.5 w-3.5"/>}
                    {addDayMutation.isPending ? "Adding…" : "Add Day"}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddDayForm({ day_number: visibleDays.length + 1, title: "", narrative: "" })}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)]/50 px-6 py-3 text-xs uppercase tracking-widest transition hover:bg-[var(--color-gold)]/10">
                <Plus className="h-4 w-4"/> Add Day
              </button>
            )}
          </div>
        )}

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
        raw_id: day.id || null,
        title: day.day_title || day.title || `Day ${index + 1}`,
        detail: day.narrative || day.description || day.detail || "",
        time: day.start_time || day.time || "",
        location: day.location || day.area || "",
        duration: day.duration || "",
        morning: day.morning || day.morning_activities || "",
        afternoon: day.afternoon || day.afternoon_activities || "",
        evening: day.evening || day.evening_activities || "",
        highlights: Array.isArray(day.highlights) ? day.highlights : day.highlights ? [day.highlights] : [],
        tips: day.tips || day.travel_tip || day.local_tip || "",
        meals: day.meals || day.meal_plan || "",
        estimated_cost: day.estimated_cost || day.cost_estimate || "",
        stops: Array.isArray(day.attractions)
          ? day.attractions.map((item) => ({
            id: item.id || null,
            name: item.name || item.attraction_name || item.title || item.attraction?.name || "Attraction",
          }))
          : Array.isArray(day.stops)
          ? day.stops.map((s) => ({ id: null, name: typeof s === "string" ? s : s.name || "Stop" }))
          : [],
      }));
    }
    function formatStatus(status) {
      if (!status)
        return "draft";
      return String(status).replace(/_/g, " ");
    }
