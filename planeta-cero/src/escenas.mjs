// Las ocho escenas del episodio 01 y la composición final de cada fotograma.
// fotograma(c, T, op) dibuja el instante T (segundos) de forma determinista.
import { W, H, Lienzo, clamp, lerp, smooth, easeOut, easeIn, easeInOut, prog, ventana, hex, mix, bayer, hash2, fbm2 } from './nucleo.mjs';
import { dibujarPlaneta, dibujarLuna, estrellas, mapaPlaneta, ATERRIZAJE } from './planeta.mjs';
import { dibujarMundo, proy, RIO, XL, ZL, BASE, crestaSol } from './mundo.mjs';
import { CIAN, CIAN_CLARO, ROJO, nexus, capsula, explorador, nave, anclaNave, holoBase, vortex, panel, subtitulo } from './elementos.mjs';
import { SALA, salaMonitor, salaConsejo } from './estacion.mjs';
import { ESCENAS, SUBTITULOS, hablando, DURACION } from './guion.mjs';

const RAD = Math.PI / 180;
const LON_L = ATERRIZAJE.lon * RAD, LAT_L = ATERRIZAJE.lat * RAD;
const AMBAR = [255, 214, 110];
const sala = new Lienzo(SALA.w, SALA.h);
const aux = new Lienzo();
const aux2 = new Lienzo();
let OP = {};
/** panel de interfaz (se omite en la versión sin textos) */
const P = (...a) => { if (OP.textos !== false) panel(...a); };
const TXT = (c, ...a) => { if (OP.textos !== false) c.texto(...a); };

/** Posición del explorador provisional sobre la llanura */
const EX = { x: XL + 4.5, z: ZL + 11 };

/** Resplandor cálido de la estrella, fuera de cuadro por la izquierda. */
function estrellaMadre(c, y = 150, f = 1) {
  c.halo(-34, y, 150, [255, 196, 130], 0.42 * f);
  c.halo(-20, y, 60, [255, 236, 200], 0.6 * f);
}
/** Capa de nubes que se atraviesa durante el descenso. a = cobertura 0..1 */
function nubesPaso(c, t, a) {
  if (a <= 0) return;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm2(x * 0.021 + 3, (y + t * 520) * 0.012, 4, 444);
    const k = a * 1.45 - n;
    if (k > 0.42) c.px(x, y, k > 0.6 ? [250, 252, 255] : [228, 236, 246]);
    else if (k > 0.3) { if (bayer(x, y) < (k - 0.3) * 8) c.px(x, y, [214, 226, 240]); }
  }
}
/** Dibuja con fn y oscurece hacia `col` los píxeles que hayan cambiado (siluetas a contraluz). */
function conTinte(c, fn, col, a) {
  if (a <= 0) return fn();
  aux2.copiar(c);
  fn();
  const d = c.d, o = aux2.d;
  for (let i = 0; i < d.length; i += 3) if (d[i] !== o[i] || d[i + 1] !== o[i + 1] || d[i + 2] !== o[i + 2]) { d[i] += (col[0] - d[i]) * a; d[i + 1] += (col[1] - d[i + 1]) * a; d[i + 2] += (col[2] - d[i + 2]) * a; }
}
function mezclar(c, b, a) { const d = c.d, o = b.d; for (let i = 0; i < d.length; i++) d[i] += (o[i] - d[i]) * a; }
/** transición digital por líneas de barrido */
function barrido(c, b, a) {
  for (let y = 0; y < H; y++) {
    const u = hash2(y >> 1, 7, 808) * 0.6 + (y / H) * 0.4;
    if (a * 1.25 > u) { const i0 = y * W * 3; c.d.set(b.d.subarray(i0, i0 + W * 3), i0); if (a * 1.25 - u < 0.08) for (let x = 0; x < W; x++) c.luz(x, y, CIAN, 0.5); }
  }
}

