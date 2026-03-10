import "./globals.css";

export const metadata = {
  title: "Homeworke",
  description: "Homeworke 3.0 rebuild in progress",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
