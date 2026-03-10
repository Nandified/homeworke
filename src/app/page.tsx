import HomeClient from "@/app/HomeClient";
import { getPublishedPageBySlug } from "@/lib/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page() {
  const page = await getPublishedPageBySlug("home");

  let homepage: any = undefined;
  if (page?.body) {
    try {
      homepage = JSON.parse(page.body);
    } catch {
      // ignore; fallback will be used in HomeClient
    }
  }

  return <HomeClient homepage={homepage} />;
}
