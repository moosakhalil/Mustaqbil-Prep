import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mustaqbil Prep",
    short_name: "Mustaqbil",
    description: "MCQ practice for degree courses and short service commission initial tests.",
    start_url: "/home?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1020",
    theme_color: "#0b1020",
    lang: "en",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Build a quiz", url: "/practice", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Military", url: "/home/military", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
