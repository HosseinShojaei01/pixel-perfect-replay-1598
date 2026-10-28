import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describeVisualSimilarity, type AiResult } from "@/lib/visual-ai.functions";

const read = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });

export function AiVisualAnalysis({ portrait }: { portrait: string }) {
  const run = useServerFn(describeVisualSimilarity);
  const [refs, setRefs] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);

  const add = async (files: FileList | null) => {
    if (!files) return;
    const ok = [...files].filter((f) => /image\/(jpeg|png|webp)/.test(f.type) && f.size < 5_000_000);
    const urls = await Promise.all(ok.map(read));
    setRefs((r) => [...r, ...urls].slice(0, 4)); setResult(null);
  };
  const analyze = async () => {
    setBusy(true); setError(null); setResult(null);
    try { setResult(await run({ data: { portrait, references: refs, consent: true } })); }
    catch (e) { setError(e instanceof Error ? e.message : "The AI comparison failed."); }
    finally { setBusy(false); }
  };

  return <section className="glass glow-border mt-8 rounded-3xl p-5 sm:p-6" aria-label="AI photographic comparison">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><Sparkles className="h-5 w-5 text-cyan" /> AI Photographic Comparison</h2>
    <p className="mt-1 text-sm text-muted-foreground">Upload up to 4 comparison photos. AI describes lighting, pose, composition and color — never ethnicity or ancestry.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      {refs.map((src, i) => <div key={i} className="relative">
        <img src={src} alt={`Comparison photo ${i + 1}`} className="h-24 w-24 rounded-xl object-cover" />
        <span className="absolute left-1 top-1 rounded bg-background/80 px-1.5 text-xs">{i + 1}</span>
        <button aria-label="Remove photo" className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5" onClick={() => { setRefs(refs.filter((_, j) => j !== i)); setResult(null); }}><X className="h-3 w-3" /></button>
      </div>)}
      {refs.length < 4 && <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-xl border border-dashed border-border text-muted-foreground hover:bg-muted">
        <Upload className="h-5 w-5" /><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => add(e.target.files)} />
      </label>}
    </div>
    <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />I agree to send these photos to Lovable AI for a one-time description. They are not stored.</label>
    <Button className="mt-4" onClick={analyze} disabled={busy || !consent || !refs.length}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Describe similarities</Button>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {result && <div className="mt-5 space-y-4">
      <p className="text-sm">{result.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {result.comparisons.map((c) => <article key={c.reference} className="rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3">{refs[c.reference - 1] && <img src={refs[c.reference - 1]} alt="" className="h-12 w-12 rounded-lg object-cover" />}
            <h3 className="font-semibold">Photo {c.reference}</h3><span className="ms-auto font-display text-2xl text-cyan">{Math.round(c.similarity)}<span className="text-xs text-muted-foreground"> / 100</span></span></div>
          <dl className="mt-3 space-y-1 text-sm"><div><dt className="inline font-medium">Lighting: </dt><dd className="inline text-muted-foreground">{c.lighting}</dd></div>
            <div><dt className="inline font-medium">Pose: </dt><dd className="inline text-muted-foreground">{c.pose}</dd></div>
            <div><dt className="inline font-medium">Composition: </dt><dd className="inline text-muted-foreground">{c.composition}</dd></div>
            <div><dt className="inline font-medium">Color: </dt><dd className="inline text-muted-foreground">{c.color}</dd></div></dl>
        </article>)}
      </div>
      <p className="text-xs text-muted-foreground">AI-written estimate of photographic similarity — not a measurement of identity or ancestry.</p>
    </div>}
  </section>;
}
