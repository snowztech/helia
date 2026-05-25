# Releasing

Solo-maintainer flow. Three commands.

The root `package.json` version is the source of truth. Both the API
(`/v1/system`) and the admin footer read it directly. Workspace
packages stay at `0.0.0` (they're `private: true`, their versions are
meaningless).

## Bump → tag → push

```bash
pnpm version patch            # or minor / major
git push --follow-tags
gh release create v$(node -p "require('./package.json').version") --generate-notes
```

That's it. Each step:

- `pnpm version patch` bumps `package.json`, commits the change, and
  creates a `vX.Y.Z` tag. No need to touch workspace packages.
- `git push --follow-tags` pushes the commit and the tag.
- `gh release create ...` publishes a GitHub release with auto-generated
  notes from commits since the previous tag.

If Railway is wired to auto-deploy from `main`, the new version is live
within a couple of minutes. The footer and `/settings → System` reflect
it automatically because both read from the bumped `package.json`.

## When to bump

Loose Semver, applied honestly:

- **patch**: bug fix, polish, dependency update, no schema/API surface change
- **minor**: new feature, new endpoint, additive schema migration
- **major**: breaking schema or API change, env var renamed, behavior changed in a way that requires customer action

## When this stops being enough

Move to [Changesets](https://github.com/changesets/changesets) the
first time you accept a contributor's PR. Changesets gives PR authors
a way to declare the impact of their change (patch / minor / major +
a one-line summary), and assembles the changelog for you on release.
Solo maintainer doesn't need this.
