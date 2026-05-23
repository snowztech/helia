# UX and DX bar

What "good" means for Helia at MVP scale. Not Linear-level polish, but no embarrassing rough edges either. A self-host user gets the app running in ten minutes. A paying customer sets up the widget without us on a call. Both leave thinking "this is a real product."

This file is the standard. Every PR is checked against it.

## UX (the user-facing app)

The admin app, the landing page, and the widget. Three surfaces, one feel.

### Visual system

- One typeface across the whole app. System UI by default, Inter as fallback. No Google Fonts hosted call.
- One spacing scale. Tailwind defaults. No magic numbers.
- One color palette per surface. Admin uses neutral grayscale + one accent. Widget uses the workspace theme. Landing uses brand colors.
- shadcn/ui primitives for every form, dialog, dropdown, table. We do not reinvent components.
- Dark mode in the admin, follows system. The widget has its own light/dark toggle per workspace.
- Icons from lucide-react only. No mixing icon libraries.

### Copy

- Plain language. No "leverage," no "comprehensive," no "robust." Same rules as the README and ARCHITECTURE.md.
- Every error message says what happened and what to do. "Upload failed. The file is over 10 MB. Try a smaller PDF or split it."
- Buttons are verbs. "Upload PDF," not "Submit."
- Empty states are useful. Not "No data." Instead: "No sources yet. Upload a PDF, paste text, or crawl a URL to get started." with the three buttons inline.
- Confirmation copy is calm, not panicked. "Delete this source? Its chunks and events will go with it."

### Feedback and latency

- Every click that triggers a network request has a loading state inside 100 ms. Spinner, skeleton, optimistic update, whatever fits.
- Long async (ingest, embed) shows progress via the existing `source_events` timeline. No "wait and refresh."
- Toasts for transient feedback: created, deleted, copied. Top-right, two-second auto-dismiss.
- The widget shows the first streamed token under 2 seconds on `gpt-4o-mini`. If we cannot hit that, the message says "Thinking..." with a soft animation.
- No dead clicks. A disabled button has a tooltip saying why.

### Empty and error states

Every list page renders three states cleanly: empty, loading, error.

- Empty: a one-line description plus the primary CTA.
- Loading: skeletons that match the final layout, never a centered spinner alone.
- Error: a short message, a reload button, and a link to the support email if it persists.

### Onboarding

First-time admin login lands on a guided three-step flow, not on the empty dashboard.

1. Name the bot and pick a color.
2. Add the first source (PDF, text, or URL).
3. Copy the widget snippet, with a "Test on this page" preview that loads the widget right there.

Once the flow is completed, that workspace never sees it again.

### Accessibility

- Every input has a `<label>`.
- Focus rings visible on all interactive elements.
- Keyboard navigation works: tab order makes sense, Esc closes dialogs, Enter submits forms.
- Color contrast 4.5:1 minimum for body text. Use Tailwind's `text-foreground / text-muted-foreground` pattern, not raw grays.
- Widget panel works with a screen reader: roles set, ARIA live region for streamed messages.

### Mobile

- Landing page: mobile-first, two breakpoints.
- Admin app: usable on tablet (768 px+). Phones get a "best viewed on desktop" notice, not a broken layout. Real mobile admin is post-MVP.
- Widget: works on every viewport from 320 px up. Full-screen on phones, panel on tablet and desktop.

### Performance

- Lighthouse score 90+ on the landing page. Mobile and desktop.
- Admin first contentful paint under 1 second on a cold load.
- Widget loader under 30 KB gzipped, chat panel lazy-loaded.

## DX (developer experience)

Two audiences: a self-hoster running Helia for the first time, and a contributor reading the code to add a feature.

### First-run experience

- `git clone && make setup && make dev` works on a fresh macOS or Linux machine with Node 22, pnpm 9, and Docker installed.
- `make setup` prints what it is doing at each step. No silent failures.
- If a prerequisite is missing, the error names the prerequisite and a link to install it.
- `.env.example` covers every variable Helia reads, each with a one-line description and a sane default or an example value.
- The only value the user must set is `OPENAI_API_KEY`. Everything else has a default that works.

### Code health

- TypeScript strict mode on every package. No `any` outside `// eslint-disable-next-line` lines with a comment explaining why.
- Prettier + ESLint, enforced in a pre-commit hook (`simple-git-hooks` or `husky`).
- `pnpm typecheck` and `pnpm lint` pass on every PR. CI enforces it.
- No commented-out code in main.
- File names: `kebab-case.ts`. Component files: `PascalCase.tsx`. Folders: `kebab-case`.

### Errors in development

- Server errors in dev print the offending file and line at the top of the stack.
- Database errors mention the SQL and the parameters when possible (Drizzle does this; do not silence it).
- API responses on error follow `{ error: { code, message } }`. Same shape everywhere.

### Tests

- Critical paths have at least a smoke test. The list: chat end-to-end, retrieval correctness on a fixed source, ingest of each source type, billing webhook handler.
- Tests live next to the code: `foo.ts` + `foo.test.ts`. Vitest.
- CI runs tests on every PR. A failing test blocks the merge.

### Docs

- Every package has a `README.md` with: one paragraph what it does, install / import line, one usage example, link back to the root `ARCHITECTURE.md`.
- Every public function exported from `@helia/agent`, `@helia/rag`, `@helia/db` has a one-line JSDoc above it. Not what it does — that the name covers — but the WHY when not obvious.
- Architecture decisions go in `ARCHITECTURE.md`, not in commits, not in PR descriptions.
- The README quickstart is tested manually on a fresh machine before every minor release.

### Hot reload and feedback loops

- `make dev` starts API and web with watch mode. File changes reflect in under 2 seconds.
- Drizzle schema changes generate a migration with `pnpm db:generate`. Migrations apply on `pnpm db:migrate`.
- Widget package changes propagate to the test page on `pnpm --filter @helia/widget dev` without manual rebuilds.

### Contributing

- `CONTRIBUTING.md` lists: how to set up, where to find the issues we want help with, the test and lint commands, and one example "good first issue."
- We label issues `good first issue` when they fit: tight scope, no architecture decisions, clear acceptance criteria.

## How we enforce this

Three mechanisms.

1. **PR checklist.** Every PR description has a "checked against `UX-DX.md`" line. The reviewer sanity-checks the relevant section.
2. **CI gates.** Lint, typecheck, tests, bundle-size, Lighthouse on the landing page. Failing any of them blocks merge.
3. **Weekly walkthrough.** Once a week we go through the onboarding flow as a new user. Anything that confuses us becomes an issue.

## What this is not

- Not a design system spec. shadcn/ui is the system, configured per [`docs/widget.md`](widget.md) for the embed and stock for the admin.
- Not a perfect-product manifesto. We will ship rough edges. We just name them as issues and fix them on schedule, not pretend they are not there.
- Not frozen. As the product matures, the bar rises. Update this file when it does.
