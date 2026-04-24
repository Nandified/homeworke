import servicesData from "@/../spec/services.json";
import homepageDefault from "@/../spec/homepage_marketing_v1.json";
import { dbEnabled, db } from "@/lib/db";

export type ServiceLike = {
  slug: string;
  name: string;
  icon: string;
  summary: string;
  examples: string[];
  notes: string;
};

function fromSpec(slug: string): ServiceLike | null {
  const s = servicesData.services.find((x) => x.slug === slug);
  if (!s) return null;
  return {
    slug: s.slug,
    name: s.name,
    icon: s.icon,
    summary: s.summary,
    examples: (s.examples || []) as string[],
    notes: s.notes,
  };
}

export async function getPublishedServiceBySlug(slug: string): Promise<ServiceLike | null> {
  // Defensive guard: during build/prerender, Next can invoke routes with missing params.
  // Prisma throws if we pass `undefined` into a WhereUniqueInput.
  if (!slug) return null;

  if (dbEnabled()) {
    try {
      const row = await db().service.findUnique({ where: { slug } });
      if (row && row.published) {
        return {
          slug: row.slug,
          name: row.title,
          icon: row.icon || "wrench",
          summary: row.summary || "",
          examples: Array.isArray(row.examples) ? (row.examples as string[]) : [],
          notes: row.notes || "",
        };
      }
    } catch {
      // Common during initial deploys/builds before migrations run (e.g. P2021 table missing).
      // Fall back to spec-backed content instead of failing the whole render.
    }
  }
  return fromSpec(slug);
}

export type PageLike = {
  slug: string;
  title: string;
  body: string | null;
};

export async function getPublishedPageBySlug(slug: string): Promise<PageLike | null> {
  if (dbEnabled()) {
    try {
      const row = await db().page.findUnique({ where: { slug } });
      if (row && row.published) return { slug: row.slug, title: row.title, body: row.body || null };
    } catch {
      // Fall back to code/spec-backed pages if DB isn't ready yet.
    }
  }

  // Fallbacks for existing code-backed pages
  if (slug === "home") {
    return { slug: "home", title: "Home", body: JSON.stringify(homepageDefault) };
  }

  return null;
}

export async function listPublishedServices(): Promise<ServiceLike[]> {
  if (dbEnabled()) {
    try {
      const rows = await db().service.findMany({ where: { published: true }, orderBy: [{ updatedAt: "desc" }] });
      if (rows.length) {
        return rows.map((r) => ({
          slug: r.slug,
          name: r.title,
          icon: r.icon || "wrench",
          summary: r.summary || "",
          examples: Array.isArray(r.examples) ? (r.examples as string[]) : [],
          notes: r.notes || "",
        }));
      }
    } catch {
      // If the DB schema isn't applied yet (e.g. P2021 table missing), fall back to spec.
    }
  }

  return servicesData.services.map((s) => ({
    slug: s.slug,
    name: s.name,
    icon: s.icon,
    summary: s.summary,
    examples: (s.examples || []) as string[],
    notes: s.notes,
  }));
}
