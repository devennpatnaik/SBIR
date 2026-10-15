# Ontology

Business logic for this app's objects, written once and imported by the backend, the agents and the app. Tables, constraints, policies and SQL functions stay in migrations, and `packages/database/database.types.ts` is generated from them.

Each business area gets a folder named in kebab-case, with the same layout inside:

- `<area>/objects/<name>.ts` holds one `object({ name, description, source: table('...') })`.
- `<area>/actions/<name>.ts` holds one `action({ name, description, input: z.object(...), objects: [Order], run: async (input, ctx) => ... })`. `objects` is required and lists the main objects the action is about (at least one); it may not include every object the action touches indirectly. `run` can be `sqlFunction('...')`. `ctx.db.rpc(name, args)` calls a SQL function as the signed-in user and returns `{ data, error }`; `data` is always a list, such as `data[0]` for a function that returns one value, and each call is its own transaction.
- `<area>/lib/*.ts` holds types, validation and calculations. A value that gets saved is calculated in SQL; `lib/` calculates only values shown on screen.
- `<area>/README.md` holds the rules the agent applies by judgment rather than code.

`name` matches the export: PascalCase for objects, camelCase for actions. The file name is `name` in kebab-case. `index.ts` lists `objects` and `actions`; table and SQL function names are checked against generated database types.

Import everything as `@project/ontology/<area>/<folder>/<file>` from the backend, agent tools and the app instead of writing a second copy. Use only what every runtime has, such as `fetch` and Web Crypto: no `node:` modules and no Worker `env`. Callers pass in secrets and database clients.

The agent's `ontology` skill is built from `index.ts`, each area's README and the database types, and the agent runs actions with its `run_ontology_action` tool.
