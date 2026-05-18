export function SiteFooter() {
    return (<footer className="mt-32 border-t border-border bg-[var(--color-cream)]">
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
          <ul className="mt-4 space-y-2 text-sm">
            <li>Luxury Lodges</li>
            <li>Expeditions</li>
            <li>Conservation</li>
            <li>Field Guide</li>
          </ul>
        </div>
        <div>
          <div className="eyebrow">Operations</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>SOS Emergency</li>
            <li>Kiosk Mode</li>
            <li>Admin</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} SafariSmart. All wild rights reserved.</span>
          <span>Serengeti · Ngorongoro · Grumeti</span>
        </div>
      </div>
    </footer>);
}
