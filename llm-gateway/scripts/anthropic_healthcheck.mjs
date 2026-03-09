import './_load_env.mjs';

const key = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-6';

if (!key) {
  console.error('FAIL: Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

// 1) List models
{
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }
  });
  if (!res.ok) {
    console.error('FAIL: /v1/models', res.status, await res.text());
    process.exit(1);
  }
}

// 2) Tiny message
{
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 16,
      temperature: 0,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }]
    })
  });

  const dataText = await res.text();
  if (!res.ok) {
    console.error('FAIL: /v1/messages', res.status, dataText);
    process.exit(1);
  }

  const data = JSON.parse(dataText);
  const out = data?.content?.[0]?.text || '';
  if (out.trim() !== 'OK') {
    console.error('FAIL: unexpected response:', out);
    process.exit(1);
  }
}

console.log(`OK: Anthropic key valid; model '${model}' callable.`);
