# plugin-lint — Build Brief for Claude Code

## What this is

A linter for Claude Cowork plugin folders. Validates structure, scores SKILL.md descriptions for trigger-phrase quality, and flags activation collisions across skills. Ships as a CLI first, then a hosted web version, then an MCP server.

Owner: DANZUS Holdings LLC
Positioning: companion tool to Agent Audit Trail — governance for the configs that govern agents.

## Why it exists

Plugin authors write vague description fields in SKILL.md frontmatter. Vague descriptions either never activate or hijack unrelated conversations. There is no current tool that checks this. plugin-lint is that tool.

## Repo layout
plugin-lint/
├── README.md
├── LICENSE # MIT
├── package.json
├── tsconfig.json
├── .gitignore
├── .github/
│ └── workflows/
│ └── ci.yml # lint + test on PR
├── src/
│ ├── cli.ts # entry: parse argv, route to commands
│ ├── commands/
│ │ ├── lint.ts # default command
│ │ └── fix.ts # --fix mode (calls Anthropic API)
│ ├── validators/
│ │ ├── pluginJson.ts # schema check on .claude-plugin/plugin.json
│ │ ├── skillFrontmatter.ts # YAML parse + required fields
│ │ ├── descriptionScorer.ts # the core IP — see scoring rubric below
│ │ ├── triggerCollision.ts # cross-skill phrase overlap detection
│ │ └── commandFiles.ts # validate /commands/*.md structure
│ ├── reporters/
│ │ ├── terminal.ts # colored CLI output
│ │ ├── json.ts # --format json
│ │ └── markdown.ts # --format md (for CI comments)
│ ├── fixer/
│ │ └── rewriteDescription.ts # Anthropic API call, returns suggested rewrite
│ └── types.ts
├── test/
│ ├── fixtures/
│ │ ├── good-plugin/ # passes all checks
│ │ ├── vague-descriptions/ # fails description scoring
│ │ ├── colliding-triggers/ # fails collision detection
│ │ └── broken-json/ # fails schema
│ └── *.test.ts
└── examples/
 └── ci-integration.md # how to wire into GitHub Actions

## CLI surface
npx plugin-lint <path> # lint a plugin folder
npx plugin-lint <path> --fix # rewrite weak descriptions in place
npx plugin-lint <path> --format json # machine-readable output
npx plugin-lint <path> --format md # markdown report
npx plugin-lint <path> --strict # warnings become errors (for CI)
npx plugin-lint --help
npx plugin-lint --version

Exit codes: 0 = pass, 1 = warnings, 2 = errors, 3 = invalid invocation.

## What it checks

### plugin.json

- File exists at .claude-plugin/plugin.json
- Valid JSON
- Required fields: name, description, version
- name is kebab-case, no spaces
- version matches semver

### SKILL.md frontmatter (per skill)

- File exists in skills/<skill-name>/SKILL.md
- YAML frontmatter parses
- Required fields: name, description
- name matches the folder name
- Body has a # Overview section and a ## Process section (warn, not error)

### Description scoring rubric (the core IP)

Each description gets a score 0–100 across four dimensions:

|Dimension |Weight|What it measures |
|--------------------|------|---------------------------------------------------------------------------------------------------------------|
|Trigger phrase count|30 |Count of explicit “Use when user says X” or list of trigger phrases. 0 phrases = 0 pts, 5+ phrases = full marks|
|Negative boundaries |25 |Presence of “Do NOT use for…” or “not for…” clauses. Binary-ish; partial credit if vague |
|Specificity |25 |Penalize generic words (“tasks”, “things”, “various”, “general”). Reward concrete nouns and verbs |
|Length & structure |20 |Penalize <40 chars (too short to disambiguate) and >800 chars (model won’t index well) |

Output per skill: score, grade (A/B/C/D/F), and a list of specific improvements.

### Trigger collision detection

- Tokenize every description across all skills in the plugin
- Extract trigger phrases (sentences containing “use when”, “use this when”, “user says”, “trigger”, or items in a phrase list)
- Compute pairwise overlap (Jaccard on n-grams, n=2,3)
- Flag any pair with overlap > 0.4 as a collision risk
- Report which skills compete and on which phrases

### Command files

- Every file in /commands/ is markdown
- First line is a heading matching # /<prefix>:<command>
- Body has at least one numbered or bulleted step list

## –fix mode

For any description scoring below 70:

1. Read the SKILL.md
2. Read the body of the skill (Process section, Output Format) for context
3. Call Anthropic API (`claude-opus-4-7`) with this prompt:
You are rewriting the `description` field in a SKILL.md frontmatter for a Claude plugin.

