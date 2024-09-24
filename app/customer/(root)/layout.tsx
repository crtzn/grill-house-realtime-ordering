import type { Metadata } from "next";
import GetOrder from "@/components/order/GetOrder";

export const metadata: Metadata = {
  title: "Customer",
  description: "Customer Side",
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
          <GetOrder />
        </div>
      </body>
    </html>
  );
}
