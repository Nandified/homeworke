import { Container, Card, Pill } from "@/components/ui";
import { ShareLoginCta } from "@/components/share/ShareLoginCta";
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
          <Pill>Instant Estimate</Pill>
          <Pill>{payload.mode === "selected" ? "Shared selection" : "Shared full report"}</Pill>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_420px]">
          <Card className="p-6">
            <div className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">
              Hi {payload.recipient?.name?.split(" ")[0] || "there"}, here is your Instant Estimate.
            </div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Property</div>
            <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{payload.address || "—"}</div>

            <div className="mt-5 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Courtesy of</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">
                {payload.pro?.name || "Real Estate Pro"}
                {payload.pro?.brokerageName ? ` • ${payload.pro.brokerageName}` : ""}
              </div>
              <div className="mt-3 text-xs text-[var(--hw-muted)]">Want to book repairs and see more details?</div>
              <div className="mt-3">
                <ShareLoginCta email={payload.recipient?.email} next={`/share/report/${encodeURIComponent(token)}`} />
              </div>
            </div>

            <div className="mt-4 text-xs text-[var(--hw-muted)]">You can view and download the report below without logging in.</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Shared with</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">
              {payload.recipient?.name || "—"}
              {payload.recipient?.role ? ` • ${payload.recipient.role}` : ""}
            </div>
            {payload.recipient?.email ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{payload.recipient.email}</div> : null}
            {payload.recipient?.phone ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{payload.recipient.phone}</div> : null}
          </Card>
        </div>

        <div className="mt-8">
          <SharedExpressEstimateReportClient token={token} payload={payload} />
        </div>
      </Container>
    </div>
  );
}
