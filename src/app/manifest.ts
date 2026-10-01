import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyPR — Evolução nos treinos",
    short_name: "MyPR",
    description: "Registre séries, acompanhe volume e conquiste novos recordes pessoais.",
    start_url: "/",
    display: "standalone",
    background_color: "#1A1613",
    theme_color: "#1A1613",
    orientation: "portrait-primary",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    shortcuts: [
      {
        name: "Começar treino",
        short_name: "Treinar",
        description: "Abrir o registro de treino",
        url: "/?treino=1",
        icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
  };
}