Current description: <original>
Skill body summary: <first 500 chars of Process section>

Rewrite the description to:
- Include 5-7 explicit trigger phrases ("Use when the user says: '...', '...'")
- Include explicit negative boundaries ("Do NOT use for: ...")
- Use concrete nouns and verbs from the skill body
- Stay between 200 and 600 characters

Return ONLY the rewritten description text. No preamble, no quotes, no markdown.

4. Show diff to user, ask for confirmation (unless --yes flag)
5. Write back to file

API key: read from ANTHROPIC_API_KEY env var. Error cleanly if missing.

## Tech choices

- Language: TypeScript, Node 20+
- CLI framework: commander (lightweight, no surprises)
- YAML parser: yaml (handles frontmatter cleanly)
- JSON schema: ajv for plugin.json validation
- Terminal colors: picocolors (zero deps, fast)
- Diff display: diff package
- Testing: vitest
- Anthropic SDK: @anthropic-ai/sdk
- Build: tsup (single command, ESM + CJS output)

No frameworks beyond these. Keep install footprint small.

## package.json essentials
{
 "name": "plugin-lint",
 "version": "0.1.0",
 "description": "Linter for Claude Cowork plugin folders",
 "bin": {
 "plugin-lint": "./dist/cli.js"
 },
 "type": "module",
 "scripts": {
 "build": "tsup src/cli.ts --format esm --dts --clean",
 "test": "vitest run",
 "test:watch": "vitest",
 "lint": "eslint src test",
 "prepublishOnly": "npm run build && npm test"
 },
 "engines": { "node": ">=20" },
 "license": "MIT",
 "repository": "github:danzus/plugin-lint",
 "keywords": ["claude", "cowork", "plugin", "linter", "skill", "anthropic"]
}

## README structure

1. Hero line: “Lint your Claude plugins before you ship them.”
2. The problem (vague descriptions silently fail to activate, or hijack everything)
3. 30-second install + run example
4. What it checks (table)
5. Sample output (terminal screenshot in markdown code block)
6. --fix mode walkthrough
7. CI integration snippet
8. Built by DANZUS Holdings, link to aiagentaudit.dev as the parent project

## Test fixtures to ship

Build these four fixture plugins under test/fixtures/:

1. good-plugin — well-formed, scores A across all skills, no collisions. Used as the positive baseline.
2. vague-descriptions — three skills, all with descriptions like “Use this skill for various tasks.” Should score F.
3. colliding-triggers — two skills both claiming to handle “data analysis” and “spreadsheet work.” Should flag collision.
4. broken-json — malformed plugin.json. Should fail at the structure phase before reaching skills.

Tests assert exit codes, JSON output shape, and that specific findings appear.

## CI workflow

.github/workflows/ci.yml: run on every PR.

- Install
- Build
- Run tests
- Run plugin-lint against its own fixtures and assert expected outcomes

## Ship sequence

v0.1 (this brief): CLI only. No web, no MCP. Goal is a working npx plugin-lint that catches the four failure modes above.

v0.2: Hosted web version at lint.danzus.co (or subdomain of choice). Drag-and-drop a folder, get a report. Same engine, different reporter.

v0.3: MCP server. Exposes lint_plugin and fix_plugin tools.Ship to Smithery alongside the existing OSHA/DOT/NCR/CAPA MCP servers. This is the closing move — Cowork users install plugin-lint *as a plugin* to audit their other plugins.

## Out of scope for v0.1

- Web UI
- MCP server
- Auto-publish to npm registry (do this manually after first review)
- Linting global-instructions.md or folder-instructions.md (warn-only check that file exists, no content scoring yet)
- Sub-agent or chained-skill validation

## Definition of done for v0.1

- npm install -g . then plugin-lint <fixture> works on all four fixtures and produces correct output
- All tests pass
- README renders cleanly on GitHub
- One real-world test: run against the user’s existing /mnt/skills/user/premium-ui-design and /mnt/skills/user/content-growth skills and capture the output in examples/real-world-run.md
- Repo pushed to github.com/danzus/plugin-lint, MIT licensed

## Notes for Claude Code

- Build incrementally: structure validators → description scorer → collision detector → reporters → fixer. Test each layer before moving on.
- The description scorer is where this tool earns its name. Spend disproportionate effort tuning the rubric against the four fixtures until grades feel correct.
- Keep the fixer prompt in src/fixer/rewriteDescription.ts as an exported constant. It will be tuned over time and should be easy to find.
- Do not pull in heavy dependencies. Every dep added is a future security review.
