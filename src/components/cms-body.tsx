export function CmsBody({ body }: { body: string }) {
  const parts = body
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="prose prose-neutral max-w-none">
      {parts.map((p, idx) => (
        <p key={idx}>{p}</p>
      ))}
    </div>
  );
}
