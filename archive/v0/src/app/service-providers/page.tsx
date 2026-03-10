import { getPageContent } from "@/lib/marketing-content";
import { MarketingPage } from "@/components/marketing";

export default function ServiceProvidersPage() {
  const content = getPageContent("/service-providers");
  if (!content) return null;
  return <MarketingPage content={content} />;
}
