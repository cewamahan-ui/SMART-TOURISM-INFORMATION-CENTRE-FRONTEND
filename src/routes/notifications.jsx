import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Bell, AlertCircle, CheckCircle2, Info, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — SafariSmart" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    enabled: !!user,
    retry: false,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      q.refetch();
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to mark as read");
    },
  });

  const notifications = arrayify(q.data);
  const unread = notifications.filter((n) => !n.is_read);
  const read = notifications.filter((n) => n.is_read);

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="h-20" />
        <section className="mx-auto max-w-6xl px-6 pt-12 text-center">
          <h1 className="font-display text-6xl">Sign in to view notifications</h1>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-[var(--color-ink)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-cream)]"
          >
            Sign In
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-4xl px-6 pt-12">
        <div className="border-b border-border pb-8">
          <div className="eyebrow">Your Inbox</div>
          <h1 className="mt-3 font-display text-6xl">Notifications</h1>
          <p className="mt-3 text-muted-foreground">
            {unread.length} unread message{unread.length !== 1 ? "s" : ""}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24 pt-12">
        {q.isLoading && <p className="text-muted-foreground">Loading notifications…</p>}

        {!q.isLoading && notifications.length === 0 && (
          <div className="rounded border border-dashed border-border p-10 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-3xl">All caught up!</h3>
            <p className="mt-2 text-muted-foreground">
              You're on top of things. Check back later.
            </p>
          </div>
        )}

        {/* Unread */}
        {unread.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 font-display text-2xl">New</h2>
            <div className="space-y-3">
              {unread.map((notif, idx) => (
                <NotificationItem
                  key={notif.id ?? idx}
                  notification={notif}
                  onMarkRead={() => markReadMutation.mutate(notif.id)}
                  isMarking={markReadMutation.isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* Read */}
        {read.length > 0 && (
          <div>
            <h2 className="mb-4 font-display text-2xl">Earlier</h2>
            <div className="space-y-3 opacity-60">
              {read.map((notif, idx) => (
                <NotificationItem
                  key={notif.id ?? idx}
                  notification={notif}
                  onMarkRead={() => markReadMutation.mutate(notif.id)}
                  isMarking={markReadMutation.isPending}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function NotificationItem({ notification, onMarkRead, isMarking }) {
  const type = notification.type || "info";
  const icons = {
    alert: <AlertCircle className="h-5 w-5 text-red-600" />,
    success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  };

  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-[var(--color-gold)]">
      <div className="flex-shrink-0 pt-0.5">
        {icons[type] || icons.info}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground">
          {notification.title || "Notification"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {notification.message || notification.body}
        </p>
        {notification.created_at && (
          <p className="mt-2 text-xs text-muted-foreground">
            {formatTime(notification.created_at)}
          </p>
        )}
      </div>
      {!notification.is_read && (
        <button
          onClick={onMarkRead}
          disabled={isMarking}
          className="flex-shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-muted"
          title="Mark as read"
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function formatTime(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  } catch {
    return "Recently";
  }
}

function arrayify(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.items)) return v.items;
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.notifications)) return v.notifications;
  return [];
}
