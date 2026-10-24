import { colorFor, regionInfo, type Entry, type Mode } from "./ancestry";

const hex = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];

export async function downloadReport(opts: { entries: Entry[]; mode: Mode; portrait: string | null; name: string; includePhoto: boolean }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(5, 8, 22); doc.rect(0, 0, W, 842, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(26);
  doc.text("OriginDNA", 40, 60);
  doc.setFontSize(11); doc.setFont("helvetica", "normal"); doc.setTextColor(170, 175, 200);
  doc.text("Ancestry Report", 40, 80);
  doc.text(`Report date: ${new Date().toLocaleDateString("en-GB", { dateStyle: "long" })}`, W - 40, 60, { align: "right" });
  if (opts.name) doc.text(`Prepared for: ${opts.name}`, W - 40, 78, { align: "right" });

  const demo = opts.mode === "demo";
  const [r, g, b] = demo ? [251, 191, 36] : [52, 211, 153];
  doc.setDrawColor(r, g, b); doc.setTextColor(r, g, b); doc.roundedRect(40, 100, W - 80, 34, 8, 8, "S");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text(demo ? "SIMULATED DEMO DATA - NOT A GENETIC ANALYSIS. Values are fictional." : "USER-SUPPLIED DNA RESULTS - visualized as provided, not independently verified.", W / 2, 121, { align: "center" });

  let y = 160;
  if (opts.includePhoto && opts.portrait) { doc.addImage(opts.portrait, "JPEG", 40, y, 110, 110); }
  // Donut-ish stacked bar
  const x0 = opts.includePhoto && opts.portrait ? 170 : 40, bw = W - 40 - x0;
  let cx = x0;
  opts.entries.forEach((e, i) => { const w = (e.percent / 100) * bw; doc.setFillColor(...hex(colorFor(i))); doc.rect(cx, y + 40, w, 26, "F"); cx += w; });
  doc.setTextColor(255); doc.setFontSize(13); doc.text("Ancestry distribution", x0, y + 28);

  // Map
  y = 300;
  doc.setFontSize(13); doc.text("World map", 40, y); y += 12;
  const mw = W - 80, mh = mw / 2;
  doc.setFillColor(14, 20, 45); doc.roundedRect(40, y, mw, mh, 8, 8, "F");
  doc.setDrawColor(40, 50, 90); for (let i = 1; i < 6; i++) { doc.line(40 + (mw * i) / 6, y, 40 + (mw * i) / 6, y + mh); doc.line(40, y + (mh * i) / 4, 40 + mw, y + (mh * i) / 4); }
  opts.entries.forEach((e, i) => {
    const info = regionInfo(e.region); if (!info) return;
    const px = 40 + ((info.lng + 180) / 360) * mw, py = y + ((90 - info.lat) / 180) * mh;
    doc.setFillColor(...hex(colorFor(i))); doc.circle(px, py, 3 + e.percent / 8, "F");
  });
  y += mh + 30;

  doc.setFontSize(13); doc.setTextColor(255); doc.text("Breakdown", 40, y); y += 18;
  opts.entries.forEach((e, i) => {
    doc.setFillColor(...hex(colorFor(i))); doc.circle(46, y - 4, 4, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(230); doc.text(e.region, 60, y);
    doc.setFont("helvetica", "bold"); doc.text(`${e.percent}%`, W - 40, y, { align: "right" });
    doc.setFillColor(30, 38, 70); doc.rect(200, y - 8, W - 300, 6, "F");
    doc.setFillColor(...hex(colorFor(i))); doc.rect(200, y - 8, ((W - 300) * e.percent) / 100, 6, "F");
    y += 22;
  });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(120, 125, 150);
  doc.text("OriginDNA never infers ancestry from photos. Accurate ancestry requires DNA testing.", W / 2, 815, { align: "center" });
  doc.save(`OriginDNA-${demo ? "demo" : "results"}-report.pdf`);
}
