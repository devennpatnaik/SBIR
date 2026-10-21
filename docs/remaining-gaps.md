# Remaining gaps — checklist

Live: https://github.com/devennpatnaik/sbir (see `docs/two-tracks.md`)

| # | Gap | Status | Notes |
|---|-----|--------|--------|
| 1 | Research assistant | **Retired** | Chat / Ask a guide removed → **list → pursue** (ranked unpicked first) |
| 2 | Pathway jobs + uploads | **Done** | Offline Markdown templates + `/files` binary list/upload/download |
| 3 | Production hardening | **Done** | Prior ship |
| 4 | One-command | **Done+** | `doctor`, `reset-demo`, `package`; honest no `.app`/`.exe` |
| 5 | Learning flywheel | **Done+** | Demo seeds sample outcomes (excluded from cohort); Insights example panel; pursue ranking uses cohort when ≥3 |
| 6 | UX polish | **Done** | Two tracks + pursue lists |

## Works without an API key

```bash
./lab-to-market doctor
./lab-to-market up
# → http://localhost:8080
```

- **Pursue** — select from a ranked list (most promising unpicked first), then open next step  
- **Pathway research / draft / review** — Markdown docs from project fields + templates  
- **Uploads**, auth, discover, compare, demo company, What happened, What we learned  

No chat UI. `/assistant/chat` returns 410 (retired). API keys are optional and unused for the default product flow.

## CI

```bash
bun install --minimum-release-age=0
bun test apps/untitled-app-6ac856247b02af3fede23b91/tests/
bun scripts/smoke-offline.ts
```

Template Action: `scripts/ci-workflow.yml` (copy to `.github/workflows/` when the GitHub token has `workflow` scope). Notes: `scripts/ci.md`.

## Still optional later

- Live model drafting for pathway Markdown (keys)  
- Installing the Actions workflow file (token needs `workflow` scope)  
- Native macOS `.app` / Windows `.exe` (not planned)
