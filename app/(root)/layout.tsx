import Sidebar from "@/components/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen w-full flex">
          <Sidebar />
          <div className="p-8 w-full">{children}</div>
        </div>
      </body>
    </html>
  );
}
