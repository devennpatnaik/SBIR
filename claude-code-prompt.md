Run Lab to Market from this repo. On this Mac the folder is:

`/Users/devenpatnaik/Downloads/SBIR`

That folder is the GitHub repo `devennpatnaik/SBIR`. On a phone, use the same repo wherever it is open. `cd` there before you run anything. Every command below is that program. On this Mac, call it by its full path:

`/Users/devenpatnaik/Downloads/SBIR/lab-to-market`

This is the whole product. A phone and this chat are enough to start a company. Stay in the terminal. Do not open a browser, do not start Docker, and do not run `up` or `menu`. If that Mac path is not on this machine, run `./lab-to-market` from the repo root. Node.js 22 is enough. Bun is optional.

## How to run it

Every turn:

1. Run `/Users/devenpatnaik/Downloads/SBIR/lab-to-market status --json`.
2. Read `step`, `kind`, `prompt`, and `choices` from that JSON. Stdout is one JSON document. Errors are on stderr.
3. Ask me only that question, in plain language. If `choices` is present, show each `label` and wait for me to pick one.
4. Record only what I just said, with one `/Users/devenpatnaik/Downloads/SBIR/lab-to-market do ... --json` command from the table below.
5. Read the new JSON and ask the next question.

Keep going until `kind` is `done`, `wait`, or I say stop. Then tell me the draft path and stop. After I record that I sent an inventor email, `step` is `route` again. Ask that question. Do not stop there.

The record is `~/.lab-to-market/sbir.json`. SBIR drafts are `~/.lab-to-market/drafts/phase-1.md`, `phase-2.md`, and `phase-3.md`. Inventor notes are `outreach-1.md`, `outreach-2.md`, and so on, in that same drafts folder. Do not edit those files by hand. Do not run `clear --yes` unless I explicitly ask you to delete the record. The `draft` field in the JSON is the file for the current question.

## What you may not do

- Do not invent a solicitation, a URL, a close date, a tracking number, an award decision, a dollar amount, a customer, a patent number, a PMID, a DOI, or an email address.
- Do not say that anything was submitted, signed, licensed, or sent. I submit every proposal myself. I send every email myself.
- Do not record `--submitted yes` or `--phase2-submitted yes` unless I give you the tracking number from a submission I already made.
- Do not record `--sent yes` unless I tell you I already sent that email.
- Do not guess an email from a name. If you cannot find a public contact on a real page, say so and run `do --no-contact`. A placeholder such as example.com is not a contact.
- If I have not submitted, stop on that question. Tell me the draft path and that I submit it myself. When I come back with the tracking number, record it.
- Phase II is not automatic. Phase III is a sale. Its money is not an SBIR award.
- If `kind` is `wait`, stop. Tell me to come back when the official notice arrives. Pending is not a selection.
- If rights are unavailable, stay on that question. Do not draft a proposal past a refused license.
- No company yet does not stop the draft. A submission can be recorded only after I have a U.S. small business or a research partner.
- On a phone, I choose. You do the looking up and the drafting. Do not ask me to invent an idea, a notice, or the Phase I sections.
- On `match`, when `suggestions` is empty: do not ask me anything yet. Search public agency pages, SBIR.gov, and federal-lab technology listings. Find up to three open notices, and for each one a piece of government research that fits it. Record each pair with one `do` command: `--suggest-agency`, `--suggest-number`, `--suggest-title`, `--suggest-closes YYYY-MM-DD`, `--suggest-url`, `--suggest-name`, `--suggest-idea`, `--suggest-owner`, `--suggest-source`. Every link and date must be copied from a page you opened. If you cannot find a real pair, say so. Do not invent a notice, a lab, or a technology. Then run `status --json` again.
- On `match`, when `choices` is present: show me each label and wait. Record `do --pick` with the value I chose. If I want different choices, run `do --clear-suggestions` and look again. If I want to drop a match already chosen and no submission is recorded, run `do --clear-match`.
- On `write`: draft the five sections from the saved notice and the saved government technology only. Mark anything the listing does not say as a guess. Show me the sections. When I accept them, record `--objective`, `--plan`, `--market`, `--team`, and `--budget` in one command. Do not invent a customer, a person, a measurement, or a dollar amount.
- On `submit1`: show me the draft path. The prompt lists anything still open, such as the company, SAM.gov, SBIR.gov, or the agency portal. If I say one of those is done, record it (`--company ready` or `partner`, `--sam yes`, `--sbir-registry yes`, `--portal yes`). If I have not submitted, stop. Tell me the draft path and that I submit it myself.
- On `phase2`: one answer covers what I will build and who has shown interest. No interest yet is a real answer. Record `--phase2-plan` and `--phase2-customers` together.
- On `phase3`: one answer covers who pays, what I sell, and where the money comes from. Record `--buyer`, `--offer`, and `--money` together. The money is not an SBIR award.
- On `sourceKind`, `foundTitle`, `identifier`, or `foundUrl`: if I have not confirmed one specific patent or article, you may search public patent and PubMed pages and show me a few real records with their numbers and links. Wait until I pick one. Then record only that record.
- On `contact`: look up the inventor or corresponding author from the saved link and other public pages. Show me the address and the page where you found it. Record `--contact` and `--contact-source` only after I confirm both. The source has to be an https link.
- On `deal` and `terms`: use my words. Do not fill in an amount I did not say.
- On `send`: show me the draft path and the email in that file. Ask me to send it. If I have not, stop and tell me the path.

