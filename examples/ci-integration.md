# CI Integration Guide

Use `plugin-lint` in GitHub Actions to validate your Claude plugin on every PR.

## Basic setup

Add this step to your workflow after your plugin files are checked out:

```yaml
- name: Lint Claude plugin
  run: npx @danzus/plugin-lint . --strict --format md >> $GITHUB_STEP_SUMMARY
```

This will:
- Lint the plugin in the current directory
- Use `--strict` mode so warnings fail the build
- Output a markdown report to the GitHub Actions job summary

## Full workflow example

```yaml
name: Plugin Quality Gate

on:
  pull_request:
    paths:
      - 'skills/**'
      - '.claude-plugin/**'
      - 'commands/**'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run plugin-lint
        run: npx @danzus/plugin-lint . --format md >> $GITHUB_STEP_SUMMARY

      - name: Run plugin-lint (strict, for PR gate)
        run: npx @danzus/plugin-lint . --strict
```

## Using JSON output in a custom script

```yaml
- name: Lint and parse results
  run: |
    npx @danzus/plugin-lint . --format json > lint-result.json
    # Parse with jq or your own tooling
    cat lint-result.json | jq '.skills[].descriptionScore.grade'
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | All checks pass |
| 1 | Warnings present (use `--strict` to treat as errors) |
| 2 | Errors present — build should fail |
| 3 | Invalid invocation (bad path, unknown flag) |

## Posting results as a PR comment

```yaml
- name: Run plugin-lint
  id: lint
  run: |
    npx @danzus/plugin-lint . --format md > lint-report.md
    echo "exit_code=$?" >> $GITHUB_OUTPUT
  continue-on-error: true

- name: Post comment
  uses: marocchino/sticky-pull-request-comment@v2
  with:
    path: lint-report.md

- name: Fail if errors
  if: steps.lint.outputs.exit_code == '2'
  run: exit 1
```

---

Built by [DANZUS Holdings LLC](https://aiagentaudit.dev) — governance for the configs that govern agents.
