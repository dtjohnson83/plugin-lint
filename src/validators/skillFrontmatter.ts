import { readFileSync, existsSync } from 'fs';
import { basename } from 'path';
import { parse as parseYaml } from 'yaml';
import type { Finding } from '../types.js';

export interface SkillFrontmatter {
  name?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
  findings: Finding[];
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

export function parseSkillMd(skillPath: string): ParsedSkill {
  const findings: Finding[] = [];
  const skillName = basename(skillPath);
  const file = `${skillPath}/SKILL.md`;

  if (!existsSync(file)) {
    findings.push({
      severity: 'error',
      code: 'SKILL_MD_MISSING',
      message: `Missing SKILL.md in skills/${skillName}/`,
      file,
    });
    return { frontmatter: {}, body: '', findings };
  }

  let raw: string;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (e) {
    findings.push({
      severity: 'error',
      code: 'SKILL_MD_UNREADABLE',
      message: `Cannot read SKILL.md: ${(e as Error).message}`,
      file,
    });
    return { frontmatter: {}, body: '', findings };
  }

  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    findings.push({
      severity: 'error',
      code: 'SKILL_NO_FRONTMATTER',
      message: 'SKILL.md has no valid YAML frontmatter (expected --- delimiters)',
      file,
    });
    return { frontmatter: {}, body: raw, findings };
  }

  const [, yamlBlock, body] = match;

  let frontmatter: SkillFrontmatter;
  try {
    frontmatter = parseYaml(yamlBlock) as SkillFrontmatter;
  } catch (e) {
    findings.push({
      severity: 'error',
      code: 'SKILL_FRONTMATTER_INVALID_YAML',
      message: `SKILL.md frontmatter YAML parse error: ${(e as Error).message}`,
      file,
    });
    return { frontmatter: {}, body, findings };
  }

  if (!frontmatter || typeof frontmatter !== 'object') {
    frontmatter = {};
  }

  if (!frontmatter.name) {
    findings.push({
      severity: 'error',
      code: 'SKILL_MISSING_NAME',
      message: 'SKILL.md frontmatter missing required field: name',
      file,
    });
  } else if (frontmatter.name !== skillName) {
    findings.push({
      severity: 'error',
      code: 'SKILL_NAME_MISMATCH',
      message: `SKILL.md "name" field "${frontmatter.name}" does not match folder name "${skillName}"`,
      file,
    });
  }

  if (!frontmatter.description) {
    findings.push({
      severity: 'error',
      code: 'SKILL_MISSING_DESCRIPTION',
      message: 'SKILL.md frontmatter missing required field: description',
      file,
    });
  }

  if (!body.includes('# Overview')) {
    findings.push({
      severity: 'warning',
      code: 'SKILL_NO_OVERVIEW',
      message: 'SKILL.md body is missing a "# Overview" section',
      file,
    });
  }

  if (!body.includes('## Process')) {
    findings.push({
      severity: 'warning',
      code: 'SKILL_NO_PROCESS',
      message: 'SKILL.md body is missing a "## Process" section',
      file,
    });
  }

  return { frontmatter, body, findings };
}
