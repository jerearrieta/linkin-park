# Linkin Park

Web personal con los ocho álbumes de estudio de Linkin Park, de *Hybrid Theory* (2000) a *From Zero* (2024). Cada álbum muestra sus canciones y cada canción tiene reproductor, una explicación de qué trata y la letra en dos columnas (original y español).

Hecha con Next.js (App Router) y TypeScript. Se exporta como sitio estático.

## Uso

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # genera el sitio estático en out/
npm start          # sirve out/
npm test           # pruebas del importador de letras y del reproductor
npm run typecheck
```

## Estructura

```
src/
  app/                        Rutas
    page.tsx                  Inicio: los álbumes
    [album]/page.tsx          Álbum: lista de canciones
    [album]/[track]/page.tsx  Canción: reproductor, "De qué trata" y letra
  components/                 Componentes reutilizables (portada, lista, reproductor, letras, etc.)
    PlayerProvider.tsx        Reproductor propio: el <audio>, la cola y Media Session
    PlayerBar.tsx             Barra de reproducción fija abajo
  data/
    albums.ts                 Álbumes, canciones, colores y enlaces (editar acá)
    explanations.ts           Texto de "De qué trata" por canción
    lyrics.ts                 Letras incluidas en el sitio (vacío)
  lib/
    albums.ts                 Arma los álbumes y canciones a partir de data/
    lyrics.ts                 Alinea la letra original con la traducción (con pruebas)
    storage.ts                Guarda letras y el volumen en el navegador
    audioFiles.ts             Guarda los archivos de audio del visitante (IndexedDB)
    queue.ts                  Cola de reproducción: orden, aleatorio y repetir (con pruebas)
```

Cada canción se identifica por una clave `<álbum>-<número>` (por ejemplo `met-13` para "Numb"). Esa clave se usa para guardar las letras.

## Reproductor

La web tiene un reproductor propio: una barra fija abajo con anterior, reproducir, siguiente, aleatorio, repetir, barra de progreso y volumen, que sigue sonando al cambiar de página y responde a las teclas multimedia y a la pantalla de bloqueo. Reproduce archivos de audio que el visitante elige desde su equipo, uno por canción. Se guardan en el navegador (IndexedDB); la web no aloja audio.

Cómo se diseñó, a partir de un análisis con [REA](https://github.com/morluto/rea): [docs/reproductor-analisis.md](docs/reproductor-analisis.md).

## Letras

Las letras de Linkin Park tienen derechos de autor, así que el repositorio no incluye ninguna. Cada visitante carga las suyas con "Agregar letra" en cada canción.

Se guardan en el navegador. La "Copia de seguridad" al pie de cada página sirve para pasarlas a otro equipo.
