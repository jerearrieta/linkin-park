import type { Metadata } from "next";
import { CloudSync } from "@/components/Account";
import { PlayerProvider } from "@/components/PlayerProvider";
import { ToastProvider } from "@/components/Toast";
// Fonts are bundled from @fontsource so the build never depends on downloading from Google Fonts.
import "@fontsource/big-shoulders/latin-600.css";
import "@fontsource/big-shoulders/latin-800.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Linkin Park Discoteca", template: "%s · Linkin Park" },
  description: "Los ocho álbumes de estudio de Linkin Park, sus canciones, de qué trata cada una y la letra en dos columnas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <CloudSync />
          <PlayerProvider>{children}</PlayerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
