# Cómo funciona un reproductor de música (análisis con REA)

Fase 1 del reproductor propio de la web. El objetivo era entender cómo está armado un reproductor tipo Spotify para construir uno propio.

## Qué se analizó y con qué

| Objetivo | Cómo | Resultado |
| --- | --- | --- |
| Reproductor web de Spotify (`open.spotify.com`) | REA `inspect-web-page` / `analyze-web-bundle` | **No se pudo.** La red del entorno donde corrió el análisis bloquea `open.spotify.com` y `sdk.scdn.co`. |
| [Museeks](https://github.com/martpie/museeks), reproductor de escritorio de código abierto (MIT) | REA `analyze-javascript-application` sobre `src/lib/player.ts` | 56 funciones, 9 eventos de audio, grafo de llamadas y accesos a propiedades. |
| [Amplitude.js](https://www.npmjs.com/package/amplitudejs) 5.3.2, reproductor HTML5 para webs | REA `analyze-javascript-application` sobre `dist/` | Accesos a `audio.*`, listas, aleatorio, repetición, buffer. |
| Spotify Web Playback SDK | Lectura directa de los tipos oficiales `@types/spotify-web-playback-sdk` 0.1.19 (no REA: son solo declaraciones) | Forma del estado que expone Spotify. |

Comando usado (REA 6.5.0, `npm install rea-agents`):

```bash
rea analyze-javascript-application ./museeks --source-path src/lib/player.ts --format json
rea analyze-javascript-application ./amplitudejs/package --format json
```

Para repetir el análisis sobre Spotify hace falta permitir `open.spotify.com` en la red del entorno y abrir la página en un Chromium con `--remote-debugging-port`. Ver la sección final sobre DRM: aun así, el audio de Spotify no se puede sacar de su reproductor.

## Lo que mostró REA

### Museeks: el reproductor es una clase fuera de React

REA encontró una clase `Player` (línea 58) que extiende un `EventEmitter` y es dueña de **un único `HTMLAudioElement`** (`new Audio()`). Las funciones que devolvió agrupan bien las responsabilidades:

- **Transporte:** `play`, `pause`, `playPause`, `stop`, `next` (L302), `previous` (L335), `setCurrentTime`, `getCurrentTime`.
- **Cola:** `start` (L365), `startFromQueue`, `addToQueue`, `addNextInQueue`, `removeFromQueue`, `clearQueue`, `setQueue`, `getQueue`, `getQueueCursor`.
- **Modos:** `toggleShuffle` (L505), `toggleRepeat` (L540), `getShuffle`, `getRepeat`.
- **Volumen y velocidad:** `setVolume`, `toggleMute`, `unmute`, `setPlaybackRate`.
- **Estado para la UI:** `getState` (L240) y `emitStateChange` (L230), llamada 18 veces.
- **Sistema operativo:** `setupMediaSession` (L169) y `syncMediaSession` (L207).

Las propiedades más tocadas son `queueCursor` (31 accesos), `emitStateChange` (18), `queue` (14), `audio.addEventListener` (10), `shuffle` y `repeat` (9 cada una). Los eventos de audio que escucha: `play`, `pause`, `ended`, `error`, `timeupdate`, `loadstart` y `volumechange`. Registra cuatro acciones en `navigator.mediaSession.setActionHandler` (play, pause, previoustrack, nexttrack).

Detalles de comportamiento, leídos en las funciones que REA señaló:

- **Cola = lista + cursor.** `queue` es un array de canciones y `queueCursor` el índice de la que suena.
- **Aleatorio sin perder el orden.** Al activar aleatorio guarda la lista original en `oldQueue`, mezcla el resto dejando la canción actual primera y pone el cursor en 0. Al desactivarlo restaura `oldQueue` y busca la canción actual para seguir desde ahí.
- **Repetir** cicla `None → All → One → None`.
- **Anterior** reinicia la canción si pasaron más de 5 segundos; si no, va a la anterior.
- **Siguiente** con "repetir una" vuelve a la misma canción incluso cuando el usuario aprieta "siguiente".
- **La UI no guarda estado propio.** React se suscribe con `useSyncExternalStore` a `getState`, que devuelve un objeto cacheado y solo cambia cuando se llama a `emitStateChange`.

### Amplitude.js: un `<audio>` global y listas

REA mostró el mismo núcleo: un `audio` único con 30 `addEventListener`, y el resto del estado en un objeto de configuración global: `active_playlist` (180 accesos), `shuffle_on`, `shuffle_list` (la versión mezclada, separada de la lista original), `repeat` y `repeat_song`. Lee `audio.buffered` para dibujar cuánto está cargado y usa la Web Audio API solo para las visualizaciones.

### Spotify Web Playback SDK: el mismo modelo, visto desde afuera

Los tipos oficiales describen el estado que Spotify entrega en cada evento `player_state_changed`:

```ts
interface PlaybackState {
  paused: boolean;
  position: number;        // ms
  duration: number;        // ms
  repeat_mode: 0 | 1 | 2;  // apagado, contexto, canción
  shuffle: boolean;
  track_window: { current_track; previous_tracks; next_tracks };
}
```

y los comandos `togglePlay`, `nextTrack`, `previousTrack`, `seek(ms)`, `setVolume`. Es el mismo modelo que Museeks: una cola con cursor (`previous / current / next`), modos de repetición de tres estados, aleatorio y posición. La diferencia es dónde vive el audio (ver abajo).

## Anatomía de un reproductor

Juntando las tres fuentes, un reproductor de música tiene cinco piezas:

1. **Motor de audio.** Un solo elemento `<audio>` para toda la app. Se le cambia `src` para cambiar de canción. Nunca se crea uno por canción.
2. **Cola.** Lista en orden original + orden de reproducción + cursor. Aleatorio reordena solo el orden de reproducción.
3. **Estado observable.** Un objeto (canción, sonando o no, posición, duración, volumen, aleatorio, repetición) que la UI lee y que cambia por eventos del `<audio>`.
4. **Controles e interfaz.** Barra fija abajo: canción, anterior / reproducir / siguiente, barra de progreso, volumen, aleatorio, repetir.
5. **Integración con el sistema.** Media Session API para los controles de la pantalla de bloqueo, el auricular y las teclas multimedia.

Y una regla de arquitectura: **el reproductor vive por encima de las páginas**, para que la música siga sonando al navegar.

## Qué se lleva el MVP

| Pieza | En el MVP |
| --- | --- |
| Motor | Un `<audio>` dentro del layout raíz de Next.js, así no se corta al cambiar de página. |
| Cola | `src/lib/queue.ts`: lista + orden + cursor, como Museeks, pero sin copiar la lista para aleatorio (solo cambia el orden). Con pruebas. |
| Siguiente con "repetir una" | Se aparta de Museeks: al apretar "siguiente" pasa a la próxima; solo repite cuando la canción termina sola (como Spotify). |
| Anterior | Reinicia si pasaron más de 3 segundos, como Spotify. |
| Estado | Un contexto de React con el estado y otro aparte para la posición, que cambia varias veces por segundo. |
| Interfaz | Barra fija abajo, con los colores del álbum que suena. |
| Sistema | Media Session con título, artista, álbum y las acciones play, pausa, anterior, siguiente y buscar. |
| Fuente del audio | Archivos del propio visitante, guardados en IndexedDB de su navegador. |

## Por qué el audio no puede venir de Spotify

El reproductor web de Spotify y su Web Playback SDK reproducen audio cifrado con DRM (Encrypted Media Extensions; el SDK exige un navegador con soporte EME). El navegador descifra dentro de un módulo cerrado y la página nunca tiene acceso a los datos de audio. Sacar ese audio implicaría romper el DRM, algo que ni corresponde ni hace este proyecto.

Las vías legítimas para usar el catálogo de Spotify con una interfaz propia son:

- **Web Playback SDK:** tu propia UI controla un reproductor de Spotify en el navegador. Requiere Spotify Premium, registrar una app en el panel de desarrolladores de Spotify e iniciar sesión con OAuth. Es la candidata natural para una fase 2.
- **Embeds oficiales** (lo que la web ya usa): sin cuenta, pero con la interfaz de Spotify.

Por eso el MVP reproduce archivos que el visitante ya tiene. La web sigue sin alojar audio.