// =============================================================== ESCENA 01 — UNA SEÑAL EN LA OSCURIDAD
function esc1(c, t, T) {
  const contenido = (m, x, y, w, h) => {
    const cx = x + w / 2, cy = y + h / 2;
    if (t < 3.9) {
      const on = t >= 1 && (t > 3.2 || Math.floor((t - 1) / 0.4) % 2 === 0);
      if (on) { m.px(cx, cy, CIAN_CLARO); for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) m.px(cx + ox, cy + oy, [26, 74, 150]); }
    } else if (t < 7.0) {
      const enc = prog(t, 3.9, 4.2);
      m.rect(x, y, w, h, [4, 16, 30], enc);
      nexus(m, cx, y + 26, 8, T, hablando(T));
      if (OP.textos === false) return;
      [['SISTEMA NEXUS', 4.1, CIAN_CLARO], ['ESTADO: REACTIVADO', 4.75, CIAN], ['BÚSQUEDA FINALIZADA', 5.4, CIAN]].forEach(([s, t0, col], i) => {
        const n = Math.floor((t - t0) * 34);
        if (n > 0) m.texto(s, cx, y + 56 + i * 14, col, { alin: 'c', n });
      });
      if (t > 6.05) {
        const k = t - 6.05, par = k < 0.6 ? Math.floor(k * 10) % 2 : 1;
        m.rect(x + 16, y + 100, w - 32, 31, CIAN, 0.16 + 0.1 * par);
        m.marco(x + 16, y + 100, w - 32, 31, CIAN_CLARO, 0.9);
        m.texto('PLANETA HABITABLE', cx, y + 107, [255, 255, 255], { alin: 'c', n: Math.floor(k * 40) });
        m.texto('ENCONTRADO', cx, y + 119, [255, 255, 255], { alin: 'c', n: Math.floor(k * 40) - 17 });
      }
    } else {
      // coordenadas estelares
      m.rect(x, y, w, h, [2, 4, 10]);
      for (let i = 0; i < 70; i++) { const sx = x + hash2(i, 1, 60) * w, sy = y + hash2(i, 2, 60) * h; m.pxa(sx, sy, [220, 230, 255], 0.3 + 0.7 * hash2(i, 3, 60)); }
      const r = 9 + Math.floor((t * 4) % 2);
      for (let k = -r; k <= r; k++) if (Math.abs(k) > 3) { m.px(cx + k, cy, CIAN); m.px(cx, cy + k, CIAN); }
      m.marco(cx - r - 3, cy - r - 3, 2 * r + 7, 2 * r + 7, CIAN, 0.6);
      m.px(cx, cy, [255, 255, 255]);
      if (OP.textos === false) return;
      m.texto('COORDENADAS', cx, y + 10, CIAN_CLARO, { alin: 'c' });
      m.texto('AR 14h 29m 43s', cx, y + h - 27, CIAN, { alin: 'c' });
      m.texto('DEC -62° 40\' 46"', cx, y + h - 14, CIAN, { alin: 'c' });
    }
  };
  const luz = t < 2.2 ? 0 : t < 3.9 ? 0.3 * smooth(prog(t, 2.2, 3.8)) : 0.3 + 0.62 * prog(t, 3.9, 4.6) + (hash2(Math.floor(t * 20), 1, 61) > 0.9 ? -0.05 : 0);
  salaMonitor(sala, { t: T, luz, contenido });
  // cámara: retroceso lento, leve desplazamiento lateral y acercamiento final a las coordenadas
  const ret = easeInOut(prog(t, 2.2, 4.5)), ac = easeIn(prog(t, 7.1, 8));
  const s = Math.pow(9, 1 - ret) * Math.pow(7, ac);
  const pan = (lerp(0, -8, ret) + 17 * smooth(prog(t, 4.5, 7.0))) * (1 - smooth(prog(t, 7.0, 7.4)));
  c.zoom(sala, SALA.cx + pan, SALA.cy + lerp(0, 8, ret) * (1 - smooth(prog(t, 7.0, 7.4))), s);
  // puntal en primer plano (paralaje)
  if (s < 1.6) {
    const x = Math.round(-16 - pan * 2.4 - (s - 1) * 60);
    c.rect(x, 0, 16, H, [2, 3, 6]); c.rect(x + 16, 0, 1, H, mix([2, 3, 6], [40, 90, 160], luz * 0.5));
    for (let y = 30; y < H; y += 46) c.rect(x + 4, y, 8, 3, [8, 11, 17]);
  }
}

