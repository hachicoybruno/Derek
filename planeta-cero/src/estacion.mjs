// Interior de la estación orbital NEXUS: sala del monitor principal (abandonada, a oscuras)
// y sala del Consejo con las diez plataformas holográficas.
import { clamp, hex, mix, bayer, hash2 } from './nucleo.mjs';
import { CIAN, CIAN_CLARO, nexus, silueta } from './elementos.mjs';

/** Geometría de la sala del monitor (lienzo de 248x384). */
export const SALA = { w: 248, h: 384, px: 50, py: 110, pw: 148, ph: 138, cx: 124, cy: 179 };

/**
 * Sala del monitor. e: {t, luz 0..1 (brillo de la pantalla), rojo 0..1 (alerta), contenido(c,x,y,w,h)}
 */
export function salaMonitor(c, e) {
  const t = e.t, luz = e.luz ?? 1, rojo = e.rojo || 0;
  const P0 = hex('#06080d'), P1 = hex('#0c1119'), P2 = hex('#131a25'), P3 = hex('#1d2733'), P4 = hex('#2c3848');
  c.limpiar(P0);
  // pared de paneles metálicos
  for (let y = 0; y < 330; y++) for (let x = 0; x < SALA.w; x++) {
    const col = Math.floor(x / 31), fila = y < 60 ? 0 : y < 96 ? 1 : y < 262 ? 2 : 3;
    let v = hash2(col, fila, 500) > 0.5 ? P1 : P2;
    if (x % 31 === 0 || y === 60 || y === 96 || y === 262) v = P0;
    else if (x % 31 === 1 || y === 61 || y === 97) v = P3;
    if ((x % 31 === 4 || x % 31 === 27) && (y % 34 === 8)) v = P4; // remaches
    c.px(x, y, v);
  }
  // techo: viga y tuberías
  c.rect(0, 0, SALA.w, 40, P0); c.rect(0, 40, SALA.w, 2, P3);
  for (const [y, g] of [[10, 5], [22, 3], [31, 4]]) { c.rect(0, y, SALA.w, g, P2); c.rect(0, y, SALA.w, 1, P4); c.rect(0, y + g - 1, SALA.w, 1, P0); for (let x = 20; x < SALA.w; x += 58) c.rect(x, y - 1, 3, g + 2, P3); }
  // cables colgantes (se mecen apenas)
  for (const [x0, x1, cae, s] of [[20, 96, 30, 1], [150, 236, 38, 2], [70, 190, 16, 3]]) {
    for (let x = x0; x <= x1; x++) { const u = (x - x0) / (x1 - x0); const y = 42 + Math.sin(u * Math.PI) * (cae + Math.sin(t * 0.7 + s) * 1.2); c.px(x, Math.round(y), P4); c.px(x, Math.round(y) + 1, P0); }
  }
  // paneles laterales apagados
  for (const [x, y, w, h] of [[6, 122, 30, 86], [212, 132, 30, 78]]) {
    c.rect(x, y, w, h, P3); c.rect(x + 1, y + 1, w - 2, h - 2, P1);
    for (let k = 0; k < 3; k++) { c.rect(x + 4, y + 5 + k * 24, w - 8, 17, hex('#030508')); c.rect(x + 4, y + 5 + k * 24, w - 8, 1, P0); }
    for (let k = 0; k < 4; k++) c.rect(x + 4 + k * 6, y + h - 8, 3, 3, P4);
  }
  // pequeñas luces azules
  const leds = [[10, 78], [14, 78], [233, 88], [40, 236], [205, 246], [22, 250], [228, 226], [120, 72], [128, 72]];
  leds.forEach(([x, y], i) => { if (hash2(i, Math.floor(t * 1.2 + i * 0.37), 510) > 0.3) { c.px(x, y, CIAN_CLARO); c.halo(x + 0.5, y + 0.5, 4, CIAN, 0.7); } else c.px(x, y, hex('#10314a')); });
  // monitor principal
  const { px, py, pw, ph } = SALA;
  c.rect(px - 8, py - 8, pw + 16, ph + 16, P3); c.rect(px - 8, py - 8, pw + 16, 1, P4); c.rect(px - 8, py - 8, 1, ph + 16, P4);
  c.rect(px - 8, py + ph + 7, pw + 16, 1, P0); c.rect(px + pw + 7, py - 8, 1, ph + 16, P0);
  c.rect(px - 3, py - 3, pw + 6, ph + 6, P0);
  c.rect(px, py, pw, ph, hex('#010306'));
  c.rect(px - 8 + 6, py + ph + 10, 10, 2, P4); c.px(px + pw - 2, py + ph + 4, luz > 0.3 ? CIAN_CLARO : hex('#10314a'));
  if (e.contenido) e.contenido(c, px, py, pw, ph);
  // líneas de barrido y reflejo del cristal
  for (let y = py; y < py + ph; y += 2) c.rect(px, y, pw, 1, [0, 0, 0], 0.22);
  for (let k = 0; k < 26; k++) c.pxa(px + 6 + k, py + 4 + Math.floor(k * 0.4), [255, 255, 255], 0.05);
  // consola
  for (let y = 268; y < 300; y++) { const ins = Math.round((300 - y) * 0.5); c.rect(18 + ins, y, SALA.w - 36 - ins * 2, 1, y === 268 ? P4 : P2); }
  c.rect(18, 300, SALA.w - 36, 30, P1); c.rect(18, 300, SALA.w - 36, 1, P3);
  for (let k = 0; k < 9; k++) c.rect(30 + k * 22, 308, 12, 14, P0);
  for (let fy = 0; fy < 3; fy++) for (let fx = 0; fx < 22; fx++) {
    const kx = 48 + fx * 7 + fy * 2, ky = 276 + fy * 7;
    const viva = hash2(fx, fy, 520) > 0.9;
    c.rect(kx, ky, 5, 4, viva && hash2(fx + fy * 31, Math.floor(t * 0.8), 521) > 0.25 ? mix(CIAN, P0, 0.45) : P0);
    c.rect(kx, ky, 5, 1, P3);
  }
  // suelo
  c.rect(0, 330, SALA.w, 54, hex('#04060a'));
  for (let y = 332; y < 384; y += 5) c.rect(0, y, SALA.w, 1, P1);
  for (let k = -8; k <= 8; k++) c.linea(SALA.cx + k * 18, 330, SALA.cx + k * 40, 384, P1);
  // la pantalla es la única fuente de luz: resplandor azul sobre el metal
  if (luz > 0) {
    const cl = rojo > 0 ? mix([40, 110, 210], [200, 40, 40], rojo) : [40, 110, 210];
    c.halo(SALA.cx, SALA.cy, 190, cl, 0.85 * luz);
    for (let y = 268; y < 300; y++) for (let x = 40; x < SALA.w - 40; x++) if (bayer(x, y) < 0.55 * luz * (1 - Math.abs(x - SALA.cx) / 110)) c.luz(x, y, cl, 0.4);
    for (let y = 332; y < 372; y++) for (let x = 50; x < SALA.w - 50; x++) if (bayer(x, y) < 0.3 * luz * (1 - (y - 332) / 40) * (1 - Math.abs(x - SALA.cx) / 80)) c.luz(x, y, cl, 0.45);
    c.rect(px - 8, py - 9, pw + 16, 1, cl, 0.5 * luz);
  }
  // motas de polvo iluminadas por la pantalla
  for (let i = 0; i < 34; i++) {
    const bx = hash2(i, 1, 530) * SALA.w, by = hash2(i, 2, 530) * 300 + 40, v = 2 + hash2(i, 3, 530) * 4;
    const x = bx + Math.sin(t * 0.3 + i) * 6 + t * (hash2(i, 4, 530) - 0.5) * 3, y = ((by - t * v) % 300 + 300) % 300 + 40;
    const dist = Math.hypot(x - SALA.cx, y - SALA.cy);
    const a = luz * clamp(1.2 - dist / 150) * (0.35 + 0.4 * hash2(i, 5, 530));
    if (a > 0.05) c.luz(Math.round(x), Math.round(y), [150, 200, 255], a);
  }
  if (rojo > 0) {
    c.tinte([255, 78, 70], rojo * 0.82);
    const pulso = 0.5 + 0.5 * Math.sin(t * 5.2);
    c.rectLuz(0, 44, SALA.w, 3, [255, 30, 30], rojo * (0.25 + 0.6 * pulso));
    c.halo(SALA.cx, 44, 120, [255, 30, 30], rojo * 0.35 * pulso);
  }
}

