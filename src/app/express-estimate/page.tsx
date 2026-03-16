import { Container, Card, Pill } from "@/components/ui";
import { MagicLinkRequestForm } from "@/components/auth/MagicLinkRequestForm";
import { ExpressEstimatePublicClient } from "@/components/public/ExpressEstimatePublicClient";
import { getSessionTokenFromCookie, getSessionUserId } from "@/lib/session";

export default async function ExpressEstimatePage(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = (await props.searchParams) ?? {};
  const staged = typeof sp.staged === "string" ? sp.staged : undefined;
  const partner = typeof sp.partner === "string" ? sp.partner : undefined;

  const token = await getSessionTokenFromCookie();
  const userId = token ? await getSessionUserId(token) : null;

  if (!userId) {
    const next = `/express-estimate${staged ? `?staged=${encodeURIComponent(staged)}${partner ? `&partner=${encodeURIComponent(partner)}` : ""}` : partner ? `?partner=${encodeURIComponent(partner)}` : ""}`;
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
        <Container className="py-10 md:py-16">
          <div className="flex flex-wrap items-center gap-2">
            <Pill>Express Estimate</Pill>
            <Pill>Verify email</Pill>
          </div>

          <Card className="mt-8 max-w-xl p-6">
            <MagicLinkRequestForm
              next={next}
              title="Verify your email to view your estimate"
              description="To prevent abuse, we email you a one-time link before we show results."
            />
          </Card>

          <div className="mt-6 text-sm text-[var(--hw-muted)]">
            If you already requested a link, check your inbox. (Dev mode: the link is logged server-side.)
          </div>
        </Container>
      </div>
    );
  }

  return <ExpressEstimatePublicClient stagedId={staged} partnerCode={partner} />;
}
