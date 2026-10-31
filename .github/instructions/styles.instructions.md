---
applyTo: "**/*.css, tailwind.config.js, postcss.config.js"
---

<!-- managed-by: preflight -->

# Styling Conventions

## Design System
- Identity follows the pitch video: near-black `ink` (50–950), signal `lime` (300–500 on dark, 700–800 as text on light), warm `paper` surfaces, `ember` red only for "problem" accents
- Legacy tokens `brand`, `accent`, `surface`, `signal` and `slate` are remapped onto this system (keeps profile/legal pages consistent) — prefer the new names in new code
- Fonts: Inter variable (wght 100–900) for everything (`font-sans` = `font-heading`); `font-mono` = system monospace for `.eyebrow` labels
- Components in `global.css`: `.btn` + `.btn-primary|-dark|-ghost|-ghost-dark`, `.panel`, `.panel-dark`, `.ink-surface`, `.grid-lines`, `.field`, `.eyebrow`, `.display`, `.section-title`
- Elevation: prefer hairline borders (`border-ink-950/10`); `shadow-soft` only where depth is needed

## Tailwind Plugins
- `@tailwindcss/forms` — resets form element styles; use it for consistent input/select/textarea styling
- `@tailwindcss/typography` — drives `.prose` containers used in content collection pages

## Tailwind Patterns
- Use `@apply` sparingly — only in `@layer components` for shared patterns (`.card`, `.section-title`)
- Prefer utility classes directly in Astro templates over custom CSS
- Card component uses CSS custom properties for variants (`--card-bg`, `--card-lift`, etc.)
- Available card variants: `.card--on-dark`, `.card--resume`, `.card--compact` (legacy, used by profile components)

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
