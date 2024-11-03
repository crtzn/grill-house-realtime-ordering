import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin Dashboard",
  metadataBase: new URL("https://myminervaglobal.com"),
  other: {
    "facebook-domain-verification": "v0bi65ycr5xnp9tnka3v6yhxfinbea",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
