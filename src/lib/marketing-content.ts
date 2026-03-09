import content from "@/content/marketing_pages_opus.json";

export type MarketingContent = typeof content;

export const marketingContent = content;

export function getPageContent(route: string) {
  return marketingContent.pages.find((p) => p.route === route);
}
