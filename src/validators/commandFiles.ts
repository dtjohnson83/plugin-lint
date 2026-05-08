import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import type { Finding } from '../types.js';

const HEADING_RE = /^#\s+\/[\w-]+:[\w-]+/;
const LIST_ITEM_RE = /^(\s*[-*•]|\s*\d+\.)\s+/m;

export function validateCommandFiles(pluginPath: string): Finding[] {
  const findings: Finding[] = [];
  const commandsDir = join(pluginPath, 'commands');

  if (!existsSync(commandsDir)) {
    // Not having a commands/ dir is fine — it's optional
    return findings;
  }

  let files: string[];
  try {
    files = readdirSync(commandsDir);
  } catch (e) {
    findings.push({
      severity: 'error',
      code: 'COMMANDS_DIR_UNREADABLE',
      message: `Cannot read commands/ directory: ${(e as Error).message}`,
      file: commandsDir,
    });
    return findings;
  }

  for (const filename of files) {
    const filePath = join(commandsDir, filename);
    const ext = extname(filename).toLowerCase();

    if (ext !== '.md') {
      findings.push({
        severity: 'error',
        code: 'COMMAND_NOT_MARKDOWN',
        message: `commands/${filename}: command files must be .md files`,
        file: filePath,
      });
      continue;
    }

    let content: string;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch (e) {
      findings.push({
        severity: 'error',
        code: 'COMMAND_UNREADABLE',
        message: `commands/${filename}: cannot read file: ${(e as Error).message}`,
        file: filePath,
      });
      continue;
    }

    const firstLine = content.split('\n')[0].trim();
    if (!HEADING_RE.test(firstLine)) {
      findings.push({
        severity: 'error',
        code: 'COMMAND_HEADING_INVALID',
        message: `commands/${filename}: first line must be a heading matching "# /<prefix>:<command>", got: "${firstLine}"`,
        file: filePath,
      });
    }

    if (!LIST_ITEM_RE.test(content)) {
      findings.push({
        severity: 'warning',
        code: 'COMMAND_NO_STEPS',
        message: `commands/${filename}: body should contain at least one numbered or bulleted step list`,
        file: filePath,
      });
    }
  }

  return findings;
}
