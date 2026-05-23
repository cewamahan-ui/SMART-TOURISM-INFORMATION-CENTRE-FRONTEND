import React, { useMemo } from "react";
import { TrendingUp, Star, Eye, DollarSign, Bookmark, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

const COLORS = ["#c9a84c", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

export default function MetricsPanel({ attractions, bookings }) {
  const metrics = useMemo(() => {
    const totalViews = attractions.reduce((sum, a) => sum + (a.view_count || 0), 0);
    const ratedAttractions = attractions.filter((a) => a.avg_rating > 0);
    const avgRating = ratedAttractions.length
      ? ratedAttractions.reduce((sum, a) => sum + a.avg_rating, 0) / ratedAttractions.length
      : 0;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_cost || 0), 0);
    return {
      totalAttractions: attractions.length,
      totalViews,
      avgRating: avgRating.toFixed(1),
      totalBookings: bookings.length,
      totalRevenue,
    };
  }, [attractions, bookings]);

  // Attraction views bar chart data
  const viewsData = useMemo(() =>
    attractions
      .filter((a) => a.view_count > 0)
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 6)
      .map((a) => ({ name: (a.name || "Attraction").substring(0, 14), views: a.view_count || 0 })),
    [attractions]
  );

  // Booking status breakdown
  const bookingStatusData = useMemo(() => {
    const map = bookings.reduce((acc, b) => {
      const s = b.status || "pending";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  // Revenue by attraction (top 5)
  const revenueData = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const name = b.attraction_name || b.package_name || "Other";
      map[name] = (map[name] || 0) + (b.total_cost || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name: name.substring(0, 14), revenue }));
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<Bookmark className="h-5 w-5" />} label="Attractions" value={metrics.totalAttractions} sub="total listed" color="blue" />
        <MetricCard icon={<Eye className="h-5 w-5" />} label="Total Views" value={metrics.totalViews.toLocaleString()} sub="across all attractions" color="emerald" />
        <MetricCard icon={<Star className="h-5 w-5" />} label="Avg. Rating" value={metrics.avgRating > 0 ? `${metrics.avgRating}/5` : "—"} sub="from reviews" color="amber" />
        <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="Bookings"
          value={metrics.totalBookings}
          sub={metrics.totalRevenue > 0 ? `KES ${metrics.totalRevenue.toLocaleString()} revenue` : "no revenue data"}
          color="purple" />
      </div>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Views by attraction */}
        <div className="lg:col-span-1 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg mb-1">Attraction Views</h3>
          <p className="text-xs text-muted-foreground mb-4">Top attractions by view count</p>
          {viewsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={viewsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="views" fill="#c9a84c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">No view data yet</div>
          )}
        </div>

        {/* Booking status pie */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg mb-1">Booking Status</h3>
          <p className="text-xs text-muted-foreground mb-4">Status breakdown</p>
          {bookingStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={bookingStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {bookingStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">No bookings yet</div>
          )}
        </div>

        {/* Revenue by attraction */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg mb-1">Revenue by Attraction</h3>
          <p className="text-xs text-muted-foreground mb-4">Top earning attractions (KES)</p>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenueData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v) => [`KES ${v.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">No revenue data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

const COLOR_MAP = {
  blue: "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900",
  emerald: "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900",
  amber: "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900",
  purple: "border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-900",
};

function MetricCard({ icon, label, value, sub, color = "blue" }) {
  return (
    <div className={`rounded-2xl border p-5 ${COLOR_MAP[color]}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        {icon}
        <span className="text-xs uppercase tracking-widest">{label}</span>
      </div>
      <div className="font-display text-3xl text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
