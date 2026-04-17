---
applyTo: "**/*.astro"
---

<!-- managed-by: copilot-init -->

# Astro Component Conventions

## Component Structure
- Define an `interface Props` in the frontmatter for every component that accepts props
- Destructure props with `const { prop1, prop2 = default } = Astro.props as Props`
- Compute `const base = import.meta.env.BASE_URL ?? '/'` when linking to assets or pages
- For page route links, use the `to()` helper pattern: normalize trailing slashes and hash fragments

## Content Collections
- Query collections with `getCollection('name')` from `astro:content`
- Render MDX content with `const { Content } = await entry.render()`
- Schemas are defined in `src/content/config.ts` using Zod — keep in sync

## Templates
- Use double quotes for HTML attribute values in Astro templates
- Prefer Tailwind utility classes; use `.card`, `.section-title`, `.nav-link` from `global.css` for shared patterns
- Add `data-reveal` and `data-reveal-delay` for scroll animations on sections
- Always include `aria-*` attributes and `alt` text for accessibility
- Use `data-astro-prefetch` on internal navigation links

## Anti-patterns
- Don't use `<a href="/page">` — always go through `base` or `to()` for GitHub Pages compatibility
- Don't add `<script>` tags without considering CSP in `BaseLayout.astro`
- Don't import global CSS anywhere except `BaseLayout.astro`

<!-- end-managed-by: copilot-init -->
