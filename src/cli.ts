#!/usr/bin/env node
import { Command } from 'commander';
import { runLint } from './commands/lint.js';
import { runFix } from './commands/fix.js';
import { reportTerminal } from './reporters/terminal.js';
import { reportJson } from './reporters/json.js';
import { reportMarkdown } from './reporters/markdown.js';
import type { Format } from './types.js';

const program = new Command();

program
  .name('plugin-lint')
  .description('Lint your Claude Cowork plugin folders before you ship them.')
  .version('0.1.0')
  .argument('[path]', 'path to the plugin folder to lint', '.')
  .option('--fix', 'rewrite weak descriptions using Anthropic API', false)
  .option('--yes', 'auto-approve all rewrites (use with --fix)', false)
  .option('--format <format>', 'output format: terminal | json | md', 'terminal')
  .option('--strict', 'treat warnings as errors (exit code 2)', false)
  .action(async (pluginPath: string, options: { fix: boolean; yes: boolean; format: string; strict: boolean }) => {
    const format = options.format as Format;
    if (!['terminal', 'json', 'md'].includes(format)) {
      console.error(`Invalid --format value: "${format}". Must be terminal, json, or md.`);
      process.exit(3);
    }

    const result = runLint(pluginPath, options.strict);

    if (format === 'json') {
      reportJson(result);
    } else if (format === 'md') {
      reportMarkdown(result);
    } else {
      reportTerminal(result);
    }

    if (options.fix) {
      await runFix(result.skills, options.yes);
    }

    process.exit(result.exitCode);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error((err as Error).message);
  process.exit(3);
});
