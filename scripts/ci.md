# CI / smoke (no LLM keys)

GitHub Actions workflow file is intentionally kept as a template below — the current PAT may lack `workflow` scope.
Copy to `.github/workflows/ci.yml` from a Mac with `gh` (or a token that has `workflow`) when ready.

## Local

```bash
bun install --minimum-release-age=0
cd apps/untitled-app-6ac856247b02af3fede23b91 && bun run typecheck
cd ../../backend && bun run typecheck
bun test apps/untitled-app-6ac856247b02af3fede23b91/tests/
bun scripts/smoke-offline.ts
./lab-to-market doctor
# optional Compose:
# cd deploy/selfhost && cp .env.example .env && docker compose up -d --build
# curl -sf http://127.0.0.1:8787/health
```

## Template for `.github/workflows/ci.yml`

See git history commit that introduced CI, or recreate from `scripts/ci-workflow.yml`.
