import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ReceiveLyrics } from "@/components/ReceiveLyrics";

export const metadata: Metadata = { title: "Letra recibida" };

export default function ReceivePage() {
  return (
    <PageShell crumbs={[{ label: "Discografía", href: "/" }, { label: "Letra recibida" }]}>
      <div className="eyebrow">Enviar a mi sitio</div>
      <h1 className="display" style={{ fontSize: "clamp(34px, 6vw, 56px)", margin: "6px 0 18px" }}>
        Letra recibida
      </h1>
      <ReceiveLyrics />
    </PageShell>
  );
}
