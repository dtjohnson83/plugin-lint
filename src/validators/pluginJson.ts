import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import type { Finding } from '../types.js';

const ajv = new Ajv();

const PLUGIN_SCHEMA = {
  type: 'object',
  required: ['name', 'description', 'version'],
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    version: { type: 'string' },
  },
  additionalProperties: true,
};

const validate = ajv.compile(PLUGIN_SCHEMA);

const SEMVER_RE = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validatePluginJson(pluginPath: string): {
  findings: Finding[];
  pluginName?: string;
} {
  const findings: Finding[] = [];
  const jsonPath = join(pluginPath, '.claude-plugin', 'plugin.json');

  if (!existsSync(jsonPath)) {
    findings.push({
      severity: 'error',
      code: 'PLUGIN_JSON_MISSING',
      message: 'Missing .claude-plugin/plugin.json',
      file: jsonPath,
    });
    return { findings };
  }

  let raw: string;
  try {
    raw = readFileSync(jsonPath, 'utf8');
  } catch (e) {
    findings.push({
      severity: 'error',
      code: 'PLUGIN_JSON_UNREADABLE',
      message: `Cannot read .claude-plugin/plugin.json: ${(e as Error).message}`,
      file: jsonPath,
    });
    return { findings };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    findings.push({
      severity: 'error',
      code: 'PLUGIN_JSON_INVALID_JSON',
      message: `Invalid JSON in .claude-plugin/plugin.json: ${(e as Error).message}`,
      file: jsonPath,
    });
    return { findings };
  }

  const valid = validate(parsed);
  if (!valid) {
    for (const err of validate.errors ?? []) {
      findings.push({
        severity: 'error',
        code: 'PLUGIN_JSON_SCHEMA',
        message: `plugin.json schema error: ${err.instancePath} ${err.message}`,
        file: jsonPath,
      });
    }
    return { findings };
  }

  const plugin = parsed as Record<string, string>;

  if (!KEBAB_RE.test(plugin.name)) {
    findings.push({
      severity: 'error',
      code: 'PLUGIN_NAME_NOT_KEBAB',
      message: `plugin.json "name" must be kebab-case with no spaces, got: "${plugin.name}"`,
      file: jsonPath,
    });
  }

  if (!SEMVER_RE.test(plugin.version)) {
    findings.push({
      severity: 'error',
      code: 'PLUGIN_VERSION_NOT_SEMVER',
      message: `plugin.json "version" must match semver, got: "${plugin.version}"`,
      file: jsonPath,
    });
  }

  return { findings, pluginName: plugin.name };
}
