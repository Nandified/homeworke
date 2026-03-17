import { NextRequest } from "next/server";

import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

// Keep styling simple + on-brand (red/ink/muted). No external network fetches.

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 11,
    color: "#111827",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 18,
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
    marginTop: 16,
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
    color: "#111827",
    lineHeight: 1.35,
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
  qrWrap: {
    marginTop: 10,
    display: "flex",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  qr: {
    width: 96,
    height: 96,
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
  const qrDataUrl = safeParam(req, "qr", 4000); // optional: data:image/png;base64,...

  const Flyer = (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Homeworke</Text>
          <Text style={styles.title}>Your home projects — handled end-to-end.</Text>
          <Text style={styles.sub}>
            Homeworke connects you with vetted, licensed, and insured professionals — backed by a dedicated Project Manager + Home Guide to keep everything stress-free.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.h}>What you get</Text>
          <Text style={styles.li}>• Vetted, licensed, insured service providers</Text>
          <Text style={styles.li}>• A dedicated Project Manager for every request</Text>
          <Text style={styles.li}>• Clear scopes, coordinated scheduling, and oversight</Text>
          <Text style={styles.li}>• Express Estimate: a fast, helpful price-range to plan next steps</Text>

          <View style={styles.qrWrap}>
            {qrDataUrl ? <Image style={styles.qr} src={qrDataUrl} /> : null}
            <View>
              <Text style={{ fontSize: 12, fontWeight: 700 }}>{proName}</Text>
              {office ? <Text style={{ marginTop: 2, color: "#6B7280" }}>{office}</Text> : null}
              <Text style={{ marginTop: 8, fontSize: 11, fontWeight: 700 }}>Get started</Text>
              {inviteLink ? <Text style={styles.link}>{inviteLink}</Text> : <Text style={styles.small}>Use your invite link to connect and start a request.</Text>}
              <Text style={{ marginTop: 6, ...styles.small }}>
                Scan the QR code or use the link to connect your projects and keep your Pro in the loop.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.h}>Best for</Text>
          <Text style={styles.li}>• Listing prep + repair coordination</Text>
          <Text style={styles.li}>• Post-inspection repairs + negotiation clarity</Text>
          <Text style={styles.li}>• Ongoing maintenance after closing</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.small}>Homeworke — the all-in-one home services platform</Text>
          <Text style={styles.small}>homeworke.com</Text>
        </View>
      </Page>
    </Document>
  );

  const instance = pdf(Flyer);
  const buf = (await instance.toBuffer()) as unknown as Uint8Array;

  return new Response(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=Homeworke-Flyer-${encodeURIComponent(proName.replace(/\s+/g, "-"))}.pdf`,
      "Cache-Control": "no-store",
    },
  });
}
