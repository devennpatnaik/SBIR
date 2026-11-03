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
- If rights are unavailable, or there is no company yet, stay on that question. Do not draft a proposal past it.
- One fact per command, unless I clearly answered two things in the same reply.
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
| `name` | `do --name "..."` |
| `idea` | `do --idea "..."` |
| `owner` | `do --owner "..."` or, if I say it is my own work, `do --skip-owner` |
| `source` | `do --source "https://..."` or, if I have no link, `do --skip-source` |
| `rights` | `do --rights not-needed` or `asked` or `available` or `unavailable` |
| `company` | `do --company ready` or `not-yet` or `partner` |
| `sam` | `do --sam yes` or `no` or `later` |
| `sbirGov` | `do --sbir-registry yes` or `no` or `later` |
| `portal` | `do --portal yes` or `no` or `later` |
| `agency` | `do --agency "..."` |
| `number` | `do --number "..."` |
| `title` | `do --title "..."` |
| `closes` | `do --closes YYYY-MM-DD` |
| `url` | `do --url "https://..."` |
| `objective` | `do --objective "..."` |
| `plan` | `do --plan "..."` |
| `market` | `do --market "..."` |
| `team` | `do --team "..."` |
| `budget` | `do --budget "..."` |
| `submit1` | `do --submitted yes --ref "..."` only with my tracking number |
| `award1` | `do --award pending` or `yes` or `no` |
| `phase2plan` | `do --phase2-plan "..."` |
| `phase2customers` | `do --phase2-customers "..."` |
| `submit2` | `do --phase2-submitted yes --phase2-ref "..."` only with my tracking number |
| `award2` | `do --phase2-award pending` or `yes` or `no` |
| `buyer` | `do --buyer "..."` |
| `offer` | `do --offer "..."` |
| `money` | `do --money "..."` |

If I want to leave the open patent or article, run `do --drop-outreach`. That returns to `route`. It does not delete a note I already sent. If I want SBIR while a note is still open, run `do --route sbir`. The note stays. `do --route patents` later resumes it.

Pass the `value` from `choices`, not the label. Add `--json` to every `do` command.

If a command fails, show me the stderr sentence and ask the same question again. Do not guess a correction.

Start now: `cd /Users/devenpatnaik/Downloads/SBIR`, run `/Users/devenpatnaik/Downloads/SBIR/lab-to-market status --json`, and ask me the first question.
