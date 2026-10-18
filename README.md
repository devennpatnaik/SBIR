# Lab to Market

Help entrepreneurs commercialize lab, university, and inventor technologies: discover options, license IP, pursue SBIR/STTR and other funding, and track what actually worked (**Layer 4** learning feedback).

**Canonical remote:** Deven’s private GitHub repository (Bourne git hosting is abandoned).

## Works without an API key

```bash
./lab-to-market doctor
./lab-to-market up
```

Ask a guide returns structured SBIR / licensing / diligence checklists offline. Pathway research/draft/review writes Markdown from your saved fields. Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` later for a live model.

CI: `bun scripts/smoke-offline.ts` and `.github/workflows/ci.yml`.

## One command

```bash
./lab-to-market up
```

Opens **http://localhost:8080**. Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `deploy/selfhost/.env` for the research guide and pathway research/draft/review. Without a key, set `ASSISTANT_DEV_FALLBACK=1` for offline stubs.

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
