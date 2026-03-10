"use client";

import { useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import copy from "@/content/demo_request_opus.json";

type Status = "idle" | "submitting" | "success" | "error";

export function DemoForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const labels = useMemo(() => {
    return {
      fullName: "Full name",
      workEmail: "Work email",
      companyName: "Company",
      jobTitle: "Role",
      message: "Message (optional)",
    };
  }, []);

  async function onSubmit(formData: FormData) {
    setStatus("submitting");
    setError(null);

    const payload = {
      fullName: String(formData.get("fullName") || ""),
      workEmail: String(formData.get("workEmail") || ""),
      companyName: String(formData.get("companyName") || ""),
      jobTitle: String(formData.get("jobTitle") || ""),
      message: String(formData.get("message") || ""),
      website: String(formData.get("website") || ""),
    };

    const res = await fetch("/api/demo-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setStatus("success");
      return;
    }

    const data = (await res.json().catch(() => null)) as any;
    setStatus("error");
    setError(data?.message || copy.api.responseErrorMessage);
  }

  return (
    <Card className="mt-10 p-6" id="demo">
      <div className="text-xl font-extrabold tracking-tight">Schedule a demo</div>
      <div className="mt-2 text-sm text-[var(--hw-muted)]">{copy.ui.privacyNote}</div>

      {status === "success" ? (
        <div className="mt-6 rounded-2xl border border-[var(--hw-line)] bg-white p-5">
          <div className="text-sm font-semibold">{copy.ui.successTitle}</div>
          <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{copy.ui.successBody}</div>
        </div>
      ) : (
        <form
          className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2"
          action={onSubmit as any}
        >
          {/* honeypot */}
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          {copy.api.fields.map((f) => (
            <label key={f} className={f === "message" ? "md:col-span-2" : ""}>
              <div className="mb-1 text-sm font-semibold text-[var(--hw-ink)]">{(labels as any)[f] ?? f}</div>
              {f === "message" ? (
                <textarea
                  name={f}
                  rows={4}
                  className="w-full rounded-2xl border border-[var(--hw-line)] bg-white px-4 py-3 text-sm outline-none focus:border-[rgba(229,57,53,.35)]"
                  placeholder={f}
                />
              ) : (
                <input
                  name={f}
                  className="h-11 w-full rounded-2xl border border-[var(--hw-line)] bg-white px-4 text-sm outline-none focus:border-[rgba(229,57,53,.35)]"
                  placeholder={f}
                />
              )}
            </label>
          ))}

          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? copy.ui.submittingLabel : copy.ui.submitLabel}
            </Button>
            {status === "error" ? (
              <div className="text-sm text-[var(--hw-red)]">{error}</div>
            ) : null}
          </div>
        </form>
      )}
    </Card>
  );
}
