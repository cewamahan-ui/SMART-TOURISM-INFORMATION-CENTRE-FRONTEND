import React, { useState } from "react";
import { attractionsApi } from "@/lib/api";
import { getAttractionReviews } from "./dashboardApi";
import { Plus, Pencil, Trash2, Star, Eye, ChevronDown, ChevronUp, X, PlusCircle, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { KENYA_COUNTIES, KENYA_SUB_COUNTIES, KENYA_TOURISM_TYPES } from "@/lib/kenya-locations";

const CATEGORIES = [
  "museum", "heritage_site", "national_park", "wildlife", "beach",
  "cultural", "restaurant", "shopping", "viewpoint", "adventure",
  "gastronomy", "health_wellness", "ecotourism", "birdwatching",
];

const OWNER_STATUS_OPTIONS = ["draft", "pending"];
const ALL_STATUS_OPTIONS = ["draft", "pending", "approved", "rejected"];

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "wildlife",
  tourism_type: "",
  entry_fee: "",
  media_urls: [""],
  status: "draft",
  destination_id: "",
  is_wheelchair_accessible: false,
  // Location
  county: "",
  sub_county: "",
  ward: "",
  locality: "",
  gps_coordinates: "",
  // Experience highlights
  unique_features: "",
  environmental_impact: "",
  visitor_capacity: "",
  types_of_experiences: "",
  avg_time_spent: "",
  best_visiting_periods: "",
  key_events: "",
  // Situational analysis
  roads_condition: "",
  visitor_center_info: "",
  water_supply: "",
  signage_info: "",
  fencing_security: "",
  parking_area: "",
  rest_areas: "",
  site_current_status: "",
  // Associated services
  tour_operators: "",
  nearby_accommodation: "",
  distance_to_major_town: "",
};

