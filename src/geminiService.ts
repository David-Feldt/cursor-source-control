import * as https from 'https';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function summarizeChanges(
  apiKey: string,
  diffText: string
): Promise<string> {
  const prompt = `You are a concise code reviewer. Given the following git diff, produce a summary of the changes as 1-6 bullet points. Each bullet should be a short, clear sentence describing what changed and why it matters. Do not include file paths unless essential.

FORMATTING RULES — you MUST follow these exactly:
- Start each bullet with "• "
- Wrap key phrases that describe ADDITIONS or new things in <add>...</add> tags
- Wrap key phrases that describe DELETIONS or removals in <del>...</del> tags
- Wrap key phrases that describe MODIFICATIONS or changes in <mod>...</mod> tags
- Only tag the key phrase, not the entire sentence
- Keep it brief — 1-6 bullets total

Example output:
• <add>Added a new authentication middleware</add> for API route protection
• <mod>Updated the user model</mod> to include email verification fields
• <del>Removed deprecated legacy login endpoint</del>

Git diff:
${diffText.slice(0, 15000)}`;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 512,
    },
  });

  return new Promise((resolve, reject) => {
    const url = `${GEMINI_API_URL}?key=${apiKey}`;
    const parsed = new URL(url);

    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              reject(new Error(json.error.message || 'Gemini API error'));
              return;
            }
            const text =
              json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            resolve(text.trim());
          } catch (e) {
            reject(new Error('Failed to parse Gemini response'));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
