"use client";

import * as React from "react";

import { PRO_NAV } from "@/components/pro/nav";
import { PortalShell } from "@/components/portal-shell";
import { Button, Card, Checkbox, Divider, EmptyState, Input, Label, Modal, Pill } from "@/components/ui";

function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
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
  const [profileEditing, setProfileEditing] = React.useState(false);

  const [fullName, setFullName] = React.useState("Your Real Estate Pro");
  const [office, setOffice] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("you@example.com");

  const [smsOn, setSmsOn] = React.useState(true);
  const [emailOn, setEmailOn] = React.useState(true);

  const [changeEmailOpen, setChangeEmailOpen] = React.useState(false);
  const [nextEmail, setNextEmail] = React.useState("");

  const [resetPasswordOpen, setResetPasswordOpen] = React.useState(false);

  const [addCardOpen, setAddCardOpen] = React.useState(false);

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
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      setPhotoPreview(url);
                      setToast("Photo selected (stub)");
                    }}
                  />
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
                  <Input value={office} onChange={(e) => setOffice(e.target.value)} placeholder="Optional" />
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
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(###) ###-####" />
                  ) : (
                    <div className="rounded-[14px] border border-[var(--hw-line)] bg-white px-4 py-3 text-sm text-[var(--hw-ink)]">
                      {phone || <span className="text-[var(--hw-muted)]">Not set</span>}
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Email</Label>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1 rounded-[14px] border border-[var(--hw-line)] bg-white px-4 py-3 text-sm text-[var(--hw-ink)]">
                      <span className="block truncate">{email}</span>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setChangeEmailOpen(true)}>
                      Change
                    </Button>
                  </div>
                  <div className="text-xs text-[var(--hw-muted)]">Changing email requires verification.</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* SECURITY */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Security</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Manage sign-in and account protection.</div>
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
      </div>

      {/* MODALS */}
      <Modal
        open={changeEmailOpen}
        title="Change email"
        onClose={() => {
          setChangeEmailOpen(false);
          setNextEmail("");
        }}
      >
        <div className="grid gap-4">
          <div className="text-sm text-[var(--hw-muted)]">
            We’ll send a verification link to your new email address.
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
                setEmail(nextEmail.trim());
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
            We’ll email a secure reset link to <span className="font-semibold text-[var(--hw-ink)]">{email}</span>.
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
          <div className="text-sm text-[var(--hw-muted)]">
            Stripe setup is coming next. For now, this is the UI shell.
          </div>
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
