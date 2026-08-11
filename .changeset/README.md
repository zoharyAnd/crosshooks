# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets).

To record a change for the next release, run:

```bash
pnpm changeset
```

Pick the affected package and a semver bump (patch / minor / major), and describe
the change. The generated markdown file is committed alongside your code; the
release workflow consumes it to version and publish the package.
