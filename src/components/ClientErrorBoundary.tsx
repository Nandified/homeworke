"use client";

import * as React from "react";

export function ClientErrorBoundary(props: {
  children: React.ReactNode;
  title?: string;
  hint?: string;
}) {
  const [err, setErr] = React.useState<Error | null>(null);

  if (err) {
    return (
      <div className="rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.05)] p-5">
        <div className="text-sm font-semibold text-[var(--hw-ink)]">{props.title || "Something went wrong"}</div>
        <div className="mt-2 text-sm text-[var(--hw-muted)]">{props.hint || "Please refresh and try again."}</div>
        <div className="mt-3 rounded-[14px] border border-[var(--hw-line)] bg-white p-3 text-xs text-[var(--hw-ink)]/80">
          <div className="font-semibold">Client error</div>
          <div className="mt-1 whitespace-pre-wrap break-words">{String(err.message || err)}</div>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5 text-sm text-[var(--hw-muted)]">Loading…</div>}>
      <Boundary onError={setErr}>{props.children}</Boundary>
    </React.Suspense>
  );
}

class Boundary extends React.Component<{ children: React.ReactNode; onError: (e: Error) => void }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
