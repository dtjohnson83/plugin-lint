import { readdirSync, existsSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { validatePluginJson } from '../validators/pluginJson.js';
import { parseSkillMd } from '../validators/skillFrontmatter.js';
import { scoreDescription } from '../validators/descriptionScorer.js';
import { detectCollisions } from '../validators/triggerCollision.js';
import { validateCommandFiles } from '../validators/commandFiles.js';
import type { LintResult, SkillResult, Finding } from '../types.js';

function getSkillDirs(pluginPath: string): string[] {
  const skillsDir = join(pluginPath, 'skills');
  if (!existsSync(skillsDir)) return [];
  try {
    return readdirSync(skillsDir)
      .filter((name) => statSync(join(skillsDir, name)).isDirectory())
      .map((name) => join(skillsDir, name));
  } catch {
    return [];
  }
}

export function runLint(pluginPath: string, strict: boolean): LintResult {
  const absPath = resolve(pluginPath);
  const findings: Finding[] = [];

  // 1. Validate plugin.json
  const { findings: jsonFindings, pluginName } = validatePluginJson(absPath);
  findings.push(...jsonFindings);

  // If plugin.json is broken/missing, skip the rest
  const hasFatalStructureError = jsonFindings.some((f) => f.severity === 'error');

  // 2. Validate command files
  const commandFindings = validateCommandFiles(absPath);
  findings.push(...commandFindings);

  // 3. Process skills
  const skillDirs = getSkillDirs(absPath);
  const skills: SkillResult[] = [];

  if (!hasFatalStructureError) {
    for (const skillDir of skillDirs) {
      const skillName = skillDir.split('/').pop() ?? skillDir;
      const { frontmatter, body, findings: skillFindings } = parseSkillMd(skillDir);

      let descriptionScore = undefined;
      if (frontmatter.description) {
        descriptionScore = scoreDescription(frontmatter.description as string);

        // Emit a finding if score is low
        if (descriptionScore.total < 40) {
          skillFindings.push({
            severity: 'error',
            code: 'SKILL_DESCRIPTION_LOW_SCORE',
            message: `Description scored ${descriptionScore.total}/100 (grade ${descriptionScore.grade}) — run --fix to rewrite`,
            file: `${skillDir}/SKILL.md`,
          });
        } else if (descriptionScore.total < 70) {
          skillFindings.push({
            severity: 'warning',
            code: 'SKILL_DESCRIPTION_WEAK',
            message: `Description scored ${descriptionScore.total}/100 (grade ${descriptionScore.grade}) — consider improving`,
            file: `${skillDir}/SKILL.md`,
          });
        }
      }

      skills.push({
        skillName,
        skillPath: skillDir,
        findings: skillFindings,
        descriptionScore,
      });
    }
  }

  // 4. Collision detection
  const skillsWithDescriptions = skills
    .filter((s) => {
      // Check if frontmatter was parsed successfully
      return s.descriptionScore !== undefined;
    })
    .map((s) => {
      // Re-read skill frontmatter for description text — we need the raw string
      const { frontmatter } = parseSkillMd(s.skillPath);
      return {
        name: s.skillName,
        description: (frontmatter.description as string) ?? '',
      };
    });

  const collisions = detectCollisions(skillsWithDescriptions);

  // 5. Compute exit code
  const allFindings = [...findings, ...skills.flatMap((s) => s.findings)];
  const hasErrors = allFindings.some((f) => f.severity === 'error');
  const hasWarnings =
    allFindings.some((f) => f.severity === 'warning') || collisions.length > 0;

  let exitCode: 0 | 1 | 2 = 0;
  if (hasErrors) {
    exitCode = 2;
  } else if (hasWarnings) {
    exitCode = strict ? 2 : 1;
  }

  return {
    pluginPath: absPath,
    pluginName,
    findings,
    skills,
    collisions,
    exitCode,
  };
}
