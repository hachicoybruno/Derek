# PLANETA CERO · Episodio 01 «El nacimiento de un mundo»

Producción del primer episodio como **animación pixel art generada por código**: cada fotograma se
dibuja de forma determinista en un lienzo de 216×384 y se amplía ×5 sin suavizado a 1080×1920 (30 fps).
No usa imágenes, muestras de audio ni material de terceros.

> Esta carpeta es independiente de la aplicación FlipDesk del resto del repositorio.

## Entregables (`salida/`)

| Archivo | Contenido |
| --- | --- |
| `planeta-cero-ep01.mp4` | Episodio completo: 8 escenas, interfaz, subtítulos de NEXUS, música y efectos. **Sin voz.** |
| `planeta-cero-ep01-sin-textos.mp4` | Las mismas imágenes y audio sin interfaz ni subtítulos, para rotular en la edición. |
| `musica_y_efectos.wav` | Mezcla de música ambiental y efectos (94 s, estéreo, sin voz). |
| `narracion-nexus.srt` / `.txt` | Diálogo exacto del guion con los tiempos usados en el montaje. |
| `referencias.png` | Las tres referencias de diseño de la temporada: Planeta Cero, NEXUS, explorador y cápsula. |
| `hoja-de-contactos.png` | Un fotograma cada 4 s del MP4 final. |

Los `.mp4` y el `.wav` no se versionan (pesan ~90 MB); se regeneran con los comandos de abajo.

## Cómo regenerarlo

Requiere Node 18+, Python 3 con `numpy` y `scipy`, y `ffmpeg`.

```bash
python3 src/audio.py salida/musica_y_efectos.wav
```

```bash
node src/producir.mjs salida/planeta-cero-ep01.mp4 --audio salida/musica_y_efectos.wav
```

```bash
node src/producir.mjs salida/planeta-cero-ep01-sin-textos.mp4 --audio salida/musica_y_efectos.wav --sin-textos
```

```bash
node src/extras.mjs salida
```

Previsualizar instantes sueltos (segundos) como tira PNG:

```bash
node src/render.mjs --previa 12,30,47,80 --salida previa.png
```

## Añadir la voz de NEXUS

El guion recomienda grabar la locución aparte y montarla después. Con la voz en `voz.wav`
(empezando en 00:00), se mezcla así, dejando la música por debajo:

```bash
ffmpeg -i salida/planeta-cero-ep01.mp4 -i voz.wav -filter_complex "[0:a]volume=0.55[m];[m][1:a]amix=inputs=2:duration=first:normalize=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k salida/planeta-cero-ep01-con-voz.mp4
```

Si la voz definitiva no coincide con los tiempos, se ajustan `ini`/`fin` de cada frase en
`src/guion.mjs` (los subtítulos se recalculan solos) y se vuelve a producir.

## Estructura

| Archivo | Qué contiene |
| --- | --- |
| `src/guion.mjs` | Línea de tiempo: escenas, narración y subtítulos. |
| `src/escenas.mjs` | Las ocho escenas, transiciones y composición de cada fotograma. |
| `src/planeta.mjs` | Geografía fija de Planeta Cero (seis continentes), luna, estrellas y mapa digital. |
| `src/mundo.mjs` | Superficie: llanura, río, bosques, cordillera y cielo, con una sola cámara 2.5D. |
| `src/elementos.mjs` | NEXUS, cápsula, explorador, nave, holograma de la base, VÓRTEX, interfaz. |
| `src/estacion.mjs` | Interior de la estación: sala del monitor y sala del Consejo. |
| `src/nucleo.mjs` | Lienzo, tramado, ruido y tipografía bitmap 5×7 con tildes. |
| `src/audio.py` | Síntesis de la música y los efectos. |

## Continuidad para los próximos episodios

- La geografía sale únicamente de `superficie()` en `src/planeta.mjs`. No cambiar semillas ni continentes.
- El aterrizaje está en `ATERRIZAJE` (planeta) y `XL`/`ZL` (superficie); la futura base, en `BASE`.
- El personaje de la cápsula es un **explorador provisional**: los diez fundadores no aparecen hasta el episodio 02.
- No hay ciudades ni habitantes de VÓRTEX en este episodio.

## Diferencias respecto al guion

- **Duración: 94 s en lugar de 90.** Las escenas 1–7 respetan los tiempos del guion; la escena 8 dura
  9 s (no 5) para que el texto final y «CONTINUARÁ...» se puedan leer.
- **Sin voz.** No hay locución grabada; el diálogo va como subtítulos con los tiempos de `narracion-nexus.srt`.
- Proporciones medidas del planeta: 55 % océano, 23 % bosques y llanuras, 12 % cordilleras y nieve,
  8 % desierto, 3 % volcánico (el diseño pide 55 / 25 / 10 / 7 / 3).
- El texto «PLANETA HABITABLE ENCONTRADO» y las tres líneas finales se parten en dos renglones para caber en vertical.
