import type { LintResult } from '../types.js';

export function reportJson(result: LintResult): void {
  console.log(JSON.stringify(result, null, 2));
}
