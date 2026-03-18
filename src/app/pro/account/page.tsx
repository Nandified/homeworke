"use client";

import * as React from "react";

import { PRO_NAV } from "@/components/pro/nav";
import { PortalShell } from "@/components/portal-shell";
import { Button, Card, Checkbox, Divider, EmptyState, Input, Label, Modal, Pill } from "@/components/ui";

const BROKERAGE_OPTIONS = [
  "RE/MAX Loyalty",
  "RE/MAX United",
  "RE/MAX Legends",
  "Compass",
  "Coldwell Banker Realty",
  "Berkshire Hathaway HomeServices",
  "@properties Christie’s International Real Estate",
  "Keller Williams",
  "Century 21",
] as const;

function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  // Use up to 3 initials (e.g., "Fernando Rocha Jr" → "FRJ").
  // We prefer first three tokens rather than first+last to preserve suffixes like Jr/Sr.
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
          (value
            ? "border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.95)]"
            : "border-[var(--hw-line)] bg-[var(--hw-soft)]")
        }
        aria-pressed={value}
        aria-label={label}
      >
        <span
          className={
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all " +
            (value ? "left-[22px]" : "left-0.5")
          }
        />
      </button>
    </div>
  );
}

export default function Page() {
  // Phase 1: UI only; pull from demo/local context later.
  const [toast, setToast] = React.useState<string | null>(null);

  const [photoPreview, setPhotoPreview] = React.useState<string>("");
  const [photoFileName, setPhotoFileName] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [profileEditing, setProfileEditing] = React.useState(false);

  const [fullName, setFullName] = React.useState("Your Real Estate Pro");
  const [office, setOffice] = React.useState("");
  // Store digits only; render as (773) 000-0000
  const [phone, setPhone] = React.useState("");

  // Contact email: shown to clients in the product (marketing / sharing context)
  const [contactEmail, setContactEmail] = React.useState("you@example.com");

  // Login email: used for authentication + password reset
  const [loginEmail, setLoginEmail] = React.useState("you@example.com");

  const [smsOn, setSmsOn] = React.useState(true);
  const [emailOn, setEmailOn] = React.useState(true);

  const [changeEmailOpen, setChangeEmailOpen] = React.useState(false);
  const [nextEmail, setNextEmail] = React.useState("");

  const [resetPasswordOpen, setResetPasswordOpen] = React.useState(false);

  const [addCardOpen, setAddCardOpen] = React.useState(false);

  const [deleteAccountOpen, setDeleteAccountOpen] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState("");

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <PortalShell
      role="PRO"
      title="My Account"
      portalTitle="Real Estate Pro"
      description="Profile, security, and preferences."
      nav={PRO_NAV}
    >
      <div className="grid gap-4">
        {/* PROFILE */}
        <Card className="p-5 sm:p-6">
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

          <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt="Profile"
                    className="h-28 w-28 rounded-[22px] border border-[var(--hw-line)] bg-white object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-[22px] border border-[var(--hw-line)] bg-[var(--hw-soft)] text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">
                    {initials(fullName)}
                  </div>
                )}
                <Pill className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  PRO
                </Pill>
              </div>

              {profileEditing ? (
                <div className="grid w-full gap-2">
                  <Label className="text-xs">Profile photo</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      setPhotoPreview(url);
                      setPhotoFileName(file.name);
                      setToast("Photo selected (stub)");
                    }}
                  />

                  <div className="grid gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      Choose photo…
                    </Button>
                    <div className="text-xs text-[var(--hw-muted)]">
                      {photoFileName ? (
                        <span className="inline-flex max-w-full truncate rounded-full border border-[var(--hw-line)] bg-white px-3 py-1 shadow-sm">
                          {photoFileName}
                        </span>
                      ) : (
                        "PNG, JPG up to ~5MB"
                      )}
                    </div>
                  </div>
                  {photoPreview ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPhotoPreview("");
                        setToast("Photo removed (stub)");
                      }}
                    >
                      Remove photo
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className="text-xs">Full name</Label>
                {profileEditing ? (
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                ) : (
                  <div className="rounded-[14px] border border-[var(--hw-line)] bg-white px-4 py-3 text-sm text-[var(--hw-ink)]">
                    {fullName}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-xs">Office / Brokerage</Label>
                {profileEditing ? (
                  <>
                    <Input
                      value={office}
                      onChange={(e) => setOffice(e.target.value)}
                      placeholder="Start typing to search…"
                      list="hw_brokerage_list"
                    />
                    <datalist id="hw_brokerage_list">
                      {BROKERAGE_OPTIONS.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                    <div className="text-xs text-[var(--hw-muted)]">
                      Pick from the list when possible to keep brokerage names consistent (we’ll wire a full directory next).
                    </div>
                  </>
                ) : (
                  <div className="rounded-[14px] border border-[var(--hw-line)] bg-white px-4 py-3 text-sm text-[var(--hw-ink)]">
                    {office || <span className="text-[var(--hw-muted)]">Not set</span>}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                    <div className="flex h-11 items-center rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm text-[var(--hw-ink)]">
                      {phone ? formatPhone(phone) : <span className="text-[var(--hw-muted)]">Not set</span>}
                    </div>
                  )}
                  {/* Format hint removed */}
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Contact email</Label>
                  {profileEditing ? (
                    <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="name@company.com" />
                  ) : (
                    <div className="rounded-[14px] border border-[var(--hw-line)] bg-white px-4 py-3 text-sm text-[var(--hw-ink)]">
                      <span className="block truncate">{contactEmail || <span className="text-[var(--hw-muted)]">Not set</span>}</span>
                    </div>
                  )}
                  <div className="text-xs text-[var(--hw-muted)]">This is the email clients may see on shared assets.</div>
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
              <div className="mt-1 text-sm text-[var(--hw-muted)]">
                This email is used to sign in. If you switch brokerages and lose access to your old work email, update it here.
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setChangeEmailOpen(true)}>
              Change login email
            </Button>
          </div>

          <div className="mt-4 rounded-[14px] border border-[var(--hw-line)] bg-white px-4 py-3 text-sm text-[var(--hw-ink)]">
            <span className="block truncate">{loginEmail}</span>
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
          <div className="mt-4 text-sm leading-7 text-[var(--hw-muted)]">
            We’ll email you a secure link to reset your password.
          </div>
        </Card>

        {/* NOTIFICATIONS */}
        <Card className="p-5 sm:p-6">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Notifications</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Choose how you want to receive updates.</div>
          </div>

          <div className="mt-5 grid gap-3">
            <Toggle
              label="SMS notifications"
              value={smsOn}
              onChange={setSmsOn}
              help="Recommended for time-sensitive updates."
            />
            <Toggle label="Email notifications" value={emailOn} onChange={setEmailOn} help="Receipts, summaries, and important alerts." />

            <div className="pt-2">
              <Checkbox
                checked
                readOnly
                label="By enabling SMS, you agree to receive messages related to your Homeworke activity. Message & data rates may apply."
              />
            </div>

            <div className="flex items-center justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setToast("Preferences saved (stub)")}
              >
                Save preferences
              </Button>
            </div>
          </div>
        </Card>

        {/* PAYMENTS */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Payments</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Manage your saved payment methods (Stripe).</div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setAddCardOpen(true)}>
              Add payment method
            </Button>
          </div>

          <div className="mt-5">
            <EmptyState
              title="No payment methods yet"
              text="Add a card to speed up checkout for services, reports, and future upgrades."
              action={
                <Button variant="secondary" onClick={() => setAddCardOpen(true)}>
                  Add payment method
                </Button>
              }
            />
          </div>
        </Card>

        {/* INTEGRATIONS */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Integrations</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Connect tools to streamline scheduling and follow-ups.</div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setToast("Google Calendar connect (stub)")}
            >
              Connect Google Calendar
            </Button>
          </div>
          <div className="mt-4 text-sm leading-7 text-[var(--hw-muted)]">
            Coming next: CRM sync (Follow Up Boss, BoldTrail) and event-driven tasks.
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

        {/* DANGER ZONE */}
        <Card className="p-5 sm:p-6 border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.03)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Danger zone</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">
                Delete your account and remove your data. This cannot be undone.
              </div>
            </div>
            <Button size="sm" variant="destructive" onClick={() => setDeleteAccountOpen(true)}>
              Delete account
            </Button>
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
          <div className="text-sm text-[var(--hw-muted)]">
            We’ll send a verification link to your new login email. You’ll use that email the next time you sign in.
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">New email</Label>
            <Input value={nextEmail} onChange={(e) => setNextEmail(e.target.value)} placeholder="name@company.com" />
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

      <Modal
        open={resetPasswordOpen}
        title="Reset password"
        onClose={() => setResetPasswordOpen(false)}
      >
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

      <Modal open={addCardOpen} title="Add payment method" onClose={() => setAddCardOpen(false)}>
        <div className="grid gap-4">
          <div className="text-sm text-[var(--hw-muted)]">Stripe setup is coming next. For now, this is the UI shell.</div>
          <div className="rounded-[14px] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 text-sm text-[var(--hw-muted)]">
            Placeholder: Stripe Payment Element
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddCardOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setAddCardOpen(false);
                setToast("Payment method added (stub)");
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteAccountOpen}
        title="Delete account"
        onClose={() => {
          setDeleteAccountOpen(false);
          setDeleteConfirm("");
        }}
      >
        <div className="grid gap-4">
          <div className="rounded-[14px] border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.06)] p-4 text-sm leading-7 text-[var(--hw-ink)]">
            <div className="font-semibold">This action is permanent.</div>
            <div className="mt-1 text-[var(--hw-muted)]">
              Deleting your account will remove your profile and access. If you’re part of an office, contact support before deleting.
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Type DELETE to confirm</Label>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteAccountOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirm.trim().toUpperCase() !== "DELETE"}
              onClick={() => {
                setDeleteAccountOpen(false);
                setDeleteConfirm("");
                setToast("Account deletion requested (stub)");
              }}
            >
              Permanently delete
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
