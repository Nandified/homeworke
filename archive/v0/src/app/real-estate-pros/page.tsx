import { getPageContent } from "@/lib/marketing-content";
import { MarketingPage } from "@/components/marketing";

export default function RealEstateProsPage() {
  const content = getPageContent("/real-estate-pros");
  if (!content) return null;
  return <MarketingPage content={content} />;
}
