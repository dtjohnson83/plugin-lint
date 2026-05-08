export type Severity = 'error' | 'warning' | 'info';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type Format = 'terminal' | 'json' | 'md';

export interface Finding {
  severity: Severity;
  code: string;
  message: string;
  file?: string;
  line?: number;
}

export interface DescriptionScore {
  total: number;
  grade: Grade;
  triggerPhraseScore: number;
  negativeBoundaryScore: number;
  specificityScore: number;
  lengthStructureScore: number;
  improvements: string[];
}

export interface SkillResult {
  skillName: string;
  skillPath: string;
  findings: Finding[];
  descriptionScore?: DescriptionScore;
}

export interface CollisionResult {
  skillA: string;
  skillB: string;
  overlap: number;
  phrases: string[];
}

export interface LintResult {
  pluginPath: string;
  pluginName?: string;
  findings: Finding[];
  skills: SkillResult[];
  collisions: CollisionResult[];
  exitCode: 0 | 1 | 2;
}

export interface LintOptions {
  format: Format;
  strict: boolean;
  fix: boolean;
  yes: boolean;
}
