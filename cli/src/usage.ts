export const USAGE = `SBIR on this machine. No account. No server.

  ./lab-to-market                         ask the next question
  ./lab-to-market status                  where you are
  ./lab-to-market do --name "Sensor" --idea "Cheaper wastewater tests"
  ./lab-to-market clear --yes             delete this machine's SBIR file

You pick the research, then walk Phase I (prove it), Phase II (build it), and Phase III (sell it).
Phase III is not an SBIR award. You submit every proposal yourself.

Saved at ~/.lab-to-market/sbir.json
Drafts in ~/.lab-to-market/drafts/

Set LTM_DIR to keep the file somewhere else.

A few answers you will type yourself, copied from official pages:
  do --rights not-needed|asked|available|unavailable
  do --company ready|not-yet|partner
  do --sam yes|no|later --sbir-registry yes --portal yes
  do --agency DOE --number "TOPIC-1" --title "..." --closes 2026-12-01 --url https://...
  do --objective "..." --plan "..." --market "..." --team "..." --budget "..."
  do --submitted yes --ref "your tracking number"
  do --award pending|yes|no
  do --phase2-plan "..." --phase2-customers "..."
  do --phase2-submitted yes --phase2-ref "..."
  do --phase2-award yes|no|pending
  do --buyer "..." --offer "..." --money "..."

Add --json for a single JSON document. The old lab database, grants, and patents search still exist behind ./lab-to-market menu, and need ./lab-to-market up.
`;
