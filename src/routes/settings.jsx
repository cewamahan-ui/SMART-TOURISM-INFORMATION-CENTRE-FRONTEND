import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@tanstack/react-router";
import { Bell, Lock, Eye, Globe, Zap } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/language/i18n-provider";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — SafariSmart" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { language, setLanguage, availableLanguages, t } = useI18n();
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketing: false,
    language,
    theme: "auto",
  });

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-4xl px-6 pt-12">
        <div className="border-b border-border pb-8">
          <div className="eyebrow">Personalize</div>
          <h1 className="mt-3 font-display text-6xl">Settings</h1>
        </div>

        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5" />
            <h2 className="font-display text-2xl">Notifications</h2>
          </div>
          <div className="space-y-4 rounded-lg border border-border bg-card p-6">
            <Toggle
              label="Email Notifications"
              description="Receive updates about bookings and events"
              checked={preferences.emailNotifications}
              onChange={(v) =>
                setPreferences({ ...preferences, emailNotifications: v })
              }
            />
            <Toggle
              label="Push Notifications"
              description="Real-time alerts on your device"
              checked={preferences.pushNotifications}
              onChange={(v) =>
                setPreferences({ ...preferences, pushNotifications: v })
              }
            />
            <Toggle
              label="Marketing Emails"
              description="Promotions, tips, and news"
              checked={preferences.marketing}
              onChange={(v) =>
                setPreferences({ ...preferences, marketing: v })
              }
            />
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-5 w-5" />
            <h2 className="font-display text-2xl">Preferences</h2>
          </div>
          <div className="space-y-4 rounded-lg border border-border bg-card p-6">
            <div>
              <label className="block">
                <span className="eyebrow">{t("settings.language")}</span>
                <select
                  value={preferences.language}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPreferences({ ...preferences, language: next });
                    setLanguage(next);
                  }}
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
            <div>
              <label className="block">
                <span className="eyebrow">Theme</span>
                <select
                  value={preferences.theme}
                  onChange={(e) =>
                    setPreferences({ ...preferences, theme: e.target.value })
                  }
                  className="mt-2 w-full rounded border border-border bg-transparent px-3 py-2 text-base outline-none transition focus:border-[var(--color-gold)]"
                >
                  <option value="auto">Auto (System)</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="h-5 w-5" />
            <h2 className="font-display text-2xl">Privacy & Security</h2>
          </div>
          <div className="space-y-4 rounded-lg border border-border bg-card p-6">
            <button className="flex w-full items-center justify-between rounded border border-border p-4 transition hover:bg-muted">
              <div className="text-left">
                <h3 className="font-semibold">Change Password</h3>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
              <span className="text-muted-foreground">→</span>
            </button>
            <button className="flex w-full items-center justify-between rounded border border-border p-4 transition hover:bg-muted">
              <div className="text-left">
                <h3 className="font-semibold">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <span className="text-muted-foreground">→</span>
            </button>
            <button className="flex w-full items-center justify-between rounded border border-border p-4 transition hover:bg-muted">
              <div className="text-left">
                <h3 className="font-semibold">Data & Privacy</h3>
                <p className="text-sm text-muted-foreground">Download or delete your data</p>
              </div>
              <span className="text-muted-foreground">→</span>
            </button>
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
    <div className="flex items-center justify-between border-b border-border/50 pb-4 last:border-b-0">
      <div>
        <h3 className="font-semibold">{label}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={
          "relative h-6 w-11 rounded-full transition " +
          (checked
            ? "bg-[var(--color-gold)]"
            : "bg-muted border border-border")
        }
      >
        <span
          className={
            "absolute inset-0.5 rounded-full bg-white/90 transition " +
            (checked ? "translate-x-5" : "")
          }
        />
      </button>
    </div>
  );
}
