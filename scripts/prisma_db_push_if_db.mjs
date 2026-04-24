import { execSync } from "node:child_process";

const hasDb = Boolean(process.env.DATABASE_URL);

// IMPORTANT: Vercel build environment may not have network access to Supabase Postgres,
// causing builds to fail (P1001). We never want schema sync to block a deploy.
const isVercelBuild = Boolean(process.env.VERCEL) && process.env.VERCEL_ENV !== "development";

if (!hasDb) {
  console.log("[prisma] DATABASE_URL not set; skipping db push");
  process.exit(0);
}

if (isVercelBuild) {
  console.log("[prisma] VERCEL build detected; skipping prisma db push (run migrations separately)");
  process.exit(0);
}

console.log("[prisma] DATABASE_URL set; running prisma db push");
execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
