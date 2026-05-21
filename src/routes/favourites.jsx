import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/favourites")({
  head: () => ({ meta: [{ title: "Favourites — SafariSmart" }] }),
  component: FavouritesAliasPage,
});

function FavouritesAliasPage() {
  return <Navigate to="/favorites" />;
}
