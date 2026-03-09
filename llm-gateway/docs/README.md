# llm-gateway

Standalone folder for LLM providers + scripts, separate from any specific app (Relays/Homeworke/etc.).

## Setup
- Copy `.env.example` → `.env`
- Set:
  - `ANTHROPIC_API_KEY=...`
  - `ANTHROPIC_MODEL=claude-opus-4-6`

## Scripts
- `npm run models:anthropic`
- `npm run healthcheck:anthropic`
- `npm run generate:moodboard:opus` (writes `out/homeworke/opus_moodboard_spec.json`)

## Security
- Do not commit `.env`.
- Prefer a secrets manager in production; `.env` is for local/dev only.
