import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Accessibility, Languages, QrCode, ArrowRight } from "lucide-react";
import { LANDING_PAGE_VIDEO } from "@/lib/media-assets";
import { useI18n } from "@/language/i18n-provider";
import QRCode from "react-qr-code";

export const Route = createFileRoute("/")({
    component: KioskLanding,
});

function KioskLanding() {
    const { language, setLanguage, availableLanguages, t } = useI18n();
    const [textScale, setTextScale] = useState("normal");
    const [highContrast, setHighContrast] = useState(false);
    const [showQr, setShowQr] = useState(true);

    useEffect(() => {
        const sizeMap = {
            compact: "14px",
            normal: "16px",
            large: "18px",
        };
        document.documentElement.style.fontSize = sizeMap[textScale] || "16px";
        return () => {
            document.documentElement.style.fontSize = "16px";
        };
    }, [textScale]);

    return (<div className={"min-h-screen bg-background text-foreground " +
            (highContrast ? "contrast-125" : "")}>
      <section className="relative isolate min-h-screen overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={LANDING_PAGE_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/85"/>

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 md:px-8">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[var(--color-cream)]">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-cream)]/60 font-display text-lg">
                S
              </span>
              <div>
                <p className="eyebrow !text-[var(--color-cream)]/75">{t("kiosk.brand")}</p>
                <p className="font-display text-2xl">SafariSmart</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/login" className="rounded-full border border-[var(--color-cream)]/45 px-4 py-2 text-xs font-medium uppercase tracking-widest text-[var(--color-cream)] transition hover:bg-[var(--color-cream)]/10">
                {t("common.signIn")}
              </Link>
              <Link to="/register" className="rounded-full bg-[var(--color-gold)] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-95">
                {t("common.signUp")}
              </Link>
            </div>
          </header>

          <main className="mt-8 grid flex-1 gap-8 lg:grid-cols-12">
            <section className="lg:col-span-7">
              <p className="eyebrow !text-[var(--color-cream)]/70">{t("kiosk.welcome")}</p>
              <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[0.95] text-[var(--color-cream)] md:text-7xl">
                {t("kiosk.title")}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-cream)]/85 md:text-lg">
                {t("kiosk.subtitle")}
              </p>

              <Link to="/kiosk-preferences" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-7 py-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-ink)] transition hover:brightness-95">
                {t("kiosk.startPreferenceFlow")}
                <ArrowRight className="h-4 w-4"/>
              </Link>
            </section>

            <aside className="space-y-4 lg:col-span-5">
              <div className="rounded-3xl border border-[var(--color-cream)]/25 bg-black/75 p-5">
                <div className="flex items-center gap-2 text-[var(--color-cream)]">
                  <Accessibility className="h-4 w-4"/>
                  <h3 className="font-display text-2xl">{t("kiosk.accessibilityTitle")}</h3>
                </div>

                <div className="mt-4 grid gap-3">
                  <label className="flex items-center justify-between text-sm text-[var(--color-cream)]/90">
                    {t("kiosk.textSize")}
                    <select value={textScale} onChange={(e) => setTextScale(e.target.value)} className="rounded-lg border border-[var(--color-cream)]/30 bg-black/50 px-2 py-1 text-[var(--color-cream)]">
                      <option value="compact" className="text-black">{t("kiosk.compact")}</option>
                      <option value="normal" className="text-black">{t("kiosk.normal")}</option>
                      <option value="large" className="text-black">{t("kiosk.large")}</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between text-sm text-[var(--color-cream)]/90">
                    {t("kiosk.highContrast")}
                    <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} className="h-4 w-4"/>
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--color-cream)]/25 bg-black/75 p-5">
                <div className="flex items-center gap-2 text-[var(--color-cream)]">
                  <Languages className="h-4 w-4"/>
                  <h3 className="font-display text-2xl">{t("kiosk.languageTitle")}</h3>
                </div>

                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-4 w-full rounded-xl border border-[var(--color-cream)]/30 bg-black/50 px-3 py-2 text-sm text-[var(--color-cream)] outline-none focus:border-[var(--color-gold)]">
                  {availableLanguages.map((item) => (<option key={item.code} value={item.code} className="text-black">
                      {item.label}
                    </option>))}
                </select>
              </div>
            </aside>
          </main>

          {showQr && (<footer className="mt-8 rounded-3xl border border-[var(--color-cream)]/25 bg-black/75 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[var(--color-cream)]">
                    <QrCode className="h-4 w-4"/>
                    <p className="font-medium">{t("kiosk.qrTitle")}</p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-cream)]/75">
                    {t("kiosk.qrDescription")}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-2 shadow-sm">
                  <QRCode
                    value={typeof window !== "undefined" ? `${window.location.origin}/explore` : "https://safarismart.app/explore"}
                    size={88}
                    bgColor="#ffffff"
                    fgColor="#17130d"
                    level="M"
                  />
                </div>
              </div>

              <button onClick={() => setShowQr(false)} className="mt-3 text-xs uppercase tracking-widest text-[var(--color-cream)]/80 underline underline-offset-4">
                {t("kiosk.hideQr")}
              </button>
            </footer>)}
        </div>
      </section>
    </div>);
}
