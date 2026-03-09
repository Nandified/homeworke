import './_load_env.mjs';
import fs from 'node:fs';

const key = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-6';
if (!key) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const EVENT_NAMES = [
  'work_order_created',
  'work_order_scheduled',
  'work_order_completed',
  'review_requested',
  'review_submitted',
  'pm_assigned',
  'pm_on_the_way',
  'bid_requested',
  'bid_submitted',
  'draw_released',
  'partner_connected',
  'partner_sharing_changed'
];

async function callAnthropic(body) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

async function emitEvent(name) {
  const toolName = 'emit_event';
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      name: { type: 'string', const: name },
      description: { type: 'string' },
      producer: { type: 'string' },
      consumerExamples: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } },
      payloadExample: { type: 'object' }
    },
    required: ['name', 'description', 'producer', 'consumerExamples', 'payloadExample']
  };

  const prompt = `Define the event '${name}' for Homeworke 3.0.
Rules:
- No emojis.
- Keep it platform-specific (home services + partner relationship engine).
- payloadExample must be JSON with stable keys. Include ids (public_id), timestamps, and minimal PII.
- consumerExamples should mention at least one: Follow Up Boss, BoldTrail, internal notifications.
Return only tool output.`;

  const data = await callAnthropic({
    model,
    max_tokens: 500,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }],
    tools: [{ name: toolName, description: 'Emit event', input_schema: schema }],
    tool_choice: { type: 'tool', name: toolName }
  });

  const toolUse = (data.content || []).find((c) => c.type === 'tool_use' && c.name === toolName);
  if (!toolUse?.input) throw new Error(`No tool output for ${name}`);
  return toolUse.input;
}

async function emitWebhook() {
  const toolName = 'emit_webhook';
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      ingestRoute: { type: 'string', const: '/api/events/ingest' },
      authHeader: { type: 'string' },
      verifyRules: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'string' } },
      idempotencyRules: { type: 'array', minItems: 2, maxItems: 5, items: { type: 'string' } },
      storageNow: { type: 'string' },
      storageNext: { type: 'string' }
    },
    required: ['ingestRoute', 'authHeader', 'verifyRules', 'idempotencyRules', 'storageNow', 'storageNext']
  };

  const prompt = `Define the v1 event ingest webhook for Homeworke.
Rules:
- No emojis.
- Must be safe for Vercel serverless.
- Use a shared secret header; describe idempotency.
Return only tool output.`;

  const data = await callAnthropic({
    model,
    max_tokens: 600,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }],
    tools: [{ name: toolName, description: 'Emit webhook', input_schema: schema }],
    tool_choice: { type: 'tool', name: toolName }
  });

  const toolUse = (data.content || []).find((c) => c.type === 'tool_use' && c.name === toolName);
  if (!toolUse?.input) throw new Error('No webhook tool output');
  return toolUse.input;
}

async function emitIntegrations(eventNames) {
  const toolName = 'emit_integrations';
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      integrations: {
        type: 'array',
        minItems: 2,
        maxItems: 2,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            key: { type: 'string' },
            name: { type: 'string' },
            audience: { type: 'string' },
            routePrefix: { type: 'string' },
            requiredEnv: { type: 'array', minItems: 1, maxItems: 5, items: { type: 'string' } },
            supportedEvents: {
              type: 'array',
              minItems: 4,
              maxItems: 10,
              items: { type: 'string', enum: eventNames }
            },
            notes: { type: 'array', minItems: 2, maxItems: 5, items: { type: 'string' } }
          },
          required: ['key', 'name', 'audience', 'routePrefix', 'requiredEnv', 'supportedEvents', 'notes']
        }
      }
    },
    required: ['integrations']
  };

  const prompt = `Define the CRM integration placeholders for Homeworke.
Rules:
- No emojis.
- Exactly 2 integrations: Follow Up Boss and BoldTrail.
- Each must define a routePrefix for future endpoints and required env vars.
- supportedEvents must be a subset of the event names provided.
Return only tool output.`;

  const data = await callAnthropic({
    model,
    max_tokens: 800,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }],
    tools: [{ name: toolName, description: 'Emit integrations', input_schema: schema }],
    tool_choice: { type: 'tool', name: toolName }
  });

  const toolUse = (data.content || []).find((c) => c.type === 'tool_use' && c.name === toolName);
  if (!toolUse?.input) throw new Error('No integrations tool output');
  return toolUse.input.integrations;
}

(async () => {
  const eventTypes = [];
  for (const name of EVENT_NAMES) {
    // eslint-disable-next-line no-console
    console.log('Generating event:', name);
    eventTypes.push(await emitEvent(name));
  }

  const webhook = await emitWebhook();
  const integrations = await emitIntegrations(EVENT_NAMES);

  const out = { eventTypes, webhook, integrations };
  fs.mkdirSync('/Users/Clawdbot/clawd/out/homeworke', { recursive: true });
  fs.writeFileSync('/Users/Clawdbot/clawd/out/homeworke/events_integrations_opus.json', JSON.stringify(out, null, 2));
  console.log('WROTE out/homeworke/events_integrations_opus.json');
})();
