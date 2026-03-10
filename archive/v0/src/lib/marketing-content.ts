import raw from "@/content/marketing_pages_opus.json";

// Keep runtime resilient even if content JSON varies slightly.
export type MarketingContent = {
  pages: Array<Record<string, unknown>>;
};

export const marketingContent: MarketingContent = raw as unknown as MarketingContent;

export function getPageContent(route: string): Record<string, unknown> | undefined {
  return marketingContent.pages.find((p) => p.route === route);
}
