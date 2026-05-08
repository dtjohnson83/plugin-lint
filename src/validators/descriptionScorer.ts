import type { DescriptionScore, Grade } from '../types.js';

const GENERIC_WORDS = [
  'tasks',
  'things',
  'various',
  'general',
  'stuff',
  'items',
  'anything',
  'everything',
  'something',
  'work',
  'help',
  'do',
  'use',
  'assist',
  'support',
  'handle',
  'manage',
  'process',
  'perform',
];

const TRIGGER_PATTERNS = [
  /use when (the )?user (says?|asks?|requests?|needs?|wants?)/gi,
  /use this (skill |tool )?when/gi,
  /trigger(ed)? when/gi,
  /user says?[:\s]+['"]/gi,
  /TRIGGER when:/i,
  /When the user (asks?|says?|requests?|needs?|wants?)/gi,
];

const NEGATIVE_PATTERNS = [
  /do not use (for|when|if)/gi,
  /don't use (for|when|if)/gi,
  /not (for|intended for|designed for)/gi,
  /never use (for|when)/gi,
  /do not/gi,
  /not for:/gi,
  /avoid (using )?when/gi,
];

function countTriggerPhrases(description: string): number {
  let count = 0;

  // Count explicit pattern matches
  for (const pattern of TRIGGER_PATTERNS) {
    const matches = description.match(pattern);
    if (matches) count += matches.length;
  }

  // Count quoted phrases in trigger lists like: "...", "...", "..."
  // Each quoted phrase under a trigger sentence counts as one trigger phrase
  const quotedPhrases = description.match(/['"][^'"]{5,}['"]/g);
  if (quotedPhrases && count > 0) {
    count = Math.max(count, quotedPhrases.length);
  }

  // Count list items that look like trigger phrases
  const listItems = description.match(/^[\s]*[-*•]\s+.+$/gm);
  if (listItems) {
    count = Math.max(count, Math.floor(listItems.length / 2));
  }

  return count;
}

function scoreTriggerPhrases(description: string): { score: number; improvement?: string } {
  const count = countTriggerPhrases(description);
  // 0 phrases = 0 pts, 5+ phrases = 30 pts
  if (count === 0) {
    return {
      score: 0,
      improvement:
        'Add 5–7 explicit trigger phrases, e.g. "Use when the user says: \'…\', \'…\'"',
    };
  }
  if (count >= 5) return { score: 30 };
  // Linear interpolation: 1→6, 2→12, 3→18, 4→24
  const score = Math.round((count / 5) * 30);
  return {
    score,
    improvement: `Only ${count} trigger phrase(s) found — aim for 5 or more`,
  };
}

function scoreNegativeBoundaries(description: string): { score: number; improvement?: string } {
  let matches = 0;
  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(description)) matches++;
    pattern.lastIndex = 0;
  }

  if (matches === 0) {
    return {
      score: 0,
      improvement:
        'Add explicit negative boundaries, e.g. "Do NOT use for: …" to prevent activation on unrelated topics',
    };
  }
  if (matches >= 2) return { score: 25 };
  // Partial credit for one weak negative boundary
  return {
    score: 15,
    improvement: 'Negative boundary found but vague — add a specific "Do NOT use for: …" clause',
  };
}

function scoreSpecificity(description: string): { score: number; improvement?: string } {
  const words = description.toLowerCase().match(/\b\w+\b/g) ?? [];
  if (words.length === 0) return { score: 0, improvement: 'Description is empty' };

  const genericCount = words.filter((w) => GENERIC_WORDS.includes(w)).length;
  const genericRatio = genericCount / words.length;

  if (genericRatio > 0.1) {
    const found = words.filter((w) => GENERIC_WORDS.includes(w));
    const unique = [...new Set(found)];
    return {
      score: Math.max(0, Math.round(25 * (1 - genericRatio * 4))),
      improvement: `Replace generic words (${unique.slice(0, 3).join(', ')}) with concrete nouns and verbs from the skill body`,
    };
  }

  if (genericRatio > 0.05) {
    return { score: 18, improvement: 'Reduce generic vocabulary for better specificity' };
  }

  return { score: 25 };
}

function scoreLengthStructure(description: string): { score: number; improvement?: string } {
  const len = description.trim().length;

  if (len < 40) {
    return {
      score: 0,
      improvement: `Description is too short (${len} chars) — minimum 40 chars needed to disambiguate activation`,
    };
  }

  if (len > 800) {
    return {
      score: 10,
      improvement: `Description is too long (${len} chars) — keep under 800 chars for reliable model indexing`,
    };
  }

  if (len >= 200 && len <= 600) return { score: 20 };
  if (len >= 100) return { score: 15 };
  return { score: 10 };
}

function gradeFromScore(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function scoreDescription(description: string): DescriptionScore {
  const trigger = scoreTriggerPhrases(description);
  const negative = scoreNegativeBoundaries(description);
  const specificity = scoreSpecificity(description);
  const length = scoreLengthStructure(description);

  const total = trigger.score + negative.score + specificity.score + length.score;
  const grade = gradeFromScore(total);

  const improvements: string[] = [];
  if (trigger.improvement) improvements.push(trigger.improvement);
  if (negative.improvement) improvements.push(negative.improvement);
  if (specificity.improvement) improvements.push(specificity.improvement);
  if (length.improvement) improvements.push(length.improvement);

  return {
    total,
    grade,
    triggerPhraseScore: trigger.score,
    negativeBoundaryScore: negative.score,
    specificityScore: specificity.score,
    lengthStructureScore: length.score,
    improvements,
  };
}
