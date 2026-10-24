export type Entry = { id: string; region: string; percent: number };
export type Mode = "demo" | "real";

export const DEMO_DATA: Entry[] = [
  { id: "ir", region: "Iran", percent: 38 },
  { id: "tr", region: "Turkey", percent: 22 },
  { id: "it", region: "Italy", percent: 16 },
  { id: "gr", region: "Greece", percent: 12 },
  { id: "ge", region: "Georgia", percent: 8 },
  { id: "other", region: "Other Regions", percent: 4 },
];

type Info = { lat: number; lng: number; flag: string; fa: string };
export const REGIONS: Record<string, Info> = {
  iran: { lat: 32.4, lng: 53.7, flag: "🇮🇷", fa: "ایران" },
  turkey: { lat: 39, lng: 35.2, flag: "🇹🇷", fa: "ترکیه" },
  italy: { lat: 42.8, lng: 12.5, flag: "🇮🇹", fa: "ایتالیا" },
  greece: { lat: 39.1, lng: 21.8, flag: "🇬🇷", fa: "یونان" },
  georgia: { lat: 42.3, lng: 43.4, flag: "🇬🇪", fa: "گرجستان" },
  armenia: { lat: 40.1, lng: 45, flag: "🇦🇲", fa: "ارمنستان" },
  azerbaijan: { lat: 40.1, lng: 47.6, flag: "🇦🇿", fa: "آذربایجان" },
  iraq: { lat: 33.2, lng: 43.7, flag: "🇮🇶", fa: "عراق" },
  afghanistan: { lat: 33.9, lng: 67.7, flag: "🇦🇫", fa: "افغانستان" },
  india: { lat: 21, lng: 78, flag: "🇮🇳", fa: "هند" },
  pakistan: { lat: 30.4, lng: 69.3, flag: "🇵🇰", fa: "پاکستان" },
  "saudi arabia": { lat: 23.9, lng: 45, flag: "🇸🇦", fa: "عربستان" },
  egypt: { lat: 26.8, lng: 30.8, flag: "🇪🇬", fa: "مصر" },
  spain: { lat: 40.4, lng: -3.7, flag: "🇪🇸", fa: "اسپانیا" },
  france: { lat: 46.2, lng: 2.2, flag: "🇫🇷", fa: "فرانسه" },
  germany: { lat: 51.2, lng: 10.4, flag: "🇩🇪", fa: "آلمان" },
  "united kingdom": { lat: 54, lng: -2, flag: "🇬🇧", fa: "بریتانیا" },
  ireland: { lat: 53.4, lng: -8, flag: "🇮🇪", fa: "ایرلند" },
  poland: { lat: 52, lng: 19.1, flag: "🇵🇱", fa: "لهستان" },
  russia: { lat: 56, lng: 38, flag: "🇷🇺", fa: "روسیه" },
  ukraine: { lat: 48.4, lng: 31.2, flag: "🇺🇦", fa: "اوکراین" },
  scandinavia: { lat: 62, lng: 15, flag: "🌐", fa: "اسکاندیناوی" },
  china: { lat: 35.9, lng: 104.2, flag: "🇨🇳", fa: "چین" },
  japan: { lat: 36.2, lng: 138.3, flag: "🇯🇵", fa: "ژاپن" },
  nigeria: { lat: 9.1, lng: 8.7, flag: "🇳🇬", fa: "نیجریه" },
  mexico: { lat: 23.6, lng: -102.5, flag: "🇲🇽", fa: "مکزیک" },
  "united states": { lat: 39.8, lng: -98.6, flag: "🇺🇸", fa: "آمریکا" },
  lebanon: { lat: 33.9, lng: 35.9, flag: "🇱🇧", fa: "لبنان" },
  syria: { lat: 34.8, lng: 38.9, flag: "🇸🇾", fa: "سوریه" },
};

export function regionInfo(name: string): Info | undefined {
  return REGIONS[name.trim().toLowerCase()];
}

export const PALETTE = ["#8B5CF6", "#06B6D4", "#EC4899", "#22D3EE", "#A78BFA", "#F472B6", "#34D399", "#FBBF24", "#60A5FA", "#F87171"];
export const colorFor = (i: number) => PALETTE[i % PALETTE.length];

export const total = (e: Entry[]) => Math.round(e.reduce((s, x) => s + (Number(x.percent) || 0), 0) * 100) / 100;

export function validate(entries: Entry[]): string[] {
  const errs: string[] = [];
  if (!entries.length) errs.push("Add at least one region.");
  entries.forEach((e, i) => {
    if (!e.region.trim()) errs.push(`Row ${i + 1}: region name is empty.`);
    if (!Number.isFinite(e.percent) || e.percent <= 0 || e.percent > 100) errs.push(`Row ${i + 1}: percentage must be between 0 and 100.`);
  });
  const names = entries.map((e) => e.region.trim().toLowerCase()).filter(Boolean);
  if (new Set(names).size !== names.length) errs.push("Duplicate region names.");
  const t = total(entries);
  if (entries.length && Math.abs(t - 100) > 0.5) errs.push(`Percentages add up to ${t}%, not 100%.`);
  return errs;
}

/** Scale to exactly 100 (one decimal), fixing rounding drift on the largest entry. */
export function normalize(entries: Entry[]): Entry[] {
  const t = total(entries);
  if (t <= 0) return entries;
  const out = entries.map((e) => ({ ...e, percent: Math.round((e.percent / t) * 1000) / 10 }));
  const drift = Math.round((100 - out.reduce((s, e) => s + e.percent, 0)) * 10) / 10;
  if (drift !== 0) {
    const big = out.reduce((a, b) => (b.percent > a.percent ? b : a));
    big.percent = Math.round((big.percent + drift) * 10) / 10;
  }
  return out;
}

const uid = () => Math.random().toString(36).slice(2, 9);
export const newEntry = (region = "", percent = 0): Entry => ({ id: uid(), region, percent });

export function parseFile(name: string, text: string): Entry[] {
  if (name.toLowerCase().endsWith(".json")) {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : Object.entries(data).map(([region, percent]) => ({ region, percent }));
    return arr.map((r: { region?: unknown; country?: unknown; name?: unknown; percent?: unknown; percentage?: unknown; value?: unknown }) =>
      newEntry(String(r.region ?? r.country ?? r.name ?? ""), Number(r.percent ?? r.percentage ?? r.value ?? 0)),
    );
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = lines.map((l) => l.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, "")));
  if (rows.length && isNaN(parseFloat(rows[0][1]))) rows.shift();
  return rows.filter((r) => r.length >= 2).map((r) => newEntry(r[0], parseFloat(r[1].replace("%", ""))));
}
