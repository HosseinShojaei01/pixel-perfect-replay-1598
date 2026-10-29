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
- App state (portrait, entries, mode, prefs) lives in `src/lib/store.tsx` React context; portraits and visual results stay in memory; send cropped portraits to the configured Python API only with explicit consent, never persist them.
- Browser-only libs (Three.js helix, Leaflet map) are lazy-loaded behind `ClientOnly` in `src/components/Shell.tsx` — they break SSR if imported statically.
- Ancestry rules (validation, normalization, CSV/JSON parsing) live in `src/lib/ancestry.ts` with tests beside it.

- The separately deployed `backend/` FastAPI service owns persisted references and pretrained embeddings; browser comparisons stream real API stages and never fall back to ancestry or fabricated scores.
- Render's Docker service uses `backend` as its root directory with Dockerfile and build context paths relative to that directory, so Docker COPY inputs resolve within the Python service.
- Genetic dashboard entries originate only from imported user data; reference labels are restricted to non-sensitive photographic attributes.
- AI photographic descriptions run through a createServerFn in `src/lib/visual-ai.functions.ts` (Lovable AI Gateway); photos are sent only after per-request consent and never stored, and the prompt forbids identity/ancestry inferences.
