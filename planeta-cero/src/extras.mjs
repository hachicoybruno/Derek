// Material de apoyo: lámina de referencias de diseño de la temporada y subtítulos SRT de la narración.
//   node src/extras.mjs salida
import fs from 'node:fs';
import path from 'node:path';
import { Lienzo, hex } from './nucleo.mjs';
import { guardarTira } from './vista.mjs';
import { dibujarPlaneta, dibujarLuna, estrellas, ATERRIZAJE } from './planeta.mjs';
import { dibujarMundo, XL, ZL } from './mundo.mjs';
import { nexus, capsula, explorador, CIAN_CLARO } from './elementos.mjs';
import { NARRACION, SUBTITULOS } from './guion.mjs';

const dir = process.argv[2] || 'salida';
// 1) Planeta Cero desde el espacio
const a = new Lienzo(); a.limpiar(hex('#02030a')); estrellas(a, 0);
a.halo(-34, 150, 150, [255, 196, 130], 0.42);
dibujarLuna(a, 172, 78, 9);
dibujarPlaneta(a, 108, 196, 84, (ATERRIZAJE.lon * Math.PI) / 180 + 0.2, 0);
a.texto('REF. 01', 108, 320, CIAN_CLARO, { alin: 'c' }); a.texto('PLANETA CERO', 108, 334, [255, 255, 255], { alin: 'c', esc: 2 });
// 2) Núcleo holográfico de NEXUS
const b = new Lienzo(); b.limpiar(hex('#04070d'));
nexus(b, 108, 170, 38, 1.3, 1);
nexus(b, 60, 268, 9, 0.4, 0); nexus(b, 108, 268, 9, 2.1, 1); nexus(b, 156, 268, 5, 0.9, 1);
b.texto('REF. 02', 108, 320, CIAN_CLARO, { alin: 'c' }); b.texto('NEXUS', 108, 334, [255, 255, 255], { alin: 'c', esc: 2 });
// 3) Explorador provisional y cápsula
const c = new Lienzo();
dibujarMundo(c, { x: XL + 1.4, z: ZL + 9, h: 1.6, yaw: Math.PI, hor: 250, f: 200 }, 1, { sol: -40, objetos: [
  { x: XL, z: ZL, dib: (c, sx, sy, s) => capsula(c, sx, sy, s, { t: 0, puerta: 1 }) },
  { x: XL + 2.6, z: ZL + 3.4, dib: (c, sx, sy, s) => explorador(c, sx, sy, s, { vista: 'frente', t: 0 }) },
  { x: XL + 1.2, z: ZL + 4.4, dib: (c, sx, sy, s) => explorador(c, sx, sy, s, { vista: 'espalda', t: 0 }) },
] });
c.rect(0, 310, 216, 50, [3, 8, 16], 0.7);
c.texto('REF. 03', 108, 320, CIAN_CLARO, { alin: 'c' }); c.texto('EXPLORADOR Y CÁPSULA', 108, 336, [255, 255, 255], { alin: 'c' });
guardarTira([a, b, c], path.join(dir, 'referencias.png'), 5);

// SRT de la narración (guía de tiempos para la locución y subtítulos editables)
const tc = (t) => { const ms = Math.round(t * 1000); const p = (n, l = 2) => String(n).padStart(l, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
fs.writeFileSync(path.join(dir, 'narracion-nexus.srt'), SUBTITULOS.map((s, i) => `${i + 1}\n${tc(s.ini)} --> ${tc(s.fin)}\n${s.lineas.join('\n')}\n`).join('\n'));
fs.writeFileSync(path.join(dir, 'narracion-nexus.txt'), NARRACION.map((n) => `[${tc(n.ini).slice(3, 8)} – ${tc(n.fin).slice(3, 8)}] (escena ${n.esc})\n${n.texto}\n`).join('\n'));
console.log('ok');
