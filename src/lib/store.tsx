import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEMO_DATA, type Entry, type Mode } from "./ancestry";
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
};
const Ctx = createContext<State | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [muted, setM] = useState(true);
  // Portrait lives only in memory: never persisted or uploaded.
  const [portrait, setPortrait] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("demo");
  const [entries, setEntries] = useState<Entry[]>(DEMO_DATA);

  useEffect(() => {
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
      startDemo: () => { setMode("demo"); setEntries(DEMO_DATA); },
      setReal: (e) => { setMode("real"); setEntries(e); },
    }}>{children}</Ctx.Provider>
  );
}
export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}
