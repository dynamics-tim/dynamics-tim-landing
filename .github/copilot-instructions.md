<!-- managed-by: preflight -->

# Copilot Instructions - Tim Freelance Landing

This is an **Astro 7** + Tailwind CSS 3 static site for Tim Friedrich's Dynamics 365 freelancing services, deployed on GitHub Pages at `https://dynamics-tim.dev/`.

**Stack:** Astro 7 (SSG) · TypeScript (strict) · Tailwind CSS 3 · MDX content collections · GitHub Actions CI/CD

## Build & Run Commands

```bash
npm install       # Install + runs postinstall: generates OG image and favicons
npm run dev       # Dev server on :4321 with HMR
npm run build     # Production SSG build (HTML/CSS/JS/images compressed via astro-compress)
npm run preview   # Preview production build locally
npm run sync      # Regenerate TypeScript types from content collections — run after any schema/content change
npm run lint      # ESLint (TypeScript + Astro, --max-warnings 0)
npm run format    # Prettier with astro plugin
```

## Code Style

- Semicolons: yes · Single quotes in TS, double quotes in `.astro` templates
- 2-space indent · Trailing commas: es5 · Max line width: 100 chars · LF line endings
- Prefix unused variables with `_`
- Functions: camelCase · Components/Interfaces: PascalCase
- Always define `interface Props` in Astro component frontmatter; destructure via `Astro.props as Props`
- Relative imports (`../components/`, `../layouts/`) — path aliases `@/*` exist but are not the convention

## Architecture

```
src/
  components/   Astro components (minimal client-side JS)
    home/       Sections of the landing page (index.astro only composes them)
    profile/    Profile page building blocks
    Icon.astro  Inline SVG icon set — use instead of pasting <svg> markup
  content/      MDX content collections: timeline/, projects/, certs/
  data/         ALL copy & configuration (site.ts, home.ts, services.ts, profile.ts,
                engagement-models.ts, engagement-quiz.ts, legal-data.ts)
  layouts/      BaseLayout.astro (head, CSP, fonts, global scripts)
  lib/          Pure, DOM-free logic (engagement-quiz.ts — unit tested)
  pages/        Astro pages (SSG routes, trailingSlash: always)
  scripts/      Client-side TS modules (animations, quiz DOM wiring, storage keys)
  styles/       global.css — .card, .section-title, .nav-link CSS utilities
  utils/        url.ts (to/asset/base), csp.ts, structured-data.ts, collections.ts
public/         Static assets served as-is (reveal.js, consent.js, pushover-notifier.js)
scripts/        generate-og.mjs, generate-favicons.mjs (run on npm install)
tests/          Playwright: quiz E2E smoke test + quiz logic table test
```

**Key patterns:**
- **Content lives in `src/data/`** — change copy there, not in the templates. Contact data, booking URL, availability and social links are in `src/data/site.ts` (single source of truth)
- Links: import from `src/utils/url.ts` — `to('services')` for pages, `asset('images/x.jpg')` for files in `public/`, `base` for the root. Never hard-code `/page`
- Icons: `<Icon name="check" class="h-4 w-4" />` (`src/components/Icon.astro`); add new icons to its map
- Section headings: `<SectionHeader title subtitle />`; availability hint: `<AvailabilityNote class="…" />`
- Tailwind classes that depend on data (tones/variants) must be written as full literal strings in a map — never build class names by string concatenation of fragments
- React 18 is a peer dependency for Astro islands only — do not build standalone React components
- Font paths: `global.css` uses absolute `/assets/fonts/`; `BaseLayout.astro` preloads via `asset('assets/fonts/…')` — keep both in sync
- Use `data-reveal` / `data-reveal-delay` attributes for scroll-triggered fade-ins (public/assets/js/reveal.js); `.animate-on-scroll` / `.animate-scale-up` on sections (src/scripts/animations.ts); `data-counter` for count-up numbers

## Key Integrations

- **GitHub Pages** — deployed via `.github/workflows/deploy.yml` on main push, only after the Playwright tests (`quiz-smoke.yml`, called as reusable workflow) pass
- **Pushover** — optional visitor notifications via env vars (`PUBLIC_PUSHOVER_TOKEN`, `PUBLIC_PUSHOVER_USER`, `PUBLIC_PUSHOVER_TITLE`, `PUBLIC_PUSHOVER_MESSAGE`). When set, the Pushover API is added to the CSP and notification scripts are loaded.
- **Cal.com** — booking widget integration
- **CSP** — built by `buildCsp()` in `src/utils/csp.ts`; add new external origins there
- **Engagement quiz** — copy & scoring in `src/data/engagement-quiz.ts`, logic in `src/lib/engagement-quiz.ts` (pinned by `tests/engagement-quiz-logic.spec.ts`), DOM wiring in `src/scripts/engagement-quiz.ts`. Title/badge/tagline/case study come from `engagement-models.ts`

## Content Collections (`src/content/`)

Schemas defined in `src/content.config.ts` using Zod. Run `npm run sync` after any change.

- `timeline/` — `title, company, startDate, endDate?, location?, tags[], highlight?`
- `projects/` — `title, summary, link?, repo?, tech[], featured?`
- `certs/` — `title, issuer, issued, credentialUrl?, skills[]`

Tags and skills arrays use consistent casing across entries (e.g., `"Dynamics 365"`, not `"dynamics365"`).

## Styling System

- **Colors:** `brand` (blue) · `accent` (teal) · `surface` (grays) · `signal` (gold/amber) — always use Tailwind theme tokens, never raw color values
- **Fonts:** `font-sans` = Inter · `font-heading` = Sora — both loaded as WOFF2 with `font-display: swap`
- **Elevation:** `shadow-soft` only — do not invent new shadows
- **CSS utilities:** `.card` (with `.card--on-dark`, `.card--resume`, `.card--compact` variants) · `.section-title` · `.nav-link`
- All animations MUST have `prefers-reduced-motion: reduce` overrides
- Use `cubic-bezier(0.16, 1, 0.3, 1)` as the standard easing curve

## Verifying Changes

```bash
npm run lint        # must pass with 0 warnings
npm run build
npm run test:e2e    # Playwright: quiz smoke tests + quiz logic table
```

## Common Pitfalls

- Never use `<a href="/page">` — always route through `base` or `to()` for GitHub Pages compatibility
- Don't add external `<script>`/`fetch` origins without updating `src/utils/csp.ts`
- Don't import global CSS anywhere except `BaseLayout.astro`
- Content collection schema mismatches break the build — always validate with `npm run sync`
- Don't add `@font-face` declarations without also updating the preload links in `BaseLayout.astro`

## Maintenance

This file was generated by `@preflight`. Re-run `@preflight` when:
- Adding new frameworks, languages, or major integrations
- Upgrading Astro major versions
- Changing content collection schemas significantly

<!-- end-managed-by: preflight -->