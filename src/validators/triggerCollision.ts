import type { CollisionResult } from '../types.js';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
  'use', 'used', 'when', 'this', 'that', 'it', 'its', 'my', 'your',
  'their', 'our', 'not', 'no', 'nor', 'only', 'just', 'also', 'more',
  'any', 'all', 'each', 'every', 'both', 'few', 'new', 'same', 'than',
  'then', 'into', 'if', 'so', 'up', 'out', 'about', 'such',
]);

const TRIGGER_SENTENCE_RE =
  /[^.!?]*(?:use when|use this when|user says?|trigger(?:ed)? when|when the user)[^.!?]*[.!?]?/gi;

function extractTriggerPhrases(description: string): string[] {
  const phrases: string[] = [];

  // Extract sentences containing trigger keywords
  const sentences = description.match(TRIGGER_SENTENCE_RE) ?? [];
  phrases.push(...sentences.map((s) => s.trim().toLowerCase()));

  // Extract quoted strings
  const quoted = description.match(/['"][^'"]{5,}['"]/g) ?? [];
  phrases.push(...quoted.map((s) => s.replace(/['"]/g, '').trim().toLowerCase()));

  // Extract bullet list items
  const bullets = description.match(/^[\s]*[-*•]\s+.+$/gm) ?? [];
  phrases.push(...bullets.map((s) => s.replace(/^[\s]*[-*•]\s+/, '').trim().toLowerCase()));

  return phrases.filter((p) => p.length > 0);
}

function getContentWords(text: string): string[] {
  return (text.toLowerCase().match(/\b[a-z]\w+\b/g) ?? []).filter(
    (w) => !STOP_WORDS.has(w) && w.length > 2,
  );
}

function getNgrams(text: string, n: number): Set<string> {
  const words = getContentWords(text);
  const ngrams = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

function jaccardOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function descriptionOverlap(descA: string, descB: string): number {
  let maxOverlap = 0;
  for (const n of [2, 3]) {
    const ngramsA = getNgrams(descA, n);
    const ngramsB = getNgrams(descB, n);
    const j = jaccardOverlap(ngramsA, ngramsB);
    maxOverlap = Math.max(maxOverlap, j);
  }
  return maxOverlap;
}

function findOverlappingPhrases(descA: string, descB: string): string[] {
  const phrasesA = extractTriggerPhrases(descA);
  const phrasesB = extractTriggerPhrases(descB);
  const overlapping: string[] = [];

  for (const pa of phrasesA) {
    for (const pb of phrasesB) {
      const overlap = descriptionOverlap(pa, pb);
      if (overlap > 0.3) {
        overlapping.push(`"${pa.slice(0, 60)}" ↔ "${pb.slice(0, 60)}"`);
      }
    }
  }

  // Also check full-text bigram overlap phrases
  const bigrams2A = getNgrams(descA, 2);
  const bigrams2B = getNgrams(descB, 2);
  const sharedBigrams: string[] = [];
  for (const bg of bigrams2A) {
    if (bigrams2B.has(bg)) sharedBigrams.push(bg);
  }
  if (sharedBigrams.length > 0 && overlapping.length === 0) {
    overlapping.push(`shared phrases: ${sharedBigrams.slice(0, 5).join(', ')}`);
  }

  return overlapping;
}

export interface SkillDescription {
  name: string;
  description: string;
}

export function detectCollisions(skills: SkillDescription[]): CollisionResult[] {
  const collisions: CollisionResult[] = [];

  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const skillA = skills[i];
      const skillB = skills[j];
      const overlap = descriptionOverlap(skillA.description, skillB.description);

      if (overlap > 0.10) {
        const phrases = findOverlappingPhrases(skillA.description, skillB.description);
        collisions.push({
          skillA: skillA.name,
          skillB: skillB.name,
          overlap: Math.round(overlap * 100) / 100,
          phrases,
        });
      }
    }
  }

  return collisions;
}
