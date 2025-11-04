import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Path Controller Next.js Demo",
  description:
    "Case triage console that keeps overlays and document titles in sync using @path-controller/core.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
