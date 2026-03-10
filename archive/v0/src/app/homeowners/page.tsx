import { getPageContent } from "@/lib/marketing-content";
import { MarketingPage } from "@/components/marketing";

export default function HomeownersPage() {
  const content = getPageContent("/homeowners");
  if (!content) return null;
  return <MarketingPage content={content} />;
}
