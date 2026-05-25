import React, { useState } from "react";
import { businessApi } from "@/lib/api";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, RefreshCw, MapPin, Phone, Globe, Building2 } from "lucide-react";
import { KENYA_COUNTIES, KENYA_SUB_COUNTIES, KENYA_TOURISM_TYPES } from "@/lib/kenya-locations";

// Valid values from backend BusinessRegistrationRequestCreateSchema
const BUSINESS_TYPES = [
  { value: "hotel", label: "Hotel / Accommodation" },
  { value: "restaurant", label: "Restaurant / Food & Beverage" },
  { value: "tour_operator", label: "Tour Operator" },
  { value: "transport", label: "Transport Provider" },
  { value: "attraction", label: "Attraction / Activity" },
  { value: "culture_hub", label: "Cultural / Community Enterprise" },
  { value: "conservation", label: "Conservation / Wildlife" },
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
    tourism_type: "",
    county: "",
    sub_county: "",
    ward: "",
    locality: "",
    gps_coordinates: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    license_number: "",
    year_established: "",
    distance_to_major_town: "",
    unique_features: "",
  });
  const [editForm, setEditForm] = useState({
    business_name: profile?.business_name || "",
    business_type: profile?.business_type || "attraction",
    tourism_type: profile?.tourism_type || "",
    description: profile?.description || "",
    address: profile?.address || "",
    county: profile?.county || "",
    sub_county: profile?.sub_county || "",
    ward: profile?.ward || "",
    locality: profile?.locality || "",
    gps_coordinates: profile?.gps_coordinates || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
    website: profile?.website || "",
    license_number: profile?.license_number || "",
    year_established: profile?.year_established || "",
    distance_to_major_town: profile?.distance_to_major_town || "",
    unique_features: profile?.unique_features || "",
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
        registration_doc: {
          tourism_type: regForm.tourism_type || undefined,
          county: regForm.county || undefined,
          sub_county: regForm.sub_county || undefined,
          ward: regForm.ward || undefined,
          locality: regForm.locality || undefined,
          gps_coordinates: regForm.gps_coordinates || undefined,
          phone: regForm.phone || undefined,
          email: regForm.email || undefined,
          website: regForm.website || undefined,
          description: regForm.description || undefined,
          license_number: regForm.license_number || undefined,
          year_established: regForm.year_established || undefined,
          distance_to_major_town: regForm.distance_to_major_town || undefined,
          unique_features: regForm.unique_features || undefined,
        },
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
        tourism_type: editForm.tourism_type || undefined,
        description: editForm.description || undefined,
        address: editForm.address || undefined,
        county: editForm.county || undefined,
        sub_county: editForm.sub_county || undefined,
        ward: editForm.ward || undefined,
        locality: editForm.locality || undefined,
        gps_coordinates: editForm.gps_coordinates || undefined,
        phone: editForm.phone || undefined,
        email: editForm.email || undefined,
        website: editForm.website || undefined,
        license_number: editForm.license_number || undefined,
        year_established: editForm.year_established || undefined,
        distance_to_major_town: editForm.distance_to_major_town || undefined,
        unique_features: editForm.unique_features || undefined,
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
        <form onSubmit={handleRegister} className="space-y-6">
          {/* Basic Info */}
          <RegSection title="Basic Information" icon={<Building2 className="h-4 w-4" />}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Business / Product Name *">
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
              <FormField label="Tourism Type">
                <select
                  value={regForm.tourism_type}
                  onChange={(e) => setRegForm({ ...regForm, tourism_type: e.target.value })}
                  className="input-base"
                >
                  <option value="">Select tourism type…</option>
                  {KENYA_TOURISM_TYPES.map((tt) => (
                    <option key={tt} value={tt}>{tt}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="License / Registration No.">
                <input
                  value={regForm.license_number}
                  onChange={(e) => setRegForm({ ...regForm, license_number: e.target.value })}
                  className="input-base"
                  placeholder="e.g. TRB/2024/00123"
                />
              </FormField>
              <FormField label="Year Established">
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={regForm.year_established}
                  onChange={(e) => setRegForm({ ...regForm, year_established: e.target.value })}
                  className="input-base"
                  placeholder="e.g. 2015"
                />
              </FormField>
            </div>
            <FormField label="Description / Product Overview">
              <textarea
                value={regForm.description}
                onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
                rows={3}
                className="input-base resize-none"
                placeholder="Brief description of your tourism product or service…"
              />
            </FormField>
            <FormField label="Unique Features / Selling Points">
              <textarea
                value={regForm.unique_features}
                onChange={(e) => setRegForm({ ...regForm, unique_features: e.target.value })}
                rows={2}
                className="input-base resize-none"
                placeholder="What makes your business/product stand out?"
              />
            </FormField>
          </RegSection>

          {/* Location */}
          <RegSection title="Location" icon={<MapPin className="h-4 w-4" />}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="County *">
                <select
                  value={regForm.county}
                  onChange={(e) => setRegForm({ ...regForm, county: e.target.value, sub_county: "", ward: "" })}
                  className="input-base"
                >
                  <option value="">Select county…</option>
                  {KENYA_COUNTIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Sub-County">
                {regForm.county && KENYA_SUB_COUNTIES[regForm.county]?.length > 0 ? (
                  <select
                    value={regForm.sub_county}
                    onChange={(e) => setRegForm({ ...regForm, sub_county: e.target.value })}
                    className="input-base"
                  >
                    <option value="">Select sub-county…</option>
                    {KENYA_SUB_COUNTIES[regForm.county].map((sc) => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={regForm.sub_county}
                    onChange={(e) => setRegForm({ ...regForm, sub_county: e.target.value })}
                    className="input-base"
                    placeholder="Sub-county name"
                  />
                )}
              </FormField>
              <FormField label="Ward">
                <input
                  value={regForm.ward}
                  onChange={(e) => setRegForm({ ...regForm, ward: e.target.value })}
                  className="input-base"
                  placeholder="Ward name"
                />
              </FormField>
              <FormField label="Locality / Nearest Landmark">
                <input
                  value={regForm.locality}
                  onChange={(e) => setRegForm({ ...regForm, locality: e.target.value })}
                  className="input-base"
                  placeholder="e.g. Near Nairobi National Park"
                />
              </FormField>
              <FormField label="GPS Coordinates">
                <input
                  value={regForm.gps_coordinates}
                  onChange={(e) => setRegForm({ ...regForm, gps_coordinates: e.target.value })}
                  className="input-base"
                  placeholder="e.g. -1.2921, 36.8219"
                />
              </FormField>
              <FormField label="Distance to Major Town / Tourism Hub">
                <input
                  value={regForm.distance_to_major_town}
                  onChange={(e) => setRegForm({ ...regForm, distance_to_major_town: e.target.value })}
                  className="input-base"
                  placeholder="e.g. 15 km from Nairobi"
                />
              </FormField>
            </div>
          </RegSection>

          {/* Contact */}
          <RegSection title="Contact Information" icon={<Phone className="h-4 w-4" />}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Phone Number">
                <input
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  className="input-base"
                  placeholder="+254 700 000 000"
                />
              </FormField>
              <FormField label="Email Address">
                <input
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="input-base"
                  placeholder="contact@yourbusiness.com"
                />
              </FormField>
              <FormField label="Website">
                <input
                  type="url"
                  value={regForm.website}
                  onChange={(e) => setRegForm({ ...regForm, website: e.target.value })}
                  className="input-base"
                  placeholder="https://www.yourbusiness.com"
                />
              </FormField>
            </div>
          </RegSection>

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
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Basic Info */}
          <RegSection title="Basic Information" icon={<Building2 className="h-4 w-4" />}>
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
              <FormField label="Tourism Type">
                <select
                  value={editForm.tourism_type}
                  onChange={(e) => setEditForm({ ...editForm, tourism_type: e.target.value })}
                  className="input-base"
                >
                  <option value="">Select tourism type…</option>
                  {KENYA_TOURISM_TYPES.map((tt) => (
                    <option key={tt} value={tt}>{tt}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="License / Registration No.">
                <input
                  value={editForm.license_number}
                  onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                  className="input-base"
                  placeholder="e.g. TRB/2024/00123"
                />
              </FormField>
              <FormField label="Year Established">
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={editForm.year_established}
                  onChange={(e) => setEditForm({ ...editForm, year_established: e.target.value })}
                  className="input-base"
                  placeholder="e.g. 2015"
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
            <FormField label="Unique Features / Selling Points">
              <textarea
                value={editForm.unique_features}
                onChange={(e) => setEditForm({ ...editForm, unique_features: e.target.value })}
                rows={2}
                className="input-base resize-none"
                placeholder="What makes your business/product stand out?"
              />
            </FormField>
          </RegSection>

          {/* Location */}
          <RegSection title="Location" icon={<MapPin className="h-4 w-4" />}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="County">
                <select
                  value={editForm.county}
                  onChange={(e) => setEditForm({ ...editForm, county: e.target.value, sub_county: "", ward: "" })}
                  className="input-base"
                >
                  <option value="">Select county…</option>
                  {KENYA_COUNTIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Sub-County">
                {editForm.county && KENYA_SUB_COUNTIES[editForm.county]?.length > 0 ? (
                  <select
                    value={editForm.sub_county}
                    onChange={(e) => setEditForm({ ...editForm, sub_county: e.target.value })}
                    className="input-base"
                  >
                    <option value="">Select sub-county…</option>
                    {KENYA_SUB_COUNTIES[editForm.county].map((sc) => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={editForm.sub_county}
                    onChange={(e) => setEditForm({ ...editForm, sub_county: e.target.value })}
                    className="input-base"
                    placeholder="Sub-county name"
                  />
                )}
              </FormField>
              <FormField label="Ward">
                <input
                  value={editForm.ward}
                  onChange={(e) => setEditForm({ ...editForm, ward: e.target.value })}
                  className="input-base"
                  placeholder="Ward name"
                />
              </FormField>
              <FormField label="Locality / Nearest Landmark">
                <input
                  value={editForm.locality}
                  onChange={(e) => setEditForm({ ...editForm, locality: e.target.value })}
                  className="input-base"
                  placeholder="e.g. Near Nairobi National Park"
                />
              </FormField>
              <FormField label="Address">
                <input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="input-base"
                  placeholder="Physical / postal address"
                />
              </FormField>
              <FormField label="GPS Coordinates">
                <input
                  value={editForm.gps_coordinates}
                  onChange={(e) => setEditForm({ ...editForm, gps_coordinates: e.target.value })}
                  className="input-base"
                  placeholder="e.g. -1.2921, 36.8219"
                />
              </FormField>
              <FormField label="Distance to Major Town">
                <input
                  value={editForm.distance_to_major_town}
                  onChange={(e) => setEditForm({ ...editForm, distance_to_major_town: e.target.value })}
                  className="input-base"
                  placeholder="e.g. 15 km from Nairobi"
                />
              </FormField>
            </div>
          </RegSection>

          {/* Contact */}
          <RegSection title="Contact Information" icon={<Phone className="h-4 w-4" />}>
            <div className="grid gap-4 md:grid-cols-2">
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
              <FormField label="Website">
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="input-base"
                  placeholder="https://www.yourbusiness.com"
                />
              </FormField>
            </div>
          </RegSection>

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
              {(profile.county || profile.address) && (
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {[profile.county, profile.sub_county, profile.ward, profile.address].filter(Boolean).join(", ")}
                </p>
              )}
              {(profile.phone || profile.email || profile.website) && (
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {profile.phone}</span>}
                  {profile.email && <span>✉ {profile.email}</span>}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 underline underline-offset-2">
                      <Globe className="h-3 w-3" /> Website
                    </a>
                  )}
                </div>
              )}
              {profile.tourism_type && (
                <p className="mt-2 text-xs text-muted-foreground">Tourism Type: {profile.tourism_type}</p>
              )}
              {profile.unique_features && (
                <p className="mt-2 text-xs text-foreground/80 italic">{profile.unique_features}</p>
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
                tourism_type: profile.tourism_type || "",
                description: profile.description || "",
                address: profile.address || "",
                county: profile.county || "",
                sub_county: profile.sub_county || "",
                ward: profile.ward || "",
                locality: profile.locality || "",
                gps_coordinates: profile.gps_coordinates || "",
                phone: profile.phone || "",
                email: profile.email || "",
                website: profile.website || "",
                license_number: profile.license_number || "",
                year_established: profile.year_established || "",
                distance_to_major_town: profile.distance_to_major_town || "",
                unique_features: profile.unique_features || "",
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

function RegSection({ title, icon, children }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-[var(--color-gold)]">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}
