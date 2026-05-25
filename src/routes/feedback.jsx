import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feedbackApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/language/i18n-provider";
import { useState } from "react";
import { Star, MessageSquare, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/feedback")({
  head: () => ({ meta: [{ title: "Leave a Review — SafariSmart" }] }),
  component: FeedbackPage,
});

const TARGET_TYPES = ["attraction", "accommodation", "tour"];

function FeedbackPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ["reviews-all"],
    queryFn: () => feedbackApi.reviews.list({ per_page: 20 }),
    retry: false,
  });

  const [form, setForm] = useState({
    target_type: "attraction",
    target_id: "",
    rating: 5,
    title: "",
    body: "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const mediaMutation = useMutation({
    mutationFn: ({ reviewId, url }) =>
      feedbackApi.media.create({ target_type: "review", target_id: reviewId, url, media_type: "image" }),
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
    onSuccess: (result) => {
      const review = result?.data ?? result;
      toast.success(t("feedback.success", "Thank you for your review!"));
      if (imageUrl.trim() && review?.id) {
        mediaMutation.mutate({ reviewId: review.id, url: imageUrl.trim() });
      }
      setForm({ target_type: "attraction", target_id: "", rating: 5, title: "", body: "" });
      setImageUrl("");
      setShowImageInput(false);
      queryClient.invalidateQueries({ queryKey: ["reviews-all"] });
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

          {/* Optional image attachment */}
          <div>
            {showImageInput ? (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="eyebrow flex items-center gap-1.5">
                    <ImagePlus className="h-3.5 w-3.5"/> Attach Image (URL)
                  </span>
                  <button type="button" onClick={() => { setShowImageInput(false); setImageUrl(""); }}
                    className="rounded-full p-1 hover:bg-muted">
                    <X className="h-3.5 w-3.5"/>
                  </button>
                </div>
                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]"/>
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" onError={(e) => { e.currentTarget.style.display = "none"; }}
                    className="mt-3 max-h-40 rounded-lg object-cover"/>
                )}
              </div>
            ) : (
              <button type="button" onClick={() => setShowImageInput(true)}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition">
                <ImagePlus className="h-4 w-4"/> Add Image (optional)
              </button>
            )}
          </div>

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

      {/* Recent Reviews */}
      <section className="mx-auto max-w-2xl px-6 pb-24 mt-16">
        <div className="flex items-center gap-3 border-t border-border pt-10 mb-8">
          <MessageSquare className="h-5 w-5" />
          <h2 className="font-display text-3xl">Recent Reviews</h2>
        </div>

        {reviewsQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        )}

        {!reviewsQuery.isLoading && arrayifyReviews(reviewsQuery.data).length === 0 && (
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
        )}

        <div className="space-y-5">
          {arrayifyReviews(reviewsQuery.data).map((review, idx) => (
            <ReviewCard key={review.id ?? idx} review={review} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ReviewCard({ review }) {
  const stars = Math.min(5, Math.max(0, Math.round(Number(review.rating) || 0)));
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : null;
  const author = review.user?.full_name || review.user?.username || review.author_name || "Anonymous";
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5"
                fill={i < stars ? "var(--color-gold)" : "none"}
                stroke={i < stars ? "var(--color-gold)" : "currentColor"}
              />
            ))}
          </div>
          {review.title && <h4 className="mt-1.5 font-semibold text-sm">{review.title}</h4>}
        </div>
        {date && <span className="shrink-0 text-xs text-muted-foreground">{date}</span>}
      </div>
      {review.body && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/80 line-clamp-4">{review.body}</p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{author}</p>
        {(review.target_type || review.target_id) && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground capitalize">
            {review.target_type || "attraction"}
          </span>
        )}
      </div>
    </div>
  );
}

function arrayifyReviews(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.reviews)) return v.reviews;
  if (Array.isArray(v.items)) return v.items;
  return [];
}
