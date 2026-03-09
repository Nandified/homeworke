import { Card, Container, Pill } from "@/components/ui";
import spec from "@/content/events_integrations_opus.json";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Integrations</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Event Stream and CRM placeholders</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              This is a v1 spec-driven scaffold. We are emitting stable events and providing placeholder integration
              routes for Follow Up Boss and BoldTrail.
            </div>
          </div>
          <Pill>Opus 4.6 spec</Pill>
        </div>

        <Card className="mt-6 p-6">
          <div className="text-sm font-semibold">Webhook ingest</div>
          <div className="mt-2 text-sm text-[var(--hw-muted)]">Route: {spec.webhook.ingestRoute}</div>
          <div className="mt-2 text-sm text-[var(--hw-muted)]">Auth header: {spec.webhook.authHeader}</div>
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-sm font-semibold">Event types</div>
            <div className="mt-4 grid gap-3">
              {spec.eventTypes.map((e) => (
                <div key={e.name} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                  <div className="text-sm font-semibold">{e.name}</div>
                  <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{e.description}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold">CRM placeholders</div>
            <div className="mt-4 grid gap-3">
              {spec.integrations.map((i) => (
                <div key={i.key} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                  <div className="text-sm font-semibold">{i.name}</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Audience: {i.audience}</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Route prefix: {i.routePrefix}</div>
                  <div className="mt-3 text-sm font-semibold">Supported events</div>
                  <div className="mt-2 text-sm text-[var(--hw-muted)]">{i.supportedEvents.join(", ")}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
