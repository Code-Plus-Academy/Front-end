import fs from 'node:fs/promises';

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function truncate(text, maxChars) {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars)}\n\n[diff truncated by script]`;
}

function escapeMarkdown(text) {
  return String(text ?? '').replace(/\r/g, '').trim();
}

function normalizeResponse(payloadText) {
  const start = payloadText.indexOf('{');
  const end = payloadText.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not contain JSON');
  }
  return JSON.parse(payloadText.slice(start, end + 1));
}

const diffPath = getArg('--diff');
const outputPath = getArg('--output') ?? 'code-review-report.md';

if (!diffPath) {
  throw new Error('Missing --diff argument');
}

const geminiKey = process.env.GEMINI_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

if (!geminiKey && !anthropicKey) {
  const generatedAt = new Date().toISOString();
  const markdown = [
    '# Code Review Report',
    '',
    '- Verdict: SKIPPED',
    `- Repository: ${process.env.GITHUB_REPOSITORY ?? 'local'}`,
    `- Ref: ${process.env.GITHUB_REF_NAME ?? 'local'}`,
    `- Commit: ${process.env.GITHUB_SHA ?? 'local'}`,
    `- Generated: ${generatedAt}`,
    '',
    '## Summary',
    '',
    'AI Code Review was skipped because neither `GEMINI_API_KEY` nor `ANTHROPIC_API_KEY` is configured in GitHub Repository Secrets.',
    '',
    'To enable automated AI code reviews, add `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) to your GitHub Repository Settings -> Secrets and variables -> Actions.',
    '',
  ].join('\n');

  await fs.writeFile(outputPath, markdown, 'utf8');
  console.warn('Skipping AI code review: Neither GEMINI_API_KEY nor ANTHROPIC_API_KEY is configured.');
  process.exit(0);
}

const rawDiff = (await fs.readFile(diffPath, 'utf8').catch(() => '')).trim();

if (!rawDiff) {
  const generatedAt = new Date().toISOString();
  const markdown = [
    '# Code Review Report',
    '',
    '- Verdict: PASS',
    `- Provider: ${geminiKey ? 'Gemini API' : (anthropicKey ? 'Anthropic API' : 'None')}`,
    `- Repository: ${process.env.GITHUB_REPOSITORY ?? 'local'}`,
    `- Ref: ${process.env.GITHUB_REF_NAME ?? 'local'}`,
    `- Commit: ${process.env.GITHUB_SHA ?? 'local'}`,
    `- Generated: ${generatedAt}`,
    '',
    '## Summary',
    '',
    'No code changes detected in diff. Automated pass.',
    '',
  ].join('\n');

  await fs.writeFile(outputPath, markdown, 'utf8');
  console.log('No diff found. Generated pass report.');
  process.exit(0);
}

const diff = truncate(rawDiff, 120000);

const prompt = `You are a principal engineer performing a release gate review for changed code only. Review the git diff for security, scalability, performance, accessibility, and operational risk in this Next.js frontend repository. Be strict but fair.

Return JSON only with this exact shape:
{
  "verdict": "pass" | "fail",
  "summary": "short paragraph",
  "scores": {
    "security": 1-5,
    "performance": 1-5,
    "scalability": 1-5,
    "maintainability": 1-5
  },
  "findings": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "title": "short title",
      "details": "why this matters and what should change"
    }
  ],
  "required_actions": ["action item"],
  "strengths": ["positive point"]
}

Mark verdict as fail if you see any high-confidence issue that should block deployment.

Repository: ${process.env.GITHUB_REPOSITORY ?? 'local'}
Ref: ${process.env.GITHUB_REF_NAME ?? 'local'}
Actor: ${process.env.GITHUB_ACTOR ?? 'local'}
Commit: ${process.env.GITHUB_SHA ?? 'local'}

Diff:
${diff}`;

let responseText = '';
let reviewVerdict = 'pass';

try {
  if (geminiKey) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini API request failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    responseText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  } else {
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1800,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic request failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    responseText = (data.content ?? [])
      .filter((item) => item.type === 'text')
      .map((item) => item.text)
      .join('\n');
  }

  const review = normalizeResponse(responseText);
  const findings = Array.isArray(review.findings) ? review.findings : [];
  const strengths = Array.isArray(review.strengths) ? review.strengths : [];
  const actions = Array.isArray(review.required_actions) ? review.required_actions : [];
  const scores = review.scores ?? {};
  const verdict = String(review.verdict ?? 'fail').toLowerCase() === 'pass' ? 'pass' : 'fail';
  reviewVerdict = verdict;
  const generatedAt = new Date().toISOString();

  const markdown = [
    '# Code Review Report',
    '',
    `- Verdict: ${verdict.toUpperCase()}`,
    `- Provider: ${geminiKey ? 'Gemini API' : 'Anthropic API'}`,
    `- Repository: ${process.env.GITHUB_REPOSITORY ?? 'local'}`,
    `- Ref: ${process.env.GITHUB_REF_NAME ?? 'local'}`,
    `- Commit: ${process.env.GITHUB_SHA ?? 'local'}`,
    `- Generated: ${generatedAt}`,
    '',
    '## Summary',
    '',
    escapeMarkdown(review.summary || 'No summary returned.'),
    '',
    '## Scores',
    '',
    `- Security: ${scores.security ?? 'n/a'}/5`,
    `- Performance: ${scores.performance ?? 'n/a'}/5`,
    `- Scalability: ${scores.scalability ?? 'n/a'}/5`,
    `- Maintainability: ${scores.maintainability ?? 'n/a'}/5`,
    '',
    '## Findings',
    '',
    ...(findings.length
      ? findings.map((finding) => `- [${String(finding.severity ?? 'medium').toUpperCase()}] ${escapeMarkdown(finding.title || 'Untitled finding')}: ${escapeMarkdown(finding.details || 'No details provided.')}`)
      : ['- No blocking findings reported.']),
    '',
    '## Required Actions',
    '',
    ...(actions.length ? actions.map((action) => `- ${escapeMarkdown(action)}`) : ['- None.']),
    '',
    '## Strengths',
    '',
    ...(strengths.length ? strengths.map((item) => `- ${escapeMarkdown(item)}`) : ['- None noted.']),
    '',
  ].join('\n');

  await fs.writeFile(outputPath, markdown, 'utf8');
} catch (err) {
  console.error('AI code review encountered an error:', err.message);
  const generatedAt = new Date().toISOString();
  const fallbackMarkdown = [
    '# Code Review Report',
    '',
    '- Verdict: WARNING',
    `- Provider: ${geminiKey ? 'Gemini API' : 'Anthropic API'}`,
    `- Repository: ${process.env.GITHUB_REPOSITORY ?? 'local'}`,
    `- Ref: ${process.env.GITHUB_REF_NAME ?? 'local'}`,
    `- Commit: ${process.env.GITHUB_SHA ?? 'local'}`,
    `- Generated: ${generatedAt}`,
    '',
    '## Warning',
    '',
    `AI code review call failed: ${err.message}`,
    '',
  ].join('\n');

  await fs.writeFile(outputPath, fallbackMarkdown, 'utf8');
}

if (reviewVerdict !== 'pass') {
  process.exitCode = 1;
}
