import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth-context";
import { settingsApi, authApi } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import { Bell, Lock, Globe, Zap, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/language/i18n-provider";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — SafariSmart" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { language, setLanguage, availableLanguages, t } = useI18n();
  const queryClient = useQueryClient();

  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
    enabled: !!user,
    retry: false,
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: false,
    marketing_emails: false,
  });

  const [preferences, setPreferences] = useState({
    language,
  });

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!serverSettings) return;
    const n = serverSettings.notifications || serverSettings.notification_settings || {};
    setNotifications({
      email_notifications: n.email_notifications ?? true,
      push_notifications: n.push_notifications ?? false,
      marketing_emails: n.marketing_emails ?? false,
    });
    const p = serverSettings.preferences || serverSettings.user_preferences || {};
    if (p.language) {
      setPreferences((prev) => ({ ...prev, language: p.language }));
      setLanguage(p.language);
    }
  }, [serverSettings, setLanguage]);

  const notifMutation = useMutation({
    mutationFn: settingsApi.notifications,
    onSuccess: () => toast.success("Notification preferences saved"),
    onError: (err) => toast.error(err?.message || "Failed to save"),
  });

  const prefMutation = useMutation({
    mutationFn: settingsApi.preferences,
    onSuccess: () => toast.success("Preferences saved"),
    onError: (err) => toast.error(err?.message || "Failed to save"),
  });

  const handleNotifToggle = useCallback((key, value) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    notifMutation.mutate(updated);
  }, [notifications, notifMutation]);

  const handleLanguageChange = useCallback((lang) => {
    setPreferences((p) => ({ ...p, language: lang }));
    setLanguage(lang);
    prefMutation.mutate({ language: lang });
  }, [setLanguage, prefMutation]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setPwSaving(true);
    try {
      await authApi.passwordReset({ email: user?.email });
      toast.success("Password reset email sent — check your inbox.");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      toast.error(err?.message || "Failed to send reset email");
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="h-20" />
        <section className="mx-auto max-w-6xl px-6 pt-12 text-center">
          <h1 className="font-display text-6xl">Sign in to view settings</h1>
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="h-20" />
        <section className="mx-auto max-w-4xl px-6 pt-12 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading settings…
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-4xl px-6 pt-12 pb-24">
        <div className="border-b border-border pb-8">
          <div className="eyebrow">Personalize</div>
          <h1 className="mt-3 font-display text-6xl">Settings</h1>
        </div>

        {/* Notifications */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5" />
            <h2 className="font-display text-2xl">Notifications</h2>
            {notifMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />}
            {notifMutation.isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />}
          </div>
          <div className="space-y-4 rounded-lg border border-border bg-card p-6">
            <Toggle
              label="Email Notifications"
              description="Receive booking updates and important alerts by email"
              checked={notifications.email_notifications}
              onChange={(v) => handleNotifToggle("email_notifications", v)}
            />
            <Toggle
              label="Push Notifications"
              description="Real-time alerts on your device"
              checked={notifications.push_notifications}
              onChange={(v) => handleNotifToggle("push_notifications", v)}
            />
            <Toggle
              label="Marketing Emails"
              description="Promotions, travel tips, and seasonal offers"
              checked={notifications.marketing_emails}
              onChange={(v) => handleNotifToggle("marketing_emails", v)}
            />
          </div>
        </div>

        {/* Language & Preferences */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-5 w-5" />
            <h2 className="font-display text-2xl">Language & Preferences</h2>
            {prefMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />}
            {prefMutation.isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />}
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <label className="block">
              <span className="eyebrow">{t("settings.language", "Language")}</span>
              <select
                value={preferences.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="mt-2 w-full rounded border border-border bg-transparent px-3 py-2 text-base outline-none transition focus:border-[var(--color-gold)]"
              >
                {availableLanguages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Security */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="h-5 w-5" />
            <h2 className="font-display text-2xl">Privacy & Security</h2>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To change your password, we'll send a reset link to <strong>{user?.email}</strong>.
              </p>
              <button
                type="submit"
                disabled={pwSaving}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs uppercase tracking-widest transition hover:bg-muted disabled:opacity-60"
              >
                {pwSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                {pwSaving ? "Sending…" : "Send Password Reset Email"}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 rounded-lg border border-border bg-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span className="text-sm">SafariSmart v1.0.0</span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-4 last:border-b-0 last:pb-0">
      <div>
        <h3 className="font-semibold">{label}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          "relative h-6 w-11 rounded-full transition " +
          (checked ? "bg-[var(--color-gold)]" : "bg-muted border border-border")
        }
      >
        <span
          className={
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white/90 shadow transition-transform " +
            (checked ? "translate-x-5" : "translate-x-0")
          }
        />
      </button>
    </div>
  );
}
