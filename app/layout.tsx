import type { Metadata } from "next";
import "./globals.css";
import SideNav from "@/components/SideNav";

export const metadata: Metadata = {
  title: "Chilli Wings Manager Pro",
  description: "Centro de operaciones de Chilli Wings",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0a0a0d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body>
        <div className="flex min-h-screen">
          <SideNav />
          <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
