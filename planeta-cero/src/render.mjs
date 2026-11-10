// Render por línea de órdenes.
//   node src/render.mjs --previa 1,5.5,12 --salida previa.png [--esc 2]   → tira PNG de fotogramas
//   node src/render.mjs --ini 0 --fin 94 [--sin-textos] [--sin-subtitulos] → fotogramas RGB24 216x384 por stdout
import { Lienzo, FPS } from './nucleo.mjs';
import { fotograma } from './escenas.mjs';
import { guardarTira } from './vista.mjs';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
const op = { textos: !process.argv.includes('--sin-textos'), subtitulos: !process.argv.includes('--sin-subtitulos') };
if (process.argv.includes('--previa')) {
  const ts = arg('previa').split(',').map(Number);
  const fr = ts.map((t) => { const c = new Lienzo(); fotograma(c, t, op); return c; });
  guardarTira(fr, arg('salida', 'previa.png'), Number(arg('esc', 2)));
} else {
  const f0 = Math.round(Number(arg('ini', 0)) * FPS), f1 = Math.round(Number(arg('fin', 94)) * FPS);
  const c = new Lienzo();
  const fs = await import('node:fs');
  for (let f = f0; f < f1; f++) {
    fotograma(c, f / FPS, op);
    fs.writeSync(1, c.d);
  }
}
