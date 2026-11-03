# Lab to Market

The product is Lab to Market, a local walk you can run from a phone in Claude Code. The program is `/Users/devenpatnaik/Downloads/SBIR/lab-to-market`. `cd /Users/devenpatnaik/Downloads/SBIR` first. Do not send the user to the web UI. If the user pasted `claude-code-prompt.md`, follow that prompt.

The first question is the route. Both routes start from demand, and the user picks a match. `patents` is an unsolved problem paired with a real patent or PubMed article. Draft an offer of debt, royalties, or equity, and let the user send the email. `sbir` is an open notice paired with government research. Draft Phase I from that pair. SAM.gov and the other registrations are a checklist on that draft. Do not invent a problem's document, a patent number, a PMID, a DOI, a URL, a solicitation, a lab technology, or an email address. Do not send mail. A missing company does not block the draft. It blocks recording a submission.

```bash
/Users/devenpatnaik/Downloads/SBIR/lab-to-market status --json
/Users/devenpatnaik/Downloads/SBIR/lab-to-market do --name "..." --idea "..." --json
```

With no arguments in a terminal, `./lab-to-market` asks the next question. From an agent, use `status --json` and `do ... --json` so stdout is one JSON document. Errors go to stderr.

The record is `~/.lab-to-market/sbir.json`. Drafts are in `~/.lab-to-market/drafts/`. Set `LTM_DIR` to use another folder. `clear --yes` deletes that record only.

Nothing is emailed, submitted, signed, or sent. Phase III is not an SBIR award. Do not invent a deadline, a tracking number, an award decision, or a contact.

`./lab-to-market menu` is the older lab database. It needs `./lab-to-market up`. `path`, `guide`, and `programs` do not.

Sign in, only for that older database:

```bash
LTM_PASSWORD='…' ./lab-to-market signin --email you@example.com --json
```

Session file: `~/.lab-to-market/session.json` (mode 600). Override with `LTM_SESSION` and `LTM_API` (default `http://127.0.0.1:8787`).

`./lab-to-market up|down|logs|ps|doctor|reset-demo` is Docker, not the product.
