# MVP thesis — Lab to Market as a match loop

**v1 problem space:** diabetic foot ulcers (DFU) / chronic non-healing wounds  
**User:** one commercializer, personal Cursor / Docker Compose self-host  
**Job:** discover overlooked research → rank → path cards → act → log outcome  

## Diagnosis

Lab to Market was drifting toward **SBIR school + optional patents**. That dilutes the real job: help a tactical commercializer find underused biology/medicine research and connect it to a next move.

Mithril’s lesson: one operator + AI coordinating **external** specialists — not building a full wet-lab or curriculum platform. Our MVP stays **upstream of execution**: matching.

## Spoonful (locked)

| Lever | Choice |
|-------|--------|
| Feed | PubMed-shaped abstracts + NIH / VA / DoD tech leads |
| Domain | DFU / chronic non-healing wounds only |
| Action | Exactly three path cards per lead |
| UX | One ranked **Pursue** queue (most promising unpicked first) |
| Out | Wet-lab logistics, patents-as-primary, SBIR Phase wizard, chat, required LLM, native `.exe` |

### Path cards

1. **Inventor / TTO outreach** — copyable eval-license / collab email draft  
2. **Matching open SBIR/STTR topic** — stub link + why it fits (no Phase I–III walk)  
3. **Skip / not a fit** — archive so ranking stays clean  

## Loop

```
discover → rank → path cards → act → log outcome
```

Layer 4 outcome fields (contacted / reply / interest, plus SBIR status) feed ranking so pursued and skipped leads drop or deprioritize.

## Success metric (one)

In a week of personal use: **≥5 DFU/wound leads pursued** with a logged outreach or SBIR-topic open — and at least **one** inventor/lab reply or clear “no.”

That validates **matching**, not curriculum coverage.

## How to run

```bash
cd deploy/selfhost
cp .env.example .env   # if needed
docker compose up --build
```

Open **http://localhost:8080** → create an account → land on the DFU pursue queue (seed loads automatically).

Offline-first: no API key required for the demo path.
