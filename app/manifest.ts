import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VAYO Driver Booking",
    short_name: "VAYO",
    description: "Book a professional driver for your own car.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5eef4",
    theme_color: "#e5d0ec",
    icons: [],
  };
}
