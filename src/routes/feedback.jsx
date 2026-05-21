import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useMutation } from "@tanstack/react-query";
import { feedbackApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/language/i18n-provider";
import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/feedback")({
  head: () => ({ meta: [{ title: "Leave a Review — SafariSmart" }] }),
  component: FeedbackPage,
});

const TARGET_TYPES = ["attraction", "accommodation", "tour"];

function FeedbackPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [form, setForm] = useState({
    target_type: "attraction",
    target_id: "",
    rating: 5,
    title: "",
    body: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      feedbackApi.reviews.create({
        target_type: form.target_type,
        ...(form.target_id.trim() ? { target_id: form.target_id.trim() } : {}),
        rating: form.rating,
        title: form.title,
        body: form.body,
      }),
    onSuccess: () => {
      toast.success(t("feedback.success", "Thank you for your review!"));
      setForm({ target_type: "attraction", target_id: "", rating: 5, title: "", body: "" });
    },
    onError: (err) => {
      toast.error(err?.message || t("feedback.error", "Failed to submit. Please try again."));
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="h-20" />
        <section className="mx-auto max-w-2xl px-6 pt-12 text-center">
          <h1 className="font-display text-5xl">{t("feedback.signInRequired", "Sign in to leave a review")}</h1>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-[var(--color-ink)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-cream)]"
          >
            {t("common.signIn", "Sign In")}
          </Link>
        </section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20" />

      <section className="mx-auto max-w-2xl px-6 pt-12">
        <div className="border-b border-border pb-8">
          <div className="eyebrow">{t("feedback.eyebrow", "Your Voice")}</div>
          <h1 className="mt-3 font-display text-6xl">{t("feedback.title", "Leave a Review")}</h1>
          <p className="mt-3 text-muted-foreground">
            {t("feedback.subtitle", "Share your experience to help other travellers.")}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-10 space-y-7"
        >
          <div>
            <span className="eyebrow">{t("feedback.targetType", "Reviewing")}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {TARGET_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, target_type: type }))}
                  className={
                    "rounded-full border px-4 py-1.5 text-xs uppercase tracking-widest transition " +
                    (form.target_type === type
                      ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-ink)]"
                      : "border-border text-muted-foreground hover:border-[var(--color-gold)]/50")
                  }
                >
                  {t(`feedback.targetTypes.${type}`, type)}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="eyebrow">ID (optional)</span>
            <input
              type="text"
              value={form.target_id}
              onChange={(e) => setForm((f) => ({ ...f, target_id: e.target.value }))}
              placeholder="Leave blank for a general review"
              className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"
            />
          </label>

          <div>
            <span className="eyebrow">{t("feedback.ratingLabel", "Your rating")}</span>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: n }))}
                  className="transition hover:scale-110"
                >
                  <Star
                    className="h-7 w-7"
                    fill={n <= form.rating ? "var(--color-gold)" : "none"}
                    stroke={n <= form.rating ? "var(--color-gold)" : "currentColor"}
                  />
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="eyebrow">{t("feedback.titleLabel", "Review title")}</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"
            />
          </label>

          <label className="block">
            <span className="eyebrow">{t("feedback.bodyLabel", "Your experience")}</span>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={5}
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)] resize-none"
            />
          </label>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-7 py-3 text-xs uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-110 disabled:opacity-60"
          >
            {mutation.isPending
              ? t("feedback.submitting", "Submitting\u2026")
              : t("feedback.submit", "Submit Review")}
          </button>
        </form>
      </section>

      <SiteFooter />
    </div>
  );
}
