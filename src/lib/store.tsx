import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Entry, type Mode } from "./ancestry";
import type { Comparison } from "./comparison";
import { setMuted } from "./sound";

type Lang = "en" | "fa";
type State = {
  lang: Lang; setLang: (l: Lang) => void;
  theme: "dark" | "light"; toggleTheme: () => void;
  muted: boolean; toggleMuted: () => void;
  portrait: string | null; setPortrait: (p: string | null) => void;
  name: string; setName: (n: string) => void;
  mode: Mode; entries: Entry[];
  startDemo: () => void; setReal: (e: Entry[]) => void;
  apiUrl: string; setApiUrl: (url: string) => void;
  processingConsent: boolean; setProcessingConsent: (consent: boolean) => void;
  comparison: Comparison | null; setComparison: (result: Comparison | null) => void;
};
const Ctx = createContext<State | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [muted, setM] = useState(true);
  // Portrait and comparison remain in memory; consent is required for transient API processing.
  const [portrait, setP] = useState<string | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [processingConsent, setProcessingConsent] = useState(false);
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_PYTHON_API_URL ?? "");
  const setPortrait = (photo: string | null) => { setP(photo); setComparison(null); setProcessingConsent(false); };
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("demo");
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const configured = localStorage.getItem("odna-api-url");
    if (configured) setApiUrl(configured);
    const s = localStorage.getItem("odna-prefs");
    if (s) try { const p = JSON.parse(s); p.lang && setLang(p.lang); p.theme && setTheme(p.theme); typeof p.muted === "boolean" && setM(p.muted); } catch {}
  }, []);
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("dark", theme === "dark");
    el.lang = lang; el.dir = lang === "fa" ? "rtl" : "ltr";
    setMuted(muted);
    localStorage.setItem("odna-prefs", JSON.stringify({ lang, theme, muted }));
  }, [lang, theme, muted]);

  return (
    <Ctx.Provider value={{
      lang, setLang, theme, toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      muted, toggleMuted: () => setM((m) => !m), portrait, setPortrait, name, setName,
      mode, entries,
      apiUrl, setApiUrl: (url) => { setApiUrl(url); localStorage.setItem("odna-api-url", url); setComparison(null); },
      comparison, setComparison, processingConsent, setProcessingConsent,
      startDemo: () => { setMode("demo"); setEntries([]); setComparison(null); setP(null); setProcessingConsent(false); },
      setReal: (e) => { setMode("real"); setEntries(e); },
    }}>{children}</Ctx.Provider>
  );
}
export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}
