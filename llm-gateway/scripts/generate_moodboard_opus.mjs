import './_load_env.mjs';
import fs from 'node:fs';
import path from 'node:path';

const key = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-6';
if (!key) {
  console.error('Missing ANTHROPIC_API_KEY. Create llm-gateway/.env (see .env.example).');
  process.exit(1);
}

const prompt = `Output STRICT JSON (no markdown). You are creating a moodboard spec for Homeworke 3.0 UI.

Context to incorporate:
- Brand: Homeworke; tagline “Making Homeownership Easy”. Primary red #E53935; clean whites; dark ink.
- 3-sided marketplace: Homeowners, Service Providers, Real Estate Pros; plus Offices, Lenders, Inspectors, Insurance.
- Agent-first relationship engine; post-close retention.
- Homepage: semi-open marketplace funnel + AI service picker (chat box + bubble suggestions + auto-select).
- Matching: recommend ~3 curated providers + browse more; provider identity partially gated early.
- Homeowner: properties, pro team, messages, loan calculator; Zillow valuation + map.
- Ops: Home Guide + PM; PM record+talk (video/voice) → scope+estimate draft (Handoff-like).
- Live feel: Uber/DoorDash day-of tracking (PM assigned + on the way).
- Quality bar: Apple/Airbnb/Uber/Vercel-level polish; beat BOSSCAT.

Return JSON with keys:
{
  "palette": {"primary":"#E53935", "neutrals":[], "support":[]},
  "typography": {"headline": {"family":"...","weight":"...","tracking":"..."}, "body": {"family":"...","sizeScale":"..."}},
  "layout": {"grid":"...", "spacing":"...", "radius":"...", "elevation":"..."},
  "components": [ {"name":"...","purpose":"...","visual":"...","states":[...]} ],
  "imagery": {"style":"...","do":[...],"avoid":[...]},
  "motion": {"principles": [ ... ]},
  "sample_sections": [ {"section":"...","purpose":"...","key_elements":[...]} ]
}`;

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model,
    max_tokens: 1600,
    temperature: 0.6,
    messages: [{ role: 'user', content: prompt }]
  })
});

const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  process.exit(1);
}

const data = JSON.parse(text);
let out = data?.content?.[0]?.text || '';
// Strip fenced code block if Opus includes it
out = out.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

const outDir = '/Users/Clawdbot/clawd/out/homeworke';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'opus_moodboard_spec.json'), out, 'utf8');
console.log('WROTE', path.join(outDir, 'opus_moodboard_spec.json'));
