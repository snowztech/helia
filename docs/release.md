# Releasing

Helia has two release tracks:

- **App releases** ship the hosted/self-hosted product and bump the root
  `package.json` version.
- **SDK releases** publish the public npm packages:
  `@gethelia/widget`, `@gethelia/server`, and `@gethelia/react`.

Keep them separate. The hosted app can ship without publishing npm packages,
and SDK packages can patch without changing the hosted app version.

## App release

Use this for product changes, backend changes, dashboard changes, docs shipped
with the app, and deployable self-hosted changes.

```bash
pnpm release:app patch
# or minor / major
```

The script:

1. Requires a clean git worktree.
2. Runs `pnpm typecheck`.
3. Runs `pnpm version <patch|minor|major>`.
4. Prints the push and GitHub release commands.

Then push the version commit and tag:

```bash
git push --follow-tags
gh release create v$(node -p "require('./package.json').version") --generate-notes
```

## SDK release

Use this when the public npm API changes, package docs change, or the widget,
React wrapper, or server helpers need to be published.

First-time npm setup:

```bash
npm login
npm whoami
```

Make sure your npm account can publish public packages under the `@gethelia`
scope.

Run a dry release first:

```bash
pnpm release:sdk patch
# or minor / major
```

The script:

1. Requires a clean git worktree.
2. Temporarily bumps all three SDK package versions together.
3. Runs SDK typecheck and builds.
4. Packs the packages to a temporary directory.
5. Verifies packed manifests do not leak `workspace:` dependency ranges.
6. Restores package manifests and stops before publishing.

Inspect the generated tarballs if this is the first publish. Then publish:

```bash
pnpm release:sdk patch --publish
```

Publish order is handled by the script:

1. `@gethelia/widget`
2. `@gethelia/server`
3. `@gethelia/react`

After publishing, commit and tag the SDK version bump:

```bash
git add packages/widget/package.json packages/server/package.json packages/react/package.json
git commit -m "chore: release sdk <version>"
git tag sdk-v<version>
git push --follow-tags
```

## Bump guide

- **patch**: bug fix, docs correction, package metadata fix, no behavior break
- **minor**: new feature, new endpoint, additive SDK API
- **major**: breaking API, required migration, renamed env var, behavior change
  that requires customer action

## Later

Move to Changesets after external contributors start opening PRs or SDK
packages need independent versioning. Until then, the scripts keep release DX
simple and explicit.
