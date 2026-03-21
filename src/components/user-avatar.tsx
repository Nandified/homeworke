"use client";

import * as React from "react";

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

export function useStoredProfile() {
  const [profile, setProfile] = React.useState<{ fullName: string; photoDataUrl: string }>(() => ({
    fullName: "",
    photoDataUrl: "",
  }));

  // Use layout effect so nav/refresh doesn't paint placeholder initials before we hydrate from storage.
  useIsoLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const fullName = window.localStorage.getItem(PROFILE_STORAGE_KEYS.fullName) || "";
      const photoDataUrl = window.localStorage.getItem(PROFILE_STORAGE_KEYS.photoDataUrl) || "";
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
