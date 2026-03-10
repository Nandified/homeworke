import { Container } from "@/components/ui";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Legal</div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <div className="mt-4 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
          Placeholder. We will replace with final policy copy.
        </div>
      </Container>
    </div>
  );
}
