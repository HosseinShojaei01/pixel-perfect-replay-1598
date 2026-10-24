<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- App state (portrait, entries, mode, prefs) lives in `src/lib/store.tsx` React context; portraits stay in memory only — privacy requirement, never persist or upload them.
- Browser-only libs (Three.js helix, Leaflet map) are lazy-loaded behind `ClientOnly` in `src/components/Shell.tsx` — they break SSR if imported statically.
- Ancestry rules (validation, normalization, CSV/JSON parsing) live in `src/lib/ancestry.ts` with tests beside it.
