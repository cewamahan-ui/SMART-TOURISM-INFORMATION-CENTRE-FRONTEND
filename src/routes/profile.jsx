import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usersApi, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { User, Mail, LogOut, Settings, Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — SafariSmart" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  });

  const userQuery = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => user?.id ? usersApi.get(user.id) : null,
    enabled: !!user?.id,
    retry: false,
  });

  const favoritesQuery = useQuery({
    queryKey: ["favorites"],
    queryFn: () => usersApi.getActivity(user?.id),
    enabled: !!user?.id,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => usersApi.update(user.id, data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setEditing(false);
      userQuery.refetch();
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to update profile");
    },
  });

  const handleLogout = async () => {
    try {
      signOut();
      toast.success("Logged out successfully");
      navigate({ to: "/" });
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="h-20" />
        <section className="mx-auto max-w-6xl px-6 pt-12 text-center">
          <h1 className="font-display text-6xl">Sign in Required</h1>
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
          <div className="eyebrow">Your Account</div>
          <h1 className="mt-3 font-display text-6xl">Profile</h1>
        </div>

        {/* User Info Section */}
        <div className="mt-12 rounded-lg border border-border bg-card p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-gold)]/20">
                <User className="h-8 w-8 text-[var(--color-ink)]" />
              </div>
              <div>
                <h2 className="font-display text-2xl">
                  {user?.first_name || "Explorer"}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest transition hover:bg-muted"
            >
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          {editing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate(formData);
              }}
              className="mt-8 space-y-6 border-t border-border pt-8"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="First Name"
                  value={formData.first_name}
                  onChange={(v) =>
                    setFormData({ ...formData, first_name: v })
                  }
                />
                <Field
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(v) =>
                    setFormData({ ...formData, last_name: v })
                  }
                />
              </div>
              <Field
                label="Email"
                type="email"
                value={formData.email}
                onChange={(v) => setFormData({ ...formData, email: v })}
              />
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-full bg-[var(--color-gold)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-110 disabled:opacity-60"
              >
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </button>
            </form>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Link
            to="/bookings"
            className="rounded-lg border border-border bg-card p-6 transition hover:border-[var(--color-gold)]"
          >
            <h3 className="font-display text-lg">Your Bookings</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your expeditions and reservations
            </p>
          </Link>
          <Link
            to="/favorites"
            className="rounded-lg border border-border bg-card p-6 transition hover:border-[var(--color-gold)]"
          >
            <h3 className="font-display text-lg">Saved Favorites</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your curated collection of experiences
            </p>
          </Link>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 rounded-lg border border-red-200 bg-red-50/50 p-8">
          <h3 className="font-display text-lg">Danger Zone</h3>
          <button
            onClick={handleLogout}
            className="mt-4 flex items-center gap-2 text-red-600 transition hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded border border-border bg-transparent px-3 py-2 text-base outline-none transition focus:border-[var(--color-gold)]"
      />
    </label>
  );
}
