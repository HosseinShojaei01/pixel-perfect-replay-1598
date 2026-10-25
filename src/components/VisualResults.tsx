import { Link } from "@tanstack/react-router";
import { Download, ImageIcon } from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { apiBase } from "@/lib/comparison";

export function VisualResults() {
  const { comparison, apiUrl } = useApp();
  const exportResult = () => {
    const blob = new Blob([JSON.stringify(comparison, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "OriginDNA-photographic-comparison.json"; a.click(); URL.revokeObjectURL(url);
  };
  return <section className="mt-8" aria-label="Visual Similarity">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">Visual Similarity</h2>
      {comparison && <Button variant="outline" onClick={exportResult}><Download /> Export measurements</Button>}
    </div>
    <p className="mt-2 text-sm text-muted-foreground">Cosine similarity measures visual feature alignment, not probability or genetic ancestry. Scores do not add up to 100%.</p>
    {!comparison ? <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><ImageIcon className="h-5 w-5" /> No photographic comparison yet. <Button asChild variant="outline"><Link to="/upload">Compare a photo</Link></Button><Button asChild variant="ghost"><Link to="/references">Reference management</Link></Button></div> : <>
      <p className="mt-3 text-xs text-muted-foreground">{comparison.model} · {comparison.reference_count} references · {comparison.elapsed_ms} ms</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comparison.matches.map((match) => <article key={match.id} className="glass overflow-hidden rounded-lg border border-border">
          <img src={`${apiBase(apiUrl)}/references/${match.id}/image`} alt={`${match.label} reference`} className="aspect-[4/3] w-full object-contain bg-muted" />
          <div className="p-4"><p className="text-xs uppercase text-muted-foreground">{match.category}</p><h3 className="mt-1 font-semibold">{match.label}</h3>
            <p className="mt-2 font-display text-2xl text-cyan" data-testid="cosine-score">{match.cosine.toFixed(4)} <span className="text-xs text-muted-foreground">cosine · {(match.cosine * 100).toFixed(2)} / 100</span></p>
            <meter className="mt-2 h-2 w-full accent-primary" min={-1} max={1} value={match.cosine} aria-label={`${match.label} cosine similarity`} />
          </div>
        </article>)}
      </div>
    </>}
  </section>;
}