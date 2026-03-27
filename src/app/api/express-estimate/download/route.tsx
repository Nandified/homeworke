import { NextResponse } from "next/server";
import * as React from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

export const runtime = "nodejs";

type LaneItem = { id: string; label: string; note?: string; range?: string; price?: number };
type Lane = { title: string; items: LaneItem[] };

type Body = {
  reportId: string;
  address: string;
  reportType?: string;
  mode: "full" | "selected";
  selectedIds: string[] | null;
  lanes: Lane[];
};

function parseMoneyToNumber(raw: string): number | null {
  const s = (raw || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!s) return null;
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

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11, fontFamily: "Helvetica" },

  header: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  meta: { color: "#6b7280", fontSize: 10 },

  totalCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff1f2",
    borderRadius: 14,
    padding: 12,
  },
  totalLabel: { color: "#6b7280", fontSize: 9, textTransform: "uppercase" },
  totalValue: { fontSize: 18, fontWeight: 800, marginTop: 4 },
  totalNote: { color: "#6b7280", fontSize: 9, marginTop: 2 },

  laneTitle: { fontSize: 10, fontWeight: 700, marginTop: 10, marginBottom: 6, color: "#6b7280", textTransform: "uppercase" },

  item: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  itemLabel: { fontSize: 11, fontWeight: 600 },
  itemRange: { fontSize: 10, color: "#6b7280" },
  itemNote: { marginTop: 2, fontSize: 10, color: "#6b7280" },
});

function ReportPdf(props: { body: Body; filtered: Lane[] }) {
  const { body, filtered } = props;
  const now = new Date();

  const nums = filtered
    .flatMap((l) => l.items)
    .map((it) => estimateItemValue(it))
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const total = nums.reduce((a, b) => a + b, 0);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Express Estimate</Text>
          <Text style={styles.meta}>
            {body.address} {body.reportType ? `• ${body.reportType}` : ""}
          </Text>
          <Text style={styles.meta}>
            {now.toLocaleString()} • {body.mode === "selected" ? "Selected items" : "Full"}
          </Text>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatUSD(total)}</Text>
            <Text style={styles.totalNote}>Based on avg of provided ranges (demo).</Text>
          </View>
        </View>

        {filtered.map((lane) => (
          <View key={lane.title}>
            <Text style={styles.laneTitle}>{lane.title}</Text>
            {lane.items.map((it) => (
              <View key={it.id} style={styles.item}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemLabel}>{it.label}</Text>
                  <Text style={styles.itemRange}>{it.range || "—"}</Text>
                </View>
                {it.note ? <Text style={styles.itemNote}>{it.note}</Text> : null}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const selected = new Set(body.selectedIds || []);
    const filtered: Lane[] = (body.lanes || []).map((lane) => ({
      title: lane.title,
      items:
        body.mode === "selected"
          ? (lane.items || []).filter((it) => selected.has(it.id))
          : (lane.items || []),
    }));

    const cleaned = filtered.filter((l) => l.items.length);

    const doc = <ReportPdf body={body} filtered={cleaned.length ? cleaned : filtered} />;
    const blob = await pdf(doc).toBlob();
    const out = await blob.arrayBuffer();

    return new NextResponse(out, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=express-estimate-${body.reportId}.pdf`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "server_error", detail: String(e?.message || e || "unknown") }, { status: 500 });
  }
}
