import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VAYO | Your car. Your journey. Our driver.",
  description: "Book a professional driver for your own car in Mananthavady, Wayanad.",
  applicationName: "VAYO",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "VAYO" },
};

export const viewport: Viewport = {
  themeColor: "#121310",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
