import { useState, useEffect } from "react";
import { QrCode, X, Smartphone } from "lucide-react";
import QRCode from "react-qr-code";

function SessionTransferQr() {
  const [open, setOpen] = useState(true);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  // Update URL on navigation without re-mounting
  useEffect(() => {
    const handler = () => setUrl(window.location.href);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  if (!url) return null;

  return (
    <div className="border-t border-[var(--color-gold)]/25 bg-[var(--color-ink)]/[0.03]">
      <div className="mx-auto max-w-7xl px-6 py-4">
        {open ? (
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--color-gold)]/35 text-[var(--color-gold)]">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Transfer session to your phone</p>
                <p className="mt-0.5 max-w-sm text-xs text-muted-foreground">
                  Scan this QR code to continue browsing on your mobile device — your current page opens instantly.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="rounded-xl border border-border bg-white p-2 shadow-sm">
                <QRCode value={url} size={80} bgColor="#ffffff" fgColor="#17130d" />
              </div>
              <button
                onClick={() => setOpen(false)}
                className="self-start rounded-full p-1 text-muted-foreground transition hover:bg-border"
                aria-label="Hide session QR"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
          >
            <QrCode className="h-3.5 w-3.5" />
            Show transfer QR
          </button>
        )}
      </div>
    </div>
  );
}

export function SiteFooter() {
    return (
      <footer className="mt-32 border-t border-border bg-background text-foreground">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="eyebrow">The Modern Safari</div>
            <h3 className="mt-3 font-display text-3xl">SafariSmart</h3>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              A new operating system for the wild — booking, itineraries, and live field
              guidance for the discerning expeditioner.
            </p>
          </div>
          <div>
            <div className="eyebrow">Explore</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Maasai Mara Experiences</li>
              <li>Lake Nakuru Safaris</li>
              <li>Tsavo Lodges</li>
              <li>Field Guide</li>
            </ul>
          </div>
          <div>
            <div className="eyebrow">Operations</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Emergency Hotline</li>
              <li>Kiosk Mode</li>
              <li>Admin</li>
              <li>Kenya Tourism Support</li>
            </ul>
          </div>
        </div>

        <SessionTransferQr />

        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} SafariSmart. All wild rights reserved.</span>
            <span>Maasai Mara · Lake Nakuru · Tsavo</span>
          </div>
        </div>
      </footer>
    );
}