// =============================================================== ESCENA 02 — EL PLANETA DESCONOCIDO
function esc2(c, t, T) {
  c.limpiar(hex('#02030a'));
  const desc = prog(t, 9.4, 13); // descenso hacia la atmósfera
  estrellas(c, T, t * 2.2, -t * 1.2 - desc * 60, 1 - desc * 0.5);
  estrellaMadre(c, 150 - desc * 80, 1 - desc * 0.6);
  // travelling frontal lento + movimiento orbital suave
  const R = t < 9.4 ? lerp(5, 80, smooth(t / 9.4) * 0.85 + (t / 9.4) * 0.15) : 80 * Math.exp(Math.log(7) * easeIn(desc) * 0.6 + Math.log(7) * desc * 0.4);
  const cx = 108 - 5 * smooth(t / 9.4) + 5 * desc, cy = 184 + 4 * Math.sin(t * 0.25);
  const rl = 5 + t * 0.42;
  dibujarLuna(c, 166 + t * 1.6 + desc * 90, 96 - t * 2.4 - desc * 120, rl, 0.6 + t * 0.02);
  const k = smooth(prog(t, 7.5, 12.2));
  dibujarPlaneta(c, cx, cy, R, LON_L + 0.75 * (1 - smooth(prog(t, 0, 12.4))) , T, { incl: lerp(0.3, 0, k), lat0: lerp(0, LAT_L, k) });
  // retícula holográfica alrededor del planeta
  const ar = ventana(t, 0.7, 9.2, 0.4);
  if (ar > 0 && OP.textos !== false) {
    const rr = R + 9, n = Math.ceil(rr * 7);
    for (let i = 0; i < n; i++) { const th = (i / n) * 6.2832; if ((Math.floor((th + t * 0.3) * 12) % 4) < 2) c.luz(Math.round(cx + Math.cos(th) * rr - 0.5), Math.round(cy + Math.sin(th) * rr - 0.5), CIAN, 0.5 * ar); }
    for (const th of [0, 1.5708, 3.1416, 4.7124]) for (let q = 0; q < 5; q++) c.luz(Math.round(cx + Math.cos(th + 0.785) * (rr + 2 + q)), Math.round(cy + Math.sin(th + 0.785) * (rr + 2 + q)), CIAN_CLARO, 0.8 * ar);
  }
  // indicadores (visibles solo el tiempo necesario)
  const ap = (t0, t1) => ventana(t, t0, t1, 0.3);
  P(c, 108, 34, [{ txt: 'AGUA: CONFIRMADA' }], t - 1.0, ap(1.0, 8.8), CIAN, { w: 150 });
  P(c, 108, 54, [{ txt: 'ATMÓSFERA: ESTABLE' }], t - 2.6, ap(2.6, 8.8), CIAN, { w: 150 });
  P(c, 108, 74, [{ txt: 'RECURSOS: ABUNDANTES' }], t - 4.2, ap(4.2, 8.8), CIAN, { w: 150 });
  P(c, 108, 44, [{ txt: 'POBLACIÓN: 0', esc: 2, col: AMBAR }], t - 9.0, ap(9.0, 11.9), AMBAR, { w: 160 });
  // atraviesa una capa de nubes
  nubesPaso(c, -t, prog(t, 11.9, 12.9));
}

