---
applyTo: "src/content/**/*.mdx, src/content/**/*.md, src/content.config.ts"
---

<!-- managed-by: preflight -->

# Content Collection Rules

## Schemas (defined in `src/content/config.ts`)
- `timeline`: title, company, startDate, endDate?, location?, tags[], highlight?
- `projects`: title, summary, link?, repo?, tech[], featured?
- `certs`: title, issuer, issued, credentialUrl?, skills[]

All schemas use Zod validation. After any schema change, run `npm run sync`.

## Writing MDX Content
- Frontmatter must match the Zod schema exactly — mismatches break the build
- Use standard Markdown inside MDX files; avoid importing components into content
- Keep content concise — it renders inside `.prose` containers with Tailwind Typography
- Tags and skills arrays should use consistent casing across entries (e.g., "Dynamics 365", not "dynamics365")

## Adding New Collections
1. Define the schema in `src/content/config.ts` with `defineCollection` and Zod
2. Export it in the `collections` object
3. Create the directory under `src/content/`
4. Run `npm run sync` to generate TypeScript types
5. Query with `getCollection('name')` in Astro components

<!-- end-managed-by: preflight -->
