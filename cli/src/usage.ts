export const USAGE = `Lab to Market on this machine. No account. No server. A phone is enough.

  ./lab-to-market                         ask the next question
  ./lab-to-market status                  where you are
  ./lab-to-market do --route patents
  ./lab-to-market do --route sbir --name "Sensor" --idea "Cheaper wastewater tests"
  ./lab-to-market clear --yes             delete this machine's file

Start by choosing a route. Patents and new papers: you find a record, the draft offers debt, royalties, or equity, and you send the email yourself.

SBIR is for government technology, and it is short enough for a phone. One sentence for the idea. Whether the work is yours. Where the company stands. One official notice you confirm. One spoken Phase I. The draft is saved then. SAM.gov is a checklist on that draft. Phase I proves it, Phase II builds it, and Phase III sells it. Phase III is not an SBIR award. You submit every proposal yourself. No company yet does not block the draft.

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

A patent or a paper, after --route patents:
  do --kind patent|article
  do --found-title "..." --identifier "US 1,234,567 or PMID 123" --found-url https://...
  do --novelty "..." --inventor "..."
  do --deal debt|royalties|equity --terms "..."
  do --contact "the address you copied" --contact-source https://...
  do --no-contact
  do --sent yes
  do --drop-outreach

Add --json for a single JSON document. Nothing is emailed for you. The old lab database still sits behind ./lab-to-market menu, and needs ./lab-to-market up.
`;