// =============================================================== ESCENA 03 — UN MUNDO VACÍO
function camVuelo(t) {
  const u = prog(t, 0, 11.6), e = 1 - Math.pow(1 - u, 2.1);
  const z = 150 + (ZL - 44 - 150) * e;
  const fin = smooth(prog(u, 0.5, 1));
  const x = lerp(RIO(z + 60) + 9, XL - 2, fin);
  const pend = (RIO(z + 95) - RIO(z + 65)) / 30;
  return { x, z, h: lerp(66, 15, smooth(u)), yaw: lerp(Math.atan(pend) * 0.65, 0.01, fin), hor: lerp(94, 178, smooth(u)), f: 200 };
}
function esc3(c, t, T) {
  dibujarMundo(c, camVuelo(t), T, { sol: -40 });
  nubesPaso(c, -13 - t * 1.4, 1 - prog(t, 0, 0.9));
  const a = ventana(t, 7.4, 11.5, 0.3);
  P(c, 108, 34, [{ txt: 'PLANETA CERO', esc: 2, col: [255, 255, 255], sep: 7 }, { txt: 'CICLO 00' }, { txt: 'POBLACIÓN: 0' }, { txt: 'CIVILIZACIÓN: NIVEL 0' }], t - 7.4, a, CIAN, { w: 160 });
  // la interfaz ocupa la pantalla y se transforma en el mapa digital del planeta
  mapaDigital(c, T, prog(t, 11.25, 12));
}
function mapaDigital(c, T, k) {
  if (k <= 0) return;
  const e = smooth(k);
  c.rect(0, lerp(40, 0, e), W, lerp(60, H, e), [3, 9, 18], 0.94 * clamp(k * 3));
  if (k < 0.35) return;
  const rev = prog(k, 0.35, 1);
  c.marco(8, 126, 200, 108, CIAN, 0.8);
  for (let y = 0; y < H; y += 3) c.rectLuz(0, y, W, 1, CIAN, 0.025);
  mapaPlaneta(c, 12, 131, 192, 98, T, 1, rev);
  if (OP.textos !== false) c.texto('PLANETA CERO', 108, 104, [255, 255, 255], { esc: 2, alin: 'c', n: Math.floor(rev * 30), sombra: [0, 30, 50] });
}

