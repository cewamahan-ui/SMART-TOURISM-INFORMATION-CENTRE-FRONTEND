import React, { useState } from "react";
import { attractionsApi } from "@/lib/api";
import { getAttractionReviews } from "./dashboardApi";
import { Plus, Pencil, Trash2, Star, Eye, ChevronDown, ChevronUp, X, PlusCircle, MinusCircle } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "museum", "heritage_site", "national_park", "wildlife", "beach",
  "cultural", "restaurant", "shopping", "viewpoint", "adventure",
  "gastronomy", "health_wellness", "ecotourism", "birdwatching",
];

// Business owners can only submit as draft or pending — admin sets approved/rejected
const OWNER_STATUS_OPTIONS = ["draft", "pending"];
const ALL_STATUS_OPTIONS = ["draft", "pending", "approved", "rejected"];

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "wildlife",
  entry_fee: "",
  media_urls: [""],  // first entry = cover image; others = supporting media
  status: "draft",
  destination_id: "",
  is_wheelchair_accessible: false,
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
    // Reconstruct media_urls: use existing array or fall back to image_url as first entry
    const existing = Array.isArray(attraction.media_urls) && attraction.media_urls.length > 0
      ? attraction.media_urls
      : attraction.image_url ? [attraction.image_url] : [""];
    setForm({
      name: attraction.name || "",
      description: attraction.description || "",
      category: attraction.category || "wildlife",
      entry_fee: attraction.entry_fee ?? "",
      media_urls: existing,
      status: attraction.status || "draft",
      destination_id: attraction.destination_id || "",
      is_wheelchair_accessible: attraction.is_wheelchair_accessible || false,
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
