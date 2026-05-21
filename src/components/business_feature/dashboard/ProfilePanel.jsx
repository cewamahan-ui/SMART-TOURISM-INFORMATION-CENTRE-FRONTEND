import React, { useState } from "react";
import { businessApi } from "@/lib/api";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";

// Valid values from backend BusinessRegistrationRequestCreateSchema
const BUSINESS_TYPES = [
  { value: "hotel", label: "Hotel / Accommodation" },
  { value: "restaurant", label: "Restaurant / Food & Beverage" },
  { value: "tour_operator", label: "Tour Operator" },
  { value: "transport", label: "Transport Provider" },
  { value: "attraction", label: "Attraction / Activity" },
  { value: "other", label: "Other" },
];

const REG_STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    label: "Pending Review",
    message: "Your registration request has been submitted and is awaiting admin approval. You will get access to your business profile once approved.",
  },
  approved: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    label: "Approved",
    message: "Your registration was approved. Your business profile is now active.",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    label: "Rejected",
    message: "Your registration was rejected. You can update your details and resubmit.",
  },
  suspended: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    label: "Suspended",
    message: "Your registration has been suspended. Contact support for more information.",
  },
};

export default function ProfilePanel({ profile, registration, onProfileUpdate, onRegistrationUpdate }) {
  const [mode, setMode] = useState("view"); // view | register | edit
  const [regForm, setRegForm] = useState({
    business_name: "",
    business_type: "attraction",
  });
  const [editForm, setEditForm] = useState({
    business_name: profile?.business_name || "",
    business_type: profile?.business_type || "attraction",
    description: profile?.description || "",
    address: profile?.address || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Submit registration request ──────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.business_name.trim()) { setError("Business name is required"); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await businessApi.registrations.submit({
        business_name: regForm.business_name.trim(),
        business_type: regForm.business_type,
      });
      toast.success("Registration submitted! Awaiting admin approval.");
      // result has {message, registration}
      const reg = result?.registration || result;
      onRegistrationUpdate?.(reg);
      setMode("view");
    } catch (err) {
      const msg = err?.details?.fields
        ? Object.values(err.details.fields).flat().join(", ")
        : err?.message || "Failed to submit registration";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Update existing profile ──────────────────────────────────────────────
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editForm.business_name.trim()) { setError("Business name is required"); return; }
    setLoading(true);
    setError(null);
    try {
      await businessApi.profiles.update({
        business_name: editForm.business_name.trim(),
        business_type: editForm.business_type,
        description: editForm.description || undefined,
        address: editForm.address || undefined,
        phone: editForm.phone || undefined,
        email: editForm.email || undefined,
      });
      toast.success("Profile updated");
      // Re-fetch the fresh profile
      const fresh = await businessApi.profiles.list();
      const freshProfile = Array.isArray(fresh) ? null : (fresh?.profile || null);
      onProfileUpdate?.(freshProfile);
      setMode("view");
    } catch (err) {
      setError(err?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const regStatus = registration?.status;
  const regConfig = REG_STATUS_CONFIG[regStatus];

  // ── View mode: no profile, no registration → show register CTA ──────────
  if (!profile && !registration && mode === "view") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h3 className="font-display text-2xl text-foreground">Register Your Business</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Submit a registration request to become a verified business owner. Once approved by an admin, you can manage your attractions.
          </p>
          <button
            onClick={() => setMode("register")}
            className="mt-5 inline-flex rounded-full bg-[var(--color-gold)] px-6 py-2.5 text-xs uppercase tracking-widest text-[var(--color-ink)]"
          >
            Register Business
          </button>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  if (mode === "register") {
    return (
      <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-card p-6">
        <h3 className="mb-5 font-display text-2xl">Register Your Business</h3>
        <p className="mb-5 text-sm text-muted-foreground">
          Fill in your business details. An admin will review your request and approve or reject it.
        </p>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Business Name *">
              <input
                value={regForm.business_name}
                onChange={(e) => setRegForm({ ...regForm, business_name: e.target.value })}
                className="input-base"
                placeholder="e.g. Safari Adventures Ltd"
                required
              />
            </FormField>
            <FormField label="Business Type *">
              <select
                value={regForm.business_type}
                onChange={(e) => setRegForm({ ...regForm, business_type: e.target.value })}
                className="input-base"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </FormField>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[var(--color-gold)] px-5 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Submit Registration"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("view"); setError(null); }}
              className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-widest hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Edit profile form ────────────────────────────────────────────────────
  if (mode === "edit" && profile) {
    return (
      <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-card p-6">
        <h3 className="mb-5 font-display text-2xl">Edit Business Profile</h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Business Name *">
              <input
                value={editForm.business_name}
                onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                className="input-base"
                required
              />
            </FormField>
            <FormField label="Business Type">
              <select
                value={editForm.business_type}
                onChange={(e) => setEditForm({ ...editForm, business_type: e.target.value })}
                className="input-base"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Address">
              <input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="input-base"
                placeholder="Physical address"
              />
            </FormField>
            <FormField label="Phone">
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="input-base"
                placeholder="+254 700 000 000"
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="input-base"
                placeholder="contact@yourbusiness.com"
              />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="input-base resize-none"
              placeholder="Brief description of your business…"
            />
          </FormField>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[var(--color-gold)] px-5 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("view"); setError(null); }}
              className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-widest hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── View mode ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Registration status banner */}
      {registration && regConfig && (
        <div className={`rounded-2xl border p-4 ${regConfig.bg}`}>
          <div className={`flex items-center gap-2 font-semibold text-sm ${regConfig.color}`}>
            <regConfig.icon className="h-4 w-4" />
            Registration: {regConfig.label}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{regConfig.message}</p>
          {registration.rejection_reason && (
            <p className="mt-1 text-xs text-red-600">Reason: {registration.rejection_reason}</p>
          )}
          {regStatus === "rejected" && (
            <button
              onClick={() => setMode("register")}
              className="mt-2 inline-flex items-center gap-1 text-xs text-amber-700 underline"
            >
              <RefreshCw className="h-3 w-3" /> Resubmit
            </button>
          )}
        </div>
      )}

      {/* Profile card */}
      {profile && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-foreground">
                {profile.business_name || "—"}
              </h2>
              {profile.business_type && (
                <p className="mt-1 text-sm text-muted-foreground capitalize">
                  {BUSINESS_TYPES.find((t) => t.value === profile.business_type)?.label || profile.business_type}
                </p>
              )}
              {profile.description && (
                <p className="mt-3 text-sm text-foreground">{profile.description}</p>
              )}
              {profile.address && (
                <p className="mt-2 text-xs text-muted-foreground">📍 {profile.address}</p>
              )}
              {(profile.phone || profile.email) && (
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {profile.phone && <span>📞 {profile.phone}</span>}
                  {profile.email && <span>✉ {profile.email}</span>}
                </div>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-widest font-semibold ${
                profile.verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {profile.verified ? "Verified" : "Unverified"}
            </span>
          </div>
          <button
            onClick={() => {
              setEditForm({
                business_name: profile.business_name || "",
                business_type: profile.business_type || "attraction",
                description: profile.description || "",
                address: profile.address || "",
                phone: profile.phone || "",
                email: profile.email || "",
              });
              setMode("edit");
            }}
            className="mt-5 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest hover:bg-muted"
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* No profile but no registration either — shouldn't normally reach here */}
      {!profile && !registration && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
          No business profile found.{" "}
          <button onClick={() => setMode("register")} className="underline">Register your business</button>.
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
