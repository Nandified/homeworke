import './_load_env.mjs';
import fs from 'node:fs';

const key = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-6';
if (!key) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const ICONS = [
  'shield','lock','clock','sparkles','grid','users','star','list','cursor','mail','login','map-pin','milestone',
  'message-circle','credit-card','camera','check-circle','home','trending-up','calculator','link','eye-off',
  'handshake','refresh','dollar-sign','bar-chart','layout','user-plus','bot','calendar'
];

const pageSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    route: { type: 'string' },
    hero: {
      type: 'object',
      additionalProperties: false,
      properties: {
        headline: { type: 'string' },
        subheadline: { type: 'string' },
        primaryCta: { type: 'string' },
        secondaryCta: { type: 'string' },
        trustBullets: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              icon: { type: 'string', enum: ICONS },
              text: { type: 'string' }
            },
            required: ['icon','text']
          }
        }
      },
      required: ['headline','subheadline','primaryCta','secondaryCta','trustBullets']
    },
    sections: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
          bullets: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                icon: { type: 'string', enum: ICONS },
                text: { type: 'string' }
              },
              required: ['icon','text']
            }
          }
        },
        required: ['title','subtitle','bullets']
      }
    },
    demoForm: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: false,
          properties: {
            fields: {
              type: 'array',
              items: { type: 'string' },
              minItems: 5,
              maxItems: 5
            },
            submitLabel: { type: 'string' }
          },
          required: ['fields','submitLabel']
        }
      ]
    },
    faq: {
      type: 'array',
      minItems: 4,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          q: { type: 'string' },
          a: { type: 'string' }
        },
        required: ['q','a']
      }
    }
  },
  required: ['route','hero','sections','faq']
};

async function generatePage(route, includeDemoForm) {
  const instructions = `Generate marketing copy for ${route}.
Rules:
- No emojis.
- Premium, calm tone.
- Use only icon names from the allowed list.
- Keep it concrete and product-specific.

Context summary:
- Homeworke 3.0: trust-first marketplace + relationship engine.
- Homeowners: AI service picker, curated matching (default 3), gated provider identity, live day-of tracking (PM on the way), milestone-based payment draws.
- Real estate pros: pro landing page, invite clients, office dashboards, admitted partner program payouts on completed jobs, CRM integrations.
- Service providers: DoorDash/Uber-style feed, gated onboarding, calendar connect.
`;

  const toolName = includeDemoForm ? 'emit_page_with_demo' : 'emit_page';
  const schema = JSON.parse(JSON.stringify(pageSchema));
  schema.properties.route.const = route;
  if (!includeDemoForm) {
    // Disallow demoForm entirely
    delete schema.properties.demoForm;
  } else {
    schema.properties.demoForm = {
      type: 'object',
      additionalProperties: false,
      properties: {
        fields: { type: 'array', items: { type: 'string' }, minItems: 5, maxItems: 5 },
        submitLabel: { type: 'string' }
      },
      required: ['fields','submitLabel']
    };
    schema.required.push('demoForm');
  }

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
      temperature: 0.4,
      messages: [{ role: 'user', content: instructions }],
      tools: [{ name: toolName, description: 'Emit the page JSON', input_schema: schema }],
      tool_choice: { type: 'tool', name: toolName }
    })
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  const data = JSON.parse(text);

  const toolUse = (data.content || []).find((c) => c.type === 'tool_use' && c.name === toolName);
  if (!toolUse) throw new Error('No tool_use found');
  return toolUse.input;
}

(async () => {
  const pages = [];
  pages.push(await generatePage('/homeowners', false));
  pages.push(await generatePage('/real-estate-pros', true));
  pages.push(await generatePage('/service-providers', false));

  const out = { pages };
  fs.mkdirSync('/Users/Clawdbot/clawd/out/homeworke', { recursive: true });
  fs.writeFileSync('/Users/Clawdbot/clawd/out/homeworke/marketing_pages_opus.json', JSON.stringify(out, null, 2));
  console.log('WROTE out/homeworke/marketing_pages_opus.json');
})();
