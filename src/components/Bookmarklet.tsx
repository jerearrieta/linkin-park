"use client";

import { useEffect, useRef, useState } from "react";
import { bookmarkletHref } from "@/lib/sendLyrics";
import { useToast } from "./Toast";

/** The draggable "Enviar a mi sitio" link, pointing at whatever address this site is open on. */
export function Bookmarklet() {
  const link = useRef<HTMLAnchorElement>(null);
  const [href, setHref] = useState("");
  const toast = useToast();

  useEffect(() => {
    const h = bookmarkletHref(window.location.origin);
    // React refuses javascript: URLs in href, so it is set on the element directly.
    link.current?.setAttribute("href", h);
    setHref(h);
  }, []);

  return (
    <div className="row">
      <a
        ref={link}
        className="btn primary"
        onClick={(e) => {
          e.preventDefault();
          toast("Arrastralo a la barra de favoritos");
        }}
      >
        Enviar a mi sitio
      </a>
      <button
        className="btn"
        disabled={!href}
        onClick={() =>
          navigator.clipboard.writeText(href).then(
            () => toast("Código copiado"),
            () => toast("No se pudo copiar"),
          )
        }
      >
        Copiar el código
      </button>
    </div>
  );
}
