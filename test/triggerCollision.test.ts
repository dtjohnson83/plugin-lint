import { describe, it, expect } from 'vitest';
import { detectCollisions } from '../src/validators/triggerCollision.js';

const DATA_ANALYST_DESC = `Use when the user says: 'analyze this data', 'do data analysis on this spreadsheet',
'help me with spreadsheet work', 'analyze my spreadsheet data', 'run data analysis'.
Use when the user needs statistical analysis, data exploration, or spreadsheet data processing.
Do NOT use for: data visualization only, creating new spreadsheets from scratch, or writing reports.`;

const SPREADSHEET_DESC = `Use when the user says: 'help with my spreadsheet', 'spreadsheet work needed', 'data analysis on Excel',
'analyze spreadsheet data', 'work on this spreadsheet'.
Use when the user needs help with spreadsheet formulas, data analysis, or organizing data in Excel or Google Sheets.
Do NOT use for: database queries, coding in Python/R for analysis, or non-spreadsheet data analysis.`;

const PDF_DESC = `Use when the user says: 'summarize this PDF', 'give me the key points from this document'.
Do NOT use for: editing PDFs or converting file formats.`;

describe('detectCollisions', () => {
  it('detects collision between data-analyst and spreadsheet-wizard', () => {
    const skills = [
      { name: 'data-analyst', description: DATA_ANALYST_DESC },
      { name: 'spreadsheet-wizard', description: SPREADSHEET_DESC },
    ];
    const collisions = detectCollisions(skills);
    expect(collisions.length).toBeGreaterThan(0);
    expect(collisions[0].skillA).toBe('data-analyst');
    expect(collisions[0].skillB).toBe('spreadsheet-wizard');
    expect(collisions[0].overlap).toBeGreaterThan(0.10);
  });

  it('finds no collision between unrelated skills', () => {
    const skills = [
      { name: 'data-analyst', description: DATA_ANALYST_DESC },
      { name: 'pdf-summarizer', description: PDF_DESC },
    ];
    const collisions = detectCollisions(skills);
    expect(collisions).toHaveLength(0);
  });

  it('returns empty array for single skill', () => {
    const collisions = detectCollisions([
      { name: 'data-analyst', description: DATA_ANALYST_DESC },
    ]);
    expect(collisions).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(detectCollisions([])).toHaveLength(0);
  });
});
