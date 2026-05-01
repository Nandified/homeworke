"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Zap } from "lucide-react";

import { Button, Card } from "@/components/ui";
import { stageFile } from "@/lib/staged-files";

export function InstantEstimateCard({ basePath }: { basePath: string }) {
  const router = useRouter();
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(f: File) {
    try {
      const id = await stageFile(f);
      router.push(`${basePath}/express-estimate?staged=${encodeURIComponent(id)}`);
    } catch {
      router.push(`${basePath}/express-estimate`);
    }
  }

  return (
    <Card
      className="relative overflow-hidden border-[rgba(229,57,53,.35)] p-6 md:p-7"
      style={{ boxShadow: "0 10px 30px rgba(229,57,53,.06)" }}
    >
      {/* Glow accents (kept on mobile but contained so they don't bleed past corners) */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-40 w-40 -translate-y-1/3 translate-x-1/3 rounded-full bg-[var(--hw-red)]/18 blur-[50px] sm:-right-24 sm:-top-24 sm:h-64 sm:w-64 sm:translate-x-0 sm:translate-y-0 sm:bg-[var(--hw-red)]/20 sm:blur-[60px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 bottom-0 h-32 w-32 -translate-x-1/3 translate-y-1/3 rounded-full bg-[var(--hw-red)]/10 blur-[55px] sm:-left-24 sm:h-48 sm:w-48 sm:translate-x-0 sm:translate-y-0 sm:blur-[70px]"
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
              <Zap className="h-3.5 w-3.5 text-[var(--hw-red)]" />
              Instant estimate
            </div>
            <div className="mt-2 text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">Instant Estimate</div>
          </div>
          <div className="shrink-0">
            <Link href={`${basePath}/express-estimate`}>
              <Button variant="secondary" size="sm">
                Open Estimates
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-2 text-sm leading-relaxed text-[var(--hw-muted)]">
          Help clients currently buying or selling a Home. Submit a{" "}
          <span className="font-semibold text-[var(--hw-ink)]">Home Inspection</span>,{" "}
          <span className="font-semibold text-[var(--hw-ink)]">Village Inspection</span>, or{" "}
          <span className="font-semibold text-[var(--hw-ink)]">Appraisal</span> report to get a{" "}
          <span className="font-semibold text-[var(--hw-ink)]">Free Instant Express Estimate</span> of repair costs.
        </div>

        <div className="mt-5">
          <label
            className="block cursor-pointer rounded-[var(--hw-radius-lg)] border border-dashed border-[rgba(17,24,39,.22)] bg-[var(--hw-soft)] p-4 hover:bg-white"
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const f = e.dataTransfer.files?.[0] ?? null;
              if (!f) return;
              if (f.type && f.type !== "application/pdf") return;
              void handleFile(f);
            }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Choose a PDF to upload</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Drag & drop or click to browse.</div>
              </div>
              <div className="shrink-0">
                <Button
                  size="md"
                  variant="primary"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    pdfInputRef.current?.click();
                  }}
                >
                  Upload report
                </Button>
              </div>
            </div>
            <input
              ref={pdfInputRef}
              className="hidden"
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (!f) return;
                void handleFile(f);
              }}
            />
          </label>
        </div>
      </div>
    </Card>
  );
}
