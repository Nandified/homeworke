import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

export function dbEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

export function db() {
  if (!dbEnabled()) {
    throw new Error("DATABASE_URL not set");
  }
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
