import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Side",
  description: "Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen w-full flex">
          <div className="p-8 w-full">{children}</div>
        </div>
      </body>
    </html>
  );
}
