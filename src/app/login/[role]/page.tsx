import LoginClient from "../LoginClient";

export default async function RoleLoginPage(props: { params: Promise<{ role: string }> }) {
  const params = await props.params;
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[var(--hw-surface)] px-4 py-10">
      <LoginClient role={params.role} />
    </main>
  );
}
