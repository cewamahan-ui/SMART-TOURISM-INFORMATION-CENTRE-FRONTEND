import React, { useState } from "react";

const STATUS_STYLES = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending:   "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
  refunded:  "bg-gray-100 text-gray-600",
};

const TARGET_LABELS = {
  attraction:    "Attraction",
  accommodation: "Accommodation",
  tour_package:  "Tour Package",
  transport:     "Transport",
};

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-widest font-semibold ${STATUS_STYLES[status] || "bg-muted text-muted-foreground"}`}>
      {status || "unknown"}
    </span>
  );
}

export default function BookingsPanel({ bookings, attractions = [] }) {
  const [filter, setFilter] = useState("all");

  const attractionMap = attractions.reduce((m, a) => {
    m[String(a.id)] = a.name;
    return m;
  }, {});

  const filtered = filter === "all"
    ? bookings
    : bookings.filter((b) => b.status === filter);

  const statusCounts = ["pending", "confirmed", "completed", "cancelled"].reduce((acc, s) => {
    acc[s] = bookings.filter((b) => b.status === s).length;
    return acc;
  }, {});

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
        <p className="text-sm">No bookings for your attractions yet.</p>
        <p className="mt-1 text-xs">Bookings will appear here once tourists book your attractions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: bookings.length, color: "text-foreground" },
          { label: "Pending", value: statusCounts.pending, color: "text-amber-600" },
          { label: "Confirmed", value: statusCounts.confirmed, color: "text-emerald-600" },
          { label: "Completed", value: statusCounts.completed, color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
            <div className={`font-display text-2xl ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition ${
              filter === s
                ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-foreground"
                : "border-border text-muted-foreground hover:border-[var(--color-gold)]/50"
            }`}
          >
            {s} {s !== "all" && `(${statusCounts[s] ?? filtered.filter((b) => b.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No {filter} bookings.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-muted-foreground">Reference</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-muted-foreground">Attraction</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-widest text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const attractionName = getAttractionNameFromBooking(b, attractionMap);
                return (
                  <tr key={b.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      {b.reference_number || (b.id ? String(b.id).slice(0, 8) : "—")}
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <span className="truncate text-foreground">{attractionName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {b.total_cost != null ? `KES ${Number(b.total_cost).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {bookings.length} bookings
      </p>
    </div>
  );
}

function getAttractionNameFromBooking(booking, attractionMap) {
  if (!booking.items || booking.items.length === 0) {
    return booking.type ? (TARGET_LABELS[booking.type] || booking.type) : "—";
  }
  const attractionItem = booking.items.find(
    (it) => it.target_type === "attraction" && attractionMap[String(it.target_id)]
  );
  if (attractionItem) return attractionMap[String(attractionItem.target_id)];
  const first = booking.items[0];
  return first?.target_type ? (TARGET_LABELS[first.target_type] || first.target_type) : "—";
}
