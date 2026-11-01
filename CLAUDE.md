# CLAUDE.md

Project conventions, architecture and pitfalls are documented in
[`.github/copilot-instructions.md`](.github/copilot-instructions.md) and the
path-specific rules in [`.github/instructions/`](.github/instructions/) — read them first.

## Workflow

- `main` deploys automatically to GitHub Pages (`deploy.yml`, gated by the Playwright tests) — never push to `main`
  directly; work on a branch and open a PR.
- Copy/content changes go into `src/data/*.ts` or `src/content/**/*.mdx`, not into templates.
- Commit messages: Conventional Commits, see
  [`.github/instructions/commit-message.instructions.md`](.github/instructions/commit-message.instructions.md).

## Before pushing

```bash
npm run lint       # 0 warnings allowed
npm run build
npm run test:e2e   # Playwright (health-check/lead logic tables + E2E flows, n8n mocked)
```

If you change health-check scoring in `src/data/health-check.ts`, update the expectation
table in `tests/health-check-logic.spec.ts` deliberately. Renaming a question id or option
value, or changing a limit in `src/lib/lead.ts`, also requires updating the n8n workflow
"Website-Leads · dynamics-tim.dev" (node "Prüfen & entscheiden") — it whitelists them.
Likewise, adding/renaming an analytics event or value (`ANALYTICS_EVENTS` in `src/lib/analytics.ts`)
requires updating "Website-Analytics · dynamics-tim.dev" (node "Prüfen & normalisieren"), and
bumping `VERSION` in `public/assets/js/consent.js` requires `CONSENT_LAYER_VERSION` in `tests/fixtures.ts`.
