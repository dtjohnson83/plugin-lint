# plugin-lint project decisions

## Namespace

Use `@danzus/plugin-lint` as the intended npm package name.

`@danzus` does not exist on npm yet. Create the `danzus` npm org manually on npmjs.com, then run `npm login` on the build machine and publish the stub or v0.1 package with:

```bash
npm publish --access public
```

Do not switch to an unscoped package unless there is a strong reason. The scoped namespace matters because future governance tools can live under the same org, e.g. `@danzus/aat-cli` and `@danzus/skill-audit`.

## GitHub

Start under `dtjohnson83/plugin-lint` for v0.1 so the build is not blocked.

Before v0.2 goes public, create the `danzus` GitHub org and transfer the repo there. GitHub repo transfers preserve stars, forks, issues, and redirects.

## Claude Code context

The first Claude Code run hit a 1M-context requirement. Note for v0.2 and v0.3: split work by surface instead of running one mega-session.

Recommended sessions:
- v0.2 hosted web app: separate Claude Code session
- v0.3 MCP server: separate Claude Code session
- release hardening / npm publish: separate review session

## Rubric calibration

Real skills are the ground truth. If `premium-ui-design` or `content-growth` comes back with a grade that feels wrong, tune the rubric weights before rewriting the skill.

Expected first-pass risk: the scorer may over-penalize strong real-world descriptions that do not match the fixture-shaped trigger phrase pattern.

## Social-proof artifact

Best launch artifact: terminal output of `plugin-lint` running against `premium-ui-design`, ideally showing one C-or-lower grade and a rewrite suggestion. Use that as the screenshot/clip for the first post. Do not write the post until v0.1 output is real.
