"use client";

import * as React from "react";

import { loadPartner } from "@/lib/partner-context";

function initials(name: string) {
  const parts = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters = parts.slice(0, 3).map((p) => p[0] ?? "");
  return (letters.join("") || "?").toUpperCase();
}

export const PROFILE_STORAGE_KEYS = {
  fullName: "hw_profile_fullName_v1",
  photoDataUrl: "hw_profile_photoDataUrl_v1",
} as const;

const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

function demoPhotoForPartner(partnerId: string | null | undefined) {
  if (!partnerId) return "";
  if (partnerId === "frj") return "/partners/frj-headshot.jpg";
  return "";
}

export function useStoredProfile() {
  const [profile, setProfile] = React.useState<{ fullName: string; photoDataUrl: string }>(() => ({
    fullName: "",
    photoDataUrl: "",
  }));

  const isProPortal = typeof window !== "undefined" && window.location.pathname.startsWith("/pro");

  // Use layout effect so nav/refresh doesn't paint placeholder initials before we hydrate from storage.
  useIsoLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      let fullName = window.localStorage.getItem(PROFILE_STORAGE_KEYS.fullName) || "";
      let photoDataUrl = window.localStorage.getItem(PROFILE_STORAGE_KEYS.photoDataUrl) || "";

      // If we previously seeded placeholder initials (e.g. YRE), replace them with a better default for the PRO portal.
      const isPlaceholder = (s: string) => (s || "").trim().toUpperCase() === "YRE";
      if (isProPortal && isPlaceholder(fullName)) {
        fullName = "";
        photoDataUrl = "";
        try {
          window.localStorage.removeItem(PROFILE_STORAGE_KEYS.fullName);
          window.localStorage.removeItem(PROFILE_STORAGE_KEYS.photoDataUrl);
        } catch {}
      }

      // localStorage doesn't sync across devices. If we have a partner context, seed a sensible
      // default so the portal doesn't fall back to placeholder initials.
      if (!fullName) {
        const partner = loadPartner();
        let seededName = partner?.partnerName || "";
        let seededPhoto = demoPhotoForPartner(partner?.partnerId) || "";

        // Until auth/user profiles are wired, the PRO portal uses a demo context.
        // If no partner context exists (common on mobile), seed FRJ defaults.
        if (!seededName && typeof window !== "undefined" && window.location.pathname.startsWith("/pro")) {
          seededName = "Fernando Rocha Jr";
          seededPhoto = "/partners/frj-headshot.jpg";
        }

        if (seededName) window.localStorage.setItem(PROFILE_STORAGE_KEYS.fullName, seededName);
        if (seededPhoto) window.localStorage.setItem(PROFILE_STORAGE_KEYS.photoDataUrl, seededPhoto);
        if (seededName || seededPhoto) {
          setProfile({ fullName: seededName, photoDataUrl: seededPhoto });
          return;
        }
      }

      setProfile({ fullName, photoDataUrl });
    } catch {
      // ignore
    }
  }, []);

  return profile;
}

export function UserAvatar(props: {
  fullName?: string;
  photoUrl?: string;
  size?: number;
  className?: string;
}) {
  const size = props.size ?? 32;
  const text = initials(props.fullName || "");

  return (
    <div
      className={
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--hw-line)] bg-[var(--hw-soft)] text-[var(--hw-ink)] " +
        (props.className || "")
      }
      style={{ width: size, height: size }}
      aria-label={props.fullName ? `Profile: ${props.fullName}` : "Profile"}
    >
      {props.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={props.photoUrl} alt="Profile" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[11px] font-extrabold tracking-tight">{text}</span>
      )}
    </div>
  );
}
