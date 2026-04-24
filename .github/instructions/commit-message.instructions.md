<!-- managed-by: preflight -->

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`

**Format:** `type(scope): subject`

**Types:**
- `feat` — new feature or capability
- `fix` — bug fix
- `style` — visual/CSS changes, no logic change
- `refactor` — code restructuring, no behaviour change
- `content` — MDX/data content updates (timeline, projects, certs)
- `chore` — deps, config, tooling, scripts
- `ci` — GitHub Actions workflow changes

**Scopes** (use the component or area changed):
`hero` · `timeline` · `projects` · `certs` · `og` · `csp` · `seo` · `nav` · `fonts` · `deps` · `scripts` · `layout`

**Subject rules:**
- Imperative mood, lowercase, no trailing period
- ≤72 characters
- No body needed for single-concern changes

**Examples:**
```
feat(hero): add cal.com booking button
fix(csp): allow pushover api origin
content(certs): add pl-400 certification entry
style(nav): tighten mobile spacing
chore(deps): update astro to 6.x
```

<!-- end-managed-by: preflight -->
