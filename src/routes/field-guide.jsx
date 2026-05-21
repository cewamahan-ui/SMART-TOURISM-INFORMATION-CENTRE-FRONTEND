import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Search, BookOpen, Compass, Leaf } from "lucide-react";
import { useState } from "react";
export const Route = createFileRoute("/field-guide")({
    head: () => ({ meta: [{ title: "Field Guide — SafariSmart" }] }),
    component: FieldGuide,
});
const ENTRIES = [
    { name: "African Elephant", binomial: "Loxodonta africana", note: "Matriarchal herds; rely on infrasound communication across kilometers.", tag: "Mammal" },
    { name: "Masai Lion", binomial: "Panthera leo nubica", note: "Coalitions of brothers patrol territories spanning 200km².", tag: "Predator" },
    { name: "Leopard", binomial: "Panthera pardus", note: "Solitary, nocturnal; caches kills high in acacia branches.", tag: "Predator" },
    { name: "Cheetah", binomial: "Acinonyx jubatus", note: "Diurnal hunter — sprints up to 112 km/h in short bursts.", tag: "Predator" },
    { name: "Black Rhino", binomial: "Diceros bicornis", note: "Critically endangered; conservation funded by every booking.", tag: "Conservation" },
    { name: "Blue Wildebeest", binomial: "Connochaetes taurinus", note: "Large herds seasonally traverse the Maasai Mara ecosystem and connected corridors.", tag: "Migration" },
];
function FieldGuide() {
    const [q, setQ] = useState("");
    const filtered = ENTRIES.filter((e) => (e.name + e.binomial + e.tag).toLowerCase().includes(q.toLowerCase()));
    return (<div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="h-20"/>
      <section className="mx-auto max-w-5xl px-6 pt-12">
        <div className="flex items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <div className="eyebrow">The Modern Safari</div>
            <h1 className="mt-3 font-display text-6xl">Field Guide</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              An offline-first companion for tracking the wild. Notes curated by your assigned guide.
            </p>
          </div>
          <label className="hidden items-center gap-2 border-b border-border pb-1 md:flex">
            <Search className="h-4 w-4 text-muted-foreground"/>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search species" className="w-64 bg-transparent text-sm outline-none"/>
          </label>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 md:grid-cols-6">
          {[
            { icon: BookOpen, label: "All" },
            { icon: Leaf, label: "Mammal" },
            { icon: Compass, label: "Predator" },
            { icon: Leaf, label: "Conservation" },
            { icon: Compass, label: "Migration" },
            { icon: BookOpen, label: "Birds" },
        ].map((c) => (<button key={c.label} onClick={() => setQ(c.label === "All" ? "" : c.label)} className="flex flex-col items-center gap-2 rounded border border-border bg-card p-4 text-xs uppercase tracking-widest text-muted-foreground hover:border-[var(--color-gold)] hover:text-foreground">
              <c.icon className="h-4 w-4"/> {c.label}
            </button>))}
        </div>

        <ul className="mt-12 divide-y divide-border">
          {filtered.map((e) => (<li key={e.name} className="grid grid-cols-12 gap-6 py-8">
              <div className="col-span-3">
                <div className="eyebrow">{e.tag}</div>
                <h3 className="mt-2 font-display text-2xl">{e.name}</h3>
                <p className="text-xs italic text-muted-foreground">{e.binomial}</p>
              </div>
              <p className="col-span-9 text-sm leading-relaxed text-foreground/80">{e.note}</p>
            </li>))}
        </ul>
      </section>
      <SiteFooter />
    </div>);
}
