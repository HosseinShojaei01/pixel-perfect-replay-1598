import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Download, Share2, Trash2, User, Calendar, Pencil, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Page, Helix, Map, ModeBadge, btnPrimary, btnGhost } from "@/components/Shell";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { colorFor, regionInfo } from "@/lib/ancestry";
import { downloadReport } from "@/lib/report";
import { blip } from "@/lib/sound";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Ancestry Dashboard — OriginDNA" },
      { name: "description", content: "Interactive world map, ancestry chart, country breakdown and downloadable report." },
      { property: "og:title", content: "Ancestry Dashboard — OriginDNA" },
      { property: "og:description", content: "Explore ancestry results on a cinematic interactive dashboard." },
    ],
  }),
  component: Dashboard,
});

const STORIES: Record<string, string> = {
  iran: "The Iranian plateau has been a crossroads of empires, poetry and trade for millennia — home to Persepolis and the Silk Road's great caravanserais.",
  turkey: "Anatolia bridges Europe and Asia; Hittites, Greeks, Byzantines and Ottomans each left layers of culture here.",
  italy: "From Etruscan cities to Rome and the Renaissance, the Italian peninsula shaped Mediterranean art, law and language.",
  greece: "The Aegean world gave rise to seafaring city-states, philosophy and democracy, spreading colonies across the Mediterranean.",
  georgia: "Nestled in the Caucasus, Georgia holds one of the world's oldest winemaking traditions and a unique alphabet.",
};

const card = "glass glow-border rounded-3xl p-5 sm:p-6";

