// Utilidad de previsualización: guarda lienzos como PNG ampliados (vía ffmpeg) para revisar fotogramas.
import { spawnSync } from 'node:child_process';
import { Lienzo } from './nucleo.mjs';

/** Guarda una lista de lienzos como una tira horizontal PNG ampliada `esc` veces. */
export function guardarTira(lienzos, ruta, esc = 2) {
  const w = lienzos[0].w, h = lienzos[0].h, n = lienzos.length, sep = 2;
  const tw = n * w + (n - 1) * sep;
  const t = new Lienzo(tw, h);
  t.limpiar([255, 0, 255]);
  lienzos.forEach((l, k) => {
    for (let y = 0; y < h; y++) t.d.set(l.d.subarray(y * w * 3, (y + 1) * w * 3), (y * tw + k * (w + sep)) * 3);
  });
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${tw}x${h}`, '-i', '-',
    '-vf', `scale=${tw * esc}:${h * esc}:flags=neighbor`, '-frames:v', '1', ruta], { input: Buffer.from(t.d.buffer) });
  if (r.status !== 0) throw new Error(String(r.stderr));
}
