"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { Button, Card, Chip, Textarea } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { buildProNav } from "@/components/partner/portal-nav";
import { stageFile } from "@/lib/staged-files";

const STORAGE_KEYS = {
  customProps: "hw_props_custom_v1",
  clientProps: "hw_props_client_v1",
} as const;

type StoredProperty = { id: string; address: string; nickname?: string; createdAt: string };

type StoredClientProperty = {
  id: string;
  createdAt: string;
  address: string;
  nickname?: string;
  propertyType?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
};

function normalizeAddress(s: string) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function readCustomProperties(): StoredProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.customProps) || "[]";
    const arr = JSON.parse(raw) as StoredProperty[];
    return Array.isArray(arr) ? arr.filter((p) => p && typeof p.id === "string") : [];
  } catch {
    return [];
  }
}

function writeCustomProperties(items: StoredProperty[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.customProps, JSON.stringify(items.slice(0, 50)));
  } catch {}
}

function readClientProperties(): StoredClientProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.clientProps) || "[]";
    const arr = JSON.parse(raw) as StoredClientProperty[];
    return Array.isArray(arr) ? arr.filter((p) => p && typeof p.id === "string") : [];
  } catch {
    return [];
  }
}

function writeClientProperties(items: StoredClientProperty[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.clientProps, JSON.stringify(items.slice(0, 200)));
  } catch {}
}

export type ExpressEstimateClientProps = {
  basePath: "/partner" | "/pro";
  title?: string;
  role: "PARTNER" | "PRO";
};

type Report = {
  id: string;
  address: string;
  type: "Inspection" | "Appraisal";
  createdAt: string;
  status: "Draft" | "Ready";
};

