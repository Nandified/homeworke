import Link from "next/link";
import { Button, Card, Container } from "@/components/ui";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Contact</div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Contact Homeworke</h1>

        <Card className="mt-6 p-6">
          <div className="text-sm font-semibold">Fastest path</div>
          <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">Use the demo form for office/team inquiries.</div>
          <div className="mt-4">
            <Link href="/real-estate-pros#demo">
              <Button>Schedule a demo</Button>
            </Link>
          </div>
        </Card>

        <div className="mt-6">
          <Link href="/">
            <Button variant="ghost">Back home</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
