import { Container, Card, Pill } from "@/components/ui";
import { MagicLinkRequestForm } from "@/components/auth/MagicLinkRequestForm";
import { SharedExpressEstimateReportClient } from "@/components/share/SharedExpressEstimateReportClient";
import { verifyShareToken } from "@/lib/share-token";

export default async function ShareReportPage(props: { params: Promise<{ token: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await props.params;
  const secret = process.env.SHARE_TOKEN_SECRET || "dev-share-secret";

  const v = verifyShareToken(token, secret);
  if (!v.ok) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
        <Container className="py-10 md:py-16">
          <div className="flex flex-wrap items-center gap-2">
            <Pill>Shared report</Pill>
            <Pill>Link invalid</Pill>
          </div>
          <Card className="mt-8 max-w-xl p-6">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">This share link is no longer valid.</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Ask the sender to generate a new share link.</div>
          </Card>
        </Container>
      </div>
    );
  }

  const payload = v.payload;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10 md:py-16">
        <div className="flex flex-wrap items-center gap-2">
          <Pill>Shared report</Pill>
          <Pill>{payload.mode === "selected" ? "Selected items" : "Full report"}</Pill>
        </div>

        <Card className="mt-8 max-w-xl p-6">
          <MagicLinkRequestForm
            next={`/share/report/${encodeURIComponent(token)}`}
            title="Want to save and book repairs?"
            description="Enter your email for a one-time login link. (No password yet.)"
          />
          <div className="mt-3 text-xs text-[var(--hw-muted)]">
            You can still view and download this report below without logging in.
          </div>
        </Card>

        <div className="mt-8">
          <SharedExpressEstimateReportClient token={token} payload={payload} />
        </div>
      </Container>
    </div>
  );
}
