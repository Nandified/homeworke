import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <main className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-white px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(229,57,53,.14),transparent_55%),radial-gradient(circle_at_0%_30%,rgba(229,57,53,.08),transparent_45%),radial-gradient(circle_at_100%_45%,rgba(17,24,39,.06),transparent_45%)]" />
      <Suspense fallback={null}>
        <LoginClient />
      </Suspense>
    </main>
  );
}