// =============================================================== ESCENA 04 — LOS PRIMEROS HABITANTES
function esc4(c, t, T) {
  if (t < 1.25) { c.limpiar([3, 9, 18]); mapaDigital(c, T, 1); if (t > 1.05) c.velo([200, 240, 255], (t - 1.05) * 3); return; }
  if (t < 5.2) return orbita(c, t - 1.25, T);
  if (t < 8.6) return descenso(c, t - 5.2, T);
  if (t < 11.8) return puerta(c, t - 8.6, T);
  if (t < 14.2) return horizonte(c, t - 11.8, T, t);
  return aerea(c, t - 14.2, T);
}
function orbita(c, t, T) {
  c.limpiar(hex('#02030a'));
  estrellas(c, T, 40 + t * 2.5, 20, 1);
  estrellaMadre(c, 90, 0.8);
  dibujarPlaneta(c, 108, 566 - t * 2, 332, LON_L + 0.02 - t * 0.012, T, { incl: 0, lat0: LAT_L - 0.86 });
  const nx = 62 + t * 9, ny = 120 + Math.sin(t * 1.3) * 1.5;
  const an = anclaNave(nx, ny);
  const TS = 1.1; // instante en que se libera la cápsula
  if (t < TS) capsula(c, an.x, an.y, 3, { t: T, sombra: false, conPuerta: false });
  else {
    const r = t - TS, a0 = anclaNave(62 + TS * 9, 120);
    const cy = a0.y + 5 * r + 9.5 * r * r, cx = a0.x + 7 * r + 1.2 * r * r;
    const s = lerp(3, 1.7, clamp(r / 2.8));
    capsula(c, Math.round(cx), Math.round(cy), s, { t: T, sombra: false, conPuerta: false, empuje: r < 0.5 ? 0.5 : 0, calor: clamp((cy - 190) / 50) });
    if (cy > 195) for (let q = 1; q < 14; q++) if (bayer(Math.round(cx), Math.round(cy) - q * 2) < 1 - q / 14) c.pxa(Math.round(cx - q * 0.6), Math.round(cy - s * 4 - q * 2), [255, 170, 90], clamp((cy - 195) / 30) * (1 - q / 14));
  }
  nave(c, nx, ny, T);
  if (t < 0.25) c.velo([200, 240, 255], 1 - t * 4);
}
function descenso(c, t, T) {
  const TA = 2.75; // toma de contacto
  const tiembla = t > TA && t < TA + 0.25 ? (Math.floor(t * 30) % 2 ? 1 : -1) : 0;
  const cam = { x: XL - 3, z: ZL - 27, h: 2.2, yaw: 0.02 + t * 0.004, hor: 208 + tiembla, f: 200 };
  const alt = 52 * Math.pow(1 - prog(t, 0, TA), 2.6);
  const emp = t < 0.5 ? 0 : t < TA ? 0.55 + 0.45 * prog(t, 0.5, 1.6) : 1 - prog(t, TA, TA + 0.35);
  const objetos = [
    { x: XL, z: ZL, sesgo: 0.2, dib: (c, sx, sy, s) => c.elipse(sx, sy, 2.2 * s * (1 - alt / 90), Math.max(1, 0.3 * s), [10, 34, 22], 0.45 * (1 - alt / 60)) },
    { x: XL, z: ZL, y: alt, dib: (c, sx, sy, s) => capsula(c, sx, sy + (t > TA && t < TA + 0.12 ? 1 : 0), s, { t: T, empuje: emp, calor: 1 - prog(t, 0, 1.2), conPuerta: false, sombra: false }) },
  ];
  dibujarMundo(c, cam, T, { sol: -40, objetos });
  // partículas de polvo levantadas por los motores
  for (let i = 0; i < 70; i++) {
    const t0 = TA - 0.9 + hash2(i, 1, 300) * 1.3, ed = t - t0, vida = 1.1 + hash2(i, 2, 300) * 0.8;
    if (ed < 0 || ed > vida) continue;
    const dir = hash2(i, 3, 300) < 0.5 ? -1 : 1, v = 2 + hash2(i, 4, 300) * 5.5;
    const q = proy(cam, XL + dir * (1.2 + v * (1 - Math.exp(-ed * 1.6))), 0.15 + hash2(i, 5, 300) * 1.6 * ed, ZL + (hash2(i, 6, 300) - 0.5) * 4);
    if (!q) continue;
    const a = 1 - ed / vida, col = hash2(i, 7, 300) > 0.5 ? [222, 214, 180] : [176, 190, 150];
    const x = Math.round(q.sx), y = Math.round(q.sy);
    if (bayer(x, y) < a + 0.2) { c.px(x, y, col); if (a > 0.5) { c.px(x + 1, y, col); c.px(x, y - 1, mix(col, [255, 255, 255], 0.3)); } }
  }
}
function puerta(c, t, T) {
  const cam = { x: XL + 0.6 - t * 0.06, z: ZL + 9.5 - t * 0.12, h: 1.75, yaw: Math.PI, hor: 226, f: 200 };
  const ab = smooth(prog(t, 0.3, 1.7));
  const objetos = [{ x: XL, z: ZL, dib: (c, sx, sy, s) => capsula(c, sx, sy, s, { t: T, puerta: ab }) }];
  if (t > 1.6) {
    const anda = smooth(prog(t, 2.0, 3.2));
    const z = ZL + 0.3 + anda * 2.2, y = 0.9 * (1 - smooth(prog(t, 2.05, 2.7)));
    objetos.push({ x: XL, z, y, dib: (c, sx, sy, s) => conTinte(c, () => explorador(c, sx, sy, s, { vista: 'frente', t: T, paso: t > 2.0 && t < 3.2 ? (t - 2) * 7.5 : null }), [14, 26, 40], 0.92 * (1 - prog(t, 1.6, 2.5))) });
  }
  dibujarMundo(c, cam, T, { sol: -40, objetos });
}
function horizonte(c, t, T, tl) {
  const cam = { x: XL + 3.85, z: ZL + 6.9 - t * 0.08, h: 1.15, yaw: 0.02, hor: 222, f: 200 };
  const mira = t < 0.6 ? 0 : Math.sin((t - 0.6) * 1.5) > 0.4 ? 1 : Math.sin((t - 0.6) * 1.5) < -0.4 ? -1 : 0;
  dibujarMundo(c, cam, T, { sol: -40, objetos: [{ x: EX.x, z: EX.z, dib: (c, sx, sy, s) => explorador(c, sx, sy, s, { vista: 'espalda', t: T, mira, sombra: 0.7 }) }] });
  hudHabitante(c, tl);
}
function hudHabitante(c, tl) {
  const k = tl - 12.2, a = ventana(tl, 12.2, 15.75, 0.3);
  const uno = tl > 13.45;
  P(c, 108, 36, [{ txt: 'NUEVO HABITANTE DETECTADO', col: CIAN_CLARO, sep: 7 }, { txt: uno ? 'POBLACIÓN: 0 → 1' : 'POBLACIÓN: 0', esc: 2, col: uno && Math.floor(tl * 6) % 2 === 0 && tl < 14.1 ? [255, 255, 255] : AMBAR }], k, a, CIAN, { w: 204 });
}
function aerea(c, t, T) {
  const u = smooth(prog(t, 0, 1.8));
  const cam = { x: XL + 2.5 + 3 * u, z: ZL - 36 - 26 * u, h: 36 + 28 * u, yaw: 0.02 + 0.07 * u, hor: 76 - 24 * u, f: 200 };
  dibujarMundo(c, cam, T, { sol: -40, objetos: [
    { x: XL, z: ZL, dib: (c, sx, sy, s) => { c.elipse(sx + 1, sy + 2.4 * s, 1.5 * s, 2.6 * s, [10, 36, 26], 0.4); capsula(c, sx, sy, s, { t: T, conPuerta: false, sombra: false }); } },
    { x: EX.x, z: EX.z, dib: (c, sx, sy, s) => explorador(c, sx, sy, s, { vista: 'espalda', t: T, sombra: 1.3 }) },
  ] });
  hudHabitante(c, t + 14.2);
  // sobre el suelo aparece el holograma de una futura construcción
  if (t > 1.0) holoBase(c, cam, T, 0.1 * prog(t, 1.0, 1.8), hash2(Math.floor(T * 15), 2, 77) > 0.35 ? 1 : 0.3);
}

