import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyPR — Evolução nos treinos",
    short_name: "MyPR",
    description: "Registre séries, acompanhe volume e conquiste novos recordes pessoais.",
    start_url: "/",
    display: "standalone",
    background_color: "#07101e",
    theme_color: "#07101e",
    orientation: "portrait-primary",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
