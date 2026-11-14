# Wound Match

Cursor-hosted DFU / chronic-wounds commercialization match loop:

**discover → rank → path cards → act → log outcome**

## Local

```bash
cd apps/wound-match
npm install   # use a local install (this folder has its own package-lock)
env -u DATABASE_URL npm run dev
```

Open http://127.0.0.1:3456 — PGlite applies `migrations/` and seeds ~35 curated DFU leads. Local identity is simulated (`cursor/identity.dev.ts`).

## Publish

`cursor-app.json` requests platform Postgres. `npm run build` runs `scripts/migrate.mjs` after the Next build when `DATABASE_URL` is set. Confirm Publish in Cursor; prefer **private** visibility.
