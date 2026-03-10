import Link from "next/link";
import { Button, Card, Container, Pill } from "@/components/ui";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Reference</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Homeworke recorded videos</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              Placeholder page. Once you drop the recordings (Drive link or local path), we’ll list them here and map each
              video to a build task.
            </div>
          </div>
          <Pill>todo</Pill>
        </div>

        <Card className="mt-6 p-6">
          <div className="text-sm font-semibold">What I need from you</div>
          <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
            Send either:
            <ul className="mt-2 list-disc pl-5">
              <li>A Google Drive folder link, or</li>
              <li>A local file path on this machine.</li>
            </ul>
          </div>
        </Card>

        <div className="mt-6">
          <Link href="/dashboard">
            <Button variant="ghost">Back to dashboards</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
