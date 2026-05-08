import Anthropic from '@anthropic-ai/sdk';

export const REWRITE_PROMPT = `You are rewriting the \`description\` field in a SKILL.md frontmatter for a Claude plugin.

Current description: {ORIGINAL}
Skill body summary: {BODY_SUMMARY}

Rewrite the description to:
- Include 5-7 explicit trigger phrases ("Use when the user says: '...', '...'")
- Include explicit negative boundaries ("Do NOT use for: ...")
- Use concrete nouns and verbs from the skill body
- Stay between 200 and 600 characters

Return ONLY the rewritten description text. No preamble, no quotes, no markdown.`;

export async function rewriteDescription(
  original: string,
  bodySummary: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is not set. ' +
        'Set it to use --fix mode: export ANTHROPIC_API_KEY=sk-ant-...',
    );
  }

  const client = new Anthropic({ apiKey });

  const prompt = REWRITE_PROMPT
    .replace('{ORIGINAL}', original)
    .replace('{BODY_SUMMARY}', bodySummary.slice(0, 500));

  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic API');
  }

  return content.text.trim();
}
