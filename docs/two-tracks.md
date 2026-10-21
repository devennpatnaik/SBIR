# Two tracks

Lab to Market keeps **two separate product tracks**. Choosing a track changes chrome, nav, and defaults — not just a welcome card.

There is **no conversational chat guide**. Interaction is **select from a ranked list → pursue**.

## Track A — SBIR route

- **URL:** `/#/sbir/...` (home: `/#/sbir/home`, pursue: `/#/sbir/pursue`)
- **Scope:** SBIR-eligible government R&D (federal labs / agency-backed tech that can feed SBIR/STTR)
- **Experience:** Process handholding — SBIR path steps, licensing follow-ups, funding guidance, Layer 4 outcomes
- **Pursue list:** gov R&D / technologies + path steps — **ranked: most promising unpicked first**
- **Nav:** Pursue · Gov R&D · Workspace (+ SBIR path, funding, pathways, demo)

## Track B — Worldwide patents

- **URL:** `/#/patents/...` (home: `/#/patents/home`, pursue: `/#/patents/pursue`)
- **Scope:** Patents registered anywhere that look unused / not commercialized
- **Experience:** Find · inspect · shortlist. **May not be SBIR-eligible.** No SBIR wizard or commercialization coaching
- **Pursue / search lists:** unpicked candidates with strongest “unused” fit first; shortlisted below
- **Nav:** Pursue · Patents · Shortlist (+ notes/files). Explicit **Switch to SBIR route** control

## Ranking (pursue lists)

1. **Unpicked first** — not shortlisted / in-progress / archived (acted items go under “In progress / done”)
2. **Promising** — SBIR uses score + Layer 4 cohort adjustment when `sampleSize ≥ 3` (`@project/learning`); patents use unused/not-commercialized heuristics
3. UI label: **“Ranked: most promising unpicked”**

## Persistence

1. **URL prefix** is canonical (`sbir` | `patents` as first hash segment)
2. **`localStorage` / `sessionStorage`** key `ltm:active-track`
3. Welcome cards call `enterTrack('sbir'|'patents')` and deep-link into each track home
4. Switch via banner / chip / menu / footer — never a merged ambiguous “Explore”