## Record my answer

Each command below is run as `/Users/devenpatnaik/Downloads/SBIR/lab-to-market <command> --json`.

| `step` | Command |
| --- | --- |
| `route` | `do --route patents` or `do --route sbir` |
| `sourceKind` | `do --kind patent` or `do --kind article` |
| `foundTitle` | `do --found-title "..."` |
| `identifier` | `do --identifier "..."` |
| `foundUrl` | `do --found-url "https://..."` |
| `novelty` | `do --novelty "..."` |
| `inventor` | `do --inventor "..."` |
| `deal` | `do --deal debt` or `royalties` or `equity` |
| `terms` | `do --terms "..."` |
| `contact` | `do --contact "..."` after I confirm it, or `do --no-contact` |
| `contactSource` | `do --contact-source "https://..."` |
| `send` | `do --sent yes` only after I say I sent it |
| `match` | while suggestions are empty, one command per pair: `--suggest-agency` `--suggest-number` `--suggest-title` `--suggest-closes` `--suggest-url` `--suggest-name` `--suggest-idea` `--suggest-owner` `--suggest-source`. Then `do --pick 1` with the value I chose. `do --clear-suggestions` to look again |
| `rights` | `do --rights not-needed` or `asked` or `available` or `unavailable`. `not-needed` means the work is mine |
| `owner` | `do --owner "..."` only when the work is not mine |
| `source` | `do --source "https://..."` or `do --skip-source` |
| `company` | `do --company ready` or `not-yet` or `partner` |
| `write` | one command after I accept the draft: `--objective` `--plan` `--market` `--team` `--budget` |
| `submit1` | `do --submitted yes --ref "..."` only with my tracking number. Or `--sam yes`, `--sbir-registry yes`, `--portal yes`, `--company ready` when I say that item is done |
| `award1` | `do --award pending` or `yes` or `no` |
| `phase2` | `do --phase2-plan "..."` and `--phase2-customers "..."` together |
| `submit2` | `do --phase2-submitted yes --phase2-ref "..."` only with my tracking number |
| `award2` | `do --phase2-award pending` or `yes` or `no` |
| `phase3` | `do --buyer "..."` `--offer "..."` `--money "..."` together |

If I want to leave the open patent or article, run `do --drop-outreach`. That returns to `route`. It does not delete a note I already sent. If I want SBIR while a note is still open, run `do --route sbir`. The note stays. `do --route patents` later resumes it.

Pass the `value` from `choices`, not the label. Add `--json` to every `do` command.

If a command fails, show me the stderr sentence and ask the same question again. Do not guess a correction.

Start now: `cd /Users/devenpatnaik/Downloads/SBIR`, run `/Users/devenpatnaik/Downloads/SBIR/lab-to-market status --json`, and ask me the first question.
