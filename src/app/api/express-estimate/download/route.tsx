import { NextResponse } from "next/server";
import * as React from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

export const runtime = "nodejs";

type LaneItem = { id: string; label: string; note?: string; range?: string };
type Lane = { title: string; items: LaneItem[] };

type Body = {
  reportId: string;
  address: string;
  reportType?: string;
  mode: "full" | "selected";
  selectedIds: string[] | null;
  lanes: Lane[];
};

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  meta: { color: "#6b7280", marginBottom: 12 },
  laneTitle: { fontSize: 12, fontWeight: 700, marginTop: 10, marginBottom: 6 },
  item: { marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  itemLabel: { fontSize: 11, fontWeight: 600 },
  itemRange: { fontSize: 10, color: "#6b7280" },
  itemNote: { marginTop: 2, fontSize: 10, color: "#6b7280" },
});

function ReportPdf(props: { body: Body; filtered: Lane[] }) {
  const { body, filtered } = props;
  const now = new Date();
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Express Estimate</Text>
        <Text style={styles.meta}>
          {body.address} {body.reportType ? `• ${body.reportType}` : ""} • {now.toLocaleString()} •{" "}
          {body.mode === "selected" ? "Selected items" : "Full"}
        </Text>

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
