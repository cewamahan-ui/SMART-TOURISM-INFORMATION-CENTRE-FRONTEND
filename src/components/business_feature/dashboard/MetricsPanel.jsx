import React, { useMemo } from "react";
import { TrendingUp, Star, Eye, DollarSign, Bookmark } from "lucide-react";

export default function MetricsPanel({ attractions, bookings }) {
  const metrics = useMemo(() => {
    const totalViews = attractions.reduce((sum, a) => sum + (a.view_count || 0), 0);
    const ratedAttractions = attractions.filter((a) => a.avg_rating > 0);
    const avgRating = ratedAttractions.length
      ? ratedAttractions.reduce((sum, a) => sum + a.avg_rating, 0) / ratedAttractions.length
      : 0;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_cost || 0), 0);
    const entryFeeTotal = attractions.reduce((sum, a) => sum + (a.entry_fee || 0), 0);
    return {
      totalAttractions: attractions.length,
      totalViews,
      avgRating: avgRating.toFixed(1),
      totalBookings: bookings.length,
      totalRevenue,
      entryFeeTotal,
    };
  }, [attractions, bookings]);

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <MetricCard
        icon={<Bookmark className="h-5 w-5" />}
        label="Attractions"
        value={metrics.totalAttractions}
        sub="total listed"
      />
      <MetricCard
        icon={<Eye className="h-5 w-5" />}
        label="Total Views"
        value={metrics.totalViews.toLocaleString()}
        sub="across all attractions"
      />
      <MetricCard
        icon={<Star className="h-5 w-5" />}
        label="Avg. Rating"
        value={metrics.avgRating > 0 ? `${metrics.avgRating} / 5` : "—"}
        sub="from reviews"
      />
      <MetricCard
        icon={<TrendingUp className="h-5 w-5" />}
        label="Bookings"
        value={metrics.totalBookings}
        sub={metrics.totalRevenue > 0 ? `KES ${metrics.totalRevenue.toLocaleString()} revenue` : "no revenue data"}
      />
    </div>
  );
}

function MetricCard({ icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-3 font-display text-3xl text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
