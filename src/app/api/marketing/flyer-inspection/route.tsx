import { NextRequest } from "next/server";

import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 11,
    color: "#111827",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 16,
  },
  brand: {
    fontSize: 20,
    fontWeight: 700,
    color: "#E53935",
  },
  title: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: 700,
  },
  sub: {
    marginTop: 4,
    color: "#6B7280",
    lineHeight: 1.35,
  },
  panel: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
  },
  h: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
  },
  li: {
    marginTop: 3,
    lineHeight: 1.35,
  },
  qrWrap: {
    marginTop: 10,
    display: "flex",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  qr: {
    width: 92,
    height: 92,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  small: {
    fontSize: 10,
    color: "#6B7280",
    lineHeight: 1.35,
  },
  link: {
    color: "#111827",
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#6B7280",
  },
});

function safeParam(req: NextRequest, key: string, max = 180) {
  const v = req.nextUrl.searchParams.get(key);
  if (!v) return "";
  return v.slice(0, max);
}

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const proName = safeParam(req, "name", 80) || "Your Real Estate Pro";
  const office = safeParam(req, "office", 100);
  const inviteLink = safeParam(req, "invite", 400);
  const qrDataUrl = safeParam(req, "qr", 4000);

  const Doc = (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Homeworke</Text>
          <Text style={styles.title}>Inspection → repair-cost clarity.</Text>
          <Text style={styles.sub}>
            Upload your inspection report and get a fast, helpful Express Estimate range — so you can plan next steps and avoid surprises.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.h}>What this helps with</Text>
          <Text style={styles.li}>• Negotiation clarity (what repairs may cost)</Text>
          <Text style={styles.li}>• Prioritizing items by urgency + budget</Text>
          <Text style={styles.li}>• Moving faster from findings → action</Text>

          <View style={styles.qrWrap}>
            {qrDataUrl ? <Image style={styles.qr} src={qrDataUrl} /> : null}
            <View>
              <Text style={{ fontSize: 12, fontWeight: 700 }}>{proName}</Text>
              {office ? <Text style={{ marginTop: 2, color: "#6B7280" }}>{office}</Text> : null}
              <Text style={{ marginTop: 8, fontSize: 11, fontWeight: 700 }}>Upload your inspection</Text>
              {inviteLink ? <Text style={styles.link}>{inviteLink}</Text> : <Text style={styles.small}>Use your invite link to connect.</Text>}
              <Text style={{ marginTop: 6, ...styles.small }}>Scan the QR or use the link, then upload the report for an Express Estimate.</Text>
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.h}>What happens next</Text>
          <Text style={styles.li}>1) Connect using the link</Text>
          <Text style={styles.li}>2) Upload the inspection PDF</Text>
          <Text style={styles.li}>3) Review your Express Estimate range</Text>
          <Text style={styles.li}>4) Coordinate repairs if you choose to proceed</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.small}>Homeworke — the all-in-one home services platform</Text>
          <Text style={styles.small}>homeworke.com</Text>
        </View>
      </Page>
    </Document>
  );

  const instance = pdf(Doc);
  const buf = (await instance.toBuffer()) as unknown as Uint8Array;

  return new Response(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=Homeworke-Inspection-Estimate-${encodeURIComponent(proName.replace(/\s+/g, "-"))}.pdf`,
      "Cache-Control": "no-store",
    },
  });
}