// =============================================================== ESCENA 05 — LOS RECURSOS
function esc5(c, t, T) {
  const x = XL + 6.2 + 1.0 * smooth(t / 12), z = ZL + 4.5 + t * 0.05;
  const cam = { x, z, h: 2.0, yaw: Math.atan2(BASE.x - x, BASE.z - z) * 0.9, hor: 212, f: 200 };
  const mira = Math.sin(t * 0.9) > 0.75 ? 1 : 0;
  dibujarMundo(c, cam, T, { sol: -40, objetos: [{ x: EX.x, z: EX.z, dib: (c, sx, sy, s) => explorador(c, sx, sy, s, { vista: 'espalda', t: T, mira, sombra: 0.7 }) }] });
  const a = 1 - prog(t, 10.9, 11.5);
  holoBase(c, cam, T, 0.1 + 0.9 * prog(t, 0.2, 6.6), a * (t < 0.5 && hash2(Math.floor(T * 15), 2, 77) < 0.3 ? 0.4 : 1));
  P(c, 108, 34, [{ txt: 'SISTEMA DE RECURSOS' }, { txt: 'ACTIVADO', col: CIAN_CLARO }], t - 0.5, ventana(t, 0.5, 11.2, 0.3), CIAN, { w: 150 });
  const k2 = t - 3.0, a2 = ventana(t, 3.0, 11.2, 0.3);
  P(c, 108, 70, [{ txt: '1 LIKE = 10 ⚡', esc: 2, col: AMBAR, sep: 8 }, { txt: 'ENERGÍA DISPONIBLE: 0', sep: 14 }], k2, a2, CIAN, { w: 176 });
  // barra de energía (vacía)
  if (k2 > 1.6 && OP.textos !== false) {
    const bx = 108 - 60, by = 114;
    c.marco(bx, by, 120, 7, CIAN, a2);
    for (let i = 0; i < 20; i++) c.rect(bx + 2 + i * 6 - (i ? 0 : 0), by + 2, 4, 3, CIAN, a2 * (i === 0 && Math.floor(t * 3) % 2 ? 0.55 : 0.1));
  }
}

