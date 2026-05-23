import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Menu, AlertTriangle, Bell, Heart, User, Settings, X, Map, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/language/i18n-provider";

// Non-admin nav items (shown to everyone)
const navBase = [
  { to: "/explore", key: "explore" },
  { to: "/attractions", label: "Attractions" },
  { to: "/culture-hub", label: "Culture Hub" },
  { to: "/itinerary", key: "itinerary" },
  { to: "/events", key: "events" },
  { to: "/tour-packages", key: "tourPackages" },
  { to: "/accommodations", key: "accommodations" },
  { to: "/transport", key: "transport" },
  { to: "/bookings", key: "bookings" },
  { to: "/business-dashboard", key: "businessDashboard" },
  { to: "/notifications", key: "notifications" },
  { to: "/favorites", key: "favorites" },
  { to: "/field-guide", key: "fieldGuide" },
];
export function SiteHeader({ transparent = false }) {
  const HIDE_AFTER_SCROLL_Y = 200;

  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const nav = user?.is_admin
    ? [...navBase, { to: "/admin-dashboard", key: "adminDashboard" }]
    : navBase;
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [open, setOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      if (y < HIDE_AFTER_SCROLL_Y) {
        setIsHeaderVisible(true);
      } else if (delta > 6) {
        setIsHeaderVisible(false);
      } else if (delta < -4) {
        setIsHeaderVisible(true);
      }

      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sidebar-open", open);
    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const closeSidebar = () => setOpen(false);
  const floatingHeaderClass =
    isHeaderVisible || open
      ? "opacity-100 translate-y-0"
      : "pointer-events-none opacity-0 -translate-y-3";

  const sidebarContent = (
    <>
      <div className="flex items-center justify-end border-b border-white/15 px-5 py-5">
        <button
          onClick={closeSidebar}
          className="rounded-full border border-white/25 p-2 hover:bg-white/10 lg:hidden"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="min-h-0 flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-5">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={closeSidebar}
            className="rounded-xl px-3 py-2 text-sm tracking-wide whitespace-normal break-words hover:bg-white/10"
          >
            {n.label ?? t(`header.nav.${n.key}`)}
          </Link>
        ))}

        <div className="my-3 border-t border-white/15" />

        <Link
          to="/maps"
          onClick={closeSidebar}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-normal break-words hover:bg-white/10"
        >
          <Map className="h-4 w-4" /> {t("header.mapDirections")}
        </Link>

        <Link
          to="/notifications"
          onClick={closeSidebar}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-normal break-words hover:bg-white/10"
        >
          <Bell className="h-4 w-4" /> {t("header.notifications")}
        </Link>
        <Link
          to="/favorites"
          onClick={closeSidebar}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-normal break-words hover:bg-white/10"
        >
          <Heart className="h-4 w-4" /> {t("header.favorites")}
        </Link>
        <Link
          to="/profile"
          onClick={closeSidebar}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-normal break-words hover:bg-white/10"
        >
          <User className="h-4 w-4" /> {t("header.profile")}
        </Link>
        <Link
          to="/settings"
          onClick={closeSidebar}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-normal break-words hover:bg-white/10"
        >
          <Settings className="h-4 w-4" /> {t("header.settings")}
        </Link>

        <Link
          to="/sos"
          onClick={closeSidebar}
          className="mt-2 inline-flex items-center gap-2 rounded-xl border border-red-300/40 px-3 py-2 text-sm text-red-200 whitespace-normal break-words hover:bg-red-500/15"
        >
          <AlertTriangle className="h-4 w-4" /> {t("header.sosEmergency")}
        </Link>
      </nav>

      <div className="border-t border-white/15 px-5 py-4">
        {user ? (
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/" });
              closeSidebar();
            }}
            className="w-full rounded-full border border-white/25 px-4 py-2 text-xs uppercase tracking-widest hover:bg-white/10"
          >
            {t("header.signOut")}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={closeSidebar}
              className="rounded-full border border-white/25 px-4 py-2 text-center text-xs uppercase tracking-widest hover:bg-white/10"
            >
              {t("common.signIn")}
            </Link>
            <Link
              to="/register"
              onClick={closeSidebar}
              className="rounded-full bg-[var(--color-gold)] px-4 py-2 text-center text-xs uppercase tracking-widest text-[var(--color-ink)] hover:brightness-95"
            >
              {t("header.begin")}
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <div
        className={
          "pointer-events-none fixed top-5 z-30 hidden -translate-x-1/2 transition-all duration-300 lg:block " +
          floatingHeaderClass
        }
        style={{ left: "50%" }}
      >
        <Link to="/" className="pointer-events-auto flex items-center gap-3 text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-current/40">
            <span className="font-display text-lg leading-none">S</span>
          </span>
          <div className="leading-tight text-center">
            <div className="eyebrow !text-[0.62rem]" style={{ color: "inherit", opacity: 0.7 }}>
              {t("header.tagline")}
            </div>
            <div className="font-display text-xl">SafariSmart</div>
          </div>
        </Link>
      </div>

      <header
        className={
          "absolute z-40 w-full transition-all duration-300 lg:hidden " +
          floatingHeaderClass +
          " " +
          (transparent
            ? "text-cream"
            : "text-foreground bg-background/95 backdrop-blur border-b border-border")
        }
      >
        <div className="relative mx-auto flex max-w-7xl items-center justify-start px-6 py-5">
        <button
          className="inline-flex items-center gap-2 rounded-full border border-current/25 px-4 py-2 text-xs uppercase tracking-widest hover:bg-black/10"
          onClick={() => setOpen(true)}
          aria-label="Menu"
        >
          <Menu />
        </button>

        <Link to="/" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-current/40">
            <span className="font-display text-lg leading-none">S</span>
          </span>
          <div className="leading-tight text-center">
            <div className="eyebrow !text-[0.62rem] hidden sm:block" style={{ color: "inherit", opacity: 0.7 }}>
              {t("header.tagline")}
            </div>
            <div className="font-display text-xl">SafariSmart</div>
          </div>
        </Link>

          <div className="ml-auto h-10 w-20" aria-hidden="true" />
        </div>
      </header>

      <button
        className={
          "fixed left-6 top-5 z-40 hidden items-center gap-2 rounded-full border border-current/25 bg-background/85 px-4 py-2 text-xs uppercase tracking-widest text-foreground backdrop-blur transition-all duration-300 hover:bg-black/10 lg:inline-flex " +
          floatingHeaderClass
        }
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu />
      </button>

      <button
        className={
          "fixed inset-0 z-40 bg-black/35 transition-opacity duration-300 " +
          (open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")
        }
        onClick={closeSidebar}
        aria-label="Close menu backdrop"
      />

      <div
        className={
          "fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] max-w-[90vw] transition " +
          (open ? "pointer-events-auto" : "pointer-events-none")
        }
      >
        <aside
          className={
            "fixed inset-y-0 left-0 flex h-screen w-[var(--sidebar-width)] max-w-[90vw] flex-col overflow-x-clip overflow-y-hidden bg-[var(--color-ink)] text-[var(--color-cream)] shadow-2xl transition-transform duration-300 " +
            (open ? "translate-x-0" : "-translate-x-full")
          }
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