function Dashboard() {
  const { entries, mode, portrait, setPortrait, name, theme } = useApp();
  const { t, region, lang } = useT();
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const date = useMemo(() => new Date().toLocaleDateString(lang === "fa" ? "fa-IR" : "en-GB", { dateStyle: "long" }), [lang]);
  const top = entries.reduce<(typeof entries)[number] | undefined>((a, b) => (!a || b.percent > a.percent ? b : a), undefined);
  const pick = (id: string) => { setSel(id); blip(620); };

  const pdf = async () => {
    setBusy(true);
    try { await downloadReport({ entries, mode, portrait, name, includePhoto: true }); toast.success("Report downloaded"); }
    catch { toast.error("Couldn't create the PDF. Please try again."); }
    finally { setBusy(false); }
  };
  const share = async () => {
    const text = `OriginDNA ${mode === "demo" ? "(simulated demo)" : "(my DNA results)"}\n` + entries.map((e) => `${e.region}: ${e.percent}%`).join("\n");
    try {
      if (navigator.share) await navigator.share({ title: "OriginDNA", text });
      else { await navigator.clipboard.writeText(text); toast.success("Share preview copied", { description: "Your photo is never included." }); }
    } catch {}
  };

  return (
    <Page className="pt-8">
      {/* Profile */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={card + " flex flex-col items-center gap-6 sm:flex-row"}>
        <div className="relative shrink-0 rounded-full bg-brand p-1 shadow-glow">
          {portrait ? <img src={portrait} alt="Your portrait" className="h-28 w-28 rounded-full object-cover" /> :
            <div className="grid h-28 w-28 place-items-center rounded-full bg-background"><User className="h-10 w-10 text-muted-foreground" /></div>}
        </div>
        <div className="flex-1 text-center sm:text-start">
          <ModeBadge mode={mode} />
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{t("Welcome")}{name ? `, ${name}` : ""} <span className="text-gradient">✦</span></h1>
          <p className="mt-1 text-muted-foreground">{t("Your Ancestry Dashboard")}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {date}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button className={btnPrimary} onClick={pdf} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{t("Download PDF")}</button>
          <button className={btnGhost} onClick={share}><Share2 className="h-4 w-4" />{t("Share preview")}</button>
          {portrait && <button className={btnGhost} onClick={() => { setPortrait(null); toast.success("Photo deleted from this session"); }}><Trash2 className="h-4 w-4" />{t("Delete photo")}</button>}
          <Link to="/import" className={btnGhost}><Pencil className="h-4 w-4" />{mode === "demo" ? t("Import Real Results") : "Edit"}</Link>
        </div>
      </motion.section>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Map */}
        <section className={card + " lg:col-span-2"}>
          <h2 className="mb-4 text-lg font-semibold">{t("Geographic Map")}</h2>
          <div className="h-[340px] sm:h-[420px]">
            <Map entries={entries} selected={sel} onSelect={pick} dark={theme === "dark"} label={region} />
          </div>
        </section>
        {/* Donut */}
        <section className={card}>
          <h2 className="text-lg font-semibold">{t("Distribution")}</h2>
          <div className="relative h-64">
            <ResponsiveContainer>
              <PieChart>
                <defs>{entries.map((_, i) => (
                  <linearGradient key={i} id={`g${i}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={colorFor(i)} /><stop offset="1" stopColor={colorFor(i)} stopOpacity={0.6} /></linearGradient>
                ))}</defs>
                <Pie data={entries} dataKey="percent" nameKey="region" innerRadius="64%" outerRadius="92%" paddingAngle={2} stroke="none" animationDuration={1400}
                  onClick={(d) => pick((d as unknown as { id: string }).id)}>
                  {entries.map((e, i) => <Cell key={e.id} fill={`url(#g${i})`} opacity={!sel || sel === e.id ? 1 : 0.35} className="cursor-pointer outline-none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }}
                  formatter={(v, n) => [`${v}%`, region(String(n))]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div><div className="font-display text-3xl font-bold text-gradient">{top?.percent}%</div><div className="text-xs text-muted-foreground">{top && region(top.region)}</div></div>
            </div>
          </div>
          <ul className="mt-2 space-y-1.5">
            {entries.map((e, i) => (
              <li key={e.id}><button onClick={() => pick(e.id)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm transition hover:bg-muted ${sel === e.id ? "bg-muted" : ""}`}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorFor(i) }} />{region(e.region)}<span className="ms-auto tabular-nums text-muted-foreground">{e.percent}%</span>
              </button></li>
            ))}
          </ul>
        </section>
      </div>

      {/* Cards */}
      <h2 className="mt-10 mb-4 text-xl font-semibold">{t("Country Breakdown")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((e, i) => (
          <motion.button key={e.id} onClick={() => pick(e.id)} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
            className={`glass rounded-3xl p-5 text-start transition hover:-translate-y-1 hover:shadow-glow ${sel === e.id ? "ring-2 ring-ring" : ""}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{regionInfo(e.region)?.flag ?? "🌐"}</span>
              <span className="font-semibold">{region(e.region)}</span>
              <span className="ms-auto font-display text-2xl font-bold" style={{ color: colorFor(i) }}>{e.percent}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div className="h-full rounded-full" style={{ background: colorFor(i), boxShadow: `0 0 12px ${colorFor(i)}` }}
                initial={{ width: 0 }} whileInView={{ width: `${e.percent}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.2 }} />
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <section className={card + " relative overflow-hidden"}>
          <h2 className="text-lg font-semibold">{t("Your Genome, Visualized")}</h2>
          <p className="text-sm text-muted-foreground">An artistic, real-time double helix.</p>
          <Helix speed={0.6} className="h-80" />
        </section>
        <section className={card}>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><BookOpen className="h-5 w-5 text-cyan" />{t("Ancestry Story")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "demo" ? "Fictional educational content about the demo regions — not about you." : "Background on regions present in the results you provided."}
          </p>
          <div className="mt-4 space-y-4">
            {entries.filter((e) => e.region !== "Other Regions").map((e, i) => (
              <div key={e.id} className="border-s-2 ps-4" style={{ borderColor: colorFor(i) }}>
                <h3 className="font-semibold">{regionInfo(e.region)?.flag} {region(e.region)} · {e.percent}%</h3>
                <p className="text-sm text-muted-foreground">{STORIES[e.region.toLowerCase()] ?? `${e.region} represents ${e.percent}% of the results shown. Explore its history, languages and cuisine to bring this part of the story to life.`}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}
