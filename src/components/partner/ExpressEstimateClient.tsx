"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
// import { useRouter } from "next/navigation";

import { Button, Card, Chip, Input, Picker, Textarea } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { buildProNav } from "@/components/partner/portal-nav";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { getStagedFiles, stageFile, stageFiles } from "@/lib/staged-files";
import { formatPhoneUS } from "@/lib/phone";

const STORAGE_KEYS = {
  customProps: "hw_props_custom_v1",
  clientProps: "hw_props_client_v1",
  reports: "hw_express_estimate_reports_v1",
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
  // Lightweight normalization used for report ID stability. Do not change behavior lightly.
  return (s || "").replace(/\s+/g, " ").trim();
}

function addressKey(s: string) {
  // More aggressive normalization for matching/search (case/punctuation/abbrev tolerant).
  return (s || "")
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/\bst\b/g, "street")
    .replace(/\bave\b/g, "avenue")
    .replace(/\bblvd\b/g, "boulevard")
    .replace(/\brd\b/g, "road")
    .replace(/\bdr\b/g, "drive")
    .replace(/\bln\b/g, "lane")
    .replace(/\bct\b/g, "court")
    .replace(/\bpl\b/g, "place")
    .replace(/\btrl\b/g, "trail")
    .replace(/\bter\b/g, "terrace")
    .replace(/\bpkwy\b/g, "parkway")
    .replace(/\ssuite\s|\bste\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function readReports(): Report[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.reports) || "[]";
    const arr = JSON.parse(raw) as Report[];
    return Array.isArray(arr) ? arr.filter((r) => r && typeof r.id === "string" && typeof r.address === "string") : [];
  } catch {
    return [];
  }
}

function writeReports(items: Report[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(items.slice(0, 200)));
  } catch {}
}

function upsertReport(next: Report) {
  const prev = readReports();
  const out: Report[] = [next, ...prev.filter((r) => r.id !== next.id)];
  writeReports(out);
  return out;
}

export type ExpressEstimateClientProps = {
  basePath: "/partner" | "/pro";
  title?: string;
  role: "PARTNER" | "PRO";
};

type Report = {
  id: string;
  address: string;
  ownerName?: string;
  type: "Inspection" | "Appraisal";
  createdAt: string;
  status: "Processing" | "Ready" | "Failed";
};

