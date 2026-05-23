import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth-context";
import {
  usersApi, bookingsApi, attractionsApi, businessApi,
  kioskApi, qrCodesApi, auditApi, rbacApi, feedbackApi, destinationsApi,
} from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Bookmark, Building2, Monitor,
  QrCode, FileText, Shield, CalendarCheck, RefreshCw,
  CheckCircle, XCircle, Trash2, Eye, ChevronDown, ChevronUp,
  Search, RotateCcw, Plus, X, MapPin, Info, TrendingUp, Phone,
} from "lucide-react";
import { KENYA_COUNTIES, KENYA_SUB_COUNTIES } from "@/lib/kenya-locations";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/admin-dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — SafariSmart" }] }),
  component: AdminDashboard,
});

const TABS = [
  { id: "overview",      label: "Overview",         icon: LayoutDashboard },
  { id: "registrations", label: "Biz Registrations", icon: Building2 },
  { id: "attractions",   label: "Attractions",       icon: Bookmark },
  { id: "bookings",      label: "Bookings",          icon: CalendarCheck },
  { id: "users",         label: "Users",             icon: Users },
  { id: "kiosks",        label: "Kiosks",            icon: Monitor },
  { id: "qrcodes",       label: "QR Codes",          icon: QrCode },
  { id: "audit",         label: "Audit Logs",        icon: FileText },
  { id: "roles",         label: "Roles & Perms",     icon: Shield },
  { id: "emergency",     label: "Emergency Contacts", icon: Phone },
];

function unwrap(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.items)) return result.items;
  if (Array.isArray(result.registrations)) return result.registrations;
  if (Array.isArray(result.users)) return result.users;
  if (Array.isArray(result.kiosks)) return result.kiosks;
  if (Array.isArray(result.roles)) return result.roles;
  if (Array.isArray(result.permissions)) return result.permissions;
  if (Array.isArray(result.audit_logs)) return result.audit_logs;
  if (Array.isArray(result.bookings)) return result.bookings;
  return [];
}

function useAdminFetch(fetchFn, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(unwrap(result));
    } catch (e) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}

function SectionShell({ title, children, onReload, loading }) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        {onReload && (
          <button onClick={onReload} disabled={loading} className="rounded-full border border-border p-1.5 hover:bg-muted disabled:opacity-40">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ msg = "No records found." }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {msg}
    </div>
  );
}

function LoadingState() {
  return <div className="flex justify-center py-16 text-sm text-muted-foreground">Loading…</div>;
}

function ErrorState({ msg, onRetry }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
      {msg}
      {onRetry && <button onClick={onRetry} className="underline ml-4">Retry</button>}
    </div>
  );
}

const STATUS_BADGE = {
  approved: "bg-emerald-100 text-emerald-700",
  active:   "bg-emerald-100 text-emerald-700",
  confirmed:"bg-emerald-100 text-emerald-700",
  completed:"bg-blue-100 text-blue-700",
  pending:  "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  cancelled:"bg-red-100 text-red-700",
  suspended:"bg-red-100 text-red-700",
  draft:    "bg-gray-100 text-gray-600",
  inactive: "bg-gray-100 text-gray-600",
  revoked:  "bg-red-100 text-red-700",
};

