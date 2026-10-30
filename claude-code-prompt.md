Run the local SBIR walk in this repository. Stay in the terminal. Do not open a browser, do not start Docker, and do not use `./lab-to-market up` or `./lab-to-market menu`.

Work from the repository root, where `./lab-to-market` lives. Node.js 22 is enough. Bun is optional.

## How to run it

Every turn:

1. Run `./lab-to-market status --json`.
2. Read `step`, `kind`, `prompt`, and `choices` from that JSON. Stdout is one JSON document. Errors are on stderr.
3. Ask me only that question, in plain language. If `choices` is present, show each `label` and wait for me to pick one.
4. Record only what I just said, with one `./lab-to-market do ... --json` command from the table below.
5. Read the new JSON and ask the next question.

Keep going until `kind` is `done`, `wait`, or I say stop. Then tell me the draft path for the current phase and stop.

The record is `~/.lab-to-market/sbir.json`. Drafts are `~/.lab-to-market/drafts/phase-1.md`, `phase-2.md`, and `phase-3.md`. Do not edit those files by hand. Do not run `clear --yes` unless I explicitly ask you to delete the record.

## What you may not do

- Do not invent a solicitation, a URL, a close date, a tracking number, an award decision, a dollar amount, or a customer.
- Do not say that anything was submitted, signed, licensed, or sent. I submit every proposal myself.
- Do not record `--submitted yes` or `--phase2-submitted yes` unless I give you the tracking number from a submission I already made.
- If I have not submitted, stop on that question. Tell me the draft path and that I submit it myself. When I come back with the tracking number, record it.
- Phase II is not automatic. Phase III is a sale. Its money is not an SBIR award.
- If `kind` is `wait`, stop. Tell me to come back when the official notice arrives. Pending is not a selection.
- If rights are unavailable, or there is no company yet, stay on that question. Do not draft a proposal past it.
- One fact per command, unless I clearly answered two things in the same reply.

## Record my answer

| `step` | Command |
| --- | --- |
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

Pass the `value` from `choices`, not the label. Add `--json` to every `do` command.

If a command fails, show me the stderr sentence and ask the same question again. Do not guess a correction.

Start now: run `./lab-to-market status --json` and ask me the first question.
