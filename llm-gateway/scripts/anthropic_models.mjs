import './_load_env.mjs';

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.error('Missing ANTHROPIC_API_KEY. Create llm-gateway/.env (see .env.example).');
  process.exit(1);
}

const res = await fetch('https://api.anthropic.com/v1/models', {
  headers: {
    'x-api-key': key,
    'anthropic-version': '2023-06-01'
  }
});
const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${text}`);
  process.exit(1);
}
console.log(text);
