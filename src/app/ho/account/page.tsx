"use client";

import * as React from "react";

import { HO_NAV } from "@/components/ho/nav";
import { PortalShell } from "@/components/portal-shell";

import { Button, Card, CardHeader, Checkbox, Divider, Input, Label, Modal, Pill } from "@/components/ui";

async function fileToSmallJpegDataUrl(file: File, maxSize = 256, quality = 0.82): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read_failed"));
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  });

  if (!dataUrl) return "";

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("img_load_failed"));
    i.src = dataUrl;
  });

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return dataUrl;

  const scale = Math.min(1, maxSize / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, cw, ch);

  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters = parts.slice(0, 3).map((p) => p[0] ?? "");
  return letters.join("").toUpperCase();
}

function formatPhone(digits: string) {
  const d = (digits || "").replace(/\D/g, "").slice(0, 10);
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);
  if (!d) return "";
  if (d.length < 4) return `(${a}`;
  if (d.length < 7) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

function Toggle({ label, value, onChange, help }: { label: string; value: boolean; onChange: (v: boolean) => void; help?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[14px] border border-[var(--hw-line)] bg-white p-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[var(--hw-ink)]">{label}</div>
        {help ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{help}</div> : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={
          "relative h-7 w-12 rounded-full border transition-all " +
          (value ? "border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.95)]" : "border-[var(--hw-line)] bg-[var(--hw-soft)]")
        }
        aria-pressed={value}
        aria-label={label}
      >
        <span className={"absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all " + (value ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  );
}

// HO portal must NOT share account/profile localStorage with PRO.
const HO_PROFILE_STORAGE_KEYS = {
  fullName: "hw_profile_fullName_v1__HO",
  photoDataUrl: "hw_profile_photoDataUrl_v1__HO",
} as const;

const HO_ACCOUNT_STORAGE_KEYS = {
  phone: "hw_profile_phone_v1__HO",
  contactEmail: "hw_profile_contactEmail_v1__HO",
  loginEmail: "hw_profile_loginEmail_v1__HO",
  smsOn: "hw_profile_smsOn_v1__HO",
  emailOn: "hw_profile_emailOn_v1__HO",
} as const;

export default function Page() {
  const [toast, setToast] = React.useState<string | null>(null);

  const [photoPreview, setPhotoPreview] = React.useState<string>("");
  const [photoFileName, setPhotoFileName] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [profileEditing, setProfileEditing] = React.useState(false);

  const [fullName, setFullName] = React.useState("Your Homeowner");
  const [phone, setPhone] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");

  const DEFAULT_LOGIN_EMAIL = "you@example.com";
  const [loginEmail, setLoginEmail] = React.useState(DEFAULT_LOGIN_EMAIL);

  const [smsOn, setSmsOn] = React.useState(true);
  const [emailOn, setEmailOn] = React.useState(true);

  const [changeEmailOpen, setChangeEmailOpen] = React.useState(false);
  const [nextEmail, setNextEmail] = React.useState("");

  const [resetPasswordOpen, setResetPasswordOpen] = React.useState(false);

  const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

  useIsoLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedName = window.localStorage.getItem(HO_PROFILE_STORAGE_KEYS.fullName) || "";
      const storedPhoto = window.localStorage.getItem(HO_PROFILE_STORAGE_KEYS.photoDataUrl) || "";
      const storedPhone = window.localStorage.getItem(HO_ACCOUNT_STORAGE_KEYS.phone) || "";
      const storedContactEmail = window.localStorage.getItem(HO_ACCOUNT_STORAGE_KEYS.contactEmail) || "";
      const storedLoginEmail = window.localStorage.getItem(HO_ACCOUNT_STORAGE_KEYS.loginEmail) || "";
      const storedSmsOn = window.localStorage.getItem(HO_ACCOUNT_STORAGE_KEYS.smsOn);
      const storedEmailOn = window.localStorage.getItem(HO_ACCOUNT_STORAGE_KEYS.emailOn);

      if (storedName) setFullName(storedName);
      if (storedPhoto) setPhotoPreview(storedPhoto);
      if (storedPhone) setPhone(storedPhone);
      if (storedContactEmail) setContactEmail(storedContactEmail);
      if (storedLoginEmail) setLoginEmail(storedLoginEmail);
      if (storedSmsOn != null) setSmsOn(storedSmsOn === "1");
      if (storedEmailOn != null) setEmailOn(storedEmailOn === "1");
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HO_PROFILE_STORAGE_KEYS.fullName, fullName || "");
    } catch {}
  }, [fullName]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HO_ACCOUNT_STORAGE_KEYS.phone, phone || "");
    } catch {}
  }, [phone]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HO_ACCOUNT_STORAGE_KEYS.contactEmail, contactEmail || "");
    } catch {}
  }, [contactEmail]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HO_ACCOUNT_STORAGE_KEYS.loginEmail, loginEmail || "");
    } catch {}
  }, [loginEmail]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HO_ACCOUNT_STORAGE_KEYS.smsOn, smsOn ? "1" : "0");
    } catch {}
  }, [smsOn]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HO_ACCOUNT_STORAGE_KEYS.emailOn, emailOn ? "1" : "0");
    } catch {}
  }, [emailOn]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (photoPreview) window.localStorage.setItem(HO_PROFILE_STORAGE_KEYS.photoDataUrl, photoPreview);
      else window.localStorage.removeItem(HO_PROFILE_STORAGE_KEYS.photoDataUrl);
    } catch {
      setToast("Profile photo couldn’t be saved (storage full)");
    }
  }, [photoPreview]);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <PortalShell role="HO" title="My Account" portalTitle="Homeowner" nav={HO_NAV as any} hideHeading>
      <div className="grid gap-4">
        {/* PROFILE */}
        <Card className="p-5 sm:p-6">
          <CardHeader title="My Account" subtitle="Profile and preferences." className="mb-5" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Profile</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Keep your contact details up to date.</div>
            </div>
            <div className="flex items-center gap-2">
              {!profileEditing ? (
                <Button size="sm" variant="secondary" onClick={() => setProfileEditing(true)}>
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setProfileEditing(false);
                      setToast("Profile updated (stub)");
                    }}
                  >
                    Save profile
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setProfileEditing(false)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          <Divider className="my-5" />

          <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
            <div className="flex flex-col items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  fileToSmallJpegDataUrl(file)
                    .then((result) => {
                      if (!result) return;
                      setPhotoPreview(result);
                      setPhotoFileName(file.name);
                      setToast("Photo selected");
                    })
                    .catch(() => setToast("Could not read image"));
                }}
              />

              <button
                type="button"
                className={
                  "relative overflow-visible rounded-[22px] border border-[var(--hw-line)] bg-white shadow-sm transition " +
                  (profileEditing ? "cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,.08)]" : "cursor-default")
                }
                onClick={() => {
                  if (!profileEditing) return;
                  fileInputRef.current?.click();
                }}
                aria-label={profileEditing ? "Upload profile photo" : "Profile photo"}
              >
                <div className="relative overflow-hidden rounded-[22px]">
                  <div className="h-36 w-28 bg-[var(--hw-soft)]">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoPreview} alt="Profile" className="h-full w-full object-cover object-top" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">
                        {initials(fullName)}
                      </div>
                    )}
                  </div>

                  {profileEditing ? (
                    <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-b from-transparent via-transparent to-black/40 p-2">
                      <div className="rounded-full border border-[rgba(229,57,53,.18)] bg-white/85 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--hw-ink)] shadow-sm">
                        Change photo
                      </div>
                    </div>
                  ) : null}
                </div>

                {!profileEditing ? (
                  <Pill className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-[rgba(229,57,53,.18)] bg-[linear-gradient(135deg,rgba(229,57,53,.10),rgba(229,57,53,.02))] text-[var(--hw-ink)] shadow-sm">
                    HO
                  </Pill>
                ) : null}
              </button>

              {profileEditing && photoFileName ? (
                <div className="w-full text-center text-[11px] text-[var(--hw-muted)]">
                  <div className="truncate">Photo: {photoFileName}</div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className="text-xs">Full name</Label>
                {profileEditing ? (
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                ) : (
                  <div className="rounded-[14px] border border-[var(--hw-line)] bg-white px-4 py-3 text-sm text-[var(--hw-ink)]">{fullName}</div>
                )}
              </div>

              <div className="grid items-start gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-xs">Phone</Label>
                  {profileEditing ? (
                    <Input
                      inputMode="tel"
                      autoComplete="tel"
                      value={formatPhone(phone)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone(digits);
                      }}
                      placeholder="(000) 000-0000"
                    />
                  ) : (
                    <Input readOnly value={phone ? formatPhone(phone) : ""} placeholder="Not set" className="text-[var(--hw-ink)]" />
                  )}
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Contact email</Label>
                  {profileEditing ? (
                    <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@example.com" />
                  ) : (
                    <Input readOnly value={contactEmail} placeholder="Not set" className="text-[var(--hw-ink)]" />
                  )}
                  <div className="text-xs text-[var(--hw-muted)]">Used for receipts and updates.</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* LOGIN EMAIL */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Login email</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">This email is used to sign in. Update it if you lose access to your old email.</div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setChangeEmailOpen(true)}>
              Change login email
            </Button>
          </div>

          <div className="mt-4">
            <Input readOnly value={loginEmail} className={loginEmail === DEFAULT_LOGIN_EMAIL ? "text-[var(--hw-muted)]" : "text-[var(--hw-ink)]"} />
          </div>
          <div className="mt-2 text-xs text-[var(--hw-muted)]">Changing login email requires verification.</div>
        </Card>

        {/* SECURITY */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Password Reset</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Send yourself a secure link to reset your password.</div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setResetPasswordOpen(true)}>
              Send reset link
            </Button>
          </div>
          <div className="mt-4 text-sm leading-7 text-[var(--hw-muted)]">We’ll email you a secure link to reset your password.</div>
        </Card>

        {/* NOTIFICATIONS */}
        <Card className="p-5 sm:p-6">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Notifications</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Choose how you want to receive updates.</div>
          </div>

          <div className="mt-5 grid gap-3">
            <Toggle label="SMS notifications" value={smsOn} onChange={setSmsOn} help="Recommended for time-sensitive updates." />
            <Toggle label="Email notifications" value={emailOn} onChange={setEmailOn} help="Receipts, summaries, and important alerts." />

            <div className="pt-2">
              <Checkbox
                checked
                readOnly
                label="By enabling SMS, you agree to receive messages related to your Homeworke activity. Message & data rates may apply."
              />
            </div>

            <div className="flex items-center justify-end">
              <Button size="sm" variant="secondary" onClick={() => setToast("Preferences saved (stub)")}>Save preferences</Button>
            </div>
          </div>
        </Card>

        {/* ACCOUNT ACTIONS */}
        <Card className="p-5 sm:p-6">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">Account actions</div>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">Sign out of this device.</div>
          <div className="mt-5 flex items-center justify-end">
            <Button variant="secondary" onClick={() => setToast("Logged out (stub)")}>Log out</Button>
          </div>
        </Card>
      </div>

      {/* MODALS */}
      <Modal
        open={changeEmailOpen}
        title="Change login email"
        onClose={() => {
          setChangeEmailOpen(false);
          setNextEmail("");
        }}
      >
        <div className="grid gap-4">
          <div className="text-sm text-[var(--hw-muted)]">We’ll send a verification link to your new login email.</div>
          <div className="grid gap-2">
            <Label className="text-xs">New email</Label>
            <Input value={nextEmail} onChange={(e) => setNextEmail(e.target.value)} placeholder="name@email.com" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setChangeEmailOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (!nextEmail.trim()) return;
                setChangeEmailOpen(false);
                setToast("Verification email sent (stub)");
                setLoginEmail(nextEmail.trim());
                setNextEmail("");
              }}
            >
              Send verification
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={resetPasswordOpen} title="Reset password" onClose={() => setResetPasswordOpen(false)}>
        <div className="grid gap-4">
          <div className="text-sm text-[var(--hw-muted)]">
            We’ll email a secure reset link to <span className="font-semibold text-[var(--hw-ink)]">{loginEmail}</span>.
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setResetPasswordOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setResetPasswordOpen(false);
                setToast("Reset link sent (stub)");
              }}
            >
              Send reset link
            </Button>
          </div>
        </div>
      </Modal>

      {/* TOAST */}
      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 w-[340px] max-w-[calc(100vw-40px)]">
          <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,.1)]">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">{toast}</div>
          </div>
        </div>
      ) : null}
    </PortalShell>
  );
}
