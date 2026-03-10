import Link from "next/link";
import { Button, Card, Container, Pill } from "@/components/ui";

const DOC_URL =
  "https://docs.google.com/document/d/1qN8taOXV24NNe3pXdpOvJw79i8jgTD51_pl6S9WXQcQ/edit?usp=drivesdk";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Reference</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Homeworke 2.0 walkthrough</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              This is your recorded walkthrough for how Homeworke 2.0 is set up today. We’ll use it to ensure the 3.0
              dashboards and workflows match reality.
            </div>
          </div>
          <Pill>source of truth</Pill>
        </div>

        <Card className="mt-6 p-6">
          <div className="text-sm font-semibold">Walkthrough doc</div>
          <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
            <a className="font-semibold text-[var(--hw-red)] underline" href={DOC_URL} target="_blank" rel="noreferrer">
              Open the Homeworke 2.0 walkthrough (Google Doc)
            </a>
            <div className="mt-3 text-sm text-[var(--hw-muted)]">
              Next step: I’ll extract the key screens and map each to the appropriate Dashboard lane (HO / PRO / SP / HG /
              PM / ADM) based on the ship checklist.
            </div>
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
