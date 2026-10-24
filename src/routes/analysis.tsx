import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, User, FlaskConical } from "lucide-react";
import { Page, Helix, btnPrimary } from "@/components/Shell";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { blip } from "@/lib/sound";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Building Your Experience — OriginDNA" },
      { name: "description", content: "A cinematic visual simulation that prepares your OriginDNA dashboard." },
      { property: "og:title", content: "Building Your Experience — OriginDNA" },
      { property: "og:description", content: "Watch your ancestry dashboard come to life." },
    ],
  }),
  component: Analysis,
});

const STAGES = ["Preparing Your Experience", "Building Your Visualization", "Mapping Demo Regions", "Generating Your Dashboard", "Experience Ready"];

function Analysis() {
  const { portrait } = useApp();
  const { t } = useT();
  const nav = useNavigate();
  const [p, setP] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setP((v) => { if (v >= 100) { clearInterval(id); return 100; } return v + 1; }), 55);
    return () => clearInterval(id);
  }, []);
  const stage = Math.min(4, Math.floor(p / 25));
  useEffect(() => { blip(400 + stage * 120, 0.12); }, [stage]);

  const R = 120, C = 2 * Math.PI * R;
  return (
    <Page className="flex flex-col items-center pt-10 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs text-warning">
        <FlaskConical className="h-3.5 w-3.5" /> {t("Visual simulation only — no genetic or facial analysis is performed.")}
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

      <button className={btnPrimary + " mt-8"} disabled={p < 100} onClick={() => nav({ to: "/dashboard" })}>{t("Open Dashboard")}</button>
    </Page>
  );
}
