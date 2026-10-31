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
npm run test:e2e   # Playwright (quiz smoke test + quiz logic table)
```

If you change quiz scoring in `src/data/engagement-quiz.ts`, update the expectation
table in `tests/engagement-quiz-logic.spec.ts` deliberately.
