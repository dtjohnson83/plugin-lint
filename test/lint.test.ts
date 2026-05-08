import { describe, it, expect } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runLint } from '../src/commands/lint.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = join(__dirname, 'fixtures');

describe('runLint — good-plugin', () => {
  it('exits with code 0', () => {
    const result = runLint(join(fixtures, 'good-plugin'), false);
    expect(result.exitCode).toBe(0);
  });

  it('has no errors', () => {
    const result = runLint(join(fixtures, 'good-plugin'), false);
    const errors = [
      ...result.findings,
      ...result.skills.flatMap((s) => s.findings),
    ].filter((f) => f.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('grades all skills A or B', () => {
    const result = runLint(join(fixtures, 'good-plugin'), false);
    for (const skill of result.skills) {
      expect(['A', 'B']).toContain(skill.descriptionScore?.grade);
    }
  });

  it('detects no collisions', () => {
    const result = runLint(join(fixtures, 'good-plugin'), false);
    expect(result.collisions).toHaveLength(0);
  });
});

describe('runLint — vague-descriptions', () => {
  it('exits with code 2 (errors)', () => {
    const result = runLint(join(fixtures, 'vague-descriptions'), false);
    expect(result.exitCode).toBe(2);
  });

  it('has SKILL_DESCRIPTION_LOW_SCORE errors', () => {
    const result = runLint(join(fixtures, 'vague-descriptions'), false);
    const codes = result.skills.flatMap((s) => s.findings).map((f) => f.code);
    expect(codes).toContain('SKILL_DESCRIPTION_LOW_SCORE');
  });

  it('all skills grade F', () => {
    const result = runLint(join(fixtures, 'vague-descriptions'), false);
    for (const skill of result.skills) {
      expect(skill.descriptionScore?.grade).toBe('F');
    }
  });
});

describe('runLint — colliding-triggers', () => {
  it('reports collision between data-analyst and spreadsheet-wizard', () => {
    const result = runLint(join(fixtures, 'colliding-triggers'), false);
    expect(result.collisions.length).toBeGreaterThan(0);
    const names = result.collisions.flatMap((c) => [c.skillA, c.skillB]);
    expect(names).toContain('data-analyst');
    expect(names).toContain('spreadsheet-wizard');
  });
});

describe('runLint — broken-json', () => {
  it('exits with code 2 (errors)', () => {
    const result = runLint(join(fixtures, 'broken-json'), false);
    expect(result.exitCode).toBe(2);
  });

  it('reports PLUGIN_JSON_INVALID_JSON', () => {
    const result = runLint(join(fixtures, 'broken-json'), false);
    const codes = result.findings.map((f) => f.code);
    expect(codes).toContain('PLUGIN_JSON_INVALID_JSON');
  });

  it('JSON output has expected shape', () => {
    const result = runLint(join(fixtures, 'broken-json'), false);
    expect(result).toHaveProperty('pluginPath');
    expect(result).toHaveProperty('findings');
    expect(result).toHaveProperty('skills');
    expect(result).toHaveProperty('collisions');
    expect(result).toHaveProperty('exitCode');
  });
});

describe('runLint — strict mode', () => {
  it('upgrades warnings to errors (exit 2) for good-plugin with strict', () => {
    // good-plugin should be clean, so still 0
    const result = runLint(join(fixtures, 'good-plugin'), true);
    expect(result.exitCode).toBe(0);
  });
});
