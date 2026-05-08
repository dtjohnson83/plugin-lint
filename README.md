# plugin-lint

**Lint your Claude plugins before you ship them.**

---

## The problem

Plugin authors write vague `description` fields in `SKILL.md` frontmatter. Vague descriptions silently fail to activate — or worse, hijack unrelated conversations. There is no existing tool to catch this before deploy.

`plugin-lint` is that tool.

---

## Install & run

```bash
# One-time run with npx
npx @danzus/plugin-lint ./my-plugin

# Install globally
npm install -g @danzus/plugin-lint
plugin-lint ./my-plugin
```

---

## What it checks

| Check | Description |
|-------|-------------|
| **plugin.json** | File exists, valid JSON, required fields (`name`, `description`, `version`), `name` is kebab-case, `version` is semver |
| **SKILL.md frontmatter** | YAML parses, required fields present, `name` matches folder, body has `# Overview` and `## Process` sections |
| **Description scoring** | 0–100 score across trigger phrases, negative boundaries, specificity, and length. Grade A–F |
| **Trigger collision detection** | Pairwise n-gram overlap across all skill descriptions — flags skill pairs that will fight over the same activations |
| **Command files** | Every file in `commands/` is markdown, first line matches `# /<prefix>:<command>`, has at least one step list |

### Description scoring rubric

| Dimension | Weight | What it measures |
|-----------|-------:|------------------|
| Trigger phrase count | 30 | Explicit "Use when user says X" phrases. 0 = 0 pts, 5+ = full marks |
| Negative boundaries | 25 | "Do NOT use for…" clauses. Binary-ish with partial credit |
| Specificity | 25 | Penalizes generic words (`tasks`, `things`, `various`). Rewards concrete nouns and verbs |
| Length & structure | 20 | Penalizes <40 chars (too short) and >800 chars (model won't index well) |

---

## Sample output

```
plugin-lint v0.1.0
Path: ./my-plugin  (my-plugin)

Plugin structure
  ✔ plugin.json — valid

Skills

  ✖ skill: pdf-summarizer
    Score: ████████████░░░░░░░░ 58/100  Grade: C
    Breakdown: triggers=18/30  negatives=25/25  specificity=15/25  length=0/20
    Improvements:
      → Description is too short (35 chars) — minimum 40 chars needed

  ✔ skill: email-drafter
    Score: ████████████████████ 95/100  Grade: A

──────────────────────────────────────────────────
Description grades: pdf-summarizer:C  email-drafter:A

✖ 0 errors, 1 warning
```

---

## CLI flags

```bash
plugin-lint <path>                # lint a plugin folder
plugin-lint <path> --fix          # rewrite weak descriptions using Claude API
plugin-lint <path> --format json  # machine-readable output
plugin-lint <path> --format md    # markdown report (for CI comments)
plugin-lint <path> --strict       # warnings become errors (for CI gates)
plugin-lint --help
plugin-lint --version
```

**Exit codes:** `0` = pass · `1` = warnings · `2` = errors · `3` = invalid invocation

---

## --fix mode

For any description scoring below 70, `--fix` calls the Anthropic API to rewrite it:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
plugin-lint ./my-plugin --fix
```

1. Reads current description and skill body (Process section)
2. Calls `claude-opus-4-7` with a structured rewrite prompt
3. Shows a diff of proposed changes
4. Asks for confirmation (skip with `--yes`)
5. Writes back to the file

---

## CI integration

```yaml
# .github/workflows/plugin-quality.yml
- name: Lint Claude plugin
  run: npx @danzus/plugin-lint . --strict --format md >> $GITHUB_STEP_SUMMARY
```

See [examples/ci-integration.md](examples/ci-integration.md) for full workflow examples.

---

## Built by DANZUS Holdings LLC

`plugin-lint` is a companion tool to [Agent Audit Trail](https://aiagentaudit.dev) — governance for the configs that govern agents.

MIT License.
