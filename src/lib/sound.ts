let muted = true;
let ctx: AudioContext | null = null;
export const setMuted = (m: boolean) => { muted = m; };

export function blip(freq = 660, dur = 0.08, vol = 0.04) {
  if (muted || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch {}
}
