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
  if (dbEnabled()) {
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
    const row = await db().page.findUnique({ where: { slug } });
    if (row && row.published) return { slug: row.slug, title: row.title, body: row.body || null };
  }

  // Fallbacks for existing code-backed pages
  if (slug === "home") {
    return { slug: "home", title: "Home", body: JSON.stringify(homepageDefault) };
  }

  return null;
}

export async function listPublishedServices(): Promise<ServiceLike[]> {
  if (dbEnabled()) {
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