function Badge({ status }) {
  const s = String(status || "").toLowerCase();
  return (
    <span className={`rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-widest font-semibold ${STATUS_BADGE[s] || "bg-muted text-muted-foreground"}`}>
      {status || "—"}
    </span>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-muted-foreground whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>;
}

const CHART_COLORS = ["#c9a84c", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      usersApi.admin.list(),
      bookingsApi.adminList(),
      attractionsApi.list({ include_all: "true", per_page: 100 }),
      businessApi.admin.registrations(),
      kioskApi.admin.list(),
    ]).then(([users, bookings, attractions, registrations, kiosks]) => {
      const u = unwrap(users.value);
      const b = unwrap(bookings.value);
      const a = unwrap(attractions.value);
      const r = unwrap(registrations.value);
      const k = unwrap(kiosks.value);
      setStats({
        users: u.length, bookings: b.length, attractions: a.length,
        registrations: r.length, kiosks: k.length,
      });
      setRawData({ users: u, bookings: b, attractions: a, registrations: r, kiosks: k });
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState />;

  const cards = [
    { label: "Users",        value: stats.users,         tab: "users",         color: "from-blue-50 dark:from-blue-950/20",   icon: Users },
    { label: "Bookings",     value: stats.bookings,      tab: "bookings",      color: "from-amber-50 dark:from-amber-950/20", icon: CalendarCheck },
    { label: "Attractions",  value: stats.attractions,   tab: "attractions",   color: "from-emerald-50 dark:from-emerald-950/20", icon: Bookmark },
    { label: "Biz Requests", value: stats.registrations, tab: "registrations", color: "from-purple-50 dark:from-purple-950/20", icon: Building2 },
    { label: "Kiosks",       value: stats.kiosks,        tab: "kiosks",        color: "from-rose-50 dark:from-rose-950/20",   icon: Monitor },
  ];

  // Bar chart data
  const barData = cards.map(({ label, value }) => ({ name: label, count: value }));

  // Booking status breakdown
  const bookingStatusMap = (rawData?.bookings || []).reduce((acc, b) => {
    const s = b.status || "pending";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const bookingPieData = Object.entries(bookingStatusMap).map(([name, value]) => ({ name, value }));

  // Registration status breakdown
  const regStatusMap = (rawData?.registrations || []).reduce((acc, r) => {
    const s = r.status || "pending";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const regPieData = Object.entries(regStatusMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(({ label, value, tab, color, icon: Icon }) => (
          <button key={tab} onClick={() => onNavigate(tab)}
            className={`rounded-2xl border border-border bg-gradient-to-b ${color} to-card p-5 text-left transition hover:border-[var(--color-gold)]/60 hover:shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <TrendingUp className="h-3.5 w-3.5 text-[var(--color-gold)]" />
            </div>
            <div className="font-display text-4xl text-foreground">{value}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Platform overview bar chart */}
        <div className="lg:col-span-1 rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-xl mb-1">Platform Overview</h3>
          <p className="text-xs text-muted-foreground mb-5">Total entities by category</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking status pie */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-xl mb-1">Booking Status</h3>
          <p className="text-xs text-muted-foreground mb-5">Distribution across all bookings</p>
          {bookingPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={bookingPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {bookingPieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No bookings yet</div>
          )}
        </div>

        {/* Business registrations pie */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-xl mb-1">Business Requests</h3>
          <p className="text-xs text-muted-foreground mb-5">Registration status breakdown</p>
          {regPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={regPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {regPieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No requests yet</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-xl mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <ActionBtn onClick={() => onNavigate("registrations")}>Review Business Registrations</ActionBtn>
          <ActionBtn onClick={() => onNavigate("attractions")}>Approve Attractions</ActionBtn>
          <ActionBtn onClick={() => onNavigate("audit")}>View Audit Logs</ActionBtn>
          <ActionBtn onClick={() => onNavigate("kiosks")}>Monitor Kiosks</ActionBtn>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick }) {
  return (
    <button onClick={onClick}
      className="rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest hover:bg-muted transition">
      {children}
    </button>
  );
}

// ── Business Registrations ───────────────────────────────────────────────────
function RegistrationsTab() {
  const { data, loading, error, reload } = useAdminFetch(businessApi.admin.registrations);
  const [acting, setActing] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  const act = async (id, status, rejection_reason = null) => {
    setActing(id);
    try {
      await businessApi.admin.updateRegistration(id, { status, ...(rejection_reason ? { rejection_reason } : {}) });
      toast.success(`Registration ${status}`);
      reload();
    } catch (e) {
      toast.error(e?.message || "Action failed");
    } finally {
      setActing(null);
    }
  };

  return (
    <SectionShell title="Business Registrations" onReload={reload} loading={loading}>
      {rejectModal && (
        <RejectModal
          onConfirm={(reason) => { act(rejectModal, "rejected", reason); setRejectModal(null); }}
          onCancel={() => setRejectModal(null)}
        />
      )}
      {loading && <LoadingState />}
      {error && <ErrorState msg={error} onRetry={reload} />}
      {!loading && !error && data.length === 0 && <EmptyState msg="No registration requests." />}
      {!loading && !error && data.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full">
            <thead className="bg-muted/40 border-b border-border">
              <tr><Th>Business Name</Th><Th>Type</Th><Th>Status</Th><Th>Submitted</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                  <Td className="font-medium">{r.business_name || "—"}</Td>
                  <Td><span className="capitalize">{(r.business_type || "—").replace(/_/g, " ")}</span></Td>
                  <Td><Badge status={r.status} /></Td>
                  <Td className="text-muted-foreground text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</Td>
                  <Td>
                    {r.status === "pending" && (
                      <div className="flex gap-2">
                        <button disabled={acting === r.id} onClick={() => act(r.id, "approved")}
                          className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-200 disabled:opacity-50">
                          <CheckCircle className="h-3 w-3" /> Approve
                        </button>
                        <button disabled={acting === r.id} onClick={() => setRejectModal(r.id)}
                          className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50">
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    )}
                    {r.status === "rejected" && r.rejection_reason && (
                      <span className="text-xs text-muted-foreground italic">"{r.rejection_reason}"</span>
                    )}
                    {r.status === "approved" && <span className="text-xs text-emerald-600">Approved</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}

function RejectModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="font-display text-xl mb-3">Rejection Reason</h3>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          className="input-base resize-none" placeholder="Explain why this registration is being rejected…" />
        <div className="mt-4 flex gap-3">
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim()}
            className="rounded-full bg-red-600 px-5 py-2 text-xs uppercase tracking-widest text-white disabled:opacity-50">
            Reject
          </button>
          <button onClick={onCancel} className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-widest hover:bg-muted">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Attractions ───────────────────────────────────────────────────────────────
function AttractionsTab() {
  const { data, loading, error, reload } = useAdminFetch(
    () => attractionsApi.list({ include_all: "true", per_page: 100 })
  );
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState("all");

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await attractionsApi.update(id, { status });
      toast.success(`Attraction ${status}`);
      reload();
    } catch (e) {
      toast.error(e?.message || "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? data : data.filter((a) => a.status === filter);

  return (
    <SectionShell title="Attraction Management" onReload={reload} loading={loading}>
      {loading && <LoadingState />}
      {error && <ErrorState msg={error} onRetry={reload} />}
      {!loading && !error && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {["all", "pending", "approved", "rejected", "draft"].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition ${
                  filter === s ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10" : "border-border text-muted-foreground hover:border-[var(--color-gold)]/50"
                }`}>
                {s} {s !== "all" && `(${data.filter((a) => a.status === s).length})`}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? <EmptyState msg={`No ${filter === "all" ? "" : filter} attractions.`} /> : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full">
                <thead className="bg-muted/40 border-b border-border">
                  <tr><Th>Name</Th><Th>County</Th><Th>Category</Th><Th>Status</Th><Th>Rating</Th><Th>Actions</Th></tr>
                </thead>
                <tbody>
                  {filtered.map((a, i) => (
                    <tr key={a.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                      <Td className="font-medium max-w-[180px] truncate">{a.name}</Td>
                      <Td className="text-muted-foreground text-xs">{a.county || "—"}</Td>
                      <Td><span className="capitalize text-muted-foreground">{(a.category || "—").replace(/_/g, " ")}</span></Td>
                      <Td><Badge status={a.status} /></Td>
                      <Td className="text-muted-foreground">{a.avg_rating > 0 ? `★ ${Number(a.avg_rating).toFixed(1)}` : "—"}</Td>
                      <Td>
                        <div className="flex gap-2">
                          {a.status !== "approved" && (
                            <button disabled={updating === a.id} onClick={() => updateStatus(a.id, "approved")}
                              className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-200 disabled:opacity-50">
                              Approve
                            </button>
                          )}
                          {a.status !== "rejected" && (
                            <button disabled={updating === a.id} onClick={() => updateStatus(a.id, "rejected")}
                              className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50">
                              Reject
                            </button>
                          )}
                          {a.status !== "draft" && (
                            <button disabled={updating === a.id} onClick={() => updateStatus(a.id, "draft")}
                              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50">
                              Draft
                            </button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </SectionShell>
  );
}

// ── Bookings ─────────────────────────────────────────────────────────────────
function BookingsTab() {
  const { data, loading, error, reload } = useAdminFetch(bookingsApi.adminList);
  const [cancelling, setCancelling] = useState(null);
  const [filter, setFilter] = useState("all");

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    setCancelling(id);
    try {
      await bookingsApi.cancel(id);
      toast.success("Booking cancelled");
      reload();
    } catch (e) {
      toast.error(e?.message || "Failed to cancel");
    } finally {
      setCancelling(null);
    }
  };

  const filtered = filter === "all" ? data : data.filter((b) => b.status === filter);

  return (
    <SectionShell title="All Bookings" onReload={reload} loading={loading}>
      {loading && <LoadingState />}
      {error && <ErrorState msg={error} onRetry={reload} />}
      {!loading && !error && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition ${filter === s ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10" : "border-border text-muted-foreground hover:border-[var(--color-gold)]/50"}`}>
                {s}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? <EmptyState msg="No bookings found." /> : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full">
                <thead className="bg-muted/40 border-b border-border">
                  <tr><Th>Reference</Th><Th>Status</Th><Th>Amount</Th><Th>Type</Th><Th>Date</Th><Th>Actions</Th></tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => (
                    <tr key={b.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                      <Td className="font-mono text-xs">{b.reference_number || b.id?.slice(0, 8) || "—"}</Td>
                      <Td><Badge status={b.status} /></Td>
                      <Td>{b.total_cost != null ? `KES ${Number(b.total_cost).toLocaleString()}` : "—"}</Td>
                      <Td className="capitalize text-muted-foreground">{b.booking_type || b.type || "—"}</Td>
                      <Td className="text-xs text-muted-foreground">{b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}</Td>
                      <Td>
                        {b.status !== "cancelled" && b.status !== "completed" && (
                          <button disabled={cancelling === b.id} onClick={() => cancelBooking(b.id)}
                            className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50">
                            Cancel
                          </button>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </SectionShell>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────
function UsersTab() {
  const { data, loading, error, reload } = useAdminFetch(usersApi.admin.list);
  const { data: roles } = useAdminFetch(rbacApi.roles.list);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState(null);
  const [userRoles, setUserRoles] = useState({});
  const [assigningRole, setAssigningRole] = useState(false);

  const filtered = data.filter((u) => {
    const q = search.toLowerCase();
    return !q || (u.email || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q);
  });

  const loadUserRoles = async (userId) => {
    if (userRoles[userId] !== undefined) return;
    try {
      const result = await rbacApi.userRoles.getByUser(userId);
      const arr = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : Array.isArray(result?.roles) ? result.roles : [];
      setUserRoles((prev) => ({ ...prev, [userId]: arr }));
    } catch {
      setUserRoles((prev) => ({ ...prev, [userId]: [] }));
    }
  };

  const toggleUser = (userId) => {
    const next = expandedUser === userId ? null : userId;
    setExpandedUser(next);
    if (next) loadUserRoles(next);
  };

  const assignRole = async (userId, roleId) => {
    setAssigningRole(true);
    try {
      await rbacApi.userRoles.create({ user_id: userId, role_id: roleId });
      toast.success("Role assigned");
      setUserRoles((prev) => ({ ...prev, [userId]: undefined }));
      loadUserRoles(userId);
    } catch (e) {
      toast.error(e?.message || "Failed to assign role");
    } finally {
      setAssigningRole(false);
    }
  };

  const revokeRole = async (userId, roleId) => {
    try {
      await rbacApi.userRoles.delete(userId, roleId);
      toast.success("Role removed");
      setUserRoles((prev) => ({ ...prev, [userId]: undefined }));
      loadUserRoles(userId);
    } catch (e) {
      toast.error(e?.message || "Failed to remove role");
    }
  };

  return (
    <SectionShell title="User Management" onReload={reload} loading={loading}>
      {loading && <LoadingState />}
      {error && <ErrorState msg={error} onRetry={reload} />}
      {!loading && !error && (
        <>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email or username…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          {filtered.length === 0 ? <EmptyState msg="No users found." /> : (
            <div className="space-y-2">
              {filtered.map((u) => (
                <div key={u.id} className="rounded-2xl border border-border overflow-hidden">
                  <div className="flex flex-wrap items-center gap-3 bg-card px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{u.email}</div>
                      <div className="text-xs text-muted-foreground">{u.username || "—"}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.is_admin && <Badge status="approved" />}
                      <Badge status={u.is_active ? "active" : "inactive"} />
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </span>
                      <button onClick={() => toggleUser(u.id)}
                        className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">
                        {expandedUser === u.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        Roles
                      </button>
                    </div>
                  </div>

                  {expandedUser === u.id && (
                    <div className="border-t border-border bg-muted/20 p-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Assigned Roles</p>
                      {userRoles[u.id] === undefined ? (
                        <p className="text-xs text-muted-foreground">Loading…</p>
                      ) : userRoles[u.id].length === 0 ? (
                        <p className="text-xs text-muted-foreground mb-3">No roles assigned yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {userRoles[u.id].map((r) => (
                            <span key={r.id || r.role_id || String(r)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs">
                              {r.name || r.role_name || String(r)}
                              <button onClick={() => revokeRole(u.id, r.id || r.role_id)}
                                className="text-red-400 hover:text-red-600 ml-1">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 mt-3">Assign Role</p>
                      <div className="flex flex-wrap gap-2">
                        {roles
                          .filter((r) => !userRoles[u.id]?.some((ur) => (ur.id || ur.role_id) === r.id))
                          .map((r) => (
                            <button key={r.id} onClick={() => assignRole(u.id, r.id)}
                              disabled={assigningRole}
                              className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-[var(--color-gold)] hover:text-foreground disabled:opacity-50">
                              + {r.name}
                            </button>
                          ))}
                        {roles.filter((r) => !userRoles[u.id]?.some((ur) => (ur.id || ur.role_id) === r.id)).length === 0 && userRoles[u.id]?.length > 0 && (
                          <span className="text-xs text-muted-foreground">All roles assigned.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </SectionShell>
  );
}

// ── Kiosks ────────────────────────────────────────────────────────────────────
const KIOSK_LOCATION_TYPES = [
  "airport", "sgr_station", "hotel", "national_park",
  "museum", "urban_centre", "border_point", "shopping_mall",
];

const EMPTY_KIOSK_FORM = {
  name: "", county: "", sub_county: "", ward: "", address: "",
  location_type: "urban_centre", description: "",
};

function KiosksTab() {
  const { data, loading, error, reload } = useAdminFetch(kioskApi.admin.list);
  const [syncing, setSyncing] = useState(null);
  const [decommissioning, setDecommissioning] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_KIOSK_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedKiosk, setSelectedKiosk] = useState(null);
  const [kioskSearch, setKioskSearch] = useState("");

  const subCounties = form.county ? (KENYA_SUB_COUNTIES[form.county] || []) : [];

  const sync = async (id) => {
    setSyncing(id);
    try {
      await kioskApi.admin.contentSync(id);
      toast.success("Content sync triggered");
    } catch (e) {
      toast.error(e?.message || "Sync failed");
    } finally {
      setSyncing(null);
    }
  };

  const decommission = async (id, name) => {
    if (!window.confirm(`Decommission kiosk "${name}"? This cannot be undone.`)) return;
    setDecommissioning(id);
    try {
      await kioskApi.admin.decommission(id);
      toast.success("Kiosk decommissioned");
      reload();
    } catch (e) {
      toast.error(e?.message || "Failed");
    } finally {
      setDecommissioning(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.county) {
      toast.error("Name and county are required");
      return;
    }
    setSaving(true);
    try {
      await kioskApi.admin.create({
        name: form.name,
        county: form.county,
        sub_county: form.sub_county || null,
        ward: form.ward || null,
        address: form.address || null,
        location_type: form.location_type,
        description: form.description || null,
      });
      toast.success("Kiosk created");
      setForm(EMPTY_KIOSK_FORM);
      setShowAddForm(false);
      reload();
    } catch (e) {
      toast.error(e?.message || "Failed to create kiosk");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionShell title="Kiosk Management" onReload={reload} loading={loading}>
      {/* Add Kiosk button */}
      <div className="mb-4 flex justify-end">
        <button onClick={() => setShowAddForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-95">
          <Plus className="h-4 w-4" /> Add Kiosk
        </button>
      </div>

      {/* Add kiosk form */}
      {showAddForm && (
        <div className="mb-6 rounded-2xl border border-[var(--color-gold)]/30 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl">New Kiosk</h3>
            <button onClick={() => setShowAddForm(false)} className="rounded-full p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Kiosk Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-base" placeholder='e.g. JKIA Terminal 1A Kiosk' required />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Location Type *</label>
                <select value={form.location_type} onChange={(e) => setForm((f) => ({ ...f, location_type: e.target.value }))} className="input-base">
                  {KIOSK_LOCATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">County *</label>
                <select value={form.county}
                  onChange={(e) => setForm((f) => ({ ...f, county: e.target.value, sub_county: "", ward: "" }))}
                  className="input-base" required>
                  <option value="">— Select County —</option>
                  {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Sub-County</label>
                {subCounties.length > 0 ? (
                  <select value={form.sub_county} onChange={(e) => setForm((f) => ({ ...f, sub_county: e.target.value }))} className="input-base">
                    <option value="">— Select Sub-County —</option>
                    {subCounties.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={form.sub_county} onChange={(e) => setForm((f) => ({ ...f, sub_county: e.target.value }))}
                    className="input-base" placeholder="Sub-county" />
                )}
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Ward</label>
                <input value={form.ward} onChange={(e) => setForm((f) => ({ ...f, ward: e.target.value }))}
                  className="input-base" placeholder="Ward name" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Address</label>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="input-base" placeholder="Physical address" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2} className="input-base resize-none" placeholder="Brief description of this kiosk location…" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="rounded-full bg-[var(--color-gold)] px-5 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:opacity-60">
                {saving ? "Creating…" : "Create Kiosk"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-widest hover:bg-muted">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kiosk detail modal */}
      {selectedKiosk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-display text-2xl">{selectedKiosk.name || "Kiosk"}</h3>
              <button onClick={() => setSelectedKiosk(null)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <KioskInfoRow label="ID" value={<span className="font-mono text-xs">{selectedKiosk.id}</span>} />
              <KioskInfoRow label="Status" value={<Badge status={selectedKiosk.status || "offline"} />} />
              <KioskInfoRow label="Location Type" value={(selectedKiosk.location_type || "—").replace(/_/g, " ")} />
              <KioskInfoRow label="County" value={selectedKiosk.county || "—"} />
              <KioskInfoRow label="Sub-County" value={selectedKiosk.sub_county || "—"} />
              <KioskInfoRow label="Ward" value={selectedKiosk.ward || "—"} />
              <KioskInfoRow label="Address" value={selectedKiosk.address || "—"} />
              <KioskInfoRow label="Description" value={selectedKiosk.description || "—"} />
              <KioskInfoRow label="Last Heartbeat" value={selectedKiosk.last_heartbeat_at ? new Date(selectedKiosk.last_heartbeat_at).toLocaleString() : "Never"} />
              <KioskInfoRow label="Installed" value={selectedKiosk.installed_at ? new Date(selectedKiosk.installed_at).toLocaleDateString() : "—"} />
            </dl>
            <div className="mt-5 flex gap-3">
              <button onClick={() => { sync(selectedKiosk.id); setSelectedKiosk(null); }}
                className="flex items-center gap-1 rounded-full border border-border px-4 py-2 text-xs hover:bg-muted">
                <RotateCcw className="h-3.5 w-3.5" /> Sync Content
              </button>
              <button onClick={() => setSelectedKiosk(null)}
                className="rounded-full border border-border px-4 py-2 text-xs hover:bg-muted">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kiosk search */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input value={kioskSearch} onChange={(e) => setKioskSearch(e.target.value)}
          placeholder="Search kiosk by name…" className="flex-1 bg-transparent text-sm outline-none" />
        {kioskSearch && (
          <button onClick={() => setKioskSearch("")} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState msg={error} onRetry={reload} />}
      {!loading && !error && data.length === 0 && <EmptyState msg="No kiosks registered. Add one above." />}
      {!loading && !error && data.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full">
            <thead className="bg-muted/40 border-b border-border">
              <tr><Th>Name</Th><Th>County</Th><Th>Type</Th><Th>Status</Th><Th>Last Heartbeat</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {data.filter((k) => !kioskSearch || (k.name || "").toLowerCase().includes(kioskSearch.toLowerCase())).map((k, i) => (
                <tr key={k.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                  <Td>
                    <button onClick={() => setSelectedKiosk(k)} className="text-left group">
                      <div className="font-medium group-hover:text-[var(--color-gold)] transition">{k.name || "Kiosk"}</div>
                      <div className="font-mono text-xs text-muted-foreground">{k.id?.slice(0, 8)}</div>
                    </button>
                  </Td>
                  <Td className="text-muted-foreground">{k.county || k.location || "—"}</Td>
                  <Td className="text-muted-foreground capitalize text-xs">{(k.location_type || "—").replace(/_/g, " ")}</Td>
                  <Td><Badge status={k.status || (k.is_active ? "active" : "inactive")} /></Td>
                  <Td className="text-xs text-muted-foreground">{k.last_heartbeat_at ? new Date(k.last_heartbeat_at).toLocaleString() : "—"}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedKiosk(k)}
                        className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted">
                        <Info className="h-3 w-3" /> Info
                      </button>
                      <button disabled={syncing === k.id} onClick={() => sync(k.id)}
                        className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50">
                        <RotateCcw className="h-3 w-3" /> Sync
                      </button>
                      <button disabled={decommissioning === k.id} onClick={() => decommission(k.id, k.name)}
                        className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50">
                        Decomm.
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}

function KioskInfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-right text-sm">{value || "—"}</dd>
    </div>
  );
}

// ── QR Codes ──────────────────────────────────────────────────────────────────
function QrCodesTab() {
  const { data, loading, error, reload } = useAdminFetch(qrCodesApi.adminList);
  const [acting, setActing] = useState(null);

  const revoke = async (id) => {
    if (!window.confirm("Revoke this QR code?")) return;
    setActing(id);
    try {
      await qrCodesApi.adminRevoke(id);
      toast.success("QR code revoked");
      reload();
    } catch (e) { toast.error(e?.message || "Failed"); }
    finally { setActing(null); }
  };

  const regenerate = async (id) => {
    setActing(id);
    try {
      await qrCodesApi.adminRegenerate(id);
      toast.success("QR code regenerated");
      reload();
    } catch (e) { toast.error(e?.message || "Failed"); }
    finally { setActing(null); }
  };

  return (
    <SectionShell title="QR Code Management" onReload={reload} loading={loading}>
      {loading && <LoadingState />}
      {error && <ErrorState msg={error} onRetry={reload} />}
      {!loading && !error && data.length === 0 && <EmptyState msg="No QR codes found." />}
      {!loading && !error && data.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full">
            <thead className="bg-muted/40 border-b border-border">
              <tr><Th>Token</Th><Th>Target Type</Th><Th>Status</Th><Th>Created</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {data.map((q, i) => (
                <tr key={q.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                  <Td className="font-mono text-xs">{q.token?.slice(0, 16) || q.id?.slice(0, 8) || "—"}…</Td>
                  <Td className="capitalize text-muted-foreground">{(q.target_type || "—").replace(/_/g, " ")}</Td>
                  <Td><Badge status={q.status || "active"} /></Td>
                  <Td className="text-xs text-muted-foreground">{q.created_at ? new Date(q.created_at).toLocaleDateString() : "—"}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button disabled={acting === q.id} onClick={() => regenerate(q.id)}
                        className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50">
                        <RotateCcw className="h-3 w-3" /> Regen
                      </button>
                      {q.status !== "revoked" && (
                        <button disabled={acting === q.id} onClick={() => revoke(q.id)}
                          className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50">
                          Revoke
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}

// ── Audit Logs ────────────────────────────────────────────────────────────────
function AuditLogsTab() {
  const { data, loading, error, reload } = useAdminFetch(auditApi.list);
  const [search, setSearch] = useState("");

  const filtered = data.filter((l) => {
    const q = search.toLowerCase();
    return !q ||
      (l.action || "").toLowerCase().includes(q) ||
      (l.entity_type || "").toLowerCase().includes(q) ||
      (l.actor_user_id || "").toLowerCase().includes(q);
  });

  return (
    <SectionShell title="Audit Logs" onReload={reload} loading={loading}>
      {loading && <LoadingState />}
      {error && <ErrorState msg={error} onRetry={reload} />}
      {!loading && !error && (
        <>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by action, entity, user…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          {filtered.length === 0 ? <EmptyState msg="No audit logs found." /> : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full">
                <thead className="bg-muted/40 border-b border-border">
                  <tr><Th>Action</Th><Th>Entity</Th><Th>Actor</Th><Th>Timestamp</Th></tr>
                </thead>
                <tbody>
                  {filtered.map((l, i) => (
                    <tr key={l.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                      <Td className="font-mono text-xs text-foreground">{l.action || "—"}</Td>
                      <Td className="text-muted-foreground text-xs">
                        {l.entity_type && <span className="capitalize">{l.entity_type}</span>}
                        {l.entity_id && <span className="ml-1 text-[0.6rem]">{String(l.entity_id).slice(0, 8)}</span>}
                      </Td>
                      <Td className="font-mono text-xs text-muted-foreground">
                        {l.actor_user_id ? String(l.actor_user_id).slice(0, 8) : "system"}
                      </Td>
                      <Td className="text-xs text-muted-foreground">
                        {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </SectionShell>
  );
}

// ── Roles & Permissions ───────────────────────────────────────────────────────
function RolesTab() {
  const { data: roles, loading: rLoading, error: rError, reload: reloadRoles } = useAdminFetch(rbacApi.roles.list);
  const { data: perms, loading: pLoading, error: pError, reload: reloadPerms } = useAdminFetch(rbacApi.permissions.list);
  const [sub, setSub] = useState("roles");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [expandedRole, setExpandedRole] = useState(null);
  const [rolePerms, setRolePerms] = useState({});
  const [assigningPerm, setAssigningPerm] = useState(false);

  const createRole = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await rbacApi.roles.create({ name: newName.trim(), description: newDesc.trim() || undefined });
      toast.success("Role created");
      setNewName(""); setNewDesc("");
      reloadRoles();
    } catch (err) {
      toast.error(err?.message || "Failed to create role");
    } finally {
      setCreating(false);
    }
  };

  const deleteRole = async (id) => {
    if (!window.confirm("Delete this role?")) return;
    try {
      await rbacApi.roles.delete(id);
      toast.success("Role deleted");
      reloadRoles();
    } catch (e) { toast.error(e?.message || "Failed"); }
  };

  const loadRolePerms = async (roleId) => {
    if (rolePerms[roleId] !== undefined) return;
    try {
      const result = await rbacApi.roles.getPermissions(roleId);
      setRolePerms((prev) => ({ ...prev, [roleId]: unwrap(result) }));
    } catch {
      setRolePerms((prev) => ({ ...prev, [roleId]: [] }));
    }
  };

  const toggleRoleExpand = (roleId) => {
    const next = expandedRole === roleId ? null : roleId;
    setExpandedRole(next);
    if (next) loadRolePerms(next);
  };

  const assignPermission = async (roleId, permissionId) => {
    setAssigningPerm(true);
    try {
      await rbacApi.rolePermissions.create({ role_id: roleId, permission_id: permissionId });
      toast.success("Permission assigned");
      setRolePerms((prev) => ({ ...prev, [roleId]: undefined }));
      loadRolePerms(roleId);
    } catch (e) {
      toast.error(e?.message || "Failed to assign permission");
    } finally {
      setAssigningPerm(false);
    }
  };

  const revokePermission = async (roleId, permissionId) => {
    try {
      await rbacApi.rolePermissions.delete(roleId, permissionId);
      toast.success("Permission removed");
      setRolePerms((prev) => ({ ...prev, [roleId]: undefined }));
      loadRolePerms(roleId);
    } catch (e) {
      toast.error(e?.message || "Failed to remove permission");
    }
  };

  return (
    <SectionShell title="Roles & Permissions">
      <div className="flex gap-2 mb-6">
        {["roles", "permissions"].map((s) => (
          <button key={s} onClick={() => setSub(s)}
            className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-widest transition ${sub === s ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-foreground" : "border-border text-muted-foreground hover:border-[var(--color-gold)]/50"}`}>
            {s}
          </button>
        ))}
      </div>

      {sub === "roles" && (
        <div className="space-y-5">
          <form onSubmit={createRole} className="rounded-2xl border border-border bg-card p-4">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Create New Role</h4>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-muted-foreground mb-1">Name *</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input-base" placeholder="e.g. content_editor" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-muted-foreground mb-1">Description</label>
                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="input-base" placeholder="Optional description" />
              </div>
              <button type="submit" disabled={creating || !newName.trim()}
                className="rounded-full bg-[var(--color-gold)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:opacity-50">
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </form>

          {rLoading && <LoadingState />}
          {rError && <ErrorState msg={rError} onRetry={reloadRoles} />}
          {!rLoading && !rError && roles.length === 0 && <EmptyState msg="No roles defined." />}
          {!rLoading && !rError && roles.length > 0 && (
            <div className="space-y-2">
              {roles.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border overflow-hidden">
                  <div className="flex items-center gap-4 bg-card px-4 py-3">
                    <span className="font-mono text-sm flex-1">{r.name}</span>
                    <span className="text-xs text-muted-foreground flex-1">{r.description || "—"}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleRoleExpand(r.id)}
                        className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">
                        {expandedRole === r.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        Permissions
                      </button>
                      <button onClick={() => deleteRole(r.id)}
                        className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200">
                        Delete
                      </button>
                    </div>
                  </div>

                  {expandedRole === r.id && (
                    <div className="border-t border-border bg-muted/20 p-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Assigned Permissions</p>
                      {rolePerms[r.id] === undefined ? (
                        <p className="text-xs text-muted-foreground">Loading…</p>
                      ) : rolePerms[r.id].length === 0 ? (
                        <p className="text-xs text-muted-foreground">No permissions assigned yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {rolePerms[r.id].map((p) => (
                            <span key={p.id || p} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs">
                              {p.name || String(p)}
                              <button onClick={() => revokePermission(r.id, p.id || p)}
                                className="text-red-400 hover:text-red-600 ml-1">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 mt-3">Add Permission</p>
                      <div className="flex flex-wrap gap-2">
                        {!pLoading && perms
                          .filter((p) => !rolePerms[r.id]?.some((rp) => (rp.id || rp) === p.id))
                          .map((p) => (
                            <button key={p.id} onClick={() => assignPermission(r.id, p.id)}
                              disabled={assigningPerm}
                              className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-[var(--color-gold)] hover:text-foreground disabled:opacity-50">
                              + {p.name}
                            </button>
                          ))}
                        {!pLoading && perms.filter((p) => !rolePerms[r.id]?.some((rp) => (rp.id || rp) === p.id)).length === 0 && (
                          <span className="text-xs text-muted-foreground">All permissions assigned.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {sub === "permissions" && (
        <PermissionsSubTab perms={perms} pLoading={pLoading} pError={pError} reloadPerms={reloadPerms} />
      )}
    </SectionShell>
  );
}

function PermissionsSubTab({ perms, pLoading, pError, reloadPerms }) {
  const [newPermName, setNewPermName] = useState("");
  const [newPermDesc, setNewPermDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const createPermission = async (e) => {
    e.preventDefault();
    if (!newPermName.trim()) return;
    setCreating(true);
    try {
      await rbacApi.permissions.create({ name: newPermName.trim(), description: newPermDesc.trim() || undefined });
      toast.success("Permission created");
      setNewPermName(""); setNewPermDesc("");
      reloadPerms();
    } catch (err) {
      toast.error(err?.message || "Failed to create permission");
    } finally {
      setCreating(false);
    }
  };

  const deletePermission = async (id) => {
    if (!window.confirm("Delete this permission? Any roles using it will lose it.")) return;
    try {
      await rbacApi.permissions.delete(id);
      toast.success("Permission deleted");
      reloadPerms();
    } catch (e) { toast.error(e?.message || "Failed"); }
  };

  return (
    <div className="space-y-5">
      {/* Create permission form */}
      <form onSubmit={createPermission} className="rounded-2xl border border-border bg-card p-4">
        <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Create New Permission</h4>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-muted-foreground mb-1">Name *</label>
            <input value={newPermName} onChange={(e) => setNewPermName(e.target.value)}
              className="input-base" placeholder="e.g. manage_attractions" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-muted-foreground mb-1">Description</label>
            <input value={newPermDesc} onChange={(e) => setNewPermDesc(e.target.value)}
              className="input-base" placeholder="Optional description" />
          </div>
          <button type="submit" disabled={creating || !newPermName.trim()}
            className="rounded-full bg-[var(--color-gold)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:opacity-50">
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </form>

      {pLoading && <LoadingState />}
      {pError && <ErrorState msg={pError} onRetry={reloadPerms} />}
      {!pLoading && !pError && perms.length === 0 && <EmptyState msg="No permissions defined." />}
      {!pLoading && !pError && perms.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full">
            <thead className="bg-muted/40 border-b border-border">
              <tr><Th>Name</Th><Th>Description</Th><Th></Th></tr>
            </thead>
            <tbody>
              {perms.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                  <Td className="font-mono text-sm">{p.name}</Td>
                  <Td className="text-muted-foreground">{p.description || "—"}</Td>
                  <Td>
                    <button onClick={() => deletePermission(p.id)}
                      className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200">
                      Delete
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Emergency Contacts ────────────────────────────────────────────────────────
const CONTACT_TYPES = ["hospital", "police", "ranger", "fire", "rescue", "tourism_police", "ambulance", "other"];

function EmergencyContactsTab() {
  const [contacts, setContacts] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterDest, setFilterDest] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    destination_id: "", name: "", type: "hospital", phone: "", city: "", region: "",
  });

  const loadContacts = async (destId) => {
    setLoading(true);
    try {
      const res = await feedbackApi.contacts.list(destId || undefined);
      const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setContacts(items);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    destinationsApi.list().then((res) => {
      const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setDestinations(items);
    }).catch(() => setDestinations([]));
    loadContacts();
  }, []);

  const handleFilterChange = (destId) => {
    setFilterDest(destId);
    loadContacts(destId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.destination_id) { toast.error("Please select a destination/area."); return; }
    if (!form.name.trim()) { toast.error("Contact name is required."); return; }
    setSaving(true);
    try {
      await feedbackApi.contacts.create(form);
      toast.success("Emergency contact added.");
      setShowForm(false);
      setForm({ destination_id: "", name: "", type: "hospital", phone: "", city: "", region: "" });
      loadContacts(filterDest);
    } catch (err) {
      toast.error(err?.message || "Failed to add contact.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this emergency contact?")) return;
    try {
      await feedbackApi.contacts.delete(id);
      toast.success("Contact removed.");
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast.error(err?.message || "Failed to delete contact.");
    }
  };

  return (
    <SectionShell title="Emergency Contacts" onReload={() => loadContacts(filterDest)} loading={loading}>
      {/* Filters + Add button */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select value={filterDest} onChange={(e) => handleFilterChange(e.target.value)}
          className="rounded-full border border-border bg-card px-4 py-2 text-xs uppercase tracking-widest text-foreground">
          <option value="">All Destinations</option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>{d.name || d.title || d.id}</option>
          ))}
        </select>
        <button onClick={() => setShowForm((v) => !v)}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-cream)] hover:brightness-110 transition">
          <Plus className="h-3.5 w-3.5" /> Add Contact
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-xl mb-5">New Emergency Contact</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Destination / Area *</label>
              <select value={form.destination_id} onChange={(e) => setForm({ ...form, destination_id: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="">— Select destination —</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name || d.title || d.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Contact Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Narok District Hospital"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {CONTACT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+254 700 000 000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">City / Town</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Narok"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Region / County</label>
              <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="e.g. Narok County"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="submit" disabled={saving}
              className="rounded-full bg-[var(--color-ink)] px-5 py-2 text-xs uppercase tracking-widest text-[var(--color-cream)] disabled:opacity-50 hover:brightness-110 transition">
              {saving ? "Saving…" : "Save Contact"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-widest hover:bg-muted transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Contacts table */}
      {loading ? <LoadingState /> : contacts.length === 0 ? (
        <EmptyState msg="No emergency contacts found. Add contacts for each destination so tourists can reach help quickly." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px]">
            <thead className="bg-muted/40">
              <tr>
                <Th>Name</Th><Th>Type</Th><Th>Phone</Th><Th>Location</Th><Th>Destination</Th><Th></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contacts.map((c) => {
                const dest = destinations.find((d) => d.id === c.destination_id);
                return (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <Td>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-[var(--color-gold)] shrink-0" />
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </Td>
                    <Td><Badge status={c.type || "other"} /></Td>
                    <Td>
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="text-[var(--color-gold)] underline underline-offset-2">{c.phone}</a>
                      ) : "—"}
                    </Td>
                    <Td className="text-muted-foreground">
                      {[c.city, c.region].filter(Boolean).join(", ") || "—"}
                    </Td>
                    <Td className="text-muted-foreground text-xs">
                      {dest?.name || dest?.title || c.destination_id?.slice(0, 8) || "—"}
                    </Td>
                    <Td>
                      <button onClick={() => handleDelete(c.id)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="h-20" />
        <section className="mx-auto max-w-4xl px-6 pt-16 text-center">
          <h1 className="font-display text-5xl">Admin Access Required</h1>
          <p className="mt-4 text-muted-foreground">Please sign in with an admin account.</p>
          <Link to="/login" className="mt-6 inline-flex rounded-full bg-[var(--color-ink)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-cream)]">
            Sign In
          </Link>
        </section>
        <SiteFooter />
      </div>
    );
  }

  if (!user.is_admin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="h-20" />
        <section className="mx-auto max-w-4xl px-6 pt-16 text-center">
          <h1 className="font-display text-5xl">Access Denied</h1>
          <p className="mt-4 text-muted-foreground">
            This area is restricted to system administrators only.
          </p>
          <Link to="/explore" className="mt-6 inline-flex rounded-full border border-border px-6 py-3 text-xs uppercase tracking-widest hover:bg-muted">
            Back to Explore
          </Link>
        </section>
        <SiteFooter />
      </div>
    );
  }

  const TAB_CONTENT = {
    overview:      <OverviewTab onNavigate={setActiveTab} />,
    registrations: <RegistrationsTab />,
    attractions:   <AttractionsTab />,
    bookings:      <BookingsTab />,
    users:         <UsersTab />,
    kiosks:        <KiosksTab />,
    qrcodes:       <QrCodesTab />,
    audit:         <AuditLogsTab />,
    roles:         <RolesTab />,
    emergency:     <EmergencyContactsTab />,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-20">
        <div className="border-b border-border pb-6">
          <div className="eyebrow">System Administration</div>
          <h1 className="mt-2 font-display text-5xl">Admin Dashboard</h1>
        </div>
        <div className="mt-4 flex overflow-x-auto border-b border-border gap-0.5 pb-px">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={
                "flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs uppercase tracking-widest transition shrink-0 " +
                (activeTab === id
                  ? "border-b-2 border-[var(--color-gold)] text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground")
              }>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="mt-8">{TAB_CONTENT[activeTab]}</div>
      </section>
      <SiteFooter />
    </div>
  );
}
