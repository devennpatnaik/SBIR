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

## SBIR walk (no account, no server)

```bash
./lab-to-market status
./lab-to-market do --route sbir --name "Ammonia sensor" --idea "Cheaper wastewater tests"
```

SBIR starts from an official notice paired with government research. The person picks a match. The draft is saved before SAM.gov.

The record is `~/.lab-to-market/sbir.json`. `status` only reads it. Drafts are written when an answer is saved. You submit every proposal yourself, and you send every inventor email yourself.

The first question is the route. `patents` records a patent or a paper you found, writes an offer (debt, royalties, or equity), and returns to that question after you record that you sent the email. `sbir` is the government-technology walk. The program does not invent a document number or an email address.

## Older lab database

Needs `./lab-to-market up` (the old web UI is http://localhost:8080).

```bash
./lab-to-market doctor
./lab-to-market up
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
