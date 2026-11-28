import type { Metadata, Viewport } from "next";
import "./globals.css";
import VayoCursor from "@/components/vayo-cursor";

export const metadata: Metadata = {
  title: "VAYO — A driver for your car",
  description: "Book a driver for your own car in Mananthavady and nearby parts of Wayanad. One-way, hourly and full-day bookings.",
  applicationName: "VAYO",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "VAYO" },
};

export const viewport: Viewport = {
  themeColor: "#f0e6f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<VayoCursor /></body></html>;
}