export default function AttractionsPanel({ attractions, businessProfileId, destinations, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [reviews, setReviews] = useState({});
  const [loadingReviews, setLoadingReviews] = useState({});

  const handleFieldChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (attraction) => {
    setEditingId(attraction.id);
    const existing = Array.isArray(attraction.media_urls) && attraction.media_urls.length > 0
      ? attraction.media_urls
      : attraction.image_url ? [attraction.image_url] : [""];
    setForm({
      name: attraction.name || "",
      description: attraction.description || "",
      category: attraction.category || "wildlife",
      tourism_type: attraction.tourism_type || "",
      entry_fee: attraction.entry_fee ?? "",
      media_urls: existing,
      status: attraction.status || "draft",
      destination_id: attraction.destination_id || "",
      is_wheelchair_accessible: attraction.is_wheelchair_accessible || false,
      county: attraction.county || "",
      sub_county: attraction.sub_county || "",
      ward: attraction.ward || "",
      locality: attraction.locality || "",
      gps_coordinates: attraction.gps_coordinates || "",
      unique_features: attraction.unique_features || "",
      environmental_impact: attraction.environmental_impact || "",
      visitor_capacity: attraction.visitor_capacity ?? "",
      types_of_experiences: attraction.types_of_experiences || "",
      avg_time_spent: attraction.avg_time_spent || "",
      best_visiting_periods: attraction.best_visiting_periods || "",
      key_events: attraction.key_events || "",
      roads_condition: attraction.roads_condition || "",
      visitor_center_info: attraction.visitor_center_info || "",
      water_supply: attraction.water_supply || "",
      signage_info: attraction.signage_info || "",
      fencing_security: attraction.fencing_security || "",
      parking_area: attraction.parking_area || "",
      rest_areas: attraction.rest_areas || "",
      site_current_status: attraction.site_current_status || "",
      tour_operators: attraction.tour_operators || "",
      nearby_accommodation: attraction.nearby_accommodation || "",
      distance_to_major_town: attraction.distance_to_major_town || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Attraction name is required"); return; }
    setSaving(true);
    try {
      const cleanUrls = (form.media_urls || []).map((u) => u.trim()).filter(Boolean);
      const coverUrl = cleanUrls[0] || null;
      const locationPayload = {
        county: form.county || null,
        sub_county: form.sub_county || null,
        ward: form.ward || null,
        locality: form.locality || null,
        gps_coordinates: form.gps_coordinates || null,
        tourism_type: form.tourism_type || null,
        unique_features: form.unique_features || null,
        environmental_impact: form.environmental_impact || null,
        visitor_capacity: form.visitor_capacity !== "" ? Number(form.visitor_capacity) : null,
        types_of_experiences: form.types_of_experiences || null,
        avg_time_spent: form.avg_time_spent || null,
        best_visiting_periods: form.best_visiting_periods || null,
        key_events: form.key_events || null,
        roads_condition: form.roads_condition || null,
        visitor_center_info: form.visitor_center_info || null,
        water_supply: form.water_supply || null,
        signage_info: form.signage_info || null,
        fencing_security: form.fencing_security || null,
        parking_area: form.parking_area || null,
        rest_areas: form.rest_areas || null,
        site_current_status: form.site_current_status || null,
        tour_operators: form.tour_operators || null,
        nearby_accommodation: form.nearby_accommodation || null,
        distance_to_major_town: form.distance_to_major_town || null,
      };

      if (editingId) {
        await attractionsApi.update(editingId, {
          name: form.name,
          description: form.description,
          category: form.category,
          entry_fee: form.entry_fee !== "" ? Number(form.entry_fee) : null,
          image_url: coverUrl,
          media_urls: cleanUrls,
          status: form.status,
          is_wheelchair_accessible: form.is_wheelchair_accessible,
          ...locationPayload,
        });
        toast.success("Attraction updated");
      } else {
        const destId = form.destination_id || destinations?.[0]?.id;
        if (!destId) { toast.error("Please select a destination for this attraction."); setSaving(false); return; }
        await attractionsApi.create({
          name: form.name,
          description: form.description,
          category: form.category,
          entry_fee: form.entry_fee !== "" ? Number(form.entry_fee) : null,
          image_url: coverUrl,
          media_urls: cleanUrls,
          status: form.status,
          is_wheelchair_accessible: form.is_wheelchair_accessible,
          destination_id: destId,
          business_owner_id: businessProfileId,
          ...locationPayload,
        });
        toast.success("Attraction created");
      }
      setShowForm(false);
      setEditingId(null);
      onUpdate?.();
    } catch (err) {
      toast.error(err?.message || "Failed to save attraction");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this attraction? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await attractionsApi.delete(id);
      toast.success("Attraction deleted");
      onUpdate?.();
    } catch (err) {
      toast.error(err?.message || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const toggleExpand = async (id) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next && !reviews[next]) {
      setLoadingReviews((p) => ({ ...p, [next]: true }));
      const data = await getAttractionReviews(next);
      setReviews((p) => ({ ...p, [next]: data }));
      setLoadingReviews((p) => ({ ...p, [next]: false }));
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl text-foreground">My Attractions</h2>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-95"
        >
          <Plus className="h-4 w-4" /> Add Attraction
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-[var(--color-gold)]/30 bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl">{editingId ? "Edit Attraction" : "New Attraction"}</h3>
            <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Name *">
                <input
                  value={form.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className="input-base"
                  placeholder="e.g. Nairobi National Park"
                  required
                />
              </FormField>
              <FormField label="Category">
                <select value={form.category} onChange={(e) => handleFieldChange("category", e.target.value)} className="input-base">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </FormField>
              {!editingId && destinations?.length > 0 && (
                <FormField label="Destination *">
                  <select
                    value={form.destination_id}
                    onChange={(e) => handleFieldChange("destination_id", e.target.value)}
                    className="input-base"
                    required
                  >
                    <option value="">— Select destination —</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name || d.canonical_name || d.slug || d.id}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
              <FormField label="Entry Fee (KES)">
                <input
                  type="number"
                  min="0"
                  value={form.entry_fee}
                  onChange={(e) => handleFieldChange("entry_fee", e.target.value)}
                  className="input-base"
                  placeholder="0 for free"
                />
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={(e) => handleFieldChange("status", e.target.value)} className="input-base">
                  {(editingId ? ALL_STATUS_OPTIONS : OWNER_STATUS_OPTIONS).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {!editingId && (
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">
                    Submit as "pending" to request admin approval, or save as "draft" to finish later.
                  </p>
                )}
              </FormField>
              <FormField label="Media URLs (first = cover image)">
                <div className="space-y-2">
                  {(form.media_urls.length === 0 ? [""] : form.media_urls).map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={url}
                        onChange={(e) => {
                          const next = [...form.media_urls];
                          next[idx] = e.target.value;
                          handleFieldChange("media_urls", next);
                        }}
                        className="input-base flex-1"
                        placeholder={idx === 0 ? "https://… (cover image or video)" : "https://… (supporting image or video)"}
                      />
                      {form.media_urls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange("media_urls", form.media_urls.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-600"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleFieldChange("media_urls", [...form.media_urls, ""])}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Add another URL
                  </button>
                </div>
                <p className="mt-1 text-[0.65rem] text-muted-foreground">Supports image and video URLs. First URL is shown as the cover.</p>
              </FormField>
            </div>
            <FormField label="Description">
              <textarea
                value={form.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                rows={3}
                className="input-base resize-none"
                placeholder="Describe the attraction…"
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_wheelchair_accessible}
                onChange={(e) => handleFieldChange("is_wheelchair_accessible", e.target.checked)}
                className="h-4 w-4 rounded"
              />
              Wheelchair accessible
            </label>

            {/* Location Section */}
            <SectionDivider title="Location (Kenya)" />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="County">
                <select value={form.county}
                  onChange={(e) => handleFieldChange("county", e.target.value) || handleFieldChange("sub_county", "")}
                  className="input-base">
                  <option value="">— Select County —</option>
                  {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Sub-County">
                {form.county && (KENYA_SUB_COUNTIES[form.county] || []).length > 0 ? (
                  <select value={form.sub_county} onChange={(e) => handleFieldChange("sub_county", e.target.value)} className="input-base">
                    <option value="">— Select Sub-County —</option>
                    {(KENYA_SUB_COUNTIES[form.county] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={form.sub_county} onChange={(e) => handleFieldChange("sub_county", e.target.value)} className="input-base" placeholder="Sub-county" />
                )}
              </FormField>
              <FormField label="Ward">
                <input value={form.ward} onChange={(e) => handleFieldChange("ward", e.target.value)} className="input-base" placeholder="Ward name" />
              </FormField>
              <FormField label="Sub-Location / Locality">
                <input value={form.locality} onChange={(e) => handleFieldChange("locality", e.target.value)} className="input-base" placeholder="Locality name" />
              </FormField>
              <FormField label="GPS Coordinates (Lat/Long)">
                <input value={form.gps_coordinates} onChange={(e) => handleFieldChange("gps_coordinates", e.target.value)} className="input-base" placeholder="e.g. -1.2921, 36.8219" />
              </FormField>
              <FormField label="Tourism Type">
                <select value={form.tourism_type} onChange={(e) => handleFieldChange("tourism_type", e.target.value)} className="input-base">
                  <option value="">— Select Type —</option>
                  {KENYA_TOURISM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
            </div>

            {/* Experience Highlights Section */}
            <SectionDivider title="Experience Highlights" />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Unique Features">
                <textarea value={form.unique_features} onChange={(e) => handleFieldChange("unique_features", e.target.value)} rows={2} className="input-base resize-none" placeholder="What makes this attraction unique…" />
              </FormField>
              <FormField label="Environmental Impact & Conservation">
                <textarea value={form.environmental_impact} onChange={(e) => handleFieldChange("environmental_impact", e.target.value)} rows={2} className="input-base resize-none" placeholder="Conservation efforts, environmental impact…" />
              </FormField>
              <FormField label="Max Visitor Capacity">
                <input type="number" min="0" value={form.visitor_capacity} onChange={(e) => handleFieldChange("visitor_capacity", e.target.value)} className="input-base" placeholder="Max sustainable visitors" />
              </FormField>
              <FormField label="Types of Experiences">
                <input value={form.types_of_experiences} onChange={(e) => handleFieldChange("types_of_experiences", e.target.value)} className="input-base" placeholder="e.g. guided tours, self-exploration, special events" />
              </FormField>
              <FormField label="Average Time at Site">
                <input value={form.avg_time_spent} onChange={(e) => handleFieldChange("avg_time_spent", e.target.value)} className="input-base" placeholder="e.g. 2-3 hours" />
              </FormField>
              <FormField label="Best Visiting Periods">
                <input value={form.best_visiting_periods} onChange={(e) => handleFieldChange("best_visiting_periods", e.target.value)} className="input-base" placeholder="e.g. July–October, year-round" />
              </FormField>
              <FormField label="Key Events / Festivals">
                <input value={form.key_events} onChange={(e) => handleFieldChange("key_events", e.target.value)} className="input-base" placeholder="Key events or seasonal activities" />
              </FormField>
            </div>

            {/* Situational Analysis Section */}
            <SectionDivider title="Situational Analysis" />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Roads (Access & Condition)">
                <input value={form.roads_condition} onChange={(e) => handleFieldChange("roads_condition", e.target.value)} className="input-base" placeholder="e.g. Tarmac road, good condition" />
              </FormField>
              <FormField label="Visitor Centre / Info Kiosks">
                <input value={form.visitor_center_info} onChange={(e) => handleFieldChange("visitor_center_info", e.target.value)} className="input-base" placeholder="Visitor centre availability…" />
              </FormField>
              <FormField label="Water Supply">
                <input value={form.water_supply} onChange={(e) => handleFieldChange("water_supply", e.target.value)} className="input-base" placeholder="e.g. Borehole, piped water available" />
              </FormField>
              <FormField label="Signage & Interpretation">
                <input value={form.signage_info} onChange={(e) => handleFieldChange("signage_info", e.target.value)} className="input-base" placeholder="Signage quality and language…" />
              </FormField>
              <FormField label="Fencing & Security">
                <input value={form.fencing_security} onChange={(e) => handleFieldChange("fencing_security", e.target.value)} className="input-base" placeholder="Security measures…" />
              </FormField>
              <FormField label="Parking Area">
                <input value={form.parking_area} onChange={(e) => handleFieldChange("parking_area", e.target.value)} className="input-base" placeholder="Parking availability…" />
              </FormField>
              <FormField label="Rest Areas / Toilets">
                <input value={form.rest_areas} onChange={(e) => handleFieldChange("rest_areas", e.target.value)} className="input-base" placeholder="Toilet facilities availability…" />
              </FormField>
              <FormField label="Site Current Status">
                <select value={form.site_current_status} onChange={(e) => handleFieldChange("site_current_status", e.target.value)} className="input-base">
                  <option value="">— Select Status —</option>
                  <option value="Active">Active</option>
                  <option value="Under Development">Under Development</option>
                  <option value="Temporarily Closed">Temporarily Closed</option>
                  <option value="Seasonal">Seasonal</option>
                </select>
              </FormField>
            </div>

            {/* Associated Services Section */}
            <SectionDivider title="Associated Services" />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Tour Operators Serving the Site">
                <input value={form.tour_operators} onChange={(e) => handleFieldChange("tour_operators", e.target.value)} className="input-base" placeholder="Tour operator names…" />
              </FormField>
              <FormField label="Nearby Accommodation Facilities">
                <input value={form.nearby_accommodation} onChange={(e) => handleFieldChange("nearby_accommodation", e.target.value)} className="input-base" placeholder="Nearby hotels, lodges…" />
              </FormField>
              <FormField label="Distance to Major Town / Tourism Hub">
                <input value={form.distance_to_major_town} onChange={(e) => handleFieldChange("distance_to_major_town", e.target.value)} className="input-base" placeholder="e.g. 15km from Nairobi CBD" />
              </FormField>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[var(--color-gold)] px-5 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:opacity-60"
              >
                {saving ? "Saving…" : editingId ? "Update" : "Create Attraction"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-widest hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {attractions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          <p className="text-sm">No attractions yet. Add your first attraction above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attractions.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {(a.image_url || (Array.isArray(a.media_urls) && a.media_urls[0])) && (
                  <img
                    src={a.image_url || a.media_urls[0]}
                    alt={a.name}
                    className="h-14 w-14 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground truncate">{a.name}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {a.category && <span className="capitalize">{a.category.replace(/_/g, " ")}</span>}
                    {a.entry_fee != null && (
                      <span>KES {Number(a.entry_fee).toLocaleString()}</span>
                    )}
                    {a.avg_rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {Number(a.avg_rating).toFixed(1)}
                      </span>
                    )}
                    {a.view_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {a.view_count.toLocaleString()} views
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleExpand(a.id)}
                    className="rounded-full p-1.5 hover:bg-muted text-muted-foreground"
                    title="View feedback"
                  >
                    {expandedId === a.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(a)}
                    className="rounded-full p-1.5 hover:bg-muted text-muted-foreground"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deleting === a.id}
                    className="rounded-full p-1.5 hover:bg-red-50 text-red-400 disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedId === a.id && (
                <div className="border-t border-border bg-muted/30 p-4">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Visitor Feedback</h4>
                  {loadingReviews[a.id] ? (
                    <p className="text-xs text-muted-foreground">Loading reviews…</p>
                  ) : !reviews[a.id] || reviews[a.id].length === 0 ? (
                    <p className="text-xs text-muted-foreground">No reviews yet for this attraction.</p>
                  ) : (
                    <div className="space-y-2">
                      {reviews[a.id].slice(0, 5).map((r) => (
                        <div key={r.id} className="rounded-lg border border-border bg-card p-3">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                  key={n}
                                  className={`h-3 w-3 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                            </span>
                          </div>
                          {r.comment && <p className="mt-1 text-xs text-foreground">{r.comment}</p>}
                        </div>
                      ))}
                      {reviews[a.id].length > 5 && (
                        <p className="text-xs text-muted-foreground">+{reviews[a.id].length - 5} more reviews</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SectionDivider({ title }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-foreground">{title}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    approved: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
    draft: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-widest font-semibold ${map[status] || "bg-muted text-muted-foreground"}`}>
      {status || "unknown"}
    </span>
  );
}
