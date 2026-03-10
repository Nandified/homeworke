import "./globals.css";

export const metadata = {
  title: "Homeworke — Home services in Chicago",
  description: "Get a free instant estimate and schedule home services with vetted local pros in Chicago.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