export function ExpressEstimateClient(props: ExpressEstimateClientProps) {
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const preselectPropertyId = searchParams?.get("property") || "";
  const preStaged = searchParams?.get("staged") || "";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [stagedId, setStagedId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [toast, setToast] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reportQuery, setReportQuery] = useState("");

  const prevSelectedPropertyIdRef = useRef<string>("");

  const [propertyMode, setPropertyMode] = useState<"existing" | "new">("existing");
  const [propertyOwner, setPropertyOwner] = useState<"my" | "client">("client");
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
  // const router = useRouter();

  const [reports, setReports] = useState<Report[]>(() => {
    const now = Date.now();
    const demo: Report[] = [
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
        status: "Ready",
      },
    ];

    // Merge persisted reports (uploaded PDFs) on the client.
    if (typeof window === "undefined") return demo;
    const persisted = readReports();
    const seen = new Set<string>();
    const out: Report[] = [];
    [...persisted, ...demo].forEach((r) => {
      if (seen.has(r.id)) return;
      seen.add(r.id);
      out.push(r);
    });
    return out;
  });

  const filteredReports = useMemo(() => {
    const q = addressKey(reportQuery);
    if (!q) return reports;
    return reports.filter((r) => {
      const derivedOwner = (() => {
        if (r.ownerName) return r.ownerName;
        try {
          const persisted = window.localStorage.getItem(`hw.expressEstimate.owner.${r.id}`) || "";
          if (persisted.trim()) return persisted.trim();
        } catch {}
        const key = addressKey(r.address);
        return properties.find((p) => addressKey(p.address) === key)?.ownerName || "";
      })();
      const hay = `${derivedOwner} ${r.address} ${r.type} ${r.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [reportQuery, reports, properties]);

  const notesCompleted = useMemo(() => {
    // Treat any whitespace (including non-breaking spaces) as empty.
    return notes.replace(/[\s\u00A0]+/g, "").length > 0;
  }, [notes]);

  const step2Completed = !!selectedPropertyId && step !== 2;
  const step2HasSelection = !!selectedPropertyId;
  const notesCompletedVisual = notesCompleted && files.length > 0 && !!selectedPropertyId;

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

  // Guided stepper: do not auto-open Notes (optional). Keep it collapsed unless the user expands it.
  useEffect(() => {
    const prev = prevSelectedPropertyIdRef.current;
    prevSelectedPropertyIdRef.current = selectedPropertyId;
    // no-op
    void prev;
  }, [selectedPropertyId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.sessionStorage.getItem("hw.expressEstimate.notes") || "";
      if (saved) setNotes(saved);
    } catch {}
  }, []);

  // If we navigated here from the dashboard card with a staged file id,
  // auto-load it into Step 1 so the user doesn't have to reselect it.
  useEffect(() => {
    if (!preStaged) return;
    if (files.length) return;

    const ids = preStaged
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) return;

    void (async () => {
      try {
        const stagedFiles = await getStagedFiles(ids);
        if (!stagedFiles.length) return;

        setFiles(stagedFiles);
        setFileName(stagedFiles.length === 1 ? stagedFiles[0].name : `${stagedFiles.length} files selected`);
        setStagedId(preStaged);
        setStep(selectedPropertyId ? 3 : 2);
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preStaged]);

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
      title={props.title || "Instant Estimate"}
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
          <div className="mt-1 grid gap-3">
            {/* Always-mounted file input so the Step 1 header "Change" button works even when collapsed */}
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              multiple
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => {
                const next = Array.from(e.target.files || []);
                if (!next.length) return;
                setFiles(next);
                setFileName(next.length === 1 ? next[0].name : `${next.length} files selected`);
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
              (files.length ? "shadow-[0_0_0_1px_rgba(229,57,53,.10),0_14px_32px_rgba(229,57,53,.12)]" : "")
            }>
              <button
                type="button"
                className={
                  "flex w-full items-center justify-between gap-3 p-4 text-left transition " +
                  (files.length ? "bg-[rgba(229,57,53,.05)]" : "")
                }
                onClick={() => setStep(1)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hw-line)] text-xs font-semibold text-[var(--hw-ink)]">
                      1
                    </div>
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">Upload file(s)</div>
                    {files.length ? <div className="text-xs font-semibold text-emerald-700">✓</div> : null}
                  </div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">{fileName ? fileName : "Choose an inspection/appraisal file(s)."}</div>
                </div>
                {files.length ? (
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
                <div className={"px-4 pb-4 " + (files.length ? "bg-[rgba(229,57,53,.05)]" : "") }>
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

                      const next = Array.from(e.dataTransfer.files || []).filter(Boolean);
                      if (!next.length) return;
                      setFiles(next);
                      setFileName(next.length === 1 ? next[0].name : `${next.length} files selected`);
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
                              setFiles([]);
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
                "rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white overflow-hidden " +
                (step === 2 ? "relative z-20 " : "") +
                (step2HasSelection ? "shadow-[0_0_0_1px_rgba(229,57,53,.10),0_14px_32px_rgba(229,57,53,.12)]" : "")
              }
            >
              <button
                type="button"
                className={
                  "flex w-full items-center justify-between gap-3 p-4 text-left transition " +
                  (!files.length ? "opacity-60 " : "") +
                  (step2HasSelection ? "bg-[rgba(229,57,53,.05)]" : "")
                }
                onClick={() => {
                  if (!files.length) return;
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
                    {selectedProperty ? selectedProperty.address : files.length ? "Choose the property context for this report." : "Upload file(s) first."}
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
                        if (!files.length) return;
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
                            setStep(3);

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
                "rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white overflow-hidden " +
                (notesCompletedVisual ? "shadow-[0_0_0_1px_rgba(229,57,53,.10),0_14px_32px_rgba(229,57,53,.12)]" : "")
              }
            >
              <button
                type="button"
                className={
                  "flex w-full items-center justify-between gap-3 p-4 text-left transition " +
                  (!files.length || !selectedPropertyId ? "opacity-60 " : "") +
                  (notesCompletedVisual ? "bg-[rgba(229,57,53,.05)]" : "")
                }
                onClick={() => {
                  // Notes are optional. Start collapsed; user can expand if needed.
                  setNotesOpen((v) => !v);
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hw-line)] text-xs font-semibold text-[var(--hw-ink)]">
                      3
                    </div>
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">Notes (optional)</div>
                    {notesCompleted ? <div className="text-xs font-semibold text-emerald-700">✓</div> : null}
                  </div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Anything you want the estimate to focus on?</div>
                </div>

                <div className="shrink-0 pt-1 text-[var(--hw-muted)]">
                  <div className={"transition " + (notesOpen ? "rotate-180" : "")}>⌄</div>
                </div>
              </button>

              {notesOpen ? (
                <div className={"px-4 pb-4 " + (notesCompleted ? "bg-[rgba(229,57,53,.05)]" : "")}>
                  <Textarea
                    className={notesCompleted ? "bg-[rgba(229,57,53,.03)]" : ""}
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
                disabled={!files.length || !selectedPropertyId || submitting}
                onClick={() => {
                  if (!files.length || !selectedPropertyId || submitting) return;
                  setSubmitting(true);
                  setSubmitError("");

                  void (async () => {
                    try {
                      // Notes are optional; persist whatever we have.
                      try {
                        window.sessionStorage.setItem("hw.expressEstimate.notes", notes || "");
                      } catch {}

                      const ids = await stageFiles(files);
                      const staged = ids.join(",");
                      setStagedId(staged);

                      const selectedProp = properties.find((p) => p.id === selectedPropertyId) || null;
                      const address = selectedProp?.address || "";

                      // Deterministic report id based on combined file hashes + address.
                      const hashes: string[] = [];
                      for (const f of files) {
                        const ab = await f.arrayBuffer();
                        const digest = await crypto.subtle.digest("SHA-256", ab);
                        hashes.push(Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join(""));
                      }
                      const combined = hashes.join("|");
                      const locKey = normalizeAddress(address).toLowerCase();
                      const keyDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${combined}|${locKey}`));
                      const cacheKey = Array.from(new Uint8Array(keyDigest)).map((b) => b.toString(16).padStart(2, "0")).join("");
                      const reportId = `rpt_${cacheKey.slice(0, 12)}`;

                      // Derive owner name from the selected property (or best-effort fallback).
                      const ownerName =
                        selectedProp?.ownerName ||
                        properties.find((p) => addressKey(p.address) === addressKey(address))?.ownerName ||
                        "";

                      // Persist owner name by report id so the list can display it even if the report row is missing it.
                      try {
                        if (ownerName) window.localStorage.setItem(`hw.expressEstimate.owner.${reportId}`, ownerName);
                      } catch {}

                      // Persist a report row locally so it appears under Reports immediately.
                      setReports((prev) => {
                        const next: Report = {
                          id: reportId,
                          address: address || "(unknown address)",
                          ownerName: ownerName || undefined,
                          type: "Inspection",
                          createdAt: new Date().toISOString(),
                          status: "Processing",
                        };
                        const persisted = upsertReport(next);
                        // Merge with existing demo rows
                        const seen = new Set<string>();
                        const out: Report[] = [];
                        [...persisted, ...prev].forEach((r) => {
                          if (seen.has(r.id)) return;
                          seen.add(r.id);
                          out.push(r);
                        });
                        return out;
                      });

                      const q = new URLSearchParams();
                      q.set("staged", staged);
                      if (address) q.set("address", address);
                      if (ownerName) q.set("owner", ownerName);
                      q.set("cacheKey", cacheKey);

                      setToast("Submitted ✓ We’re processing your report. You can keep working and come back here.");

                      // Note: status will flip to Ready only once a saved result exists.
                      // (True server-side background processing + real status updates are next.)

                      // Do not navigate away; keep user on this screen while the report processes in the background.
                      // The report will appear in the list below immediately.
                      setStep(1);
                      setFiles([]);
                      setFileName("");
                      setNotes("");
                      setNotesOpen(false);
                      setSelectedPropertyId("");
                    } catch (e) {
                      const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : "";
                      setSubmitError(msg ? `Submit failed: ${msg}` : "Submit failed. Please try again.");
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
              const address = r.address;
              const derivedOwnerName = (() => {
                if (r.ownerName) return r.ownerName;
                try {
                  const persisted = window.localStorage.getItem(`hw.expressEstimate.owner.${r.id}`) || "";
                  if (persisted.trim()) return persisted.trim();
                } catch {}
                const key = addressKey(r.address);
                return properties.find((p) => addressKey(p.address) === key)?.ownerName || "";
              })();

              const hasSavedResult = (() => {
                try {
                  const raw = window.localStorage.getItem(`hw.expressEstimate.result.${r.id}`) || "";
                  if (!raw) return false;
                  const j = JSON.parse(raw);
                  return !!j && Array.isArray(j.lanes) && j.lanes.length > 0;
                } catch {
                  return false;
                }
              })();

              const isDemoReport = r.id === "rpt_4240_mozart" || r.id === "rpt_8950_52nd";
              // A report is truly ready only once we have a saved result for that report id.
              // (Until server-side background processing is wired.)
              const isReady = isDemoReport || hasSavedResult;
              const q = new URLSearchParams();
              if (stagedId) q.set("staged", stagedId);
              if (address) q.set("address", address);
              if (derivedOwnerName) q.set("owner", derivedOwnerName);
              // Preserve cacheKey if present so refresh can reload estimate.
              const ck = (r.id.startsWith("rpt_") ? r.id.slice(4) : "");
              if (ck) q.set("cacheKey", ck);
              const href = `${props.basePath}/express-estimate/${encodeURIComponent(r.id)}${q.toString() ? `?${q.toString()}` : ""}`;
              return (
                <div
                  key={r.id}
                  className="w-full rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 text-left"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      {derivedOwnerName ? (
                        <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{derivedOwnerName}</div>
                      ) : null}
                      <div className={(r.ownerName ? "mt-0.5 " : "") + "truncate text-sm font-semibold text-[var(--hw-ink)]"}>{r.address}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--hw-muted)]">
                        <span>{r.type}</span>
                        <span>•</span>
                        <span>{new Date(r.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                        {!isReady ? (
                          <>
                            <span>•</span>
                            <span className={r.status === "Failed" ? "text-[var(--hw-red)]" : "text-amber-700"}>
                              {r.status === "Failed" ? "Failed" : "Processing…"}
                            </span>
                          </>
                        ) : null}
                      </div>
                      {!isReady ? (
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--hw-soft)]">
                          <div className="h-full w-1/3 animate-pulse rounded-full bg-[rgba(229,57,53,.35)]" />
                        </div>
                      ) : null}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!window.confirm("Delete this report from your list?")) return;
                          if (!window.confirm("Confirm delete: this cannot be undone.")) return;

                          try {
                            const key = STORAGE_KEYS.reports;
                            const raw = window.localStorage.getItem(key) || "[]";
                            const arr = (JSON.parse(raw) as any[]) || [];
                            const out = arr.filter((x) => x && x.id !== r.id);
                            window.localStorage.setItem(key, JSON.stringify(out));
                          } catch {}

                          setReports((prev) => prev.filter((x) => x.id !== r.id));
                        }}
                      >
                        Delete
                      </Button>

                      {isReady ? (
                        <Link href={href}>
                          <Button size="sm" variant="primary" disabled={false}>
                            Open report
                          </Button>
                        </Link>
                      ) : (
                        <Button size="sm" variant="primary" disabled={true}>
                          Processing…
                        </Button>
                      )}
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