// ---------------------------------------------------------------- SALA DEL CONSEJO
const VP = { x: 108, y: 126 }, FH = 172, WH = 122, TH = 150;
/** Posición en pantalla de la plataforma n (1..10): anfiteatro en arco alrededor del núcleo de NEXUS. */
export function plataforma(n, avance = 0) {
  const i = n - 1, q = (i - 4.5) / 4.5, prof = 1 - q * q;
  const esc = (1 - 0.445 * prof) * (1 + avance * 0.07);
  return { x: VP.x + (22 + i * 19.1 - VP.x) * (1 + avance * 0.07 * (1 - prof * 0.6)), y: 272 - 70 * prof + avance * 5 * (1 - prof), z: 1 / esc, h: 68 * esc, prof };
}
/**
 * Sala oscura con diez plataformas circulares. e: {enc: nº de plataformas encendidas (fraccional),
 * avance 0..1, parpadeo 0..1, rojo 0..1, habla}
 */
export function salaConsejo(c, t, e) {
  const av = e.avance || 0, rojo = e.rojo || 0;
  const S0 = hex('#04060a'), S1 = hex('#080c13'), S2 = hex('#0d131c'), S3 = hex('#151d29'), S4 = hex('#1f2a39');
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    const dx = x + 0.5 - VP.x, dy = y + 0.5 - VP.y;
    const ax = Math.abs(dx) / WH, ay = dy > 0 ? dy / FH : -dy / TH;
    let col;
    if (ay >= ax) {
      const z = 1 / Math.max(ay, 0.001), u = dx * z, zz = z + av * 0.14;
      const lin = Math.abs((zz * 1.43) % 1) < 0.05 * z * 0.7 + 0.02 || Math.abs(((u / 30) % 1 + 1) % 1) < 0.035;
      if (dy > 0) col = lin ? S0 : z > 4.6 ? S0 : z > 2.6 ? S1 : (Math.abs(u) < 26 ? S2 : S1);
      else col = lin ? S3 : z > 3.4 ? S0 : S1;
      if (dy < 0 && Math.abs(u) < 7) col = z > 5 ? S1 : S3; // luminaria apagada del techo
    } else {
      const z = 1 / Math.max(ax, 0.001), v = dy * z, zz = z + av * 0.14;
      const lin = Math.abs((zz * 1.43) % 1) < 0.04 * z * 0.7 + 0.02 || Math.abs(v - 60) < 1.2 * z * 0.4 || Math.abs(v + 70) < 1.2 * z * 0.4;
      col = lin ? S0 : z > 4.2 ? S0 : z > 2.4 ? S1 : S2;
      if (!lin && v > -40 && v < 20 && Math.floor(zz * 1.43) % 2 === 0 && z < 4.2) col = z > 2.4 ? S2 : S3;
    }
    c.px(x, y, col);
  }
  // fondo del pasillo: núcleo de NEXUS
  c.rect(VP.x - 20, VP.y - 24, 40, 46, S0);
  c.marco(VP.x - 20, VP.y - 24, 40, 46, S3);
  nexus(c, VP.x, VP.y - 4, 8, t, e.habla || 0, rojo > 0.5 ? [255, 90, 80] : null);
  // plataformas de la más lejana a la más cercana
  for (const n of [5, 6, 4, 7, 3, 8, 2, 9, 1, 10]) {
    const p = plataforma(n, av);
    let enc = clamp((e.enc || 0) - (n - 1));
    if (e.parpadeo) enc *= hash2(n, Math.floor(t * 17), 540) > e.parpadeo * 0.75 ? 1 : 0.15;
    const rx = 10.5 / p.z, ry = 3.2 / p.z, x = Math.round(p.x), y = Math.round(p.y);
    c.elipse(x, y + 2 / p.z, rx + 1, ry + 1, S0);
    c.elipse(x, y, rx, ry, S3);
    c.elipse(x, y, rx - 1.5, Math.max(1, ry - 1), S1);
    if (enc > 0) {
      const col = rojo > 0.5 ? mix(CIAN, [255, 80, 70], 0.5) : CIAN;
      // aro luminoso
      const m = Math.ceil(rx * 7);
      for (let i = 0; i < m; i++) { const th = (i / m) * Math.PI * 2; c.luz(Math.round(x + Math.cos(th) * (rx - 1) - 0.5), Math.round(y + Math.sin(th) * (ry - 0.8) - 0.5), CIAN_CLARO, 0.9 * enc); }
      c.halo(x, y, rx * 1.9, col, 0.5 * enc);
      // haz de proyección
      const hh = Math.round(p.h * 1.08);
      for (let j = 0; j < hh; j++) { const w = rx * (0.9 - (j / hh) * 0.35); for (let i = -Math.round(w); i <= Math.round(w); i++) if (bayer(x + i, y - j) < 0.3 * (1 - j / hh)) c.luz(x + i, y - j, col, 0.22 * enc); }
      const dest = clamp(enc * 2 - 0.2);
      silueta(c, x, y - Math.round(1 / p.z), p.h * (0.3 + 0.7 * clamp(enc * 1.6)), t, dest, n, col);
      if (enc > 0.7) c.texto(String(n).padStart(2, '0'), x + 1, y - Math.round(p.h) - 11, CIAN_CLARO, { alin: 'c', a: clamp((enc - 0.7) * 4), sombra: [0, 10, 18] });
    } else c.elipse(x, y, rx * 0.35, Math.max(0.6, ry * 0.35), S4);
  }
  if (rojo > 0) {
    c.tinte([255, 80, 72], rojo * 0.75);
    c.halo(VP.x, 0, 150, [255, 30, 30], rojo * 0.3 * (0.5 + 0.5 * Math.sin(t * 5.2)));
  }
}
