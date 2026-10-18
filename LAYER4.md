# Layer 4 — investigation outcomes

Included in this snapshot (`main` @ `cc1527b`).

- Migration: `prisma/migrations/20261018000200_investigation_outcomes/`
- Package: `packages/learning/`
- API: `GET/POST /learning/outcomes`, `GET /learning/insights`
- UI: Technology detail → **What happened**
- Scoring: bounded cohort adjustment (−12…+12) when `sampleSize ≥ 3`

On Docker Compose, the migration applies automatically on first Postgres boot.
