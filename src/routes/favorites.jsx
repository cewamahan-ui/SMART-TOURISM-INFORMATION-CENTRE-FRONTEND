import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { favoritesApi, attractionsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Heart, MapPin } from "lucide-react";
import lodge from "@/assets/attractions_images/lodge.jpg";
import tent from "@/assets/attractions_images/tent.jpg";
import migration from "@/assets/attractions_images/migration.jpg";
import balloon from "@/assets/attractions_images/balloon.jpg";
import night from "@/assets/attractions_images/night.jpg";
import hero from "@/assets/background_images/hero-serengeti.jpg";
import { toast } from "sonner";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "Favorites — SafariSmart" }] }),
  component: FavoritesPage,
});

const FALLBACK_IMAGES = [lodge, tent, migration, balloon, night, hero];

function FavoritesPage() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["favorites"],
    queryFn: favoritesApi.list,
    enabled: !!user,
    retry: false,
  });

  const removeMutation = useMutation({
    mutationFn: favoritesApi.remove,
    onSuccess: () => {
      toast.success("Removed from favorites");
      q.refetch();
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to remove");
    },
  });

  const list = arrayify(q.data);

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="h-20" />
        <section className="mx-auto max-w-6xl px-6 pt-12 text-center">
          <h1 className="font-display text-6xl">Sign in to view favorites</h1>
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

      <section className="mx-auto max-w-6xl px-6 pt-12">
        <div className="border-b border-border pb-8">
          <div className="eyebrow">Your Collection</div>
          <h1 className="mt-3 font-display text-6xl">Saved Favorites</h1>
          <p className="mt-3 text-muted-foreground">
            {list.length} experience{list.length !== 1 ? "s" : ""} saved
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        {q.isLoading && <p className="text-muted-foreground">Loading…</p>}

        {!q.isLoading && list.length === 0 && (
          <div className="rounded border border-dashed border-border p-10 text-center">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-3xl">No favorites yet</h3>
            <p className="mt-2 text-muted-foreground">
              Explore the collection and save your favorite experiences.
            </p>
            <Link
              to="/explore"
              className="mt-6 inline-flex rounded-full bg-[var(--color-gold)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-ink)]"
            >
              Explore Now
            </Link>
          </div>
        )}

        {list.length > 0 && (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {list.map((item, idx) => (
              <Card
                key={item.id ?? idx}
                item={item}
                idx={idx}
                onRemove={() => removeMutation.mutate(item.id)}
                isRemoving={removeMutation.isPending}
              />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function Card({ item, idx, onRemove, isRemoving }) {
  const img = item.image || item.image_url || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
  const name = item.name || item.title || "Untitled experience";
  const place = item.location || item.region || "Maasai Mara";

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={img}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <button
          onClick={onRemove}
          disabled={isRemoving}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[var(--color-cream)] text-red-600 transition hover:bg-red-100 disabled:opacity-60"
        >
          <Heart className="h-4 w-4 fill-current" />
        </button>
      </div>
      <div className="mt-5">
        <h3 className="font-display text-2xl leading-snug">{name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {place}
        </p>
        <Link
          to="/explore"
          className="mt-4 text-xs uppercase tracking-widest text-foreground underline underline-offset-8 decoration-[var(--color-gold)] decoration-2"
        >
          View Details →
        </Link>
      </div>
    </article>
  );
}

function arrayify(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.items)) return v.items;
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.favourites)) return v.favourites;
  return [];
}
