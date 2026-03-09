import { getPageContent } from "@/lib/marketing-content";
import { MarketingPage } from "@/components/marketing";

export default function Page() {
  const content = getPageContent("/inspectors");
  if (!content) return null;
  return <MarketingPage content={content} />;
}
