"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

import { Button, Card, Chip, EmptyState, Input, Picker } from "@/components/ui";
import { Camera, ChevronDown, Copy, Download, Hammer, Share2 } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { buildProNav } from "@/components/partner/portal-nav";
import { deleteStagedFile, getStagedFile } from "@/lib/staged-files";

type EvidenceThumb = { src: string; caption?: string };

type ExtractedLane = {
  title: string;
  items: Array<{
    id: string;
    label: string;
    note?: string;
    range?: string;
    price?: number;
    evidence?: EvidenceThumb[];
    pricingMode?: "Guardrails" | "Quote-only";
    confidence?: number;
    quantityHint?: string;
    scopeMultiplier?: number;
  }>;
};

type AnalyzeResponse =
  | {
      ok: true;
      summary?: string;
      lanes: ExtractedLane[];
      used?: "openai" | "demo" | string;
      cache?: { cacheKey?: string; pdfHash?: string; locationKey?: string; expiresAt?: string };
    }
  | { ok: false; error: string; detail?: string };

type Report = {
  id: string;
  address: string;
  type: "Inspection" | "Appraisal";
  createdAt: string;
  status: "Draft" | "Ready";
};

export function ExpressEstimateReportClient(props: {
  basePath: "/partner" | "/pro";
  role: "PARTNER" | "PRO";
  reportId: string;
  stagedId?: string;
  cacheKey?: string;
  ownerName?: string;
  address?: string;
}) {
  // PDF.js worker config (required for client-side text extraction)
  try {
    GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  } catch {
    // ignore
  }

  async function extractPdfTextAndHash(file: File): Promise<{ text: string; hash: string }> {
    const ab = await file.arrayBuffer();

    // Hash PDF bytes for caching consistency server-side
    const digest = await crypto.subtle.digest("SHA-256", ab);
    const hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");

    setAnalysisStage("Extracting text from PDF");

    const pdf = await getDocument({ data: ab }).promise;
    const maxPages = Math.min(pdf.numPages || 0, 120);

    let out = "";
    for (let i = 1; i <= maxPages; i++) {
      setAnalysisProgress({ current: i, total: maxPages });
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = (content.items || [])
        .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
        .filter(Boolean);
      if (strings.length) out += `\n\n[PAGE ${i}]\n` + strings.join(" ");
    }

    // Keep page boundaries/newlines so the server can chunk reliably.
    const text = out
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return { text, hash };
  }
  function svgThumb(label: string, bg = "#fdecec", fg = "#b91c1c") {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">\n  <rect x="0" y="0" width="96" height="96" rx="18" fill="${bg}"/>\n  <text x="48" y="52" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Inter,Arial" font-size="12" font-weight="700" fill="${fg}">${label}</text>\n</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  const nav = useMemo(() => buildProNav(props.basePath), [props.basePath]);

  const demoReports = useMemo<Report[]>(() => {
    const now = Date.now();
    return [
      {
        id: "rpt_4240_mozart",
        address: "4240 S Mozart St, Chicago, IL 60632",
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

  const report = useMemo(() => demoReports.find((r) => r.id === props.reportId) || null, [demoReports, props.reportId]);

  // Persist owner/address so the header doesn't go blank when navigating without query params.
  const [persistedOwnerName, setPersistedOwnerName] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem(`hw.expressEstimate.owner.${props.reportId}`) || "";
    } catch {
      return "";
    }
  });
  const [persistedAddress, setPersistedAddress] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem(`hw.expressEstimate.address.${props.reportId}`) || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (props.ownerName && props.ownerName.trim()) {
        window.localStorage.setItem(`hw.expressEstimate.owner.${props.reportId}`, props.ownerName.trim());
        setPersistedOwnerName(props.ownerName.trim());
      }
      if (props.address && props.address.trim()) {
        window.localStorage.setItem(`hw.expressEstimate.address.${props.reportId}`, props.address.trim());
        setPersistedAddress(props.address.trim());
      }
    } catch {
      // ignore
    }
  }, [props.reportId, props.ownerName, props.address]);

  const effectiveAddress = report?.address || props.address || persistedAddress || "";
  const effectiveOwnerName = props.ownerName || persistedOwnerName || "";

  const [files, setFiles] = useState<File[]>([]);
  const [forceNextRun, setForceNextRun] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const didOcrFallbackRef = useRef(false);

  // Once the staged file is consumed we delete it, so on refresh `props.stagedId` is gone.
  // Persist a flag so the UI can still show the right empty-state messaging for an uploaded report.
  const [wasUploaded, setWasUploaded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(`hw.expressEstimate.wasUploaded.${props.reportId}`) === "1";
    } catch {
      return false;
    }
  });

  const isUploadedReport = !!props.stagedId || files.length > 0 || wasUploaded;

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string>("");
  const [analysisSummary, setAnalysisSummary] = useState<string>("");
  const [analysisStage, setAnalysisStage] = useState<string>("");
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number; total: number } | null>(null);
  const [cacheKey, setCacheKey] = useState<string>(props.cacheKey || "");
  const [expiresAt, setExpiresAt] = useState<string>("");

  const FUN_ANALYSIS_LINES = useMemo(
    () => [
      "Warming up the estimate engine…",
      "Reading the inspection like a detective…",
      "Hunting for repairs hiding in plain sight…",
      "Checking Chicagoland pricing guardrails…",
      "Calling in the contractor brain trust…",
      "Comparing materials vs labor…",
      "Looking for the ‘uh-oh’ items first…",
      "Translating inspector-speak into repair-speak…",
      "Doing math so you don’t have to…",
      "Making the numbers behave…",
      "Finding the best-price lane for each repair…",
      "Double-checking totals (no funny business)…",
      "Putting it into a clean, client-ready report…",
      "Final polish—almost there…",
    ],
    []
  );

  const [funAnalysisLine, setFunAnalysisLine] = useState<string>(FUN_ANALYSIS_LINES[0] || "Working…");
  const [uiProgressPct, setUiProgressPct] = useState<number>(0);

  const [downloading, setDownloading] = useState<"" | "full" | "selected">("");
  const [toast, setToast] = useState<string>("");
  const demoExtracted = useMemo<ExtractedLane[]>(() => {
    return [
      {
        title: "Exterior",
        items: [
          {
            id: "roof",
            label: "Roofing patch / replace",
            note: "shingles + underlayment",
            range: "$4.8k–$8.2k",
            price: 6500,
            evidence: [
              { src: svgThumb("Roof"), caption: "Roof photo" },
              { src: svgThumb("Shingle"), caption: "Shingles" },
              { src: svgThumb("Flashing"), caption: "Flashing" },
            ],
          },
          {
            id: "gutters",
            label: "Gutters + downspouts",
            range: "$1.1k–$1.9k",
            price: 1500,
            evidence: [{ src: svgThumb("Gutter"), caption: "Gutters" }],
          },
          { id: "siding", label: "Siding repair", note: "loose panels", range: "$900–$2.2k", price: 1500, evidence: [{ src: svgThumb("Siding") }] },
          { id: "deck", label: "Deck board replacement", note: "rot / splintering", range: "$600–$1.6k", price: 1100, evidence: [{ src: svgThumb("Deck") }] },
          { id: "chimney", label: "Chimney cap / flashing", range: "$450–$1.4k", price: 850 },
        ],
      },
      {
        title: "Interior",
        items: [
          {
            id: "paint",
            label: "Interior paint refresh",
            note: "living + hall",
            range: "$1.3k–$2.5k",
            price: 1900,
            evidence: [{ src: svgThumb("Paint"), caption: "Wall" }, { src: svgThumb("Trim"), caption: "Trim" }],
          },
          { id: "floor", label: "Floor repair / refinish", range: "$900–$2.1k", price: 1500 },
          { id: "drywall", label: "Drywall patch + texture", note: "water stain", range: "$250–$900", price: 550 },
          { id: "window", label: "Window seal / sash repair", range: "$180–$650", price: 420 },
          { id: "door", label: "Door alignment + weatherstrip", range: "$120–$420", price: 260 },
        ],
      },
      {
        title: "Systems",
        items: [
          { id: "hvac", label: "HVAC tune-up / diagnostic", range: "$180–$450", price: 300 },
          { id: "plumbing", label: "Plumbing leak locate", range: "$250–$650", price: 450 },
          { id: "water_heater", label: "Water heater inspection", range: "$150–$400", price: 260 },
          { id: "electrical", label: "Electrical panel evaluation", range: "$250–$850", price: 520 },
          { id: "sump", label: "Sump pump test / replace", range: "$220–$950", price: 520 },
        ],
      },
      {
        title: "Need more info",
        items: [
          { id: "foundation", label: "Foundation crack severity", note: "photos needed", price: 0 },
          { id: "mold", label: "Mold / moisture source", note: "inspection recommended", price: 0 },
          { id: "attic", label: "Attic ventilation", note: "needs photos", price: 0 },
          { id: "crawl", label: "Crawlspace moisture", note: "needs inspection", price: 0 },
        ],
      },
    ];
  }, []);

  const [extracted, setExtracted] = useState<ExtractedLane[]>(() => []);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fun rotating status + smoother progress bar (users hate a stuck bar)
  useEffect(() => {
    if (!analyzing) {
      setUiProgressPct(0);
      setFunAnalysisLine(FUN_ANALYSIS_LINES[0] || "Working…");
      return;
    }

    let lineIndex = 0;
    setFunAnalysisLine(FUN_ANALYSIS_LINES[lineIndex] || "Working…");

    const lineTimer = window.setInterval(() => {
      lineIndex = (lineIndex + 1) % FUN_ANALYSIS_LINES.length;
      setFunAnalysisLine(FUN_ANALYSIS_LINES[lineIndex] || "Working…");
    }, 2250);

    // Fake progress that moves (caps at 97% until we finish) so the bar never feels stuck.
    const progTimer = window.setInterval(() => {
      setUiProgressPct((prev) => {
        const pct = Math.max(0, Math.min(97, prev));
        if (pct >= 97) return 97;

        // Move faster early, slower later (overall slower than before).
        const step = pct < 40 ? 2.4 : pct < 70 ? 1.4 : 0.6;
        const jitter = Math.random() * 0.5;
        return Math.min(97, pct + step + jitter);
      });
    }, 600);

    return () => {
      window.clearInterval(lineTimer);
      window.clearInterval(progTimer);
    };
  }, [analyzing, FUN_ANALYSIS_LINES]);

  // When we have real extraction progress (page-by-page), ensure the bar matches (never goes backwards).
  useEffect(() => {
    if (!analysisProgress) return;
    const pct = Math.round((analysisProgress.current / Math.max(1, analysisProgress.total)) * 100);
    // During extraction, we map 0–100% extraction → 0–35% overall.
    const mapped = Math.max(6, Math.min(35, Math.round(pct * 0.35)));
    setUiProgressPct((prev) => Math.max(prev, mapped));
  }, [analysisProgress?.current, analysisProgress?.total]);

  // Load persisted result on refresh (fixes "demo data" appearing after reload)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(`hw.expressEstimate.result.${props.reportId}`) || "";
      if (!raw) return;
      const j = JSON.parse(raw) as any;
      if (j && Array.isArray(j.lanes)) {
        setExtracted(j.lanes as ExtractedLane[]);
        if (typeof j.summary === "string") setAnalysisSummary(j.summary);
        if (j.cache && typeof j.cache.cacheKey === "string") setCacheKey(j.cache.cacheKey);
        if (j.cache && typeof j.cache.expiresAt === "string") setExpiresAt(j.cache.expiresAt);

        // If we already have a saved result, suppress any stale error state
        // from a failed attempt to reload/rerun analysis.
        setAnalysisError("");
        setAnalyzing(false);
        setAnalysisStage("");
        setAnalysisProgress(null);
      }
    } catch {}
  }, [props.reportId]);

  // If user refreshes and we don't have a staged file, pull from server cache using cacheKey.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (props.stagedId) return;
    if (extracted.length > 0) return;
    if (!cacheKey) return;

    setAnalyzing(true);
    setAnalysisError("");
    setAnalysisStage("Loading saved estimate…");
    setAnalysisProgress(null);

    void (async () => {
      try {
        const fd = new FormData();
        fd.set("cacheKey", cacheKey);
        const r = await fetch("/api/express-estimate/analyze", { method: "POST", body: fd });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j || typeof j !== "object") {
          // If we already have results (from localStorage), don't show a stale error banner.
          if (extracted.length === 0) setAnalysisError(`Analyze failed (${r.status}).`);
          return;
        }
        const rec = j as any;
        if (rec.ok !== true) {
          const detail = typeof rec.detail === "string" ? rec.detail : "";
          const err = typeof rec.error === "string" ? rec.error : "Analyze failed.";
          if (extracted.length === 0) setAnalysisError(detail ? `${err}: ${detail}` : err);
          return;
        }
        const lanes = Array.isArray(rec.lanes) ? rec.lanes : [];
        const normalized: ExtractedLane[] = lanes
          .filter((l: any) => l && typeof l.title === "string" && Array.isArray(l.items))
          .map((l: any) => ({
            title: String(l.title),
            items: (l.items as any[])
              .filter((it) => it && typeof it.label === "string")
              .map((it) => ({
                id: typeof it.id === "string" ? it.id : `item_${Math.random().toString(36).slice(2, 10)}`,
                label: String(it.label),
                note: typeof it.note === "string" ? it.note : undefined,
                range: typeof it.range === "string" ? it.range : undefined,
                price: typeof it.price === "number" ? it.price : undefined,
              })),
          }));
        if (normalized.length) setExtracted(normalized);
        setAnalysisSummary(typeof rec.summary === "string" ? rec.summary : "");

        try {
          window.localStorage.setItem(
            `hw.expressEstimate.result.${props.reportId}`,
            JSON.stringify({ summary: typeof rec.summary === "string" ? rec.summary : "", lanes: normalized, cache: rec.cache || {} })
          );
        } catch {}
      } catch {
        if (extracted.length === 0) setAnalysisError("Analyze failed. Please try again.");
      } finally {
        setAnalyzing(false);
        setAnalysisStage("");
        setAnalysisProgress(null);
      }
    })();
  }, [cacheKey, extracted.length, props.reportId, props.stagedId]);
  // If we have results, don't show stale error banners from background cache reload attempts.
  useEffect(() => {
    if (extracted.length > 0 && analysisError) setAnalysisError("");
  }, [analysisError, extracted.length]);

  const [repairIds, setRepairIds] = useState<Set<string>>(new Set());
  const [openItemId, setOpenItemId] = useState<string>("");
  const [totalsCollapsed, setTotalsCollapsed] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [repairsOpen, setRepairsOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [shareMode, _setShareMode] = useState<"full" | "selected">("full");
  const [shareTab, setShareTab] = useState<"new" | "contacts" | "link">("new");
  const [shareFirstName, setShareFirstName] = useState("");
  const [shareLastName, setShareLastName] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [sharePhone, setSharePhone] = useState("");
  const [shareRole, setShareRole] = useState("");
  const [contactId, setContactId] = useState("");
  const [shareBusy, setShareBusy] = useState(false);

  function setShareMode(next: "full" | "selected") {
    _setShareMode(next);
    // Changing share mode changes what the token represents.
    setShareUrl("");
  }
  const [lightboxSrc, setLightboxSrc] = useState<string>("");

  // Load cached rerun metadata on refresh.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ck = props.cacheKey || window.localStorage.getItem(`hw.expressEstimate.cacheKey.${props.reportId}`) || "";
      const exp = window.localStorage.getItem(`hw.expressEstimate.expiresAt.${props.reportId}`) || "";
      if (ck) setCacheKey(ck);
      if (exp) setExpiresAt(exp);
    } catch {}
  }, [props.cacheKey, props.reportId]);

  const allItems = useMemo(() => extracted.flatMap((lane) => lane.items), [extracted]);
  const selected = useMemo(() => allItems.filter((item) => selectedIds.has(item.id)), [allItems, selectedIds]);
  const repairs = useMemo(() => allItems.filter((item) => repairIds.has(item.id)), [allItems, repairIds]);

  const savedContacts = useMemo(() => {
    if (typeof window === "undefined") return [] as Array<{ id: string; name: string; email?: string; phone?: string }>;
    try {
      const raw = window.localStorage.getItem("hw_props_client_v1") || "[]";
      const arr = JSON.parse(raw) as unknown[];
      const out: Array<{ id: string; name: string; email?: string; phone?: string }> = [];
      const seen = new Set<string>();
      for (const p of Array.isArray(arr) ? arr : []) {
        const rec = p && typeof p === "object" ? (p as Record<string, unknown>) : null;
        const name = typeof rec?.clientName === "string" ? rec.clientName.trim() : "";
        const email = typeof rec?.clientEmail === "string" ? rec.clientEmail.trim() : "";
        const phone = typeof rec?.clientPhone === "string" ? rec.clientPhone.trim() : "";
        const key = (email || phone || name).toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push({ id: key, name: name || email || phone || "Client", email: email || undefined, phone: phone || undefined });
      }
      return out.slice(0, 50);
    } catch {
      return [];
    }
  }, []);

  function parseMoneyToNumber(raw: string): number | null {
    const s = (raw || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!s) return null;

    // Extract first numeric token and optional suffix.
    const m = s.match(/\$?([0-9]+(?:\.[0-9]+)?)(k|m)?/i);
    if (!m) return null;
    const n = Number(m[1]);
    if (!Number.isFinite(n)) return null;
    const suf = (m[2] || "").toLowerCase();
    const mult = suf === "k" ? 1000 : suf === "m" ? 1_000_000 : 1;
    return n * mult;
  }

  function estimateItemValue(item: { range?: string; price?: number }): number | null {
    if (typeof item.price === "number" && Number.isFinite(item.price)) return item.price;
    const r = (item.range || "").replace(/–/g, "-");
    const parts = r.split("-").map((p) => p.trim());
    if (parts.length >= 2) {
      const a = parseMoneyToNumber(parts[0]);
      const b = parseMoneyToNumber(parts[1]);
      if (a !== null && b !== null) return (a + b) / 2;
      return a ?? b;
    }
    return parseMoneyToNumber(r);
  }

  function formatUSD(n: number): string {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  const totals = useMemo(() => {
    const fullNums = allItems.map(estimateItemValue).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const selNums = selected.map(estimateItemValue).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const repNums = repairs.map(estimateItemValue).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const full = fullNums.reduce((a, b) => a + b, 0);
    const sel = selNums.reduce((a, b) => a + b, 0);
    const rep = repNums.reduce((a, b) => a + b, 0);
    return { full, selected: sel, repairs: rep };
  }, [allItems, repairs, selected]);

  // Load staged file(s) (if present) when arriving from list.
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const n = window.sessionStorage.getItem("hw.expressEstimate.notes") || "";
      if (n) setNotes(n);
    } catch {}

    const stagedId = props.stagedId;
    if (!stagedId) return;

    const stagedIds = stagedId
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!stagedIds.length) return;

    try {
      window.sessionStorage.setItem(`hw.expressEstimate.wasUploaded.${props.reportId}`, "1");
      setWasUploaded(true);
    } catch {}

    (async () => {
      try {
        const out: File[] = [];
        for (const id of stagedIds) {
          const f = await getStagedFile(id);
          if (f) out.push(f);
        }
        if (out.length) setFiles(out);
      } finally {
        for (const id of stagedIds) {
          try {
            await deleteStagedFile(id);
          } catch {}
        }
      }
    })();
  }, [props.reportId, props.stagedId]);

  // Collapse the totals bar on mobile after a short moment (shows full card on arrival, then gets out of the way).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
    if (!isMobile) return;

    setTotalsCollapsed(false);
    const t = window.setTimeout(() => setTotalsCollapsed(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  // When we have staged file(s), analyze them and replace demo data.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!files.length) return;

    setAnalyzing(true);
    setAnalysisError("");
    setAnalysisStage("Preparing…");
    setAnalysisProgress(null);

    void (async () => {
      try {
        const fd = new FormData();

        // Build combined text + hash from all files.
        const pieces: string[] = [];
        const hashes: string[] = [];

        for (const f of files) {
          const mime = f.type || "";
          // PDFs: extract text client-side.
          if (mime === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
            const { text, hash } = await extractPdfTextAndHash(f);
            if (hash) hashes.push(hash);

            if (text) {
              pieces.push(text);
              continue;
            }

            // Scanned/image-only PDFs: Vercel will often 413 if we upload the whole PDF.
            // Instead, rasterize pages client-side and OCR page-images via a lightweight endpoint.
            setAnalysisStage("Reading report…");

            const ab = await f.arrayBuffer();
            const pdf = await getDocument({ data: ab }).promise;
            const maxPages = Math.min(pdf.numPages || 0, 18);
            const ocrParts: string[] = [];

            for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
              setAnalysisProgress({ current: pageNum, total: maxPages });
              const page = await pdf.getPage(pageNum);
              const viewport = page.getViewport({ scale: 1.35 });
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (!ctx) continue;
              canvas.width = Math.max(1, Math.floor(viewport.width));
              canvas.height = Math.max(1, Math.floor(viewport.height));
              await page.render({ canvasContext: ctx as any, viewport }).promise;

              const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.7));
              if (!blob) continue;
              const imgFile = new File([blob], `${f.name.replace(/\.pdf$/i, "").slice(0, 48)}-p${pageNum}.jpg`, { type: "image/jpeg" });

              const ocrFd = new FormData();
              ocrFd.set("file", imgFile, imgFile.name);
              const r = await fetch("/api/express-estimate/ocr", { method: "POST", body: ocrFd });
              const j = (await r.json().catch(() => null)) as any;
              if (r.ok && j?.ok === true && typeof j.text === "string" && j.text.trim()) {
                ocrParts.push(j.text.trim());
              }
            }

            const ocrText = ocrParts.join("\n\n---\n\n").trim();
            if (ocrText) pieces.push(ocrText);
            continue;
          }

          // Images: send to server for OCR.
          const ab = await f.arrayBuffer();
          const digest = await crypto.subtle.digest("SHA-256", ab);
          const h = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
          hashes.push(h);
          fd.append("file", f, f.name);
        }

        const combinedText = pieces.join("\n\n---\n\n").trim();
        const combinedHash = hashes.join("|");

        if (combinedText) {
          fd.set("text", combinedText);
          fd.set("hash", combinedHash);
        } else if (!fd.get("file")) {
          setAnalysisError("Analyze failed: no readable input files.");
          setExtracted([]);
          return;
        } else {
          // Only images; still send a stable hash.
          fd.set("hash", combinedHash);
        }

        setAnalysisStage("Generating with Homeworke AI");
        setAnalysisProgress(null);

        fd.set("notes", notes || "");
        fd.set("location", effectiveAddress || "");

        // Allow forcing a re-run via ?force=1 (useful for internal testing / recalibration)
        try {
          const sp = new URLSearchParams(window.location.search);
          if (sp.get("force") === "1") fd.set("force", "1");
        } catch {}

        // Force this run when triggered by the Re-run button.
        if (forceNextRun) fd.set("force", "1");

        let r = await fetch("/api/express-estimate/analyze", { method: "POST", body: fd });

        // Try JSON first; if the platform returns HTML/text on error, fall back to text so we can show *some* reason.
        let j: unknown = null;
        try {
          j = await r.json();
        } catch {
          j = null;
        }

        if (!r.ok) {
          // If we extracted *some* text but the server couldn't find actionable issues,
          // fall back to OCRing rendered pages (helps PDFs where text selection "jumps" / is mostly artifacts).
          try {
            const rec = j && typeof j === "object" ? (j as any) : null;
            if (r.status === 422 && rec?.error === "no_issues_extracted" && !didOcrFallbackRef.current) {
              const pdfFile = files.find((f) => (f.type || "") === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
              if (pdfFile) {
                didOcrFallbackRef.current = true;
                setAnalysisStage("Reading report…");
                setAnalysisProgress(null);

                const ab = await pdfFile.arrayBuffer();
                const pdf = await getDocument({ data: ab }).promise;
                const maxPages = Math.min(pdf.numPages || 0, 12);
                const ocrParts: string[] = [];

                for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                  setAnalysisProgress({ current: pageNum, total: maxPages });
                  const page = await pdf.getPage(pageNum);
                  const viewport = page.getViewport({ scale: 1.35 });
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");
                  if (!ctx) continue;
                  canvas.width = Math.max(1, Math.floor(viewport.width));
                  canvas.height = Math.max(1, Math.floor(viewport.height));
                  await page.render({ canvasContext: ctx as any, viewport }).promise;

                  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.7));
                  if (!blob) continue;
                  const imgFile = new File([blob], `ocr-p${pageNum}.jpg`, { type: "image/jpeg" });

                  const ocrFd = new FormData();
                  ocrFd.set("file", imgFile, imgFile.name);
                  const rr = await fetch("/api/express-estimate/ocr", { method: "POST", body: ocrFd });
                  const jj = (await rr.json().catch(() => null)) as any;
                  if (rr.ok && jj?.ok === true && typeof jj.text === "string" && jj.text.trim()) ocrParts.push(jj.text.trim());
                }

                const ocrText = ocrParts.join("\n\n---\n\n").trim();
                if (ocrText) {
                  const fd2 = new FormData();
                  fd2.set("text", `${combinedText}\n\n---\n\n${ocrText}`);
                  fd2.set("hash", combinedHash + "|ocr");
                  fd2.set("notes", notes || "");
                  fd2.set("location", effectiveAddress || "");
                  if (forceNextRun) fd2.set("force", "1");

                  const r2 = await fetch("/api/express-estimate/analyze", { method: "POST", body: fd2 });
                  const j2 = (await r2.json().catch(() => null)) as any;
                  if (r2.ok && j2?.ok === true) {
                    r = r2;
                    j = j2;
                  } else {
                    // fall through to normal error handling
                    j = j2 || j;
                  }
                }
              }
            }
          } catch {
            // ignore fallback errors; show original error below
          }

          // If the OCR retry succeeded, fall through to normal success handling below.
          if (!r.ok) {
            let extra = "";
            if (j && typeof j === "object") {
              const rec = j as Record<string, unknown>;
              const detail = typeof rec.detail === "string" ? rec.detail : "";
              const err = typeof rec.error === "string" ? rec.error : "";
              extra = detail || err;
            } else {
              try {
                const t = await r.text();
                extra = (t || "").trim().slice(0, 280);
              } catch {
                extra = "";
              }
            }

            setAnalysisError(extra ? `Analyze failed (${r.status}): ${extra}` : `Analyze failed (${r.status}): (no error body returned)`);
            setExtracted([]);
            return;
          }
        }

        if (!j || typeof j !== "object") {
          setAnalysisError("Analyze failed: invalid server response.");
          setExtracted([]);
          return;
        }

        const rec = j as Record<string, unknown>;
        if (rec.ok !== true) {
          const detail = typeof rec.detail === "string" ? rec.detail : "";
          const err = typeof rec.error === "string" ? rec.error : "Analyze failed.";
          setAnalysisError(detail ? `${err}: ${detail}` : err);
          setExtracted([]);
          return;
        }

        const lanes = Array.isArray(rec.lanes) ? (rec.lanes as any[]) : [];

        // Cache metadata for reruns after expiry.
        try {
          const c = (rec as any).cache;
          if (c && typeof c === "object") {
            const ck = typeof c.cacheKey === "string" ? c.cacheKey : "";
            const exp = typeof c.expiresAt === "string" ? c.expiresAt : "";
            if (ck) {
              setCacheKey(ck);
              try {
                window.localStorage.setItem(`hw.expressEstimate.cacheKey.${props.reportId}`, ck);
              } catch {}
            }
            if (exp) {
              setExpiresAt(exp);
              try {
                window.localStorage.setItem(`hw.expressEstimate.expiresAt.${props.reportId}`, exp);
              } catch {}
            }
          }
        } catch {}

        const normalized: ExtractedLane[] = lanes
          .filter((l) => l && typeof l.title === "string" && Array.isArray(l.items))
          .map((l) => ({
            title: String(l.title),
            items: (l.items as any[])
              .filter((it) => it && typeof it.label === "string")
              .map((it) => ({
                id: typeof it.id === "string" ? it.id : `item_${Math.random().toString(36).slice(2, 10)}`,
                label: String(it.label),
                note: typeof it.note === "string" ? it.note : undefined,
                range: typeof it.range === "string" ? it.range : undefined,
                price: typeof it.price === "number" ? it.price : undefined,
                evidence: Array.isArray(it.evidence)
                  ? it.evidence
                      .filter((ev: any) => ev && typeof ev.src === "string")
                      .map((ev: any) => ({ src: String(ev.src), caption: typeof ev.caption === "string" ? ev.caption : undefined }))
                  : undefined,
              })),
          }));

        if (normalized.length) setExtracted(normalized);
        setAnalysisSummary(typeof rec.summary === "string" ? rec.summary : "");

        // Persist result so refresh doesn't fall back to demo/empty.
        try {
          window.localStorage.setItem(
            `hw.expressEstimate.result.${props.reportId}`,
            JSON.stringify({ summary: typeof rec.summary === "string" ? rec.summary : "", lanes: normalized, cache: (rec as any).cache || {} })
          );
        } catch {}

        // Persist this report in the local Reports list so it doesn't disappear.
        try {
          const key = "hw_express_estimate_reports_v1";
          const raw = window.localStorage.getItem(key) || "[]";
          const arr = (JSON.parse(raw) as any[]) || [];
          const next = {
            id: props.reportId,
            address: effectiveAddress || "(unknown address)",
            type: "Inspection",
            createdAt: new Date().toISOString(),
            status: "Ready", // internal only (hidden from UI)
          };
          const out = [next, ...arr.filter((r) => r && r.id !== props.reportId)].slice(0, 200);
          window.localStorage.setItem(key, JSON.stringify(out));
        } catch {}
      } catch (e) {
        setAnalysisError("Analyze failed. Please try again.");
        setExtracted([]);
      } finally {
        setAnalyzing(false);
        setAnalysisStage("");
        setAnalysisProgress(null);
        setToast("");
        setForceNextRun(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, forceNextRun]);

  // Analysis is triggered during the upload/submit step (list page).
  // This page focuses on viewing results and downloading.

  async function download(mode: "full" | "selected") {
    // Allow downloads for uploaded reports too (not just demo reports).
    const reportId = report?.id || props.reportId;
    const reportType = report?.type || "Inspection";

    try {
      setDownloading(mode);
      setToast(mode === "full" ? "Preparing full report…" : "Preparing selected report…");

      const ids = mode === "selected" ? selected.map((s) => s.id) : null;

      const r = await fetch("/api/express-estimate/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          address: effectiveAddress,
          reportType,
          mode,
          selectedIds: ids,
          lanes: extracted,
        }),
      });

      if (!r.ok) {
        setAnalysisError("Download failed.");
        setToast("Download failed.");
        return;
      }

      const blob = await r.blob();
      setToast("Downloading…");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(effectiveAddress || "report")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase()}-${mode}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setToast("Downloaded.");
      window.setTimeout(() => setToast(""), 2200);
    } finally {
      setDownloading("");
    }
  }

  return (
    <PortalShell
      role={props.role}
      title="Instant Estimate"
      portalTitle={props.role === "PRO" ? "Real Estate Pro" : undefined}
      nav={nav}
      description={
        <>
          Download the <span className="font-semibold text-[var(--hw-ink)]">full report</span> or{" "}
          <span className="font-semibold text-[var(--hw-ink)]">select</span> the items you want included. You can also book{" "}
          <span className="font-semibold text-[var(--hw-ink)]">repairs</span> from here.
        </>
      }
      primaryAction={
        <Link href={`${props.basePath}/express-estimate`}>
          <Button variant="secondary">Back to reports</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        {toast ? (
          <>
            {downloading ? <div className="pointer-events-none fixed inset-0 z-[79] bg-black/10" aria-hidden /> : null}
            <div
              className="fixed left-1/2 top-1/2 z-[80] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2"
            >
              <div className="flex items-center justify-center gap-3 rounded-[999px] border border-[rgba(229,57,53,.18)] bg-white px-5 py-3 text-center text-sm font-semibold text-[var(--hw-ink)] shadow-[0_20px_60px_rgba(17,24,39,.18)]">
                {downloading ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin text-[var(--hw-red)]">
                    <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : null}
                <span>{toast}</span>
              </div>
            </div>
          </>
        ) : null}

        {analyzing ? (
          <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/30 p-6 backdrop-blur-[2px]">
            <div className="w-full max-w-sm rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-white p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,.25)]">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[rgba(229,57,53,.20)] border-t-[var(--hw-red)]" />
              <div className="text-sm font-extrabold tracking-tight text-[var(--hw-ink)]">Analyzing inspection report…</div>
              <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]/80">{funAnalysisLine}</div>
              <div className="mt-1 text-xs text-[var(--hw-muted)]">
                {analysisStage || "Working…"}
                {analysisProgress ? ` (${analysisProgress.current}/${analysisProgress.total})` : ""}
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--hw-soft)]">
                <div
                  className="h-full bg-[rgba(229,57,53,.55)] transition-[width] duration-300"
                  style={{ width: `${Math.max(6, Math.min(97, Math.round(uiProgressPct || 0)))}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] font-semibold text-[var(--hw-muted)]">
                Tip: scanned PDFs can take a bit—grab coffee, we got this.
              </div>
            </div>
          </div>
        ) : null}
        <Card className="p-6">
          <div className="w-full min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Instant Estimate</div>
            <div className="mt-1 text-xs font-semibold text-[var(--hw-muted)]">
              Prepared For: <span className="font-semibold text-[var(--hw-ink)]">{effectiveOwnerName || "—"}</span>
            </div>
            <div className="mt-1 text-xs font-semibold text-[var(--hw-muted)]">
              Property Address: <span className="font-semibold text-[var(--hw-ink)]">{effectiveAddress || "—"}</span>
            </div>
            {null}
            {analysisError ? (
              <div className="mt-3 w-full rounded-[14px] border border-[rgba(229,57,53,.22)] bg-[rgba(229,57,53,.06)] p-3">
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[var(--hw-red)]">Analyze failed</div>
                    <div className="mt-1 whitespace-pre-wrap break-words text-xs font-semibold text-[var(--hw-ink)]/80">{analysisError}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(analysisError);
                        setToast("Error copied.");
                        window.setTimeout(() => setToast(""), 1600);
                      } catch {}
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            ) : null}
            {analysisSummary && !/fallback grouping\/pricing/i.test(analysisSummary) ? (
              <div className="mt-2 text-xs text-[var(--hw-muted)]">{analysisSummary}</div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-semibold text-[var(--hw-muted)]">
              {expiresAt
                ? (() => {
                    const ms = new Date(expiresAt).getTime() - Date.now();
                    const days = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
                    const expired = ms < 0;
                    return (
                      <span className={expired ? "text-[var(--hw-red)]" : "text-[var(--hw-muted)]"}>
                        {expired
                          ? "This Instant Estimate has expired. Re-run to refresh pricing."
                          : `Instant Estimate expires in ${days} day${days === 1 ? "" : "s"}.`}
                      </span>
                    );
                  })()
                : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              {/* Mobile: show Repairs CTA even if Repair Cart count is 0 */}
              <Button
                size="sm"
                disabled={extracted.length === 0 || downloading !== ""}
                onClick={() => setDownloadOpen(true)}
                className="gap-2 whitespace-nowrap px-3"
              >
                <Download className="h-4 w-4" />
                {downloading ? "Preparing…" : "Download report"}
              </Button>

              {cacheKey ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={analyzing}
                  onClick={() => {
                    // Internal: allow recalibration without waiting 30 days.
                    // Double-confirm so we don't accidentally burn tokens / overwrite cached pricing.
                    if (!window.confirm("Re-run this estimate and refresh pricing?")) return;
                    if (!window.confirm("Confirm re-run: this will overwrite the saved pricing for this report.")) return;

                    // The server-side cache rerun requires DB persistence; in this pilot
                    // environment it's not always available. So we force a rerun by asking
                    // for the PDF again and re-extracting text client-side.
                    const input = document.createElement("input");
                    input.type = "file";
                    input.multiple = true;
                    input.accept = "application/pdf,image/png,image/jpeg";
                    input.onchange = () => {
                      const picked = Array.from(input.files || []).filter(Boolean);
                      if (!picked.length) return;
                      setForceNextRun(true);
                      setFiles(picked);
                    };
                    input.click();
                  }}
                  className="gap-2 whitespace-nowrap px-3"
                >
                  Re-run estimate
                </Button>
              ) : null}

              <Button
                size="sm"
                variant="secondary"
                disabled={false}
                onClick={() => {
                  setShareMode(selected.length ? "selected" : "full");
                  setShareUrl("");
                  setShareOpen(true);
                }}
                className="gap-2 whitespace-nowrap px-3"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              <Button
                size="sm"
                variant="secondary"
                disabled={repairs.length === 0}
                onClick={() => setRepairsOpen(true)}
                className="hidden gap-2 whitespace-nowrap px-3 sm:inline-flex"
              >
                <Hammer className="h-4 w-4" />
                Repair Cart
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-1 text-[11px] font-semibold text-[var(--hw-ink)]">
                  {repairs.length}
                </span>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                disabled={repairs.length === 0}
                onClick={() => setRepairsOpen(true)}
                className="gap-2 whitespace-nowrap px-3 sm:hidden"
              >
                <Hammer className="h-4 w-4" />
                Repair Cart
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-1 text-[11px] font-semibold text-[var(--hw-ink)]">
                  {repairs.length}
                </span>
              </Button>
            </div>
          </div>

          {extracted.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title={isUploadedReport ? "We couldn’t generate an estimate" : "No estimate yet"}
                text={
                  isUploadedReport
                    ? "We couldn’t extract enough readable text from this PDF to build an estimate (it may be scanned or image-only). Try exporting a text-based PDF (selectable text) or upload a different version."
                    : "Upload an inspection report to generate an Instant Estimate."
                }
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-6">
              {/* Lanes */}
              <div className="grid gap-4">
                {extracted.map((lane) => (
                  <div key={lane.title} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white">
                    <div className="flex flex-col gap-2 border-b border-[var(--hw-line)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-semibold tracking-wide uppercase text-[var(--hw-muted)]">{lane.title}</div>
                        <Chip className="border-[var(--hw-line)] bg-[var(--hw-soft)] text-[var(--hw-ink)]">{lane.items.length}</Chip>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Spacer so header actions line up with per-item action columns (Details pill width) */}
                        <div className="hidden sm:block w-[98px]" aria-hidden="true" />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full px-3 min-w-[92px]"
                          onClick={() => {
                            const ids = lane.items.map((it) => it.id);
                            const allOn = ids.length > 0 && ids.every((id) => selectedIds.has(id));
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              for (const id of ids) {
                                if (allOn) next.delete(id);
                                else next.add(id);
                              }
                              return next;
                            });
                          }}
                        >
                          Select all
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full px-3 min-w-[120px]"
                          onClick={() => {
                            const ids = lane.items.filter((it) => it.pricingMode !== "Quote-only").map((it) => it.id);
                            if (!ids.length) return;
                            const allOn = ids.every((id) => repairIds.has(id));
                            setRepairIds((prev) => {
                              const next = new Set(prev);
                              for (const id of ids) {
                                if (allOn) next.delete(id);
                                else next.add(id);
                              }
                              return next;
                            });
                          }}
                        >
                          Book all repairs
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-1 p-2">
                      {lane.items.map((item) => {
                        const on = selectedIds.has(item.id);
                        const open = openItemId === item.id;
                        const hasEvidence = !!item.evidence?.length;
                        return (
                          <div
                            key={item.id}
                            className={
                              "overflow-hidden rounded-[calc(var(--hw-radius-lg)-8px)] border transition " +
                              (open
                                ? "border-[rgba(229,57,53,.20)] bg-[rgba(229,57,53,.04)]"
                                : on
                                  ? "border-[rgba(229,57,53,.18)] bg-white"
                                  : "border-[var(--hw-line)] bg-white")
                            }
                          >
                            <button
                              type="button"
                              className={
                                "flex w-full flex-col gap-3 px-3 py-3 text-left transition hover:bg-[var(--hw-soft)] sm:flex-row sm:items-start sm:justify-between"
                              }
                              onClick={() => {
                                setOpenItemId((prev) => (prev === item.id ? "" : item.id));
                              }}
                              aria-expanded={open}
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-[var(--hw-ink)]">{item.label}</div>
                                {/* Keep the row clean; show the full narrative inside the accordion */}
                                {item.note ? (
                                  <div className="mt-0.5 text-xs text-[var(--hw-muted)] whitespace-normal break-words line-clamp-2">
                                    {item.note}
                                  </div>
                                ) : null}
                              </div>

                              <div className="w-full sm:w-auto sm:shrink-0">
                                <div className="grid gap-2 sm:flex sm:items-start sm:gap-3">
                                  {/* Row 1: Price (on mobile, keep it nearer the content block) */}
                                  <div className="flex items-start justify-start sm:justify-end">
                                    <div className="w-[110px] shrink-0 text-left tabular-nums sm:text-right">
                                      <div className="text-base font-extrabold tracking-tight text-[var(--hw-ink)]">
                                        {item.pricingMode === "Quote-only" ? "Quote" : formatUSD(estimateItemValue(item) || 0)}
                                      </div>
                                      <div className="text-xs font-semibold text-[var(--hw-muted)]">{item.pricingMode === "Quote-only" ? "Needs onsite" : item.range || "—"}</div>
                                    </div>
                                  </div>

                                  {/* Row 2: Details under the price (left), actions on the right */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap sm:justify-end">
                                    <div
                                      className={
                                        "inline-flex w-[98px] items-center justify-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold " +
                                        (open
                                          ? "border-[rgba(229,57,53,.22)] bg-white text-[var(--hw-red)]"
                                          : "border-[var(--hw-line)] bg-[var(--hw-soft)] text-[var(--hw-muted)]")
                                      }
                                      title="Expand to view details"
                                    >
                                      <Camera className={"h-3.5 w-3.5 " + (hasEvidence ? "opacity-100" : "opacity-0")} />
                                      <span>Details</span>
                                      <ChevronDown className={"h-3.5 w-3.5 transition " + (open ? "rotate-180" : "")} />
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
                                      <Button
                                        size="sm"
                                        variant={on ? "secondary" : "primary"}
                                        className="rounded-full px-3 min-w-[92px]"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setSelectedIds((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(item.id)) next.delete(item.id);
                                            else next.add(item.id);
                                            return next;
                                          });
                                        }}
                                      >
                                        {on ? "Selected" : "Select"}
                                      </Button>

                                    <Button
                                      size="sm"
                                      variant={repairIds.has(item.id) ? "secondary" : "ghost"}
                                      className="rounded-full px-3 min-w-[120px]"
                                      disabled={item.pricingMode === "Quote-only"}
                                      title={
                                        item.pricingMode === "Quote-only"
                                          ? "Needs scope confirmation (quote-only)."
                                          : ""
                                      }
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (item.pricingMode === "Quote-only") return;
                                        setRepairIds((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(item.id)) next.delete(item.id);
                                          else next.add(item.id);
                                          return next;
                                        });
                                      }}
                                    >
                                      {item.pricingMode === "Quote-only" ? "Request quote" : repairIds.has(item.id) ? "Repair ✓" : "Book repair"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              </div>
                            </button>

                            {open ? (
                              <div className="border-t border-[rgba(17,24,39,.08)] bg-white px-3 pb-3 pt-3">
                                {item.note ? (
                                  <div className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--hw-ink)]/80">{item.note}</div>
                                ) : null}

                                {item.pricingMode === "Quote-only" ? (
                                  <div className="mb-3 rounded-[14px] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] px-3 py-2 text-xs font-semibold text-[var(--hw-ink)]/80">
                                    Quote-only until scope is confirmed{item.quantityHint ? ` (hint: ${item.quantityHint})` : ""}.
                                  </div>
                                ) : null}

                                {hasEvidence ? (
                                  <>
                                    {/* Mobile: horizontal scroll strip (small thumbs). Desktop: grid. */}
                                    <div className="-mx-3 overflow-x-auto px-3 pb-1 sm:hidden">
                                      <div className="flex w-max gap-2">
                                        {item.evidence!.slice(0, 12).map((ev) => (
                                          <button
                                            key={ev.src}
                                            type="button"
                                            className="h-20 w-20 shrink-0 overflow-hidden rounded-[14px] border border-[var(--hw-line)] bg-[var(--hw-soft)]"
                                            onClick={() => setLightboxSrc(ev.src)}
                                            title={ev.caption || "Evidence"}
                                          >
                                            <img src={ev.src} alt={ev.caption || "Evidence"} className="h-full w-full object-cover" />
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="hidden grid gap-2 sm:grid-cols-3 sm:grid">
                                      {item.evidence!.slice(0, 6).map((ev) => (
                                        <button
                                          key={ev.src}
                                          type="button"
                                          className="aspect-square w-full overflow-hidden rounded-[14px] border border-[var(--hw-line)] bg-[var(--hw-soft)]"
                                          onClick={() => setLightboxSrc(ev.src)}
                                          title={ev.caption || "Evidence"}
                                        >
                                          <img src={ev.src} alt={ev.caption || "Evidence"} className="h-full w-full object-cover" />
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs text-[var(--hw-muted)]">No evidence photos available for this item.</div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile mid-page Repair Cart CTA (between list and totals) */}
              <div className="lg:hidden">
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={repairs.length === 0}
                    onClick={() => setRepairsOpen(true)}
                    className="gap-2"
                  >
                    <Hammer className="h-4 w-4" />
                    Repair Cart
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-1 text-[11px] font-semibold text-[var(--hw-ink)]">
                      {repairs.length}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Sticky bottom Instant Estimate bar (content width) */}
              <div className="sticky bottom-4 mt-2">
                <div className="rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-white/95 p-4 shadow-[0_18px_48px_rgba(17,24,39,.14)] backdrop-blur">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 text-left"
                    onClick={() => setTotalsCollapsed((v) => !v)}
                    aria-expanded={!totalsCollapsed}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Instant Estimate Total</div>
                      <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">
                        {formatUSD(selected.length ? totals.selected : totals.full)}
                      </div>
                      {totalsCollapsed ? null : (
                        <div className="mt-1 text-xs text-[var(--hw-muted)]">
                          {selected.length
                            ? `Selected ${selected.length} item${selected.length === 1 ? "" : "s"}`
                            : `All items (${allItems.length})`}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 pt-1 text-[var(--hw-muted)]">
                      <ChevronDown className={"h-5 w-5 transition " + (totalsCollapsed ? "" : "rotate-180")} />
                    </div>
                  </button>

                  {totalsCollapsed ? null : (
                    <>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="secondary" disabled={selected.length === 0} onClick={() => setDrawerOpen(true)}>
                          Selected ({selected.length})
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={selected.length === 0}
                          onClick={() => setSelectedIds(new Set())}
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          disabled={extracted.length === 0 || downloading !== ""}
                          onClick={() => setDownloadOpen(true)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {downloading ? "Preparing…" : "Download report"}
                        </Button>
                      </div>

                      {selected.length === 0 ? (
                        <div className="mt-3 text-xs text-[var(--hw-muted)]">Tip: Select items to download a shorter report for clients.</div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Download modal */}
        {downloadOpen ? (
          <div className="fixed inset-0 z-[55] flex items-center justify-center p-6">
            <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setDownloadOpen(false)} aria-label="Close" />
            <div className="relative w-full max-w-md overflow-hidden rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white shadow-[0_20px_60px_rgba(0,0,0,.25)]">
              <div className="flex items-center justify-between border-b border-[var(--hw-line)] p-4">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Download report</div>
                <Button size="sm" variant="secondary" onClick={() => setDownloadOpen(false)}>
                  Close
                </Button>
              </div>
              <div className="p-4">
                <div className="grid gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={selected.length === 0 || downloading !== ""}
                    onClick={() => {
                      setDownloadOpen(false);
                      void download("selected");
                    }}
                  >
                    {downloading === "selected" ? "Preparing…" : `Download selected (${selected.length})`}
                  </Button>
                  <Button
                    size="sm"
                    disabled={extracted.length === 0 || downloading !== ""}
                    onClick={() => {
                      setDownloadOpen(false);
                      void download("full");
                    }}
                  >
                    {downloading === "full" ? "Preparing…" : "Download full report"}
                  </Button>
                </div>
                <div className="mt-3 text-xs text-[var(--hw-muted)]">Tip: Select items to download a shorter report for clients.</div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Share modal */}
        {shareOpen ? (
          <div className="fixed inset-0 z-[56] flex items-center justify-center p-6">
            <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setShareOpen(false)} aria-label="Close" />
            <div className="relative w-full max-w-lg overflow-visible rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white shadow-[0_20px_60px_rgba(0,0,0,.25)]">
              <div className="flex items-center justify-between border-b border-[var(--hw-line)] p-4">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Share report</div>
                <Button size="sm" variant="secondary" onClick={() => setShareOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={shareTab === "new" ? "primary" : "secondary"} onClick={() => setShareTab("new")}>
                    New user
                  </Button>
                  <Button size="sm" variant={shareTab === "contacts" ? "primary" : "secondary"} onClick={() => setShareTab("contacts")}>
                    Contact list
                  </Button>
                  <Button size="sm" variant={shareTab === "link" ? "primary" : "secondary"} onClick={() => setShareTab("link")}>
                    Generic link
                  </Button>
                </div>

                

                {shareTab === "new" ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-3 sm:grid-cols-2 sm:col-span-2">
                      <Input value={shareFirstName} onChange={(e) => setShareFirstName(e.target.value)} placeholder="First name" />
                      <Input value={shareLastName} onChange={(e) => setShareLastName(e.target.value)} placeholder="Last name" />
                    </div>

                    <div className="sm:col-span-2">
                      <Input value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="Email" />
                    </div>

                    <div className="sm:col-span-2">
                      <Input value={sharePhone} onChange={(e) => setSharePhone(e.target.value)} placeholder="Phone" />
                    </div>

                    <div className="sm:col-span-2">
                      <Picker
                        value={shareRole}
                        placeholder="Role"
                        options={[
                          { id: "Homeowner", label: "Homeowner" },
                          { id: "Homebuyer", label: "Homebuyer" },
                          { id: "Listing Agent", label: "Listing Agent" },
                          { id: "Buyer’s Agent", label: "Buyer’s Agent" },
                          { id: "Buyer’s Closing Coordinator", label: "Buyer’s Closing Coordinator" },
                          { id: "Seller’s Closing Coordinator", label: "Seller’s Closing Coordinator" },
                          { id: "Assistant", label: "Assistant" },
                          { id: "Contractor / Vendor", label: "Contractor / Vendor" },
                          { id: "Other", label: "Other" },
                        ]}
                        onChange={setShareRole}
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={shareBusy || !shareEmail || extracted.length === 0}
                        onClick={async () => {
                          setShareBusy(true);
                          try {
                            const name = `${shareFirstName} ${shareLastName}`.trim();
                            const r = await fetch("/api/express-estimate/share/send", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                reportId: report?.id || props.reportId,
                                address: effectiveAddress,
                                reportType: report?.type || "Inspection",
                                mode: "full",
                                lanes: extracted,
                                pro: {
                                  code: "frj",
                                  name: "Fernando Rocha Jr",
                                  email: "Fernando@TheFRJgroup.com",
                                  phone: "",
                                  brokerageName: "The FRJ Group",
                                },
                                recipient: {
                                  name: name || undefined,
                                  email: shareEmail || undefined,
                                  phone: sharePhone || undefined,
                                  role: shareRole || undefined,
                                },
                              }),
                            });
                            const j = (await r.json().catch(() => null)) as unknown;
                            const ok = !!(j && typeof j === "object" && (j as Record<string, unknown>).ok === true);
                            if (!ok) {
                              setToast("Send failed.");
                              window.setTimeout(() => setToast(""), 2000);
                              return;
                            }
                            // Also add to saved contacts store (local for now)
                            try {
                              const raw = window.localStorage.getItem("hw_props_client_v1") || "[]";
                              const arr = (JSON.parse(raw) as unknown[]) || [];
                              arr.unshift({
                                clientName: name,
                                clientEmail: shareEmail,
                                clientPhone: sharePhone,
                              });
                              window.localStorage.setItem("hw_props_client_v1", JSON.stringify(arr.slice(0, 200)));
                            } catch {}
                            setToast("Sent.");
                            window.setTimeout(() => setToast(""), 1800);
                          } finally {
                            setShareBusy(false);
                          }
                        }}
                      >
                        {shareBusy ? "Sending…" : "Send & Add Contact +"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {shareTab === "contacts" ? (
                  <div className="mt-3 grid gap-3">
                    <Picker
                      searchable
                      value={contactId}
                      placeholder="Select a contact"
                      options={savedContacts.map((c) => ({
                        id: c.id,
                        label: c.name,
                        sublabel: [c.email, c.phone].filter(Boolean).join(" • "),
                      }))}
                      onChange={(id) => {
                        setContactId(id);
                        const c = savedContacts.find((x) => x.id === id);
                        if (c) {
                          const parts = (c.name || "").trim().split(/\s+/g);
                          setShareFirstName(parts[0] || c.name || "");
                          setShareLastName(parts.slice(1).join(" ") || "");
                          setShareEmail(c.email || "");
                          setSharePhone(c.phone || "");
                          setShareRole("");
                        }
                      }}
                    />

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={!report || shareBusy || !shareEmail}
                        onClick={async () => {
                          if (!report) return;
                          setShareBusy(true);
                          try {
                            const name = `${shareFirstName} ${shareLastName}`.trim();
                            const r = await fetch("/api/express-estimate/share/send", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                reportId: report?.id || props.reportId,
                                address: effectiveAddress,
                                reportType: report?.type || "Inspection",
                                mode: "full",
                                lanes: extracted,
                                pro: {
                                  code: "frj",
                                  name: "Fernando Rocha Jr",
                                  email: "Fernando@TheFRJgroup.com",
                                  phone: "",
                                  brokerageName: "The FRJ Group",
                                },
                                recipient: {
                                  name: name || undefined,
                                  email: shareEmail || undefined,
                                  phone: sharePhone || undefined,
                                },
                              }),
                            });
                            const j = (await r.json().catch(() => null)) as unknown;
                            const ok = !!(j && typeof j === "object" && (j as Record<string, unknown>).ok === true);
                            if (!ok) {
                              setToast("Send failed.");
                              window.setTimeout(() => setToast(""), 2000);
                              return;
                            }
                            setToast("Sent.");
                            window.setTimeout(() => setToast(""), 1800);
                          } finally {
                            setShareBusy(false);
                          }
                        }}
                      >
                        {shareBusy ? "Sending…" : "Send"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {shareTab === "link" ? (
                  <div className="mt-3 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Generic share link</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">Full report</div>
                    <div className="mt-1 text-xs text-[var(--hw-muted)]">
                      Anyone with this link can view the estimate. Booking repairs and additional details are gated until they log in via magic link.
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="secondary" disabled={shareBusy || extracted.length === 0} className="gap-2" onClick={async () => {
                        setShareBusy(true);
                        try {
                          let url = shareUrl;
                          if (!url) {
                            const r = await fetch("/api/express-estimate/share/create", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                reportId: report?.id || props.reportId,
                                address: effectiveAddress,
                                reportType: report?.type || "Inspection",
                                mode: "full",
                                lanes: extracted,
                                pro: {
                                  code: "frj",
                                  name: "Fernando Rocha Jr",
                                  email: "Fernando@TheFRJgroup.com",
                                  phone: "",
                                  brokerageName: "The FRJ Group",
                                },
                                recipient: {},
                              }),
                            });
                            const j = (await r.json().catch(() => null)) as unknown;
                            const rec = j && typeof j === "object" ? (j as Record<string, unknown>) : null;
                            const ok = !!(rec && rec.ok === true);
                            const nextUrl = rec && typeof rec.url === "string" ? rec.url : "";
                            if (!ok || !nextUrl) {
                              setToast("Share link failed.");
                              window.setTimeout(() => setToast(""), 2200);
                              return;
                            }
                            url = nextUrl;
                            setShareUrl(url);
                          }
                          await navigator.clipboard.writeText(url);
                          setToast("Link copied.");
                          window.setTimeout(() => setToast(""), 1800);
                        } catch {
                          setToast("Copy failed.");
                          window.setTimeout(() => setToast(""), 1800);
                        } finally {
                          setShareBusy(false);
                        }
                      }}>
                        <Copy className="h-4 w-4" />
                        {shareBusy ? "Working…" : "Copy link"}
                      </Button>
                    </div>

                    <div className="mt-2 text-xs text-[var(--hw-muted)]">
                      {shareUrl ? `Link ready: ${shareUrl.replace(/^https?:\/\//, "").slice(0, 42)}…` : "A link will be generated when you copy."}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Selected Drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close"
            />
            <div className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-[0_20px_60px_rgba(0,0,0,.25)]">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--hw-line)] p-5">
                <div>
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Selected items</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Included in your Instant Estimate download.</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setDrawerOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="p-5">
                <div className="mb-4 rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Selected total</div>
                  <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{formatUSD(totals.selected)}</div>
                  <div className="mt-1 text-xs text-[var(--hw-muted)]">Based on selected items (avg of ranges).</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={!report || selected.length === 0} onClick={() => download("selected")}>
                    Download selected
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={selected.length === 0}
                    onClick={() => {
                      setSelectedIds(new Set());
                    }}
                  >
                    Clear
                  </Button>
                </div>

                {selected.length ? (
                  <div className="mt-4 grid gap-2">
                    {selected.map((item) => (
                      <div key={item.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-[var(--hw-ink)]">{item.label}</div>
                            {item.note ? <div className="mt-1 truncate text-xs text-[var(--hw-muted)]">{item.note}</div> : null}
                          </div>
                          <button
                            className="text-xs font-semibold text-[var(--hw-muted)] hover:text-[var(--hw-ink)]"
                            onClick={() => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                next.delete(item.id);
                                return next;
                              });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-6 text-sm text-[var(--hw-muted)]">
                    Nothing selected yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Repairs Drawer */}
        {repairsOpen ? (
          <div className="fixed inset-0 z-50">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setRepairsOpen(false)} aria-label="Close" />
            <div className="absolute inset-0 bg-white shadow-[0_20px_60px_rgba(0,0,0,.25)] lg:inset-auto lg:right-0 lg:top-0 lg:h-full lg:w-full lg:max-w-[420px]">
              <div className="grid grid-cols-3 items-center gap-3 border-b border-[var(--hw-line)] p-5">
                <div />
                <div className="text-center">
                  <div className="text-sm font-extrabold tracking-tight text-[var(--hw-red)]">Homeworke</div>
                  <div className="mt-0.5 text-xs font-semibold text-[var(--hw-muted)]">Repairs to book</div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => setRepairsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Repairs total (est.)</div>
                  <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{formatUSD(totals.repairs)}</div>
                  <div className="mt-1 text-xs text-[var(--hw-muted)]">This is a placeholder flow — next step will be Checkout/Booking.</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={repairs.length === 0} onClick={() => {}}>
                    Continue to book
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={repairs.length === 0}
                    onClick={() => {
                      setRepairIds(new Set());
                    }}
                  >
                    Clear
                  </Button>
                </div>

                {repairs.length ? (
                  <div className="mt-4 grid gap-2">
                    {repairs.map((item) => (
                      <div key={item.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-[var(--hw-ink)]">{item.label}</div>
                            {item.note ? <div className="mt-1 truncate text-xs text-[var(--hw-muted)]">{item.note}</div> : null}
                          </div>
                          <button
                            className="inline-flex h-7 items-center text-xs font-semibold text-[var(--hw-muted)] hover:text-[var(--hw-ink)]"
                            onClick={() => {
                              setRepairIds((prev) => {
                                const next = new Set(prev);
                                next.delete(item.id);
                                return next;
                              });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-6 text-sm text-[var(--hw-muted)]">
                    No repairs selected.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Lightbox */}
        {lightboxSrc ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <button type="button" className="absolute inset-0 bg-black/60" onClick={() => setLightboxSrc("")} aria-label="Close" />
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[var(--hw-radius-lg)] bg-white shadow-[0_20px_60px_rgba(0,0,0,.35)]">
              <div className="flex items-center justify-between border-b border-[var(--hw-line)] p-3">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Evidence</div>
                <Button size="sm" variant="secondary" onClick={() => setLightboxSrc("")}>
                  Close
                </Button>
              </div>
              <div className="bg-black">
                <img src={lightboxSrc} alt="Evidence" className="max-h-[80vh] w-full object-contain" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PortalShell>
  );
}
