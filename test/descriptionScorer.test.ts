import { describe, it, expect } from 'vitest';
import { scoreDescription } from '../src/validators/descriptionScorer.js';

const GOOD_DESCRIPTION = `Use when the user says: 'summarize this PDF', 'give me the key points from this document',
'what does this paper say', 'extract the main findings', 'TL;DR this file'.
Use when the user uploads a PDF and wants a structured summary with headings and bullet points.
Do NOT use for: editing PDFs, converting file formats, searching within large document collections,
or tasks unrelated to PDF content extraction and summarization.`;

const VAGUE_DESCRIPTION = 'Use this skill for various tasks.';

const MEDIUM_DESCRIPTION = `Use when the user needs to analyze data or build reports.
Handles various data processing tasks. Not for real-time streaming data.`;

describe('scoreDescription', () => {
  it('grades good description as A or B', () => {
    const result = scoreDescription(GOOD_DESCRIPTION);
    expect(result.total).toBeGreaterThanOrEqual(75);
    expect(['A', 'B']).toContain(result.grade);
  });

  it('grades vague description as F', () => {
    const result = scoreDescription(VAGUE_DESCRIPTION);
    expect(result.grade).toBe('F');
    expect(result.total).toBeLessThan(40);
  });

  it('returns improvement suggestions for vague description', () => {
    const result = scoreDescription(VAGUE_DESCRIPTION);
    expect(result.improvements.length).toBeGreaterThan(0);
  });

  it('gives 0 trigger phrase score when no triggers present', () => {
    const result = scoreDescription('A general purpose tool for data tasks.');
    expect(result.triggerPhraseScore).toBe(0);
  });

  it('gives 0 negative boundary score when no negatives present', () => {
    const result = scoreDescription('Use when the user asks for a PDF summary of a document.');
    expect(result.negativeBoundaryScore).toBe(0);
  });

  it('gives full trigger phrase score for 5+ phrases', () => {
    const result = scoreDescription(GOOD_DESCRIPTION);
    expect(result.triggerPhraseScore).toBe(30);
  });

  it('counts concrete use-when activation lists as trigger phrases', () => {
    const result = scoreDescription(
      'Create viral content and growth assets for mobile app marketing. Use when building social media posts, video scripts, landing pages, lead magnets, influencer outreach, Reddit/TikTok content, email sequences, or ASO materials. Specialized for B2C apps targeting niche communities.',
    );
    expect(result.triggerPhraseScore).toBe(30);
    expect(result.grade).toBe('B');
  });

  it('gives full negative boundary score for explicit DO NOT clause', () => {
    const result = scoreDescription(GOOD_DESCRIPTION);
    expect(result.negativeBoundaryScore).toBe(25);
  });

  it('penalizes descriptions under 40 chars', () => {
    const result = scoreDescription('Use this.');
    expect(result.lengthStructureScore).toBe(0);
  });

  it('penalizes descriptions over 800 chars', () => {
    const long = 'a'.repeat(801);
    const result = scoreDescription(long);
    expect(result.lengthStructureScore).toBeLessThanOrEqual(10);
  });
});
