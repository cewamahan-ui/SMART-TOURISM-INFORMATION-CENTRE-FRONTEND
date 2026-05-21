import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth-context";
import {
  usersApi, bookingsApi, attractionsApi, businessApi,
  kioskApi, qrCodesApi, auditApi, rbacApi, feedbackApi,
} from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Bookmark, Building2, Monitor,
  QrCode, FileText, Shield, CalendarCheck, RefreshCw,
  CheckCircle, XCircle, Trash2, Eye, ChevronDown, ChevronUp,
  Search, RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/admin-dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — SafariSmart" }] }),
  component: AdminDashboard,
});

// ── Tabs ─────────────────────────────────────────────────────────────────────
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
];

// ── Shared helpers ────────────────────────────────────────────────────────────
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
  return (
    <div className="flex justify-center py-16 text-sm text-muted-foreground">
      Loading…
    </div>
  );
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
  approved:  "bg-emerald-100 text-emerald-700",
  active:    "bg-emerald-100 text-emerald-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  pending:   "bg-amber-100 text-amber-700",
  rejected:  "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700",
  suspended: "bg-red-100 text-red-700",
  draft:     "bg-gray-100 text-gray-600",
  inactive:  "bg-gray-100 text-gray-600",
  revoked:   "bg-red-100 text-red-700",
  active_qr: "bg-emerald-100 text-emerald-700",
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

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      usersApi.admin.list(),
      bookingsApi.adminList(),
      attractionsApi.list({ include_all: "true", per_page: 100 }),
      businessApi.admin.registrations(),
      kioskApi.admin.list(),
    ]).then(([users, bookings, attractions, registrations, kiosks]) => {
      setStats({
        users:         unwrap(users.value).length,
        bookings:      unwrap(bookings.value).length,
        attractions:   unwrap(attractions.value).length,
        registrations: unwrap(registrations.value).length,
        kiosks:        unwrap(kiosks.value).length,
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState />;

  const cards = [
    { label: "Users",          value: stats.users,         tab: "users",         color: "from-blue-50" },
    { label: "Bookings",       value: stats.bookings,      tab: "bookings",      color: "from-amber-50" },
    { label: "Attractions",    value: stats.attractions,   tab: "attractions",   color: "from-emerald-50" },
    { label: "Biz Requests",   value: stats.registrations, tab: "registrations", color: "from-purple-50" },
    { label: "Kiosks",         value: stats.kiosks,        tab: "kiosks",        color: "from-rose-50" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(({ label, value, tab, color }) => (
          <button
            key={tab}
            onClick={() => onNavigate(tab)}
            className={`rounded-2xl border border-border bg-gradient-to-b ${color} to-card p-5 text-left transition hover:border-[var(--color-gold)]/60`}
          >
            <div className="font-display text-4xl text-foreground">{value}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          </button>
        ))}
      </div>
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
    <button
      onClick={onClick}
      className="rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest hover:bg-muted transition"
    >
      {children}
    </button>
  );
}

// ── Business Registrations ───────────────────────────────────────────────────
function RegistrationsTab() {
  const { data, loading, error, reload } = useAdminFetch(businessApi.admin.registrations);
  const [acting, setActing] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // {id, reason}

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
                        <button
                          disabled={acting === r.id}
                          onClick={() => act(r.id, "approved")}
                          className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" /> Approve
                        </button>
                        <button
                          disabled={acting === r.id}
                          onClick={() => setRejectModal(r.id)}
                          className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
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
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="input-base resize-none"
          placeholder="Explain why this registration is being rejected…"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="rounded-full bg-red-600 px-5 py-2 text-xs uppercase tracking-widest text-white disabled:opacity-50"
          >
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
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition ${
                  filter === s ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10" : "border-border text-muted-foreground hover:border-[var(--color-gold)]/50"
                }`}
              >
                {s} {s !== "all" && `(${data.filter((a) => a.status === s).length})`}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? <EmptyState msg={`No ${filter === "all" ? "" : filter} attractions.`} /> : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full">
                <thead className="bg-muted/40 border-b border-border">
                  <tr><Th>Name</Th><Th>Category</Th><Th>Status</Th><Th>Rating</Th><Th>Views</Th><Th>Actions</Th></tr>
                </thead>
                <tbody>
                  {filtered.map((a, i) => (
                    <tr key={a.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                      <Td className="font-medium max-w-[200px] truncate">{a.name}</Td>
                      <Td><span className="capitalize text-muted-foreground">{(a.category || "—").replace(/_/g, " ")}</span></Td>
                      <Td><Badge status={a.status} /></Td>
                      <Td className="text-muted-foreground">{a.avg_rating > 0 ? `★ ${Number(a.avg_rating).toFixed(1)}` : "—"}</Td>
                      <Td className="text-muted-foreground">{a.view_count || 0}</Td>
                      <Td>
                        <div className="flex gap-2">
                          {a.status !== "approved" && (
                            <button
                              disabled={updating === a.id}
                              onClick={() => updateStatus(a.id, "approved")}
                              className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                          {a.status !== "rejected" && (
                            <button
                              disabled={updating === a.id}
                              onClick={() => updateStatus(a.id, "rejected")}
                              className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                          {a.status !== "draft" && (
                            <button
                              disabled={updating === a.id}
                              onClick={() => updateStatus(a.id, "draft")}
                              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                            >
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
                          <button
                            disabled={cancelling === b.id}
                            onClick={() => cancelBooking(b.id)}
                            className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
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
  const [search, setSearch] = useState("");

  const filtered = data.filter((u) => {
    const q = search.toLowerCase();
    return !q || (u.email || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q);
  });

  return (
    <SectionShell title="User Management" onReload={reload} loading={loading}>
      {loading && <LoadingState />}
      {error && <ErrorState msg={error} onRetry={reload} />}
      {!loading && !error && (
        <>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email or username…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          {filtered.length === 0 ? <EmptyState msg="No users found." /> : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full">
                <thead className="bg-muted/40 border-b border-border">
                  <tr><Th>Email</Th><Th>Username</Th><Th>Active</Th><Th>Joined</Th></tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                      <Td className="font-medium">{u.email}</Td>
                      <Td className="text-muted-foreground">{u.username || "—"}</Td>
                      <Td><Badge status={u.is_active ? "active" : "inactive"} /></Td>
                      <Td className="text-xs text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</Td>
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

// ── Kiosks ────────────────────────────────────────────────────────────────────
function KiosksTab() {
  const { data, loading, error, reload } = useAdminFetch(kioskApi.admin.list);
  const [syncing, setSyncing] = useState(null);
  const [decommissioning, setDecommissioning] = useState(null);

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

  return (
    <SectionShell title="Kiosk Management" onReload={reload} loading={loading}>
      {loading && <LoadingState />}
      {error && <ErrorState msg={error} onRetry={reload} />}
      {!loading && !error && data.length === 0 && <EmptyState msg="No kiosks registered." />}
      {!loading && !error && data.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full">
            <thead className="bg-muted/40 border-b border-border">
              <tr><Th>Name / ID</Th><Th>Location</Th><Th>Status</Th><Th>Last Heartbeat</Th><Th>Actions</Th></tr>
            </thead>
            <tbody>
              {data.map((k, i) => (
                <tr key={k.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                  <Td>
                    <div className="font-medium">{k.name || k.kiosk_name || "Kiosk"}</div>
                    <div className="font-mono text-xs text-muted-foreground">{k.id?.slice(0, 8)}</div>
                  </Td>
                  <Td className="text-muted-foreground">{k.location || k.city || "—"}</Td>
                  <Td><Badge status={k.status || k.is_active ? "active" : "inactive"} /></Td>
                  <Td className="text-xs text-muted-foreground">{k.last_heartbeat ? new Date(k.last_heartbeat).toLocaleString() : "—"}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button
                        disabled={syncing === k.id}
                        onClick={() => sync(k.id)}
                        className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" /> Sync
                      </button>
                      <button
                        disabled={decommissioning === k.id}
                        onClick={() => decommission(k.id, k.name)}
                        className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
                      >
                        Decommission
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
              <tr><Th>Token (short)</Th><Th>Target Type</Th><Th>Status</Th><Th>Created</Th><Th>Actions</Th></tr>
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
                      <button
                        disabled={acting === q.id}
                        onClick={() => regenerate(q.id)}
                        className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" /> Regen
                      </button>
                      {q.status !== "revoked" && (
                        <button
                          disabled={acting === q.id}
                          onClick={() => revoke(q.id)}
                          className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
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
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by action, entity, user…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
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
          {/* Create role form */}
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
              <button type="submit" disabled={creating || !newName.trim()} className="rounded-full bg-[var(--color-gold)] px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-ink)] disabled:opacity-50">
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </form>

          {rLoading && <LoadingState />}
          {rError && <ErrorState msg={rError} onRetry={reloadRoles} />}
          {!rLoading && !rError && roles.length === 0 && <EmptyState msg="No roles defined." />}
          {!rLoading && !rError && roles.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full">
                <thead className="bg-muted/40 border-b border-border">
                  <tr><Th>Name</Th><Th>Description</Th><Th>Actions</Th></tr>
                </thead>
                <tbody>
                  {roles.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                      <Td className="font-mono text-sm">{r.name}</Td>
                      <Td className="text-muted-foreground">{r.description || "—"}</Td>
                      <Td>
                        <button
                          onClick={() => deleteRole(r.id)}
                          className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200"
                        >
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
      )}

      {sub === "permissions" && (
        <div className="space-y-5">
          {pLoading && <LoadingState />}
          {pError && <ErrorState msg={pError} onRetry={reloadPerms} />}
          {!pLoading && !pError && perms.length === 0 && <EmptyState msg="No permissions defined." />}
          {!pLoading && !pError && perms.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full">
                <thead className="bg-muted/40 border-b border-border">
                  <tr><Th>Name</Th><Th>Description</Th></tr>
                </thead>
                <tbody>
                  {perms.map((p, i) => (
                    <tr key={p.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                      <Td className="font-mono text-sm">{p.name}</Td>
                      <Td className="text-muted-foreground">{p.description || "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
          <Link to="/login" className="mt-6 inline-flex rounded-full bg-[var(--color-ink)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-cream)]">
            Sign In
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

        {/* Tab bar */}
        <div className="mt-4 flex overflow-x-auto border-b border-border gap-0.5 pb-px">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={
                "flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs uppercase tracking-widest transition shrink-0 " +
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
          {TAB_CONTENT[activeTab]}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
