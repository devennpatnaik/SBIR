# Lab to Market

Help entrepreneurs commercialize lab, university, and inventor technologies: discover options, license IP, pursue SBIR/STTR and other funding, and track what actually worked (**Layer 4** learning feedback).

**Canonical remote:** Deven’s private GitHub repository (Bourne git hosting is abandoned).

## SBIR on this machine

No account and no server. You pick the research, then walk Phase I, Phase II, and Phase III. The program asks one question at a time and writes the record on this computer. You still submit every proposal yourself.

```bash
./lab-to-market
./lab-to-market status
./lab-to-market do --name "Ammonia sensor" --idea "Cheaper wastewater tests"
./lab-to-market clear --yes
```

The record is `~/.lab-to-market/sbir.json`. Drafts are `~/.lab-to-market/drafts/phase-1.md`, `phase-2.md`, and `phase-3.md`. `LTM_DIR` moves that folder. Add `--json` when another program is driving the commands.

Phase I proves it can work. Phase II builds and demonstrates it, and is not automatic. Phase III is a sale paid by a customer or by private capital, not an SBIR award. Close dates, tracking numbers, and award decisions are copied from official notices. This program does not invent them, and it does not submit, sign, or send anything.

`claude-code-prompt.md` is the prompt to paste into Claude Code. It runs this walk one question at a time.

`./lab-to-market menu` is the older list of lab records, grants, and patents. Those commands need `./lab-to-market up`. `path`, `guide`, and `programs` still run with no server.

CI: `bun test cli/src/cli.test.ts`, `bun scripts/smoke-offline.ts`, and `scripts/ci-workflow.yml (install as GitHub Action when token has workflow scope)`.

## API and legacy web UI

```bash
./lab-to-market doctor
./lab-to-market up
```

`up` starts the API the text interface talks to, and still serves the old web UI at **http://localhost:8080**. Day-to-day use is the terminal. Optional keys only affect pathway LLM drafting if you add them later.

## Quick start (Docker Compose — no Bourne account)

```bash
cd deploy/selfhost
cp .env.example .env          # set a strong JWT_SECRET for anything beyond local play
docker compose up --build
```

Open **http://localhost:8080**

| Service | Port (default) |
|---------|----------------|
| Web UI | `8080` |
| API | `8787` |
| PostgREST | `3001` |
| Postgres | `5432` |

Create an account on the sign-in screen. Migrations (including Layer 4 `investigation_outcomes`) apply automatically on first DB boot.

### Environment

See `deploy/selfhost/.env.example` and root docs:

- Compose vars: `POSTGRES_*`, `JWT_SECRET`, ports (see `.env.example`)
- Project store docs (handoff / export runbook / bourne-exit) ship separately for Deven

Frontend build args (Compose sets these):

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | API origin (`/api` behind nginx) |
| `VITE_AUTH_MODE` | `local` (self-host JWT) |

Legacy `VITE_BOURNE_*` / `VITE_NEON_AUTH_*` names are only for older hosted deployments.

## Layer 4 — investigation outcomes

On a technology page open **What happened** and record:

- Lab / owner response  
- License availability  
- Technical due diligence  
- SBIR/STTR award  
- Customer interest  

Compare ranking applies a small evidence adjustment when enough anonymized cohort data exists.

## What still needs Bourne / Eve (optional)

The research assistant chat, pathway agent jobs (research/draft/review), and uploads/artifacts runtime are **not** required for the core product. On Compose they return clear “unavailable” errors. See `docs` in the Project store (`bourne-exit.md`).

## Develop without Docker

```bash
bun install --minimum-release-age=0
# Point VITE_API_BASE_URL at a running API; run Postgres + PostgREST as in compose
cd apps/untitled-app-6ac856247b02af3fede23b91 && bun run dev
```

## Tests

```bash
bun test apps/untitled-app-6ac856247b02af3fede23b91/tests/
```

## License / privacy

Private repository. Do not commit `.env` files, JWTs, or PATs.
