import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Runner Sports & Analytics", short_name: "Runner", description: "Sports intelligence and performance analytics.", start_url: "/dashboard", display: "standalone", background_color: "#04081A", theme_color: "#04081A", icons: [{ src: "/brand/icon.png", sizes: "1100x1100", type: "image/png" }] };
}
