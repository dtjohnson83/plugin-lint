# Real-World Test Run

Local Claude skill paths were found under:

```text
~/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/a6f103a1-168d-40b3-acbf-060194f1c04a/83e99bf1-caa4-48d1-9c31-4f3d6050b212/skills/
```

Direct skill-directory runs were attempted first. They failed because `plugin-lint` v0.1 expects a plugin root with `.claude-plugin/plugin.json` and `skills/<skill-name>/SKILL.md`, not a standalone skill directory. Captured in `examples/real-skill-direct-output.txt`.

A temporary wrapper plugin was then created at `/tmp/plugin-lint-real-skills-plugin` with:

```text
.claude-plugin/plugin.json
skills/premium-ui-design/SKILL.md
skills/content-growth/SKILL.md
```

## Calibration finding

The first wrapper run exposed an over-strict trigger parser: `content-growth` scored D because the scorer did not count real-world wording like `Use when building social media posts, video scripts, landing pages...` as trigger phrases.

That was rubric-tuned in v0.1 by counting concrete comma-separated `Use when building/creating/...` activation lists as trigger phrases. After tuning, both real skills scored B.

## Final calibrated output

```text
plugin-lint v0.1.0
Path: /tmp/plugin-lint-real-skills-plugin  (real-skills-calibration)


Skills

  ✖ skill: content-growth
    Score: ███████████████░░░░░ 75/100  Grade: B
    Breakdown: triggers=30/30  negatives=0/25  specificity=25/25  length=20/20
    Improvements:
      → Add explicit negative boundaries, e.g. "Do NOT use for: …" to prevent activation on unrelated topics
  ⚠ warn   SKILL.md body is missing a "# Overview" section /tmp/plugin-lint-real-skills-plugin/skills/content-growth/SKILL.md
  ⚠ warn   SKILL.md body is missing a "## Process" section /tmp/plugin-lint-real-skills-plugin/skills/content-growth/SKILL.md

  ✖ skill: premium-ui-design
    Score: ███████████████░░░░░ 75/100  Grade: B
    Breakdown: triggers=30/30  negatives=0/25  specificity=25/25  length=20/20
    Improvements:
      → Add explicit negative boundaries, e.g. "Do NOT use for: …" to prevent activation on unrelated topics
  ⚠ warn   SKILL.md body is missing a "# Overview" section /tmp/plugin-lint-real-skills-plugin/skills/premium-ui-design/SKILL.md
  ⚠ warn   SKILL.md body is missing a "## Process" section /tmp/plugin-lint-real-skills-plugin/skills/premium-ui-design/SKILL.md

──────────────────────────────────────────────────
Description grades: content-growth:B  premium-ui-design:B

✖ 4 warnings
```

Full final terminal and JSON output: `examples/real-skills-calibration-output-calibrated.txt`.

Screenshot artifact: `examples/plugin-lint-real-skills-terminal.png`.

## Honest rubric read

The B grades look directionally honest: both descriptions are concrete and trigger-rich, but neither includes negative boundaries, so neither should be an A yet.

No activation collisions were detected between `premium-ui-design` and `content-growth`.
