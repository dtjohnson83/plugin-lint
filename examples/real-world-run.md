# Real-World Test Run

The following real-world plugin paths were unavailable at the time this version was built:

- `/mnt/skills/user/premium-ui-design`
- `/mnt/skills/user/content-growth`

These paths do not exist in the current environment. When they become available, run:

```bash
# Lint both real-world skills
plugin-lint /mnt/skills/user/premium-ui-design
plugin-lint /mnt/skills/user/content-growth

# Or with JSON output for scripting
plugin-lint /mnt/skills/user/premium-ui-design --format json
plugin-lint /mnt/skills/user/content-growth --format json

# Use --fix to rewrite any descriptions scoring below 70
# (requires ANTHROPIC_API_KEY to be set)
export ANTHROPIC_API_KEY=sk-ant-...
plugin-lint /mnt/skills/user/premium-ui-design --fix
plugin-lint /mnt/skills/user/content-growth --fix
```

Capture output for this document with:

```bash
plugin-lint /mnt/skills/user/premium-ui-design > examples/premium-ui-design-run.txt 2>&1
plugin-lint /mnt/skills/user/content-growth > examples/content-growth-run.txt 2>&1
```
