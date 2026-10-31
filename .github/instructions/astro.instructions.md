---
applyTo: "**/*.astro"
---

<!-- managed-by: preflight -->

# Astro Component Conventions

## Component Structure
- Define an `interface Props` in the frontmatter for every component that accepts props
- Destructure props with `const { prop1, prop2 = default } = Astro.props as Props`
- Import `to`, `asset` and `base` from `src/utils/url.ts` for page links and `/public` assets
- Put copy into `src/data/*.ts` and map over it in the template instead of repeating markup
- Use `<Icon>` for SVG icons, `<SectionHeader>` for section headings

## Content Collections
- Query collections with `getCollection('name')` from `astro:content`
- Render MDX content with `const { Content } = await render(entry)` (`render` from `astro:content`)
- Schemas are defined in `src/content.config.ts` using Zod — keep in sync

## Templates
- Use double quotes for HTML attribute values in Astro templates
- Prefer Tailwind utility classes; use `.card`, `.section-title`, `.nav-link` from `global.css` for shared patterns
- Add `data-reveal` and `data-reveal-delay` for scroll animations on sections
- Always include `aria-*` attributes and `alt` text for accessibility
- Use `data-astro-prefetch` on internal navigation links

## Anti-patterns
- Don't use `<a href="/page">` — always go through `base` or `to()` for GitHub Pages compatibility
- Don't add external script/fetch origins without updating `src/utils/csp.ts`
- Don't hard-code contact data or the booking URL — use `site` from `src/data/site.ts`
- Don't import global CSS anywhere except `BaseLayout.astro`

<!-- end-managed-by: preflight -->
