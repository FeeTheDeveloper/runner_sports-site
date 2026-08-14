import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Runner Sports & Analytics", short_name: "Runner", description: "Sports intelligence and performance analytics.", start_url: "/dashboard", display: "standalone", background_color: "#04132E", theme_color: "#04132E", icons: [{ src: "/brand/runner-logo.jpg", sizes: "1200x1200", type: "image/jpeg" }] };
}
