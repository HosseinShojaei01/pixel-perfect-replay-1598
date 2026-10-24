import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Upload, Sparkles, Map as MapIcon, FileDown, Lock, Info, TestTube2 } from "lucide-react";
import { Page, Helix, btnPrimary, btnGhost } from "@/components/Shell";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { blip } from "@/lib/sound";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OriginDNA — Discover the Story Behind Your DNA" },
      { name: "description", content: "Explore your ancestry through a cinematic, interactive dashboard. Try the demo or import real DNA test results." },
      { property: "og:title", content: "OriginDNA — Discover Your Story" },
      { property: "og:description", content: "A premium, interactive way to explore your DNA ancestry results." },
    ],
  }),
  component: Index,
});

function Particles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 26 }).map((_, i) => (
        <span key={i} className="animate-float-up absolute h-1 w-1 rounded-full bg-cyan shadow-glow"
          style={{ left: `${(i * 37) % 100}%`, top: `${40 + ((i * 53) % 60)}%`, animationDuration: `${5 + (i % 6)}s`, animationDelay: `${(i % 7) * 0.7}s`, opacity: 0.6 }} />
      ))}
    </div>
  );
}

function Index() {
  const { t } = useT();
  const { startDemo } = useApp();
  const nav = useNavigate();
  const features = [
    { icon: Upload, title: "Personal portrait", body: "Your photo personalizes the report — it is never used to guess ancestry." },
    { icon: MapIcon, title: "Living world map", body: "Glowing markers and migration lines trace every region in your results." },
    { icon: Sparkles, title: "Cinematic 3D", body: "A real-time DNA helix and fluid motion make your story feel alive." },
    { icon: FileDown, title: "Beautiful PDF", body: "Download a polished report, clearly labeled as demo or your real data." },
  ];
  const steps = [
    ["01", "Upload a portrait", "Optional, stays in your browser."],
    ["02", "Choose your data", "Explore the demo, or import results from your DNA test provider."],
    ["03", "Explore & export", "Interactive map, charts, story and a downloadable report."],
  ];
  return (
    <Page>
      <section className="relative grid min-h-[86vh] items-center gap-8 pt-8 lg:grid-cols-[1.1fr_1fr]">
        <div aria-hidden className="grid-bg absolute inset-0 -z-10 opacity-60" />
        <Particles />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-glow" /> Ancestry visualization platform
          </span>
          <h1 className="mt-6 text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
            <span className="text-gradient">{t("Discover the Story Behind Your DNA")}</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">{t("Explore your ancestry through a beautiful interactive experience.")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/upload" className={btnPrimary} onClick={() => blip(740)}>{t("Explore My Origins")} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
            <button className={btnGhost} onClick={() => { startDemo(); blip(520); nav({ to: "/dashboard" }); }}>{t("View Demo")}</button>
          </div>
          <div className="mt-8 flex max-w-lg items-start gap-3 rounded-2xl border border-cyan/20 bg-cyan/5 p-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
            <p>Accurate ancestry results require a DNA test. A photo can't reveal your genetic origins — OriginDNA visualizes results you import, or fictional demo data.</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2 }} className="relative h-[420px] sm:h-[560px]">
          <div className="absolute inset-[15%] rounded-full bg-violet/30 blur-[90px]" />
          <Helix className="relative h-full w-full" />
        </motion.div>
      </section>

      <section id="features" className="scroll-mt-28 py-20">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Crafted like a <span className="text-gradient">biotech lab</span></h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass glow-border rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-glow">
              <f.icon className="h-6 w-6 text-cyan" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how" className="scroll-mt-28 py-12">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">{t("How It Works")}</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map(([n, title, body]) => (
            <div key={n} className="glass rounded-3xl p-6">
              <div className="font-display text-4xl font-bold text-gradient">{n}</div>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
        <div className="glass glow-border mt-12 flex flex-col items-center gap-4 rounded-3xl p-8 text-center sm:flex-row sm:text-start">
          <TestTube2 className="h-10 w-10 shrink-0 text-violet" />
          <div className="flex-1">
            <h3 className="text-xl font-semibold">Already took a DNA test?</h3>
            <p className="text-sm text-muted-foreground">Enter or upload your results (CSV / JSON) and see them on the full dashboard.</p>
          </div>
          <Link to="/import" className={btnPrimary}>{t("Import Real Results")}</Link>
        </div>
        <p className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Privacy-first: photos and results stay in your browser and are never stored.</p>
      </section>
    </Page>
  );
}
