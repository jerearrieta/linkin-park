import styles from "./SongAbout.module.css";

/** "De qué trata": an original explanation of the song, never a translation of it. */
export function SongAbout({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <section className={styles.about}>
      <div className="eyebrow">De qué trata</div>
      <p>{text}</p>
      <div className="note">Interpretación escrita para esta web, no es una traducción.</div>
    </section>
  );
}
