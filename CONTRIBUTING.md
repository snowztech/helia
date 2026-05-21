# Contributing

Thanks for thinking about contributing to Helia. This project is early. Most things are still moving. PRs that fix bugs, polish UX, or improve the agent and RAG layers are very welcome.

## Setup

You need Node 22 or newer, pnpm 9 or newer, Docker, and an OpenAI API key.

```bash
git clone https://github.com/snowztech/helia
cd helia
make setup
```

Open `apps/api/.env` and set `OPENAI_API_KEY`. Then run `make dev`. The API listens on port 4000 and the web UI on port 3000.

If you change the schema in `packages/db/src/schema.ts`, run `make db:push` to apply it. If the change touches the generated tsvector column, run `make db:init`.

## Branching

Cut a branch off `main`. Use a short prefix like `feat/`, `fix/`, `chore/`, `docs/`. Keep one logical change per branch. Small focused PRs land faster than big sprawling ones.

## Style

Code style is enforced by the workspace tsconfig and the linter. A few prose conventions for commits, docs, and code comments.

Write plain sentences. Skip em dashes. Avoid stacked bullet lists when a paragraph reads better. Skip headers on sections shorter than three lines. Do not narrate what the code does inside comments. Comments are for the why that is not obvious, the constraint that is not visible, or the workaround for a bug. Code that needs no comment is the goal.

Conventional commits, one line subjects, no body. Examples.

```
feat(rag): add structure aware chunking for markdown
fix(chat): preserve scroll position on auto refresh
chore(deps): bump @snowztech/ui to 0.4.0
```

Do not add `Co-Authored-By: Claude` or any other AI trailer.

## Testing locally

There is no unit test suite yet. Run the app end to end and click through the flow you changed. For the chat path, upload a small text or PDF, ask three or four real questions, and check the answers cite the right chunks. For ingest changes, look at the source detail page event timeline.

Before pushing run `make typecheck`. CI runs the same command on every PR.

## What to work on

The `roadmap` section in `docs/05-roadmap.md` lists planned features by phase. The `What is not in the codebase yet` section of `ARCHITECTURE.md` lists the bigger gaps. Issues labeled `good first issue` are smaller cleanups that do not require deep context.

If you want to add a new agent tool, look at `apps/api/src/agent/tools.ts` for the pattern. A tool is one file with a description, a zod schema, and an execute function. The description gets injected into the persona prompt automatically.

## Reporting bugs

Open an issue with the reproduction steps, what you expected, and what happened. A screenshot or a terminal capture saves us a lot of guessing. If the API logs show an error, paste it.

## Security

If you find a security issue, do not open a public issue. Send an email to the address in the snowztech org profile and we will respond within a few days.

## License

Helia is AGPL 3.0. Contributing code means you agree to license your contribution under the same terms.
