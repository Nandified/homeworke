import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local .env first (override to avoid inheriting stale env values)
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

// Also allow opting into existing env files (for convenience)
// e.g. export LLM_ENV_FILE=/path/to/.env.local
if (process.env.LLM_ENV_FILE) {
  dotenv.config({ path: process.env.LLM_ENV_FILE, override: true });
}