export function ExpressEstimateClient(props: ExpressEstimateClientProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [stagedId, setStagedId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [propertyMode, setPropertyMode] = useState<"existing" | "new">("existing");
  const [propertyOwner, setPropertyOwner] = useState<"my" | "client">("my");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [properties, setProperties] = useState<Array<{ id: string; label: string; address: string; kind: "my" | "client" }>>([]);

  const [newPropertyAddress, setNewPropertyAddress] = useState<string>("");
  const [newPropertyNickname, setNewPropertyNickname] = useState<string>("");
  const [newClientName, setNewClientName] = useState<string>("");
  const [newClientEmail, setNewClientEmail] = useState<string>("");
  const [newClientPhone, setNewClientPhone] = useState<string>("");

  const nav = useMemo(() => buildProNav(props.basePath), [props.basePath]);

  const reports = useMemo<Report[]>(() => {
    const now = Date.now();
    return [
      {
        id: "rpt_4240_mozart",
        address: "4240 S Mozart St, Chicago, IL",
        type: "Inspection",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
        status: "Ready",
      },
      {
        id: "rpt_8950_52nd",
        address: "8950 S 52nd Ave, Oak Lawn, IL",
        type: "Appraisal",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString(),
        status: "Draft",
      },
    ];
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load existing properties (demo: localStorage + /api/properties).
    const localMy = readCustomProperties().map((p) => ({
      id: p.id,
      label: normalizeAddress(p.nickname || p.address),
      address: normalizeAddress(p.address),
      kind: "my" as const,
    }));
    const localClient = readClientProperties().map((p) => ({
      id: p.id,
      label: normalizeAddress(p.nickname || p.address),
      address: normalizeAddress(p.address),
      kind: "client" as const,
    }));

    setProperties((prev) => {
      const merged = [...localMy, ...localClient];
      const seen = new Set<string>();
      const out: typeof merged = [];
      [...merged, ...prev].forEach((x) => {
        if (seen.has(x.id)) return;
        seen.add(x.id);
        out.push(x);
      });
      return out;
    });

    // Attempt to load from the properties endpoint (demo token).
    const url = new URL("/api/properties", window.location.origin);
    url.searchParams.set("token", "demo");
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        const base = (j.properties || []) as Array<any>;
        const fromApi = base
          .filter((p) => p && typeof p.id === "string")
          .map((p) => ({
            id: String(p.id),
            label: normalizeAddress(p.nickname || p.address),
            address: normalizeAddress(p.address || ""),
            kind: p.clientProperty ? ("client" as const) : ("my" as const),
          }))
          .filter((p) => p.address);

        setProperties((prev) => {
          const seen = new Set<string>();
          const out: typeof prev = [];
          [...fromApi, ...prev].forEach((x) => {
            if (seen.has(x.id)) return;
            seen.add(x.id);
            out.push(x);
          });
          return out;
        });
      })
      .catch(() => {});
  }, []);

  const propertyRequiredMissing = propertyMode === "existing" && !selectedPropertyId;
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.sessionStorage.getItem("hw.expressEstimate.notes") || "";
      if (saved) setNotes(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (!properties.length) return;
    setSelectedPropertyId((prev) => prev || properties[0]?.id || "");
  }, [properties]);

  return (
    <PortalShell
      role={props.role}
      title={props.title || "Express Estimate"}
      portalTitle={props.role === "PRO" ? "Real Estate Pro" : undefined}
      nav={nav}
      description="Upload an inspection/appraisal PDF, then open a report to analyze and download an estimate."
      primaryAction={
        <Link href={`${props.basePath}/dashboard`}>
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        {/* Property */}
        <Card className="p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Property</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Choose an existing property, or create a new one (my property or a client property).</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={propertyMode === "existing" ? "primary" : "secondary"} onClick={() => setPropertyMode("existing")}>Existing</Button>
              <Button size="sm" variant={propertyMode === "new" ? "primary" : "secondary"} onClick={() => setPropertyMode("new")}>New</Button>
            </div>
          </div>

          {propertyMode === "existing" ? (
            <div className="mt-4 grid gap-2">
              <div className="text-xs font-semibold text-[var(--hw-muted)]">Select a property</div>
              <select
                className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3 text-sm text-[var(--hw-ink)]"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                {properties.length === 0 ? <option value="">No properties yet</option> : null}
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.kind === "client" ? "Client" : "My"}: {p.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPropertyOwner("my")}
                  className={
                    "rounded-full px-3 py-2 text-xs font-semibold transition " +
                    (propertyOwner === "my"
                      ? "border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]"
                      : "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
                  }
                >
                  My property
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyOwner("client")}
                  className={
                    "rounded-full px-3 py-2 text-xs font-semibold transition " +
                    (propertyOwner === "client"
                      ? "border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]"
                      : "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
                  }
                >
                  Client property
                </button>
              </div>

              {propertyOwner === "client" ? (
                <Card className="p-4">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Client details (optional)</div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <input
                      className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Client name"
                    />
                    <input
                      className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="Phone"
                    />
                    <input
                      className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm sm:col-span-2"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="Email"
                    />
                  </div>
                </Card>
              ) : null}

              <div className="grid gap-2">
                <div className="text-xs font-semibold text-[var(--hw-muted)]">Address</div>
                <input
                  className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm"
                  value={newPropertyAddress}
                  onChange={(e) => setNewPropertyAddress(e.target.value)}
                  placeholder="123 Main St, Chicago, IL 606.."
                />
                <div className="text-xs text-[var(--hw-muted)]">(Google Places autocomplete next.)</div>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-semibold text-[var(--hw-muted)]">Nickname (optional)</div>
                <input
                  className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm"
                  value={newPropertyNickname}
                  onChange={(e) => setNewPropertyNickname(e.target.value)}
                  placeholder="Home, Lake Condo…"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    const addr = normalizeAddress(newPropertyAddress);
                    if (!addr) return;

                    const id = `${propertyOwner === "client" ? "prop_client" : "prop_local"}_${Math.random().toString(36).slice(2, 10)}`;
                    const createdAt = new Date().toISOString();

                    if (propertyOwner === "client") {
                      const next: StoredClientProperty = {
                        id,
                        createdAt,
                        address: addr,
                        nickname: newPropertyNickname ? normalizeAddress(newPropertyNickname) : undefined,
                        clientName: newClientName || undefined,
                        clientEmail: newClientEmail || undefined,
                        clientPhone: newClientPhone || undefined,
                      };
                      const items = [next, ...readClientProperties()];
                      writeClientProperties(items);
                    } else {
                      const next: StoredProperty = {
                        id,
                        createdAt,
                        address: addr,
                        nickname: newPropertyNickname ? normalizeAddress(newPropertyNickname) : undefined,
                      };
                      const items = [next, ...readCustomProperties()];
                      writeCustomProperties(items);
                    }

                    const p = { id, label: normalizeAddress(newPropertyNickname || addr), address: addr, kind: propertyOwner } as const;
                    setProperties((prev) => [p, ...prev]);
                    setSelectedPropertyId(id);
                    setPropertyMode("existing");

                    setNewPropertyAddress("");
                    setNewPropertyNickname("");
                    setNewClientName("");
                    setNewClientEmail("");
                    setNewClientPhone("");
                  }}
                >
                  Create property
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Upload */}
        <Card className="p-6">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Upload a PDF</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">This PDF will be used when you open a report to analyze it.</div>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="block cursor-pointer rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 hover:bg-white">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{fileName || "Choose a PDF to upload"}</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">
                    {fileName ? "Attached. Now open a report below." : "Drag & drop or click to browse."}
                  </div>
                </div>
                <div className="shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }}
                  >
                    Browse
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const next = e.target.files?.[0] ?? null;
                  if (!next) return;
                  setFile(next);
                  setFileName(next.name);
                  setStagedId("");

                  // Persist notes for the detail page.
                  try {
                    window.sessionStorage.setItem("hw.expressEstimate.notes", notes || "");
                  } catch {}
                }}
              />
            </label>

            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Notes (optional)</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Anything you want the estimate to focus on?</div>
              <div className="mt-2">
                <Textarea
                  value={notes}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNotes(v);
                    try {
                      window.sessionStorage.setItem("hw.expressEstimate.notes", v);
                    } catch {}
                  }}
                  placeholder="Add a note…"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-[var(--hw-muted)]">Upload attaches a PDF to the selected property, then generates a report.</div>
              <Button
                size="sm"
                disabled={!file || submitting || (!selectedPropertyId && propertyMode === "existing")}
                onClick={() => {
                  if (!file || submitting) return;
                  if (propertyMode === "existing" && !selectedPropertyId) return;
                  setSubmitting(true);
                  setSubmitError("");

                  void (async () => {
                    try {
                      const id = await stageFile(file);
                      setStagedId(id);
                    } catch {
                      setSubmitError("Upload failed. Please try again.");
                    } finally {
                      setSubmitting(false);
                    }
                  })();
                }}
              >
                {submitting ? "Uploading…" : "Upload"}
              </Button>
            </div>

            {propertyRequiredMissing ? (
              <div className="text-xs font-semibold text-[var(--hw-red)]">Select a property (or create a new one) before uploading.</div>
            ) : null}
            {selectedProperty ? (
              <div className="text-xs text-[var(--hw-muted)]">Using address for pricing: {selectedProperty.address}</div>
            ) : null}
            {submitError ? <div className="text-xs font-semibold text-[var(--hw-red)]">{submitError}</div> : null}
          </div>
        </Card>

        {/* Reports list */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Reports</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">
                Open a report to view results, select items, analyze, and download.
              </div>
            </div>
            <Chip className="border-[var(--hw-line)] bg-white">{reports.length}</Chip>
          </div>

          <div className="mt-4 grid gap-3">
            {reports.map((r) => {
              const selectedProp = properties.find((p) => p.id === selectedPropertyId) || null;
              const address = selectedProp?.address || r.address;
              const q = new URLSearchParams();
              if (stagedId) q.set("staged", stagedId);
              if (address) q.set("address", address);
              const href = `${props.basePath}/express-estimate/${encodeURIComponent(r.id)}${q.toString() ? `?${q.toString()}` : ""}`;
              return (
                <div
                  key={r.id}
                  className="w-full rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 text-left"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{r.address}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--hw-muted)]">
                        <span>{r.type}</span>
                        <span>•</span>
                        <span>{new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        <span>•</span>
                        <span>{r.status}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Link href={href}>
                        <Button size="sm" variant="primary" disabled={false}>
                          Open report
                        </Button>
                      </Link>
                      {null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}
