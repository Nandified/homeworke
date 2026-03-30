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
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Next steps</div>
              <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">Book repairs and see more details</div>
              <div className="mt-1 text-xs text-[var(--hw-muted)]">We’ll email you a one-time login link to continue.</div>
              <div className="mt-3">
                <ShareLoginCta email={payload.recipient?.email} next={`/share/report/${encodeURIComponent(token)}`} />
              </div>
            </div>

            <div className="mt-4 text-xs text-[var(--hw-muted)]">You can view and download the report below without logging in.</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--hw-soft)] text-sm font-extrabold text-[var(--hw-red)]">
                {(payload.pro?.name || "Pro")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("")}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Your trusted Real Estate Pro</div>
                <div className="mt-0.5 truncate text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">{payload.pro?.name || "Real Estate Pro"}</div>
                {payload.pro?.brokerageName ? <div className="mt-0.5 truncate text-sm text-[var(--hw-muted)]">{payload.pro.brokerageName}</div> : null}
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {payload.pro?.email ? (
                <a
                  className="inline-flex items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
                  href={`mailto:${payload.pro.email}`}
                >
                  Email
                </a>
              ) : null}
              {payload.pro?.phone ? (
                <a
                  className="inline-flex items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
                  href={`tel:${payload.pro.phone}`}
                >
                  Call
                </a>
              ) : null}
              <a
                className="inline-flex items-center justify-center rounded-full bg-[var(--hw-red)] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(229,57,53,.3)] hover:brightness-[1.05]"
                href="#book-repairs"
              >
                Book repairs
              </a>
            </div>

            <div className="mt-4 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Shared with</div>
              <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">
                {payload.recipient?.name || "—"}
                {payload.recipient?.role ? ` • ${payload.recipient.role}` : ""}
              </div>
              {payload.recipient?.email ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{payload.recipient.email}</div> : null}
              {payload.recipient?.phone ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{payload.recipient.phone}</div> : null}
            </div>
          </Card>
        </div>

        <div className="mt-8" id="book-repairs">
          <SharedExpressEstimateReportClient token={token} payload={payload} />
        </div>
      </Container>
    </div>
  );
}
