import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Upload, Scale, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Page, ModeBadge, btnPrimary, btnGhost } from "@/components/Shell";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { newEntry, normalize, parseFile, total, validate, regionInfo, colorFor, type Entry } from "@/lib/ancestry";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Import Real DNA Results — OriginDNA" },
      { name: "description", content: "Enter or upload your DNA test ancestry results (CSV or JSON) and visualize them." },
      { property: "og:title", content: "Import Real DNA Results — OriginDNA" },
      { property: "og:description", content: "Bring your genetic test results to life on the OriginDNA dashboard." },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const { mode, entries: current, setReal } = useApp();
  const { t } = useT();
  const nav = useNavigate();
  const [rows, setRows] = useState<Entry[]>(() => (mode === "real" ? current : [newEntry("", 0)]));
  const [ask, setAsk] = useState(false);
  const errs = validate(rows);
  const sum = total(rows);
  const update = (id: string, patch: Partial<Entry>) => setRows((r) => r.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const onFile = (f?: File) => {
    if (!f) return;
    if (f.size > 1024 * 1024) { toast.error("File too large (max 1 MB)"); return; }
    f.text().then((txt) => {
      try {
        const parsed = parseFile(f.name, txt);
        if (!parsed.length) throw new Error();
        setRows(parsed); toast.success(`Imported ${parsed.length} regions`, { description: "Review the preview below." });
      } catch { toast.error("Couldn't read that file", { description: "Use CSV (region,percent) or JSON [{region, percent}]." }); }
    });
  };

  return (
    <Page className="pt-10">
      <div className="mx-auto max-w-3xl">
        <ModeBadge mode="real" />
        <h1 className="mt-4 text-4xl font-bold sm:text-5xl"><span className="text-gradient">{t("Real DNA Results")}</span></h1>
        <p className="mt-3 text-muted-foreground">Enter the ancestry breakdown from your genetic testing provider, or upload a CSV / JSON export. Data stays in your browser and is shown exactly as provided — OriginDNA does not verify it.</p>

        <div className="glass glow-border mt-8 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap gap-3">
            <label className={btnGhost + " cursor-pointer"}><Upload className="h-4 w-4" />{t("Upload CSV / JSON")}
              <input type="file" accept=".csv,.json,.txt" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} /></label>
            <button className={btnGhost} onClick={() => setRows((r) => [...r, newEntry()])}><Plus className="h-4 w-4" />{t("Add region")}</button>
          </div>

          <div className="mt-6 space-y-2">
            <AnimatePresence initial={false}>
              {rows.map((e, i) => (
                <motion.div key={e.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colorFor(i) }} />
                  <span className="w-7 text-center text-lg">{regionInfo(e.region)?.flag ?? "🌐"}</span>
                  <input aria-label="Region" list="regions" value={e.region} onChange={(ev) => update(e.id, { region: ev.target.value })} placeholder="Country or region"
                    className="min-w-0 flex-1 rounded-xl border border-input bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-ring" />
                  <div className="relative w-24">
                    <input aria-label="Percent" type="number" min={0} max={100} step={0.1} value={Number.isFinite(e.percent) ? e.percent : ""} onChange={(ev) => update(e.id, { percent: parseFloat(ev.target.value) })}
                      className="w-full rounded-xl border border-input bg-background/40 px-3 py-2.5 pe-7 text-sm tabular-nums outline-none focus:border-ring" />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                  <button aria-label="Remove row" onClick={() => setRows((r) => r.filter((x) => x.id !== e.id))} className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </motion.div>
              ))}
            </AnimatePresence>
            <datalist id="regions">{["Iran", "Turkey", "Italy", "Greece", "Georgia", "Armenia", "Azerbaijan", "Iraq", "Spain", "France", "Germany", "United Kingdom", "Ireland", "Poland", "Russia", "India", "China", "Japan", "Egypt", "Lebanon", "Syria", "Other Regions"].map((r) => <option key={r} value={r} />)}</datalist>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{t("Total")}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className={`h-full transition-all ${Math.abs(sum - 100) <= 0.5 ? "bg-success" : "bg-warning"}`} style={{ width: `${Math.min(100, sum)}%` }} /></div>
            <span className="font-display font-semibold tabular-nums">{sum}%</span>
          </div>

          {errs.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
              {errs.map((m) => <p key={m} className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{m}</p>)}
            </div>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Looks good — ready to visualize.</p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button className={btnGhost} disabled={sum <= 0 || Math.abs(sum - 100) <= 0.01} onClick={() => setAsk(true)}><Scale className="h-4 w-4" />{t("Normalize to 100%")}</button>
            <button className={btnPrimary} disabled={errs.length > 0} onClick={() => { setReal(rows.map((r) => ({ ...r, region: r.region.trim() }))); toast.success("Results loaded"); nav({ to: "/dashboard" }); }}>
              {t("View on Dashboard")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">CSV format: <code>region,percent</code> per line. JSON: <code>[{"{"}"region":"Iran","percent":40{"}"}]</code>.</p>
      </div>

      <AlertDialog open={ask} onOpenChange={setAsk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Normalize percentages?</AlertDialogTitle>
            <AlertDialogDescription>Your values add up to {sum}%. Each value will be scaled proportionally so the total is exactly 100%. This changes the numbers you entered.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my values</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setRows(normalize(rows)); toast.success("Normalized to 100%"); }}>Normalize</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
