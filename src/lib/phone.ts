export function formatPhoneUS(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");

  // Allow leading 1.
  const d = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);

  if (!a) return "";
  if (a.length < 3) return `(${a}`;
  if (!b) return `(${a}) `;
  if (b.length < 3) return `(${a}) ${b}`;
  if (!c) return `(${a}) ${b}-`;
  return `(${a}) ${b}-${c}`;
}
