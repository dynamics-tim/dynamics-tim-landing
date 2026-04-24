---
applyTo: "**/*.css, tailwind.config.js, postcss.config.js"
---

<!-- managed-by: preflight -->

# Styling Conventions

## Design System
- Color palette: `brand` (blue), `accent` (teal), `surface` (light grays), `signal` (gold/amber)
- Fonts: `font-sans` = Inter, `font-heading` = Sora — both loaded as WOFF2 with `font-display: swap`
- Elevation: use `shadow-soft` (`0 18px 48px rgba(0, 39, 76, 0.12)`) — do not invent new shadows

## Tailwind Plugins
- `@tailwindcss/forms` — resets form element styles; use it for consistent input/select/textarea styling
- `@tailwindcss/typography` — drives `.prose` containers used in content collection pages

## Tailwind Patterns
- Use `@apply` sparingly — only in `@layer components` for shared patterns (`.card`, `.section-title`)
- Prefer utility classes directly in Astro templates over custom CSS
- Card component uses CSS custom properties for variants (`--card-bg`, `--card-lift`, etc.)
- Available card variants: `.card--on-dark`, `.card--resume`, `.card--compact`

## Animations
- All animations MUST have a `prefers-reduced-motion: reduce` override that disables them
- Use `will-change` only on animated properties; avoid on static elements
- Scroll animations use `data-reveal` attributes — CSS handles the transitions in `@layer utilities`
- Use `cubic-bezier(0.16, 1, 0.3, 1)` as the standard easing curve

## Anti-patterns
- Don't add new `@font-face` declarations without also updating `BaseLayout.astro` preload links
- Don't use raw color values — always reference the Tailwind theme tokens
- Don't add animations without `prefers-reduced-motion` support

<!-- end-managed-by: preflight -->
