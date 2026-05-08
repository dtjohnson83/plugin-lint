import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';
import { createPatch } from 'diff';
import pc from 'picocolors';
import { parseSkillMd } from '../validators/skillFrontmatter.js';
import { scoreDescription } from '../validators/descriptionScorer.js';
import { rewriteDescription } from '../fixer/rewriteDescription.js';
import type { SkillResult } from '../types.js';

function extractProcessSection(body: string): string {
  const match = body.match(/## Process\s+([\s\S]*?)(?=\n##|\n#|$)/);
  if (match) return match[1].trim().slice(0, 500);
  return body.slice(0, 500);
}

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

export async function runFix(
  skills: SkillResult[],
  yes: boolean,
): Promise<void> {
  const weakSkills = skills.filter(
    (s) => s.descriptionScore && s.descriptionScore.total < 70,
  );

  if (weakSkills.length === 0) {
    console.log(pc.green('No descriptions below the threshold (70). Nothing to fix.'));
    return;
  }

  console.log(
    pc.bold(`\nFixing ${weakSkills.length} weak description${weakSkills.length !== 1 ? 's' : ''}...\n`),
  );

  for (const skill of weakSkills) {
    const skillMdPath = join(skill.skillPath, 'SKILL.md');
    const { frontmatter, body } = parseSkillMd(skill.skillPath);
    const original = (frontmatter.description as string) ?? '';
    const score = skill.descriptionScore!;

    console.log(
      pc.bold(`Skill: ${skill.skillName}`) +
        pc.dim(`  (score: ${score.total}/100, grade: ${score.grade})`),
    );

    let rewritten: string;
    try {
      process.stdout.write(pc.dim('  Calling Anthropic API...'));
      rewritten = await rewriteDescription(original, extractProcessSection(body));
      process.stdout.write(' done\n');
    } catch (e) {
      console.error(pc.red(`  Error: ${(e as Error).message}`));
      continue;
    }

    // Show diff
    const patch = createPatch(skillMdPath, original, rewritten, 'original', 'rewritten');
    console.log('\n' + pc.dim(patch));

    if (!yes) {
      const ok = await confirm(pc.cyan('  Apply this rewrite? [y/N] '));
      if (!ok) {
        console.log(pc.dim('  Skipped.\n'));
        continue;
      }
    }

    // Write back — replace frontmatter description field
    const raw = readFileSync(skillMdPath, 'utf8');
    const updated = raw.replace(
      /^(description:\s*)(.+?)(\s*\n)/m,
      (_, prefix, _old, suffix) => `${prefix}${rewritten}${suffix}`,
    );

    if (updated === raw) {
      // Multi-line or quoted description — more careful replacement
      console.warn(
        pc.yellow('  Warning: could not find single-line description field. File not modified.'),
      );
      continue;
    }

    writeFileSync(skillMdPath, updated, 'utf8');
    console.log(pc.green(`  ✔ Updated ${skillMdPath}\n`));
  }
}
