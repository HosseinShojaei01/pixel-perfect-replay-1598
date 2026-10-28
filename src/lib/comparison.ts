import { z } from "zod";

export const comparisonSchema = z.object({
  model: z.string().min(1), reference_count: z.number().int().positive(), elapsed_ms: z.number().nonnegative(),
  matches: z.array(z.object({ id: z.string().min(1), category: z.enum(["lighting", "pose", "style", "composition"]), label: z.string().min(1), cosine: z.number().min(-1).max(1) })).min(1).max(12),
});
export type Comparison = z.infer<typeof comparisonSchema>;
export const CATEGORIES: Record<string, string[]> = {
  lighting: ["Studio low-key", "Studio high-key", "Natural ambient", "Cinematic neon"],
  pose: ["Front-facing", "Profile", "Three-quarter"], style: ["Monochrome", "Editorial", "Casual"],
  composition: ["Close-up", "Environmental", "Centered"],
};

export function apiBase(configured: string): string {
  if (!configured.trim()) throw new Error("The Python comparison service is not connected. Set its URL in Reference management.");
  const url = new URL(configured);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("Use an HTTPS service URL (HTTP is allowed only on localhost).");
  if (url.username || url.password || url.search || url.hash) throw new Error("Use a service URL without credentials or query parameters.");
  return url.href.replace(/\/$/, "");
}

export async function apiRequest(base: string, path: string, init?: RequestInit) {
  let response: Response;
  try { response = await fetch(apiBase(base) + path, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(120000) }); }
  catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error("The Python service could not be reached. Check its URL, deployment and allowed origins.");
  }
  if (!response.ok) {
    let detail = `Python service returned HTTP ${response.status}.`;
    try { const body = await response.json(); if (typeof body.detail === "string") detail = body.detail; } catch {}
    throw new Error(detail);
  }
  return response;
}

export async function comparePortrait(base: string, portrait: string, consent: boolean, onProgress: (progress: number, stage: string) => void, signal: AbortSignal): Promise<Comparison> {
  if (!consent) throw new Error("Explicit processing consent is required.");
  const blob = dataUrlToBlob(portrait);
  const form = new FormData();
  form.append("image", blob, "portrait.jpg"); form.append("consent", "true");
  onProgress(5, "Sending your image");
  const response = await apiRequest(base, "/compare", { method: "POST", body: form, signal });
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The comparison service returned no result.");
  const decoder = new TextDecoder(); let buffer = ""; let result: Comparison | undefined;
  const stages: Record<string, string> = { validated: "Image validated", embedding: "Measuring photographic features", comparing: "Comparing reference images", complete: "Comparison ready" };
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (typeof event.error === "string") throw new Error(event.error);
    if (event.stage in stages && typeof event.progress === "number") onProgress(event.progress, stages[event.stage] ?? "Comparing");
    if (event.result) result = comparisonSchema.parse(event.result);
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n"); buffer = lines.pop() ?? ""; lines.forEach(consume);
      if (done) break;
    }
    consume(buffer);
  } finally { await reader.cancel().catch(() => {}); }
  if (!result) throw new Error("Comparison ended without a completed result. No substitute results were generated.");
  return result;
}
export function dataUrlToBlob(url: string): Blob {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(url);
  if (!m) throw new Error("The photo could not be read. Please upload it again.");
  const raw = m[2] ? atob(m[3] ?? "") : decodeURIComponent(m[3] ?? "");
  const bytes = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return new Blob([bytes], { type: m[1] });
}
