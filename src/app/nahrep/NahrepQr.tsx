"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import QRCode from "qrcode";

export function NahrepQr() {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [joinUrl, setJoinUrl] = useState("/request-access?source=nahrep");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = new URL("/request-access", window.location.origin);
      url.searchParams.set("role", "real-estate-pro");
      url.searchParams.set("source", "nahrep");
      url.searchParams.set("campaign", "early-access");
      const nextJoinUrl = url.toString();

      if (!cancelled) setJoinUrl(nextJoinUrl);

      try {
        const dataUrl = await QRCode.toDataURL(nextJoinUrl, {
          color: {
            dark: "#111827",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "H",
          margin: 2,
          width: 420,
        });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch {
        if (!cancelled) setQrDataUrl("");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-[24px] border border-[rgba(229,57,53,.25)] bg-white p-4 shadow-[0_18px_44px_rgba(17,24,39,.12)]">
      <div className="mb-4 rounded-[18px] border border-[rgba(17,24,39,.08)] bg-white px-4 py-3 shadow-[0_12px_28px_rgba(17,24,39,.06)]">
        <Image
          src="/brand/nahrep-web-logo.png"
          alt="NAHREP"
          width={380}
          height={100}
          priority
          className="mx-auto h-auto w-full max-w-[260px]"
        />
      </div>
      <div className="rounded-[18px] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="QR code to request Homeworke early access"
            className="aspect-square w-full rounded-[14px] bg-white"
          />
        ) : (
          <div className="aspect-square w-full animate-pulse rounded-[14px] bg-white" />
        )}
      </div>
      <div className="mt-4 text-center">
        <div className="text-sm font-extrabold text-[var(--hw-ink)]">Scan for early access</div>
        <div className="mx-auto mt-1 max-w-[18rem] break-all text-xs leading-5 text-[var(--hw-muted)]">{joinUrl}</div>
      </div>
    </div>
  );
}
