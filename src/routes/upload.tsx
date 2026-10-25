import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, Trash2, Crop, Check, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Page, btnPrimary, btnGhost } from "@/components/Shell";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { blip } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Portrait — OriginDNA" },
      { name: "description", content: "Add an optional portrait to personalize your OriginDNA ancestry dashboard." },
      { property: "og:title", content: "Upload Portrait — OriginDNA" },
      { property: "og:description", content: "Personalize your ancestry experience with a private portrait." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadPage,
});

const MAX = 10 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

async function cropImage(src: string, area: Area): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  const size = Math.min(800, area.width);
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Image cropping is unavailable");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return c.toDataURL("image/jpeg", 0.9);
}

function UploadPage() {
  const { portrait, setPortrait, name, setName, apiUrl, setComparison, setProcessingConsent } = useApp();
  const { t } = useT();
  const nav = useNavigate();
  const [raw, setRaw] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [consent, setConsent] = useState(false);
  const [drag, setDrag] = useState(false);

  const handle = useCallback((f?: File) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) { toast.error("Unsupported file", { description: "Please use JPG, PNG or WEBP." }); return; }
    if (f.size > MAX) { toast.error("File too large", { description: "Maximum size is 10 MB." }); return; }
    const r = new FileReader();
    r.onload = () => { setRaw(r.result as string); setZoom(1); blip(700); };
    r.onerror = () => toast.error("Couldn't read that image.");
    r.readAsDataURL(f);
  }, []);

  const applyCrop = async () => {
    if (!raw || !area) return;
    try {
      setPortrait(await cropImage(raw, area)); setConsent(false);
      setRaw(null); toast.success("Portrait ready");
    } catch { toast.error("Couldn't crop that image. Please try again."); }
  };

  const go = () => { if (!portrait || !consent) return; setComparison(null); setProcessingConsent(true); blip(880); nav({ to: "/analysis" }); };

  return (
    <Page className="pt-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold sm:text-5xl"><span className="text-gradient">{t("Upload your portrait")}</span></h1>
        <p className="mt-3 text-muted-foreground">Compare photographic lighting, composition and style — never ethnicity, genetics, nationality or ancestry.</p>
      </div>

      <div className="glass glow-border mx-auto mt-10 max-w-2xl rounded-3xl p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {raw ? (
            <motion.div key="crop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-muted">
                <Cropper image={raw} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
                  onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, a) => setArea(a)} />
              </div>
              <label className="mx-auto mt-5 flex max-w-sm items-center gap-3 text-sm text-muted-foreground">
                <Crop className="h-4 w-4" /> Zoom
                <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="flex-1 accent-[var(--violet)]" aria-label="Zoom" />
              </label>
              <div className="mt-5 flex justify-center gap-3">
                <Button className={btnGhost} onClick={() => setRaw(null)}>Cancel</Button>
                <Button className={btnPrimary} onClick={applyCrop}><Check className="h-4 w-4" /> Apply crop</Button>
              </div>
            </motion.div>
          ) : portrait ? (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
              <div className="rounded-full bg-brand p-1 shadow-glow">
                <img src={portrait} alt="Your portrait" className="h-48 w-48 rounded-full object-cover" />
              </div>
              <div className="mt-5 flex gap-3">
                <label className={btnGhost + " cursor-pointer"}><ImagePlus className="h-4 w-4" /> Replace
                  <input type="file" accept={TYPES.join(",")} className="sr-only" onChange={(e) => handle(e.target.files?.[0])} /></label>
                <Button className={btnGhost} onClick={() => { setPortrait(null); setConsent(false); toast("Photo removed"); }}><Trash2 className="h-4 w-4" /> {t("Remove")}</Button>
              </div>
            </motion.div>
          ) : (
            <motion.label key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-16 text-center transition ${drag ? "border-cyan bg-cyan/10" : "border-border hover:border-violet/60"}`}>
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand text-primary-foreground shadow-glow"><ImagePlus className="h-7 w-7" /></span>
              <span className="mt-5 font-semibold">Drag & drop or click to choose</span>
              <span className="mt-1 text-sm text-muted-foreground">JPG, PNG or WEBP · up to 10 MB</span>
              <input type="file" accept={TYPES.join(",")} className="sr-only" onChange={(e) => handle(e.target.files?.[0])} />
            </motion.label>
          )}
        </AnimatePresence>

        <div className="mt-8 space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name (optional)" maxLength={40}
            className="w-full rounded-xl border border-input bg-background/40 px-4 py-3 text-sm outline-none focus:border-ring" />
          <label className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--violet)]" />
            <span className="text-muted-foreground"><ShieldCheck className="me-1 inline h-4 w-4 text-success" />I consent to sending my cropped photo to the configured Python service for photographic comparison. It is processed in memory, not permanently stored or used for training. No ancestry is inferred.</span>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button asChild className={btnGhost}><Link to="/import">{t("Import Real Results")}</Link></Button>
          <Button className={btnPrimary} disabled={!portrait || !consent} onClick={go}>{t("Continue")} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></Button>
        </div>
        {!apiUrl && <p className="mt-4 text-sm text-warning">Python service not connected. <Link className="underline" to="/references">Reference management</Link></p>}
      </div>
    </Page>
  );
}
