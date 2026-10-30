# Lab to Market

The product is a local SBIR walk. Do not send the user to the web UI. If the user pasted `claude-code-prompt.md`, follow that prompt.

```bash
./lab-to-market status --json
./lab-to-market do --name "..." --idea "..." --json
```

With no arguments in a terminal, `./lab-to-market` asks the next question. From an agent, use `status --json` and `do ... --json` so stdout is one JSON document. Errors go to stderr.

The record is `~/.lab-to-market/sbir.json`. Drafts are in `~/.lab-to-market/drafts/`. Set `LTM_DIR` to use another folder. `clear --yes` deletes that record only.

Nothing is submitted, signed, or sent. Phase III is not an SBIR award. Do not invent a deadline, a tracking number, or an award decision.

`./lab-to-market menu` is the older lab database. It needs `./lab-to-market up`. `path`, `guide`, and `programs` do not.

Sign in, only for that older database:

```bash
LTM_PASSWORD='…' ./lab-to-market signin --email you@example.com --json
```

Session file: `~/.lab-to-market/session.json` (mode 600). Override with `LTM_SESSION` and `LTM_API` (default `http://127.0.0.1:8787`).

`./lab-to-market up|down|logs|ps|doctor|reset-demo` is Docker, not the product.
