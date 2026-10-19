# Two tracks

Lab to Market keeps **two separate product tracks**. Choosing a track changes chrome, nav, guide prompts, and defaults — not just a welcome card.

## Track A — SBIR route

- **URL:** `/#/sbir/...` (home: `/#/sbir/home`)
- **Scope:** SBIR-eligible government R&D (federal labs / agency-backed tech that can feed SBIR/STTR)
- **Experience:** Process handholding — SBIR path steps, licensing follow-ups, funding guidance, Layer 4 outcomes that matter for SBIR
- **Nav:** Today · Gov R&D · Workspace (+ SBIR path, funding, pathways, demo)

## Track B — Worldwide patents

- **URL:** `/#/patents/...` (home: `/#/patents/home`)
- **Scope:** Patents registered anywhere that look unused / not commercialized
- **Experience:** Find · inspect · shortlist. **May not be SBIR-eligible.** No SBIR wizard or commercialization coaching
- **Nav:** Patents · Shortlist · Compare (+ notes/files). Explicit **Switch to SBIR route** control

## Persistence

1. **URL prefix** is canonical (`sbir` | `patents` as first hash segment)
2. **`localStorage` / `sessionStorage`** key `ltm:active-track`
3. Bare legacy paths (`#/discover`) rewrite to the stored/default track
4. Welcome cards call `enterTrack('sbir'|'patents')` and deep-link into each track home
5. Ask a guide sends `track=` in `[App context:…]`; offline guide respects it

## Switch

Banner chip / menu / footer — never merge both catalogs into one ambiguous “Explore” without an explicit switch.