// =============================================================== ESCENA 06 — LOS DIEZ FUNDADORES
function esc6(c, t, T) {
  salaConsejo(c, T, { enc: (t - 0.7) / 0.45, avance: t / 13, habla: hablando(T), parpadeo: prog(t, 12.25, 13), rojo: prog(t, 12.55, 13) * 0.55 });
  P(c, 108, 30, [{ txt: 'CONSEJO DE LOS DIEZ', col: [255, 255, 255], sep: 7 }, { txt: 'PERSONAJES DISPONIBLES: 10' }, { txt: 'ESTADO: ESPERANDO SELECCIÓN', col: Math.floor(t * 2) % 2 ? CIAN : CIAN_CLARO }], t - 5.4, ventana(t, 5.4, 12.5, 0.3), CIAN, { w: 176 });
}

// =============================================================== ESCENA 07 — ALGO SE APROXIMA
function esc7(c, t, T) {
  if (t < 3.4) {
    const mapa = (m, x, y, w, h) => {
      m.rect(x, y, w, h, [8, 3, 5]);
      const sx = x + 34, sy = y + 78;
      for (const [rx, ry] of [[22, 9], [44, 18], [72, 30], [104, 43]]) { const n = Math.ceil(rx * 6); for (let i = 0; i < n; i++) { const th = (i / n) * 6.2832; if (i % 2) m.pxa(sx + Math.cos(th) * rx, sy + Math.sin(th) * ry, [150, 150, 170], 0.5); } }
      m.disco(sx, sy, 3.5, [255, 236, 190]); m.halo(sx, sy, 12, [255, 200, 120], 0.9);
      const pth = 0.5 + T * 0.01, px = Math.round(sx + Math.cos(pth) * 44), py = Math.round(sy + Math.sin(pth) * 18);
      m.disco(px + 0.5, py + 0.5, 2.5, [60, 150, 230]); m.px(px, py, [90, 200, 110]); m.px(px + 1, py - 1, [240, 248, 255]);
      if (OP.textos !== false) m.texto('PLANETA CERO', px + 5, py + 7, CIAN_CLARO, { alin: 'c' });
      // punto rojo que se desplaza hacia Planeta Cero
      const x0 = x + w - 10, y0 = y + 14, u = 0.12 + t * 0.085;
      const rx = Math.round(lerp(x0, px, u)), ry = Math.round(lerp(y0, py, u));
      for (let q = 0; q < 40; q++) { const v = q / 40; if (v > u && q % 2) m.px(Math.round(lerp(x0, px, v)), Math.round(lerp(y0, py, v)), [150, 40, 40]); }
      m.disco(rx + 0.5, ry + 0.5, 2, [255, 70, 60]); m.halo(rx + 0.5, ry + 0.5, 9, ROJO, 0.9);
      const rr = 4 + Math.floor((T * 4) % 3) * 2; m.marco(rx - rr, ry - rr, rr * 2 + 1, rr * 2 + 1, ROJO, 0.8);
      m.texto('!', rx + rr + 4, ry - 3, [255, 200, 190]);
    };
    const enc = prog(t, 0, 0.5);
    salaMonitor(sala, { t: T, luz: 0.9, rojo: 0.35 + 0.65 * enc, contenido: mapa });
    // la cámara se acerca al monitor
    const u = easeInOut(prog(t, 1.2, 3.4));
    c.zoom(sala, lerp(SALA.cx + 6, SALA.cx + 22, u), lerp(SALA.cy + 6, SALA.cy - 34, u), Math.pow(3.3, u));
    return;
  }
  const s = t - 3.4;
  c.limpiar(hex('#040205'));
  estrellas(c, T, 100 + s * 1.5, 60, 0.75, 4, [255, 170, 160]);
  const R = lerp(62, 86, smooth(s / 7.6));
  vortex(c, lerp(150, 122, smooth(s / 7.6)), lerp(214, 196, smooth(s / 7.6)), R, 20 + T);
  if (s < 0.2) c.velo([255, 60, 50], 0.7 * (1 - s * 5));
  P(c, 108, 30, [{ txt: 'AMENAZA DETECTADA', col: [255, 255, 255], sep: 7 }, { txt: 'IDENTIFICACIÓN: VÓRTEX' }, { txt: 'DESTINO ESTIMADO: PLANETA CERO' }, { txt: 'NIVEL DE RIESGO: CRÍTICO', col: Math.floor(t * 3) % 2 ? [255, 255, 255] : [255, 120, 110] }], s - 1.5, ventana(s, 1.5, 7.5, 0.25), ROJO, { w: 196 });
}

