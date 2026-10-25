import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, User, FlaskConical } from "lucide-react";
import { Page, Helix, btnPrimary } from "@/components/Shell";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { blip } from "@/lib/sound";
import { comparePortrait } from "@/lib/comparison";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Building Your Experience — OriginDNA" },
      { name: "description", content: "A cinematic visual simulation that prepares your OriginDNA dashboard." },
      { property: "og:title", content: "Building Your Experience — OriginDNA" },
      { property: "og:description", content: "Real photographic comparison against licensed reference images." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analysis,
});

const STAGES = ["Sending your image", "Image validated", "Measuring photographic features", "Comparing reference images", "Comparison ready"];

function Analysis() {
  const { portrait, apiUrl, processingConsent, setComparison } = useApp();
  const { t } = useT();
  const nav = useNavigate();
  const [p, setP] = useState(0);

  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setP(0); setStage(0); setError("");
    if (!portrait || !processingConsent) { setError("Upload a portrait and give processing consent first."); return; }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    comparePortrait(apiUrl, portrait, processingConsent, (progress, label) => {
      setP(progress); setStage(Math.max(0, STAGES.indexOf(label)));
    }, controller.signal).then((result) => {
      if (!controller.signal.aborted) { setComparison(result); setP(100); setStage(4); }
    }).catch((err) => {
      setP(0);
      if (controller.signal.aborted) setError("Comparison cancelled or timed out. No substitute results were generated.");
      else setError(err instanceof Error ? err.message : "Comparison failed.");
    }).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [portrait, apiUrl, processingConsent, attempt]);
  useEffect(() => { blip(400 + stage * 120, 0.12); }, [stage]);

  const R = 120, C = 2 * Math.PI * R;
  return (
    <Page className="flex flex-col items-center pt-10 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs text-warning">
        <FlaskConical className="h-3.5 w-3.5" /> Photographic comparison only — no genetic or demographic inference.
      </span>

      <div className="relative mt-10 h-[300px] w-[300px] sm:h-[340px] sm:w-[340px]">
        <Helix speed={1.4} className="absolute -inset-16 opacity-60" />
        <svg viewBox="0 0 280 280" className="absolute inset-0 h-full w-full -rotate-90">
          <defs><linearGradient id="pg" x1="0" x2="1"><stop offset="0" stopColor="#8B5CF6" /><stop offset="1" stopColor="#06B6D4" /></linearGradient></defs>
          <circle cx="140" cy="140" r={R} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="6" />
          <circle cx="140" cy="140" r={R} fill="none" stroke="url(#pg)" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (C * p) / 100} style={{ filter: "drop-shadow(0 0 8px #8B5CF6)" }} />
        </svg>
        <div className="absolute inset-[18%] overflow-hidden rounded-full bg-muted">
          {portrait ? <img src={portrait} alt="" className="h-full w-full object-cover" /> : <User className="m-auto h-full w-1/2 text-muted-foreground" />}
          <div className="animate-scan absolute inset-x-0 h-1 bg-cyan shadow-[0_0_25px_6px_var(--cyan)]" />
          <div className="grid-bg absolute inset-0 opacity-50" />
        </div>
      </div>

      <div className="mt-8 font-display text-6xl font-bold tabular-nums text-gradient">{p}%</div>
      <AnimatePresence mode="wait">
        <motion.p key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-2 text-lg font-medium">{t(STAGES[stage] ?? "")}</motion.p>
      </AnimatePresence>

      <ol className="glass mt-8 w-full max-w-md space-y-2 rounded-3xl p-5 text-start text-sm">
        {STAGES.map((s, i) => (
          <li key={s} className={`flex items-center gap-3 ${i <= stage ? "text-foreground" : "text-muted-foreground/60"}`}>
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${i < stage || p === 100 ? "bg-brand text-primary-foreground" : i === stage ? "border border-cyan text-cyan" : "border border-border"}`}>
              {i < stage || p === 100 ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>{t(s)}
          </li>
        ))}
      </ol>

      {error && <div role="alert" className="mt-6 max-w-md text-sm text-destructive">{error}</div>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {error && <Button variant="outline" onClick={() => setAttempt((v) => v + 1)}>Retry comparison</Button>}
        <Button variant="outline" onClick={() => nav({ to: "/upload" })}>Back to upload</Button>
        <Button className={btnPrimary} disabled={p < 100 || Boolean(error)} onClick={() => nav({ to: "/dashboard" })}>{t("Open Dashboard")}</Button>
      </div>
    </Page>
  );
}
