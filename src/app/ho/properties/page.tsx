import { HOPropertiesPageClient } from "@/components/ho/HOPropertiesPageClient";
import { redirect } from "next/navigation";

export default async function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const property = Array.isArray(sp?.property) ? sp.property[0] : sp?.property;
  if (property) redirect(`/ho/properties/${encodeURIComponent(property)}`);

  return <HOPropertiesPageClient />;
}
