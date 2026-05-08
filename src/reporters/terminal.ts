import pc from 'picocolors';
import type { LintResult, SkillResult, CollisionResult, DescriptionScore, Finding } from '../types.js';

function severityIcon(severity: Finding['severity']): string {
  switch (severity) {
    case 'error':   return pc.red('✖');
    case 'warning': return pc.yellow('⚠');
    case 'info':    return pc.cyan('ℹ');
  }
}

function severityLabel(severity: Finding['severity']): string {
  switch (severity) {
    case 'error':   return pc.red('error');
    case 'warning': return pc.yellow('warn ');
    case 'info':    return pc.cyan('info ');
  }
}

function gradeColor(grade: DescriptionScore['grade']): string {
  switch (grade) {
    case 'A': return pc.green('A');
    case 'B': return pc.cyan('B');
    case 'C': return pc.yellow('C');
    case 'D': return pc.magenta('D');
    case 'F': return pc.red('F');
  }
}

function printFinding(f: Finding): void {
  const loc = f.file ? pc.dim(` ${f.file}`) : '';
  const line = f.line ? pc.dim(`:${f.line}`) : '';
  console.log(`  ${severityIcon(f.severity)} ${severityLabel(f.severity)}  ${f.message}${loc}${line}`);
}

function printScore(score: DescriptionScore): void {
  const bar = buildBar(score.total);
  console.log(`    Score: ${bar} ${pc.bold(String(score.total))}/100  Grade: ${gradeColor(score.grade)}`);
  console.log(
    `    Breakdown: triggers=${pc.cyan(String(score.triggerPhraseScore))}/30  ` +
    `negatives=${pc.cyan(String(score.negativeBoundaryScore))}/25  ` +
    `specificity=${pc.cyan(String(score.specificityScore))}/25  ` +
    `length=${pc.cyan(String(score.lengthStructureScore))}/20`,
  );
  if (score.improvements.length > 0) {
    console.log(`    ${pc.dim('Improvements:')}`);
    for (const imp of score.improvements) {
      console.log(`      ${pc.dim('→')} ${imp}`);
    }
  }
}

function buildBar(score: number): string {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  if (score >= 75) return pc.green(bar);
  if (score >= 50) return pc.yellow(bar);
  return pc.red(bar);
}

function printSkill(skill: SkillResult): void {
  const hasIssues = skill.findings.length > 0;
  const status = hasIssues ? pc.red('✖') : pc.green('✔');
  console.log(`\n  ${status} ${pc.bold('skill:')} ${pc.cyan(skill.skillName)}`);

  if (skill.descriptionScore) {
    printScore(skill.descriptionScore);
  }

  for (const f of skill.findings) {
    printFinding(f);
  }
}

function printCollision(c: CollisionResult): void {
  console.log(
    `  ${pc.yellow('⚠')} ${pc.yellow('collision')}  ${pc.cyan(c.skillA)} ↔ ${pc.cyan(c.skillB)}  ` +
    `overlap=${pc.bold(String(Math.round(c.overlap * 100)) + '%')}`,
  );
  for (const phrase of c.phrases.slice(0, 3)) {
    console.log(`    ${pc.dim('→')} ${phrase}`);
  }
}

export function reportTerminal(result: LintResult): void {
  const { pluginPath, pluginName, findings, skills, collisions, exitCode } = result;

  console.log(`\n${pc.bold('plugin-lint')} ${pc.dim('v0.1.0')}`);
  console.log(`${pc.dim('Path:')} ${pluginPath}${pluginName ? `  ${pc.dim('(')}${pc.cyan(pluginName)}${pc.dim(')')}` : ''}\n`);

  // Plugin-level findings
  if (findings.length > 0) {
    console.log(pc.bold('Plugin structure'));
    for (const f of findings) {
      printFinding(f);
    }
  }

  // Skills
  if (skills.length > 0) {
    console.log(pc.bold('\nSkills'));
    for (const skill of skills) {
      printSkill(skill);
    }
  }

  // Collisions
  if (collisions.length > 0) {
    console.log(pc.bold('\nTrigger collisions'));
    for (const c of collisions) {
      printCollision(c);
    }
  }

  // Summary
  const errorCount = [
    ...findings,
    ...skills.flatMap((s) => s.findings),
  ].filter((f) => f.severity === 'error').length;

  const warnCount = [
    ...findings,
    ...skills.flatMap((s) => s.findings),
  ].filter((f) => f.severity === 'warning').length + collisions.length;

  console.log('\n' + '─'.repeat(50));

  const grades = skills
    .filter((s) => s.descriptionScore)
    .map((s) => `${s.skillName}:${gradeColor(s.descriptionScore!.grade)}`);
  if (grades.length > 0) {
    console.log(`Description grades: ${grades.join('  ')}`);
  }

  if (exitCode === 0) {
    console.log(pc.green(`\n✔ All checks passed`));
  } else {
    const parts: string[] = [];
    if (errorCount > 0) parts.push(pc.red(`${errorCount} error${errorCount !== 1 ? 's' : ''}`));
    if (warnCount > 0) parts.push(pc.yellow(`${warnCount} warning${warnCount !== 1 ? 's' : ''}`));
    console.log(`\n${pc.red('✖')} ${parts.join(', ')}`);
  }
  console.log('');
}
