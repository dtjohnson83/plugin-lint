import { describe, it, expect } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { validatePluginJson } from '../src/validators/pluginJson.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = join(__dirname, 'fixtures');

describe('validatePluginJson', () => {
  it('passes for good-plugin', () => {
    const { findings } = validatePluginJson(join(fixtures, 'good-plugin'));
    expect(findings.filter((f) => f.severity === 'error')).toHaveLength(0);
  });

  it('fails for broken-json with PLUGIN_JSON_INVALID_JSON', () => {
    const { findings } = validatePluginJson(join(fixtures, 'broken-json'));
    const codes = findings.map((f) => f.code);
    expect(codes).toContain('PLUGIN_JSON_INVALID_JSON');
  });

  it('reports error for missing plugin.json', () => {
    const { findings } = validatePluginJson('/tmp/nonexistent-plugin-abc123');
    expect(findings[0].code).toBe('PLUGIN_JSON_MISSING');
  });

  it('returns pluginName for valid plugin', () => {
    const { pluginName } = validatePluginJson(join(fixtures, 'good-plugin'));
    expect(pluginName).toBe('good-plugin');
  });
});
