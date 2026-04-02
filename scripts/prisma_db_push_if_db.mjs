import { execSync } from "node:child_process";

const hasDb = Boolean(process.env.DATABASE_URL);

if (!hasDb) {
  console.log("[prisma] DATABASE_URL not set; skipping db push");
  process.exit(0);
}

console.log("[prisma] DATABASE_URL set; running prisma db push");
execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
