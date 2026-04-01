"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { Button, Card, Chip, Input, Picker, Textarea } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { buildProNav } from "@/components/partner/portal-nav";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { stageFile } from "@/lib/staged-files";
import { formatPhoneUS } from "@/lib/phone";

const STORAGE_KEYS = {
  customProps: "hw_props_custom_v1",
  clientProps: "hw_props_client_v1",
} as const;

type StoredProperty = { id: string; address: string; nickname?: string; ownerName?: string; propertyType?: string; createdAt: string };

type StoredClientProperty = {
  id: string;
  createdAt: string;
  address: string;
  nickname?: string;
  ownerName?: string;
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
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const preselectPropertyId = searchParams?.get("property") || "";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [stagedId, setStagedId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [toast, setToast] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reportQuery, setReportQuery] = useState("");

  const prevSelectedPropertyIdRef = useRef<string>("");

  const [propertyMode, setPropertyMode] = useState<"existing" | "new">("existing");
  const [propertyOwner, setPropertyOwner] = useState<"my" | "client">("my");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [properties, setProperties] = useState<
    Array<{ id: string; label: string; address: string; kind: "my" | "client"; ownerName?: string; propertyType?: string }>
  >([]);

  const [newPropertyAddress, setNewPropertyAddress] = useState<string>("");
  const [newPropertyNickname, setNewPropertyNickname] = useState<string>("");
  const [newPropertyType, setNewPropertyType] = useState<string>("");
  const [newOwnerName, setNewOwnerName] = useState<string>("");

  const [newClientFirstName, setNewClientFirstName] = useState<string>("");
  const [newClientLastName, setNewClientLastName] = useState<string>("");
  const [newClientEmail, setNewClientEmail] = useState<string>("");
  const [newClientPhone, setNewClientPhone] = useState<string>("");

  const newClientName = useMemo(() => `${newClientFirstName} ${newClientLastName}`.trim(), [newClientFirstName, newClientLastName]);

  const nav = useMemo(() => buildProNav(props.basePath), [props.basePath]);

  const [reports, setReports] = useState<Report[]>(() => {
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
  });

  const filteredReports = useMemo(() => {
    const q = normalizeAddress(reportQuery).toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => {
      const hay = `${r.address} ${r.type} ${r.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [reportQuery, reports]);

  const notesCompleted = useMemo(() => {
    // Treat any whitespace (including non-breaking spaces) as empty.
    return notes.replace(/[\s\u00A0]+/g, "").length > 0;
  }, [notes]);

  const step2Completed = !!selectedPropertyId && step !== 2;
  const notesCompletedVisual = notesCompleted && !!file && !!selectedPropertyId;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load existing properties (demo: localStorage + /api/properties).
    const localMy = readCustomProperties().map((p) => ({
      id: p.id,
      label: normalizeAddress(p.nickname || p.address),
      address: normalizeAddress(p.address),
      ownerName: typeof p.ownerName === "string" ? normalizeAddress(p.ownerName) : undefined,
      propertyType: typeof p.propertyType === "string" ? p.propertyType : undefined,
      kind: "my" as const,
    }));
    const localClient = readClientProperties().map((p) => ({
      id: p.id,
      label: normalizeAddress(p.nickname || p.address),
      address: normalizeAddress(p.address),
      ownerName: typeof p.ownerName === "string" ? normalizeAddress(p.ownerName) : (typeof p.clientName === "string" ? normalizeAddress(p.clientName) : undefined),
      propertyType: typeof p.propertyType === "string" ? p.propertyType : undefined,
      kind: "client" as const,
    }));

    setProperties((prev) => {
      const merged: Array<{ id: string; label: string; address: string; kind: "my" | "client"; ownerName?: string; propertyType?: string }> = [
        ...localMy,
        ...localClient,
      ];
      const seen = new Set<string>();
      const out: Array<{ id: string; label: string; address: string; kind: "my" | "client"; ownerName?: string; propertyType?: string }> = [];
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
        const base = (j.properties || []) as Array<{ id?: string; nickname?: string; address?: string; clientProperty?: boolean; ownerName?: string; clientName?: string }>;
        const fromApi = base
          .filter((p) => p && typeof p.id === "string")
          .map((p) => ({
            id: String(p.id),
            label: normalizeAddress(p.nickname || p.address || ""),
            address: normalizeAddress(p.address || ""),
            ownerName: normalizeAddress(p.ownerName || p.clientName || "") || undefined,
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

  const propertyRequiredMissing = !selectedPropertyId;
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || null;

  // Guided stepper auto-advance
  useEffect(() => {
    // Only auto-advance when the property selection actually changes (prevents "Change" click from instantly snapping back to Step 3).
    const prev = prevSelectedPropertyIdRef.current;
    if (step === 2 && selectedPropertyId && selectedPropertyId !== prev) setStep(3);
    prevSelectedPropertyIdRef.current = selectedPropertyId;
  }, [selectedPropertyId, step]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.sessionStorage.getItem("hw.expressEstimate.notes") || "";
      if (saved) setNotes(saved);
    } catch {}
  }, []);

  useEffect(() => {
    // When launched from a property detail page, we can preselect that property.
    // This keeps the user focused on the remaining required info.
    if (!properties.length) return;
    if (!preselectPropertyId) return;
    if (selectedPropertyId) return;

    const hit = properties.find((p) => p.id === preselectPropertyId) || null;
    if (!hit) return;

    setSelectedPropertyId(hit.id);
    setPropertyOwner(hit.kind);
    setPropertyMode("existing");
    setStep(3);
  }, [properties, preselectPropertyId, selectedPropertyId]);

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
        {toast ? (
          <div className="fixed bottom-5 left-1/2 z-[70] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 rounded-full border border-[rgba(229,57,53,.18)] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[var(--hw-ink)] shadow-[0_16px_40px_rgba(17,24,39,.16)]">
            {toast}
          </div>
        ) : null}
        {/* Upload */}
        <Card className="p-6">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Upload a PDF</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Upload a PDF to generate an Express Estimate.</div>
          </div>

          <div className="mt-4 grid gap-3">
            {/* Always-mounted file input so the Step 1 header "Change" button works even when collapsed */}
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
                setStep(selectedPropertyId ? 3 : 2);

                try {
                  window.sessionStorage.setItem("hw.expressEstimate.notes", notes || "");
                } catch {}
              }}
            />

            {/* Step 1: Upload */}
            <div className={
              "rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white overflow-hidden " +
              (file ? "shadow-[0_0_0_1px_rgba(229,57,53,.10),0_14px_32px_rgba(229,57,53,.12)]" : "")
            }>
              <button
                type="button"
                className={
                  "flex w-full items-center justify-between gap-3 p-4 text-left transition " +
                  (file ? "bg-[rgba(229,57,53,.05)]" : "")
                }
                onClick={() => setStep(1)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hw-line)] text-xs font-semibold text-[var(--hw-ink)]">
                      1
                    </div>
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">Upload PDF</div>
                    {file ? <div className="text-xs font-semibold text-emerald-700">✓</div> : null}
                  </div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">{fileName ? fileName : "Choose an inspection/appraisal PDF."}</div>
                </div>
                {file ? (
                  <div className="shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStep(1);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : null}
              </button>

              {step === 1 ? (
                <div className={"px-4 pb-4 " + (file ? "bg-[rgba(229,57,53,.05)]" : "") }>
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

                      const next = e.dataTransfer.files?.[0] ?? null;
                      if (!next) return;
                      if (next.type && next.type !== "application/pdf") return;

                      setFile(next);
                      setFileName(next.name);
                      setStagedId("");
                      setStep(selectedPropertyId ? 3 : 2);

                      try {
                        window.sessionStorage.setItem("hw.expressEstimate.notes", notes || "");
                      } catch {}
                    }}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[var(--hw-ink)]">{fileName || "Choose a PDF to upload"}</div>
                        <div className="mt-1 text-sm text-[var(--hw-muted)]">Drag & drop or click to browse.</div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {fileName ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setFile(null);
                              setFileName("");
                              setStagedId("");
                              setStep(1);
                            }}
                          >
                            Remove
                          </Button>
                        ) : null}
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
                    {/* file input mounted above */}
                  </label>
                </div>
              ) : null}
            </div>

            {/* Step 2: Property */}
            <div
              className={
                "rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white " +
                (step === 2 ? "relative z-20 " : "") +
                (step2Completed ? "overflow-hidden shadow-[0_0_0_1px_rgba(229,57,53,.10),0_14px_32px_rgba(229,57,53,.12)]" : "")
              }
            >
              <button
                type="button"
                className={
                  "flex w-full items-center justify-between gap-3 p-4 text-left transition " +
                  (!file ? "opacity-60 " : "") +
                  (step2Completed ? "bg-[rgba(229,57,53,.05)]" : "")
                }
                onClick={() => {
                  if (!file) return;
                  setStep(2);
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hw-line)] text-xs font-semibold text-[var(--hw-ink)]">
                      2
                    </div>
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">Select Property</div>
                    {selectedPropertyId ? <div className="text-xs font-semibold text-emerald-700">✓</div> : null}
                  </div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">
                    {selectedProperty ? selectedProperty.address : file ? "Choose the property context for this report." : "Upload a PDF first."}
                  </div>
                </div>

                {selectedPropertyId ? (
                  <div className="shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!file) return;
                        setPropertyMode("existing");
                        setStep(2);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : null}
              </button>

              {step === 2 ? (
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">Property</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={propertyMode === "existing" ? "primary" : "secondary"}
                        onClick={() => {
                          setPropertyMode("existing");
                        }}
                      >
                        Select
                      </Button>
                      <Button size="sm" variant={propertyMode === "new" ? "primary" : "secondary"} onClick={() => setPropertyMode("new")}>
                        New address
                      </Button>
                    </div>
                  </div>

                  {propertyMode === "existing" ? (
                    <div className="mt-3 grid gap-2">
                      <Picker
                        searchable
                        searchPlaceholder="Search properties…"
                        value={selectedPropertyId}
                        placeholder="Select a property…"
                        options={properties.map((p) => ({
                          id: p.id,
                          label: (p.kind === "client" ? "Client" : "My") + ": " + p.label,
                          sublabel: p.address,
                        }))}
                        onChange={(id) => {
                          setSelectedPropertyId(id);
                          prevSelectedPropertyIdRef.current = id;
                          setStep(3);
                        }}
                      />
                      {selectedProperty ? (
                        <div className="text-xs text-[var(--hw-muted)]">Using: {selectedProperty.address}</div>
                      ) : (
                        <div className="text-xs text-[var(--hw-muted)]">Select a property to continue.</div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3">
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

                      <div className="grid gap-2">
                        <div className="text-xs font-semibold text-[var(--hw-muted)]">Address</div>
                        <AddressAutocomplete
                          value={newPropertyAddress}
                          onChange={setNewPropertyAddress}
                          placeholder="123 Main St, Chicago, IL 606.."
                          country="us"
                        />
                      </div>

                      {propertyOwner === "client" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="grid gap-2">
                            <div className="text-xs font-semibold text-[var(--hw-muted)]">Client first name</div>
                            <Input value={newClientFirstName} onChange={(e) => setNewClientFirstName(e.target.value)} placeholder="Jane" />
                          </div>
                          <div className="grid gap-2">
                            <div className="text-xs font-semibold text-[var(--hw-muted)]">Client last name</div>
                            <Input value={newClientLastName} onChange={(e) => setNewClientLastName(e.target.value)} placeholder="Client" />
                          </div>
                          <div className="grid gap-2 sm:col-span-2">
                            <div className="text-xs font-semibold text-[var(--hw-muted)]">Email</div>
                            <Input value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="jane@email.com" />
                          </div>
                          <div className="grid gap-2 sm:col-span-2">
                            <div className="text-xs font-semibold text-[var(--hw-muted)]">Phone</div>
                            <Input
                              value={newClientPhone}
                              onChange={(e) => setNewClientPhone(formatPhoneUS(e.target.value))}
                              placeholder="(312) 555-0123"
                              inputMode="tel"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          <div className="text-xs font-semibold text-[var(--hw-muted)]">Owner name (optional)</div>
                          <Input value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} placeholder="Owner name" />
                        </div>
                      )}

                      <div className="grid gap-2">
                        <div className="text-xs font-semibold text-[var(--hw-muted)]">Nickname (optional)</div>
                        <Input value={newPropertyNickname} onChange={(e) => setNewPropertyNickname(e.target.value)} placeholder="Home, Lake Condo…" />
                      </div>

                      <div className="grid gap-2">
                        <div className="text-xs font-semibold text-[var(--hw-muted)]">Type of property</div>
                        <select
                          className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-gradient-to-b from-white to-[var(--hw-soft)] px-3 text-sm text-[var(--hw-ink)] shadow-[0_10px_22px_rgba(17,24,39,.06)] outline-none transition hover:shadow-[0_12px_26px_rgba(17,24,39,.08)] focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
                          value={newPropertyType}
                          onChange={(e) => setNewPropertyType(e.target.value)}
                        >
                          <option value="">Type of Property</option>
                          <option value="Condo">Condo</option>
                          <option value="House">House</option>
                          <option value="Multi-Units">Multi-Units</option>
                          <option value="Town house">Town house</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-end">
                        <Button
                          size="sm"
                          onClick={() => {
                            const addr = normalizeAddress(newPropertyAddress);
                            if (!addr) return;

                            const id = (propertyOwner === "client" ? "prop_client" : "prop_local") + "_" + Math.random().toString(36).slice(2, 10);
                            const createdAt = new Date().toISOString();

                            if (propertyOwner === "client") {
                              const next = {
                                id,
                                createdAt,
                                address: addr,
                                nickname: newPropertyNickname ? normalizeAddress(newPropertyNickname) : undefined,
                                ownerName: normalizeAddress(newOwnerName || newClientName || "") || undefined,
                                propertyType: newPropertyType || undefined,
                                clientName: newClientName || undefined,
                                clientEmail: newClientEmail || undefined,
                                clientPhone: newClientPhone || undefined,
                              };
                              writeClientProperties([next, ...readClientProperties()]);
                            } else {
                              const next = {
                                id,
                                createdAt,
                                address: addr,
                                nickname: newPropertyNickname ? normalizeAddress(newPropertyNickname) : undefined,
                                ownerName: normalizeAddress(newOwnerName) || undefined,
                                propertyType: newPropertyType || undefined,
                              };
                              writeCustomProperties([next, ...readCustomProperties()]);
                            }

                            const p = {
                              id,
                              label: normalizeAddress(newPropertyNickname || addr),
                              address: addr,
                              ownerName: normalizeAddress(newOwnerName || newClientName || "") || undefined,
                              kind: propertyOwner,
                              propertyType: newPropertyType || undefined,
                            } as const;
                            setProperties((prev) => [p, ...prev]);
                            setSelectedPropertyId(id);
                            setPropertyMode("existing");

                            setNewPropertyAddress("");
                            setNewPropertyNickname("");
                            setNewOwnerName("");
                            setNewClientFirstName("");
                            setNewClientLastName("");
                            setNewClientEmail("");
                            setNewClientPhone("");
                            setNewPropertyType("");
                          }}
                        >
                          Create
                        </Button>
                      </div>

                      {null}
                    </div>
                  )}

                  {propertyRequiredMissing ? (
                    <div className="mt-2 text-xs font-semibold text-[var(--hw-red)]">Pick or create a property to continue.</div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Step 3: Notes */}
            <div
              className={
                "rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] overflow-hidden " +
                (notesCompletedVisual
                  ? "bg-[rgba(229,57,53,.05)] shadow-[0_0_0_1px_rgba(229,57,53,.10),0_14px_32px_rgba(229,57,53,.12)]"
                  : "bg-white")
              }
            >
              <button
                type="button"
                className={
                  "flex w-full items-center justify-between gap-3 p-4 text-left transition " +
                  (!file || !selectedPropertyId ? "opacity-60 " : "")
                }
                onClick={() => {
                  // Notes are optional: allow editing anytime.
                  setStep(3);
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hw-line)] text-xs font-semibold text-[var(--hw-ink)]">
                      3
                    </div>
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">Notes (optional)</div>
                  </div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Anything you want the estimate to focus on?</div>
                </div>
              </button>

              {step === 3 ? (
                <div className="px-4 pb-4">
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
              ) : null}
            </div>

            <div className="flex items-center justify-end">
              <Button
                size="sm"
                disabled={!file || !selectedPropertyId || submitting}
                onClick={() => {
                  if (!file || !selectedPropertyId || submitting) return;
                  setSubmitting(true);
                  setSubmitError("");

                  void (async () => {
                    try {
                      // Notes are optional; persist whatever we have.
                      try {
                        window.sessionStorage.setItem("hw.expressEstimate.notes", notes || "");
                      } catch {}

                      const id = await stageFile(file);
                      setStagedId(id);

                      const selectedProp = properties.find((p) => p.id === selectedPropertyId) || null;
                      const address = selectedProp?.address || "";

                      // Demo behavior: immediately create a ready report row in the list so the user can open it.
                      const reportId = `rpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
                      setReports((prev) => [
                        {
                          id: reportId,
                          address: address || "New report",
                          type: "Inspection",
                          createdAt: new Date().toISOString(),
                          status: "Ready",
                        },
                        ...prev,
                      ]);

                      setToast("Submitted ✓ Scroll down and click ‘Open report’.");
                      window.setTimeout(() => setToast(""), 2600);

                      // Nudge the user to the report list.
                      try {
                        document.getElementById("hw_reports")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      } catch {}
                    } catch {
                      setSubmitError("Submit failed. Please try again.");
                    } finally {
                      setSubmitting(false);
                    }
                  })();
                }}
              >
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </div>

            {submitError ? <div className="text-xs font-semibold text-[var(--hw-red)]">{submitError}</div> : null}
          </div>
        </Card>

        {/* Reports list */}
        <Card className="p-6" id="hw_reports">
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <input
                className="h-10 w-full rounded-[999px] border border-[var(--hw-line)] bg-[var(--hw-soft)] px-4 text-sm outline-none transition focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
                value={reportQuery}
                onChange={(e) => setReportQuery(e.target.value)}
                placeholder="Search reports…"
              />
              <div className="shrink-0 text-xs text-[var(--hw-muted)]">
                {filteredReports.length > 10 ? `Showing 10 of ${filteredReports.length}` : `${filteredReports.length} total`}
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 text-sm text-[var(--hw-muted)]">
                No reports match that search.
              </div>
            ) : null}

            {filteredReports.slice(0, 10).map((r) => {
              const selectedProp = properties.find((p) => p.id === selectedPropertyId) || null;
              const address = selectedProp?.address || r.address;
              const ownerName = selectedProp?.ownerName || "";
              const q = new URLSearchParams();
              if (stagedId) q.set("staged", stagedId);
              if (address) q.set("address", address);
              if (ownerName) q.set("owner", ownerName);
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
