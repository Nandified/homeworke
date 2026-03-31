"use client";

import * as React from "react";

import { Input } from "@/components/ui";

type GoogleAutocomplete = {
  addListener: (eventName: string, handler: () => void) => void;
  getPlace: () => { formatted_address?: string };
};

type GooglePlacesApi = {
  maps: {
    places: {
      Autocomplete: new (
        el: HTMLInputElement,
        opts: {
          types?: string[];
          componentRestrictions?: { country: string };
          fields?: string[];
        }
      ) => GoogleAutocomplete;
    };
  };
};

declare global {
  interface Window {
    google?: GooglePlacesApi;
  }
}

let loadingPromise: Promise<void> | null = null;

function loadGooglePlaces(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();

  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!key) {
    return Promise.reject(new Error("missing_NEXT_PUBLIC_GOOGLE_PLACES_API_KEY"));
  }

  if (!loadingPromise) {
    loadingPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-google-places="1"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("google_places_script_failed")));
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.googlePlaces = "1";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("google_places_script_failed"));
      document.head.appendChild(script);
    });
  }

  return loadingPromise;
}

export function AddressAutocomplete(props: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Defaults to US. */
  country?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const acRef = React.useRef<GoogleAutocomplete | null>(null);

  React.useEffect(() => {
    let alive = true;

    loadGooglePlaces()
      .then(() => {
        if (!alive) return;
        const el = inputRef.current;
        if (!el) return;

        // Avoid double-binding.
        if (acRef.current) return;

        const google = window.google;
        if (!google?.maps?.places?.Autocomplete) return;

        const ac = new google.maps.places.Autocomplete(el, {
          types: ["address"],
          componentRestrictions: props.country ? { country: props.country } : undefined,
          fields: ["formatted_address"],
        });

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const formatted = place?.formatted_address || "";
          if (formatted) props.onChange(formatted);
        });

        acRef.current = ac;
      })
      .catch(() => {
        // Silent fallback: user can still type full address.
      });

    return () => {
      alive = false;
      // Google Autocomplete doesn't have a clean destroy API; leaving it is fine.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Input
      ref={inputRef}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      className={props.className}
      disabled={props.disabled}
      autoComplete="street-address"
    />
  );
}
