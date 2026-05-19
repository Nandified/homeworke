import "./globals.css";

export const metadata = {
  title: "Homeworke — Home services in Chicago",
  description: "Plan home repairs, organize estimates, and schedule verified next steps with Homeworke.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
