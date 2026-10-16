import type { Metadata } from "next";
import { Bookmarklet } from "@/components/Bookmarklet";
import { PageShell } from "@/components/PageShell";
import styles from "../formato/page.module.css";

export const metadata: Metadata = { title: "Cargar letras con un clic" };

export default function BookmarkletPage() {
  return (
    <PageShell crumbs={[{ label: "Discografía", href: "/" }, { label: "Cargar letras con un clic" }]}>
      <div className="eyebrow">Enviar a mi sitio</div>
      <h1 className="display" style={{ fontSize: "clamp(34px, 6vw, 56px)", marginTop: 6 }}>
        Cargar letras con un clic
      </h1>
      <div className={styles.format}>
        <p>
          Este botón va en los favoritos de tu navegador. Cuando estás viendo una canción en letras.com, lo tocás y la
          letra original y la traducción quedan guardadas en la canción que corresponde de este sitio, sin copiar ni
          pegar. Lee solo la página que tenés abierta y lo guarda en este navegador.
        </p>
        <Bookmarklet />
        <p>
          <b>En la computadora:</b> mostrá la barra de favoritos (Ctrl+Shift+B, o Cmd+Shift+B en Mac) y arrastrá el
          botón &quot;Enviar a mi sitio&quot; hasta ella.
        </p>
        <p>
          <b>En el celular:</b> tocá &quot;Copiar el código&quot;, guardá cualquier página en favoritos, editá ese
          favorito, llamalo &quot;Enviar a mi sitio&quot; y pegá el código en lugar de la dirección. Para usarlo, en
          letras.com escribí &quot;Enviar&quot; en la barra de direcciones y elegí el favorito.
        </p>
        <p>Cómo cargar todas rápido:</p>
        <ol>
          <li>En cualquier canción, tocá &quot;Letra y traducción en letras.com&quot;.</li>
          <li>Tocá el favorito &quot;Enviar a mi sitio&quot;. La letra queda guardada.</li>
          <li>
            Tocá &quot;Siguiente sin letra&quot; para abrir la próxima canción que falta en letras.com, y repetí.
          </li>
        </ol>
        <p className="note">
          Si el botón no encuentra la letra en la página, seleccioná el texto con el mouse y tocalo de nuevo. Podés
          seleccionar la letra original, una línea con solo <code>---</code> y la traducción, y se separan solas. Si una
          canción ya tenía letra, te pregunta antes de reemplazarla.
        </p>
      </div>
    </PageShell>
  );
}
