export default function Page() {
  return (
    <div className="wrap">
      <div className="pill">Homeworke 3.0 rebuild · Spec locked</div>
      <h1 style={{ marginTop: 12, fontSize: 36, letterSpacing: "-0.02em" }}>Homeworke 3.0</h1>
      <p style={{ color: "var(--hw-muted)", lineHeight: 1.6, maxWidth: 760 }}>
        Rebuild in progress. This repo is being reconstructed from the approved Source of Truth. No features are considered
        final until they are implemented against that spec.
      </p>

      <div className="card" style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 800 }}>Source of Truth</div>
        <p style={{ color: "var(--hw-muted)", lineHeight: 1.6 }}>
          See <code>HOMEWORKE_3.0_SOURCE_OF_TRUTH.md</code> in the repo root.
        </p>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 800 }}>Archive</div>
        <p style={{ color: "var(--hw-muted)", lineHeight: 1.6 }}>
          Previous work has been preserved under <code>archive/v0/</code>.
        </p>
      </div>
    </div>
  );
}
