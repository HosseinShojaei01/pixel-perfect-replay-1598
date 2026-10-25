import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw, Trash2, Upload, Plug, Plus, LogOut } from "lucide-react";
import { Page } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { apiBase, apiRequest, CATEGORIES } from "@/lib/comparison";

export const Route = createFileRoute("/references")({
  head: () => ({ meta: [
    { title: "Photographic References — OriginDNA" },
    { name: "description", content: "Manage licensed photographic references for real visual comparisons." },
    { property: "og:title", content: "Photographic References — OriginDNA" },
    { property: "og:description", content: "Manage reference collections by non-sensitive lighting, pose, style and composition." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: References,
});
type Collection = { id: string; category: string; label: string };
type Reference = { id: string; collection_id: string; model: string };
function References() {
  const { apiUrl, setApiUrl } = useApp();
  const [url, setUrl] = useState(apiUrl); const [token, setToken] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]); const [refs, setRefs] = useState<Reference[]>([]);
  const [selected, setSelected] = useState(""); const [category, setCategory] = useState("lighting"); const [label, setLabel] = useState("Studio low-key");
  const [rights, setRights] = useState(false); const [status, setStatus] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const headers = () => ({ Authorization: `Bearer ${token}` });
  const refresh = async (base = apiUrl) => {
    const health = await (await apiRequest(base, "/health")).json();
    const data = await (await apiRequest(base, "/references")).json();
    setCollections(data.collections); setRefs(data.references);
    setSelected((current) => data.collections.some((c: Collection) => c.id === current) ? current : data.collections[0]?.id ?? "");
    setStatus(`${health.status} · ${health.model} · ${health.reference_count} references`);
  };
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError("");
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : "Request failed"); } finally { setBusy(false); }
  };
  useEffect(() => { if (apiUrl) void run(() => refresh()); }, [apiUrl]);
  const field = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
  return <Page className="pt-10"><h1 className="text-3xl font-bold text-gradient">Photographic References</h1>
    <div className="mt-6 grid gap-5 md:grid-cols-2">
      <section><h2 className="font-semibold">Python service</h2><label className="mt-3 block text-sm">Service URL<input className={field + " mt-2"} type="url" placeholder="https://your-python-service.example" value={url} onChange={(e) => setUrl(e.target.value)} /></label>
        <Button className="mt-3" disabled={busy} onClick={() => run(async () => { const base = apiBase(url); await refresh(base); setApiUrl(base); })}><Plug /> Connect & check</Button>
        <p className="mt-3 text-xs text-muted-foreground" role="status">{status || "Not connected"}</p>
      </section>
      <section><h2 className="font-semibold">Administrator access</h2><label className="mt-3 block text-sm">Administrator token<input className={field + " mt-2"} type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} /></label>
        <Button className="mt-3" variant="outline" onClick={() => setToken("")}><LogOut /> Clear access</Button>
      </section>
    </div>
    {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
    <section className="mt-10 border-t border-border pt-6"><h2 className="text-xl font-semibold">Collections</h2>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">Attribute<select aria-label="Attribute" className={field + " mt-2"} value={category} onChange={(e) => { setCategory(e.target.value); setLabel(CATEGORIES[e.target.value]?.[0] ?? ""); }}>{Object.keys(CATEGORIES).map((key) => <option key={key}>{key}</option>)}</select></label>
        <label className="text-sm">Photographic label<select aria-label="Photographic label" className={field + " mt-2"} value={label} onChange={(e) => setLabel(e.target.value)}>{CATEGORIES[category]?.map((item) => <option key={item}>{item}</option>)}</select></label>
        <Button disabled={busy || !token || !apiUrl} onClick={() => run(async () => { await apiRequest(apiUrl, "/collections", { method: "POST", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify({ category, label }) }); await refresh(); })}><Plus /> Add collection</Button>
        <Button variant="outline" disabled={busy || !apiUrl} onClick={() => run(() => refresh())}><RefreshCw /> Refresh</Button>
        <Button variant="outline" disabled={busy || !token || !apiUrl} onClick={() => run(async () => { await apiRequest(apiUrl, "/rebuild", { method: "POST", headers: headers() }); await refresh(); })}><RefreshCw /> Rebuild embeddings</Button>
      </div>
      <label className="mt-6 block max-w-md text-sm">Active collection<select aria-label="Active collection" className={field + " mt-2"} value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Choose collection</option>{collections.map((c) => <option value={c.id} key={c.id}>{c.category} · {c.label}</option>)}</select></label>
      <label className="mt-4 flex items-start gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} />I have permission to store and publicly display these reference images.</label>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild disabled={busy || !token || !selected || !rights}><label className={busy || !token || !selected || !rights ? "pointer-events-none opacity-50" : "cursor-pointer"}><Upload /> Add reference images<input aria-label="Reference images" type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy || !token || !selected || !rights} onChange={(e) => { const files = Array.from(e.target.files ?? []); e.target.value = ""; void run(async () => { for (const file of files) { if (file.size > 10 * 1024 * 1024) throw new Error("Maximum reference size is 10 MB."); const form = new FormData(); form.append("image", file); form.append("collection_id", selected); form.append("rights_confirmed", "true"); await apiRequest(apiUrl, "/references", { method: "POST", headers: headers(), body: form }); } await refresh(); }); }} /></label></Button>
        <Button variant="destructive" disabled={busy || !token || !selected} onClick={() => { if (window.confirm("Delete this collection and all its reference images?")) void run(async () => { await apiRequest(apiUrl, `/collections/${selected}`, { method: "DELETE", headers: headers() }); await refresh(); }); }}><Trash2 /> Delete collection</Button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{refs.filter((r) => r.collection_id === selected).map((ref) => <article className="glass overflow-hidden rounded-lg border border-border" key={ref.id}><img src={`${apiBase(apiUrl)}/references/${ref.id}/image`} alt="Photographic reference" className="aspect-square w-full object-contain bg-muted" /><div className="p-3"><p className="truncate text-xs text-muted-foreground">{ref.model}</p><Button className="mt-3" variant="outline" disabled={busy || !token} onClick={() => run(async () => { await apiRequest(apiUrl, `/references/${ref.id}`, { method: "DELETE", headers: headers() }); await refresh(); })}><Trash2 /> Delete image</Button></div></article>)}</div>
    </section>
  </Page>;
}