import { Link } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, type ReactNode } from "react";
import { Dna, Moon, Sun, Volume2, VolumeX, Languages, FlaskConical, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { blip } from "@/lib/sound";
import { cn } from "@/lib/utils";

const HelixLazy = lazy(() => import("./Helix3D"));
export function Helix({ speed, className }: { speed?: number; className?: string }) {
  return (
    <div className={className}>
      <ClientOnly fallback={<div className="h-full w-full animate-pulse rounded-full bg-violet/5" />}>
        <Suspense fallback={null}><HelixLazy speed={speed} /></Suspense>
      </ClientOnly>
    </div>
  );
}

const MapLazy = lazy(() => import("./WorldMap"));
export function Map(props: React.ComponentProps<typeof MapLazy>) {
  return (
    <ClientOnly fallback={<div className="h-full w-full animate-pulse rounded-2xl bg-muted" />}>
      <Suspense fallback={<div className="h-full w-full animate-pulse rounded-2xl bg-muted" />}><MapLazy {...props} /></Suspense>
    </ClientOnly>
  );
}

const iconBtn = "grid h-9 w-9 place-items-center rounded-full glass text-muted-foreground transition hover:text-foreground hover:shadow-glow";

export function Nav() {
  const { lang, setLang, theme, toggleTheme, muted, toggleMuted } = useApp();
  const { t } = useT();
  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <nav className="glass mx-auto flex max-w-6xl items-center gap-2 rounded-full px-3 py-2 sm:px-5">
        <Link to="/" className="flex items-center gap-2 font-semibold" onClick={() => blip(880)}>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-primary-foreground shadow-glow"><Dna className="h-4 w-4" /></span>
          <span className="font-display text-lg tracking-tight">Origin<span className="text-gradient">DNA</span></span>
        </Link>
        <div className="ms-6 hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="/#features" className="hover:text-foreground">{t("Features")}</a>
          <a href="/#how" className="hover:text-foreground">{t("How It Works")}</a>
          <Link to="/import" className="hover:text-foreground">{t("Real DNA Results")}</Link>
        </div>
        <div className="ms-auto flex items-center gap-1.5">
          <button aria-label="Language" className={iconBtn} onClick={() => setLang(lang === "en" ? "fa" : "en")}><Languages className="h-4 w-4" /></button>
          <button aria-label={muted ? "Unmute" : "Mute"} className={iconBtn} onClick={() => { toggleMuted(); setTimeout(() => blip(990), 10); }}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
          <button aria-label="Theme" className={iconBtn} onClick={toggleTheme}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <Link to="/upload" className="ms-1 hidden rounded-full bg-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow sm:inline-block">{t("Get Started")}</Link>
        </div>
      </nav>
    </header>
  );
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className={cn("mx-auto max-w-6xl px-4 pb-20", className)}>{children}</main>
    </div>
  );
}

export function ModeBadge({ mode, className }: { mode: "demo" | "real"; className?: string }) {
  const { t } = useT();
  return mode === "demo" ? (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning", className)}>
      <FlaskConical className="h-3.5 w-3.5" />{t("Simulated Demo Data — Not a Genetic Analysis")}
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success", className)}>
      <ShieldCheck className="h-3.5 w-3.5" />{t("User-supplied DNA results")}
    </span>
  );
}

export const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:pointer-events-none";
export const btnGhost = "inline-flex items-center justify-center gap-2 rounded-full glass px-6 py-3 text-sm font-semibold text-foreground transition hover:shadow-glow active:scale-95 disabled:opacity-40";