// =============================================================== ESCENA 08 — EL COMIENZO
function esc8(c, t, T) {
  const u = smooth(prog(t, 0, 8));
  const cam = { x: XL + 3.85, z: ZL + 6.9 - 5.2 * u, h: 1.15 + 0.9 * u, yaw: 0.02, hor: 222 + 19 * u, f: 200 };
  const sol = crestaSol() - 11 + 27 * smooth(prog(t, 0.3, 7.6));
  dibujarMundo(c, cam, T, { sol, objetos: [{ x: EX.x, z: EX.z, dib: (c, sx, sy, s) => explorador(c, sx, sy, s, { vista: 'espalda', t: T, sombra: 0.9 }) }] });
  c.halo(108 + (0.1 - cam.yaw) * 200, cam.hor - sol, 150, [255, 190, 110], 0.22 * smooth(prog(t, 0.5, 7)));
  const a = ventana(t, 2.5, 7.6, 0.4);
  if (a > 0 && OP.textos !== false) {
    c.texto('PLANETA CERO', 108, 46, [255, 255, 255], { esc: 2, alin: 'c', a, borde: [4, 30, 52], n: Math.floor((t - 2.5) * 24) });
  }
  P(c, 108, 68, [{ txt: 'CREA TU PERSONAJE', col: CIAN_CLARO }, { txt: 'EN LOS COMENTARIOS', col: CIAN_CLARO, sep: 10 }, { txt: 'LOS 10 MÁS VOTADOS' }, { txt: 'SERÁN ELEGIDOS', sep: 10 }, { txt: 'SIGUE LA CUENTA PARA', col: AMBAR }, { txt: 'UNIRTE AL PLANETA', col: AMBAR }], t - 3.0, a, CIAN, { w: 150, cps: 42 });
  // la pantalla se oscurece gradualmente
  c.velo([0, 0, 0], prog(t, 7.2, 8.0));
  if (t > 7.9 && OP.textos !== false) c.texto('CONTINUARÁ...', 108, 184, [255, 255, 255], { esc: 2, alin: 'c', n: Math.floor((t - 7.9) * 22), a: 1 - prog(t, 8.8, 9) * 0.6 });
}

const FN = { 1: esc1, 2: esc2, 3: esc3, 4: esc4, 5: esc5, 6: esc6, 7: esc7, 8: esc8 };

/** Dibuja en `c` el instante T. op: {textos: false (sin interfaz), subtitulos: false} */
export function fotograma(c, T, op = {}) {
  OP = op;
  T = clamp(T, 0, DURACION - 1e-6);
  const e = ESCENAS.find((s) => T < s.fin) || ESCENAS[ESCENAS.length - 1];
  FN[e.n](c, T - e.ini, T);
  // transiciones entre escenas
  if (T >= 7.55 && T < 8) { esc2(aux, 0, 8); mezclar(c, aux, smooth(prog(T, 7.55, 8))); }
  if (T >= 60.4 && T < 61) { esc6(aux, 0, 61); barrido(c, aux, prog(T, 60.4, 61)); }
  if (op.subtitulos !== false && op.textos !== false) {
    const s = SUBTITULOS.find((q) => T >= q.ini && T < q.fin + q.cola);
    if (s) subtitulo(c, s.lineas, T - s.ini, T, Math.min(clamp((T - s.ini) * 12), clamp((s.fin + s.cola - T) * 8 + 0.2)), null);
  }
}
