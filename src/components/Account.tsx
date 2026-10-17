"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { localAudioKeys, getLocalAudioBlob } from "@/lib/audioFiles";
import { currentUser, onCloudChange, startCloud, supabase } from "@/lib/cloud";
import { getLyrics, saveLocalLyrics } from "@/lib/storage";
import { useToast } from "./Toast";
import styles from "./Account.module.css";

let started = false;

/** Mounted once in the root layout: follows the sign-in state and syncs on each sign-in. */
export function CloudSync() {
  useEffect(() => {
    if (started) return;
    started = true;
    startCloud({
      readLyrics: getLyrics,
      writeLyrics: (k, l) => void saveLocalLyrics(k, l),
      audioKeys: localAudioKeys,
      readAudio: getLocalAudioBlob,
    });
  }, []);
  return null;
}

const useUser = () => useSyncExternalStore(onCloudChange, currentUser, () => null);

/** Sign-in bar under the header: with an account, lyrics and audio follow you to any computer. */
export function Account() {
  const user = useUser();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user)
    return (
      <div className={styles.bar}>
        <span>
          Conectado como <b>{user.email}</b>: tus letras y audios se guardan en tu cuenta.
        </span>
        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>
          Salir
        </button>
      </div>
    );

  if (!open)
    return (
      <div className={styles.bar}>
        <span>Entrá con tu cuenta para ver tus letras, traducciones y audios desde cualquier computadora.</span>
        <button className="btn primary" onClick={() => setOpen(true)}>
          Entrar
        </button>
      </div>
    );

  async function submit(kind: "in" | "up") {
    if (!email || password.length < 6) return toast("Poné tu email y una contraseña de al menos 6 caracteres");
    setBusy(true);
    const { data, error } =
      kind === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin } });
    setBusy(false);
    if (error) return toast(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos" : error.message);
    if (kind === "up" && !data.session) toast("Cuenta creada: confirmala con el link que te llegó por email y después entrá");
  }

  return (
    <form
      className={styles.bar}
      onSubmit={(e) => {
        e.preventDefault();
        void submit("in");
      }}
    >
      <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        type="password"
        placeholder="Contraseña"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn primary" type="submit" disabled={busy}>
        Entrar
      </button>
      <button className="btn" type="button" disabled={busy} onClick={() => void submit("up")}>
        Crear cuenta
      </button>
      <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
        Cancelar
      </button>
    </form>
  );
}
