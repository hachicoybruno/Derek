// Elementos recurrentes del universo: NEXUS, cápsula, explorador provisional, nave de transporte,
// holograma de la primera base, planeta artificial VÓRTEX, interfaz holográfica y subtítulos.
// Son las referencias de diseño de la temporada: no cambiar proporciones ni paletas entre episodios.
import { W, H, clamp, hex, mix, bayer, rampa, hash2, fbm3, anchoTexto } from './nucleo.mjs';
import { proy, BASE } from './mundo.mjs';

export const CIAN = [70, 225, 255];
export const CIAN_CLARO = [205, 248, 255];
export const ROJO = [255, 60, 60];
const METAL = [hex('#272d38'), hex('#465160'), hex('#717e92'), hex('#a3afbe'), hex('#dbe2ea')];
const AZUL = [hex('#1b4686'), hex('#2a6cc2'), hex('#62a4ee')];

// ---------------------------------------------------------------- NEXUS
/** Núcleo holográfico de NEXUS: esfera de píxeles luminosos con tres anillos concéntricos. habla 0..1 */
export function nexus(c, cx, cy, r, t, habla = 0, tinte = null) {
  const C1 = tinte || CIAN, CB = tinte ? mix(tinte, [255, 255, 255], 0.6) : CIAN_CLARO;
  c.halo(cx, cy, r * 2.6, C1, 0.3 + 0.2 * habla);
  const anillos = [
    { R: r * 1.45, inc: 1.12, giro: 0.45, vel: 0.9 },
    { R: r * 1.78, inc: 1.27, giro: -0.75, vel: -0.65 },
    { R: r * 2.1, inc: 1.0, giro: 2.3, vel: 0.45 },
  ];
  const anillo = (an, frente) => {
    const n = Math.ceil(an.R * 8), cg = Math.cos(an.giro), sg = Math.sin(an.giro);
    const nd = Math.max(6, Math.round(an.R * 0.9));
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2;
      const z = Math.sin(th) * Math.sin(an.inc);
      if ((z > 0) !== frente) continue;
      const seg = Math.floor(((th + t * an.vel) / (Math.PI * 2)) * nd * 2);
      if (((seg % 2) + 2) % 2) continue;
      const x = Math.cos(th) * an.R, y = Math.sin(th) * Math.cos(an.inc) * an.R;
      const px = cx + x * cg - y * sg, py = cy + x * sg + y * cg;
      if (!frente && Math.hypot(px - cx, py - cy) < r) continue;
      c.luz(Math.round(px), Math.round(py), C1, frente ? 0.95 : 0.35);
    }
  };
  for (const an of anillos) anillo(an, false);
  c.disco(cx, cy, r, [3, 22, 34], 0.8);
  // retícula geométrica de puntos sobre la esfera
  const nla = r < 8 ? 5 : 9, nlo = r < 8 ? 8 : 16;
  const rot = t * 0.55, cr = Math.cos(rot), sr = Math.sin(rot), ci = Math.cos(0.38), si = Math.sin(0.38);
  const onda = (t * 0.85) % 1.4 - 0.2;
  for (let a = 1; a < nla; a++) {
    const la = (a / nla - 0.5) * Math.PI, cl = Math.cos(la), sl = Math.sin(la);
    for (let b = 0; b < nlo; b++) {
      const lo = (b / nlo) * Math.PI * 2 + (a & 1 ? Math.PI / nlo : 0);
      let x = cl * Math.cos(lo), y = sl, z = cl * Math.sin(lo);
      const x2 = x * cr + z * sr, z2 = -x * sr + z * cr;
      const y3 = y * ci - z2 * si, z3 = y * si + z2 * ci;
      const px = Math.round(cx + x2 * (r - 0.6) - 0.5), py = Math.round(cy - y3 * (r - 0.6) - 0.5);
      const ol = habla * Math.exp(-Math.pow((y3 * 0.5 + 0.5) - onda, 2) / 0.02);
      if (z3 > 0) c.luz(px, py, mix(C1, CB, clamp(ol + z3 * 0.4)), 0.55 + 0.45 * z3 + ol * 0.6);
      else c.luz(px, py, C1, 0.16);
    }
  }
  // contorno tenue
  const n = Math.ceil(r * 7);
  for (let i = 0; i < n; i++) { const th = (i / n) * Math.PI * 2; c.luz(Math.round(cx + Math.cos(th) * r - 0.5), Math.round(cy + Math.sin(th) * r - 0.5), C1, 0.22 + 0.2 * habla); }
  for (const an of anillos) anillo(an, true);
}

// ---------------------------------------------------------------- CÁPSULA
/** Cápsula de descenso (4,2 u de alto). e: {puerta, empuje, calor, t, interior} */
export function capsula(c, sx, sy, s, e = {}) {
  const t = e.t || 0, puerta = e.puerta || 0, empuje = e.empuje || 0, calor = e.calor || 0;
  const pat = Math.max(1, Math.round(0.5 * s)), Hb = Math.max(4, Math.round(3.7 * s)), Wb = 1.5 * s;
  const top = sy - pat - Hb;
  const perfil = (v) => (v < 0.32 ? 0.78 * Math.sqrt(1 - Math.pow(1 - v / 0.32, 2)) : v < 0.86 ? 0.78 + (0.22 * (v - 0.32)) / 0.54 : 1 - (0.1 * (v - 0.86)) / 0.14);
  // sombra en el suelo
  if (e.sombra !== false) c.elipse(sx, sy, Wb * 1.5, Math.max(1, s * 0.22), [10, 34, 22], 0.4);
  // llamas de los motores
  if (empuje > 0) {
    const fr = Math.floor(t * 30);
    for (const k of [-0.5, 0, 0.5]) {
      const fx = Math.round(sx + k * Wb), largo = empuje * s * (1.5 + hash2(fr, k * 10, 77) * 0.9), ancho = Math.max(1, s * 0.22);
      for (let j = 0; j < largo; j++) {
        const v = j / largo, w = Math.max(0.5, ancho * (1 - v * 0.8));
        for (let i = -Math.ceil(w); i <= Math.ceil(w); i++) {
          if (Math.abs(i) > w) continue;
          const col = v < 0.25 ? [255, 255, 235] : v < 0.6 ? [255, 214, 110] : [255, 132, 48];
          if (v > 0.6 && bayer(fx + i, sy + j + fr) < (v - 0.6) * 2.2) continue;
          c.px(fx + i, sy - pat + 1 + j, col);
        }
      }
    }
    c.halo(sx, sy - pat + s * 0.8, s * 3.2, [255, 170, 80], 0.5 * empuje);
  }
  if (calor > 0) c.halo(sx, sy - pat, s * 4, [255, 120, 50], 0.8 * calor);
  // patas
  if (s >= 2.2) {
    for (const k of [-1, 1]) {
      c.linea(sx + k * Wb * 0.7, sy - pat - 1, sx + k * Wb * 1.22, sy - 1, METAL[1]);
      if (s > 5) c.linea(sx + k * Wb * 0.7 + k, sy - pat - 1, sx + k * Wb * 1.22 + k, sy - 1, METAL[2]);
      c.rect(Math.round(sx + k * Wb * 1.22) - 1, sy - 1, 3, 1, METAL[0]);
    }
    for (const k of [-0.5, 0, 0.5]) c.rect(Math.round(sx + k * Wb) - Math.max(1, Math.round(s * 0.16)), sy - pat, Math.max(1, Math.round(s * 0.32)), Math.max(1, Math.round(pat * 0.6)), METAL[0]);
  }
  const dU = 0.34, dV0 = 0.42, dV1 = 0.89;
  const abierto = dV1 - (dV1 - dV0) * puerta;
  for (let j = 0; j < Hb; j++) {
    const v = (j + 0.5) / Hb, hw = Wb * perfil(v), y = top + j;
    const xi = Math.ceil(sx - hw - 0.5), xf = Math.floor(sx + hw - 0.5);
    for (let x = xi; x <= xf; x++) {
      const u = (x + 0.5 - sx) / hw, uA = (x + 0.5 - sx) / Wb;
      let l = 0.52 + u * 0.4 - (v > 0.9 ? 0.25 : 0) + (v < 0.2 ? 0.08 : 0);
      let col = rampa(METAL, l, x, y);
      if (v > 0.335 && v < 0.395) col = rampa(AZUL, 0.5 + u * 0.5, x, y);
      if (s > 4 && Math.abs(v - 0.63) < 0.6 / Hb) col = METAL[1];
      if (s > 7 && (Math.abs(Math.abs(uA) - 0.6) < 0.5 / Wb) && v > 0.4 && v < 0.9) col = mix(col, METAL[0], 0.5);
      if (v > 0.91) col = rampa(METAL, 0.15 + u * 0.2, x, y);
      // puerta
      if (s > 3 && e.conPuerta !== false && Math.abs(uA) < dU && v > dV0 && v < dV1) {
        const borde = Math.abs(uA) > dU - 1.2 / Wb || v < dV0 + 1.2 / Hb;
        if (v > abierto) {
          const il = e.interior ?? 1;
          col = borde ? METAL[0] : mix([20, 40, 60], mix([235, 250, 255], [255, 240, 205], (v - dV0) / (dV1 - dV0)), il);
        } else if (borde) col = METAL[0];
        else {
          col = rampa(METAL, 0.62 + uA * 0.5, x, y);
          if (s > 8 && Math.abs(uA) < dU * 0.45 && v > dV0 + 0.06 && v < dV0 + 0.14 && v < abierto - 0.02) col = hex('#16314f');
        }
      }
      // escotilla circular
      const pr = Math.max(0.9, s * 0.26), pdx = x + 0.5 - sx, pdy = y + 0.5 - (top + Hb * 0.2);
      if (s > 2.5 && pdx * pdx + pdy * pdy < pr * pr) col = pdx * pdx + pdy * pdy < (pr - 1) * (pr - 1) || pr < 2 ? (pdx < 0 && pdy < 0 && pr > 2 ? CIAN_CLARO : hex('#35b8e8')) : METAL[0];
      if (x === xi || x === xf || j === 0) col = mix(col, METAL[0], 0.75);
      if (calor > 0 && v > 0.6) col = mix(col, [255, 140, 60], calor * (v - 0.6) * 2);
      c.px(x, y, col);
    }
  }
  // luces azules laterales
  if (s > 2.5 && Math.floor(t * 2) % 2 === 0) for (const k of [-1, 1]) { const lx = Math.round(sx + k * Wb * 0.9 - 0.5), ly = Math.round(top + Hb * 0.52); c.px(lx, ly, CIAN_CLARO); c.halo(lx + 0.5, ly + 0.5, Math.max(2, s * 0.5), CIAN, 0.8); }
  if (puerta > 0.05 && s > 3 && e.conPuerta !== false) c.halo(sx, top + Hb * 0.72, s * 1.6, [200, 235, 255], 0.35 * puerta * (e.interior ?? 1));
}

// ---------------------------------------------------------------- EXPLORADOR PROVISIONAL
const TRAJE = [hex('#4f5865'), hex('#7c8796'), hex('#aab4c0')];
const CASCO = [hex('#9aa5b3'), hex('#cdd5df'), hex('#f1f4f8')];
const BOTA = hex('#24324a');
/** Explorador de traje gris y azul (1,8 u). e: {vista: 'frente'|'espalda', paso, t, mira, sombra} */
export function explorador(c, sx, sy, s, e = {}) {
  const u = 1.8 * s, t = e.t || 0, atras = e.vista !== 'frente';
  if (e.sombra) {
    const L = Math.round(u * e.sombra);
    for (let j = 0; j < L; j++) { const hw = u * 0.13 * (1 + (j / L) * 0.7); for (let i = -Math.round(hw); i <= Math.round(hw); i++) if (bayer(sx + i, sy + j) < 0.62 - (j / L) * 0.4) c.pxa(sx + i, sy + j, [10, 36, 26], 0.5); }
  }
  if (u < 5) { c.px(sx, sy - 1, TRAJE[0]); c.px(sx, sy - 2, AZUL[1]); if (u > 2.5) c.px(sx, sy - 3, CASCO[1]); return; }
  if (u < 11) {
    const hh = Math.round(u);
    for (let j = 0; j < hh; j++) {
      const v = j / hh, y = sy - hh + j;
      if (v < 0.24) { c.px(sx, y, CASCO[1]); c.px(sx + 1, y, CASCO[2]); }
      else if (v < 0.6) { c.px(sx - 1, y, TRAJE[0]); c.px(sx, y, atras ? AZUL[0] : AZUL[1]); c.px(sx + 1, y, atras ? AZUL[1] : TRAJE[2]); c.px(sx + 2, y, TRAJE[1]); }
      else { c.px(sx, y, j === hh - 1 ? BOTA : TRAJE[0]); c.px(sx + 1, y, j === hh - 1 ? BOTA : TRAJE[1]); }
    }
    return;
  }
  const paso = e.paso ?? null;
  const sn = paso === null ? 0 : Math.sin(paso), bote = paso === null ? 0 : Math.round(Math.abs(Math.cos(paso)) * Math.max(1, u * 0.02));
  const resp = paso === null && Math.sin(t * 1.6) > 0.3 ? 1 : 0; // respiración
  const hr = Math.max(2, u * 0.1);
  const yTop = sy - Math.round(u) - bote;
  const yC = yTop + hr;
  const tTop = Math.round(yTop + hr * 2 - (u > 26 ? 1 : 0)), tBot = Math.round(sy - u * 0.46 - bote);
  const tw = Math.max(2, Math.round(u * 0.145));
  const aw = Math.max(1, Math.round(u * 0.07)), lw = Math.max(1, Math.round(u * 0.09));
  const hueco = u > 20 ? 1 : 0;
  const R = (x, y, w, h, col) => c.rect(x, y, w, h, col);
  // piernas
  for (const k of [-1, 1]) {
    const lev = paso === null ? 0 : Math.max(0, k * sn) * u * 0.05;
    const lx = k < 0 ? sx - lw - hueco + (hueco ? 1 : 0) : sx + hueco;
    const ly0 = tBot, ly1 = Math.round(sy - lev);
    R(lx, ly0, lw, ly1 - ly0, TRAJE[1]);
    R(lx, ly0, 1, ly1 - ly0, TRAJE[0]);
    if (lw > 2) R(lx + lw - 1, ly0, 1, ly1 - ly0, k > 0 ? TRAJE[2] : TRAJE[1]);
    const bh = Math.max(1, Math.round(u * 0.07));
    R(lx - (lw > 3 ? 1 : 0), ly1 - bh, lw + (lw > 3 ? 1 : 0), bh, BOTA);
    if (u > 30) R(lx, Math.round(ly0 + (ly1 - ly0) * 0.5), lw, 1, TRAJE[0]); // rodillera
  }
  // brazos
  const largoB = Math.round(u * 0.34);
  for (const k of [-1, 1]) {
    const osc = paso === null ? 0 : Math.round(-k * sn * u * 0.03);
    const ax = k < 0 ? sx - tw - aw : sx + tw;
    R(ax, tTop + 1 + resp, aw, largoB + osc, k > 0 ? TRAJE[2] : TRAJE[0]);
    if (aw > 1) c.px(k < 0 ? ax : ax + aw - 1, tTop + 1 + resp, e.fondo || TRAJE[0]);
    if (aw > 2) R(k < 0 ? ax + aw - 1 : ax, tTop + 1 + resp, 1, largoB + osc, TRAJE[1]);
    R(ax, tTop + 1 + resp + largoB + osc - Math.max(1, Math.round(u * 0.05)), aw, Math.max(1, Math.round(u * 0.05)), AZUL[k > 0 ? 1 : 0]);
    if (u > 30) R(ax, tTop + 1 + resp, aw, Math.max(1, Math.round(u * 0.04)), AZUL[k > 0 ? 2 : 1]); // hombrera
  }
  // torso
  R(sx - tw, tTop + resp, tw * 2, tBot - tTop - resp, TRAJE[1]);
  R(sx - tw, tTop + resp, 1, tBot - tTop - resp, TRAJE[0]);
  R(sx + tw - 1, tTop + resp, 1, tBot - tTop - resp, TRAJE[2]);
  R(sx - tw, tBot - Math.max(1, Math.round(u * 0.03)), tw * 2, Math.max(1, Math.round(u * 0.03)), BOTA); // cinturón
  if (atras) {
    // mochila de soporte vital azul
    const mw = Math.max(2, tw * 2 - (u > 24 ? 4 : 2)), mh = Math.round((tBot - tTop) * 0.72);
    const mx = sx - Math.floor(mw / 2), my = tTop + resp + 1;
    R(mx, my, mw, mh, AZUL[1]);
    R(mx, my, 1, mh, AZUL[0]); R(mx, my + mh - 1, mw, 1, AZUL[0]);
    if (mw > 5) { c.px(mx, my, TRAJE[1]); c.px(mx + mw - 1, my, TRAJE[1]); }
    if (mw > 3) R(mx + mw - 1, my, 1, mh - 1, AZUL[2]);
    if (u > 28) { R(mx + 1, my + Math.round(mh * 0.45), mw - 2, 1, AZUL[0]); c.px(mx + mw - 3, my + 2, Math.floor(t * 1.5) % 2 ? CIAN_CLARO : CIAN); }
    if (u > 40) c.linea(sx + tw - 2, tTop + resp, sx + tw - 2, tTop - Math.round(u * 0.09), TRAJE[0]);
  } else {
    const pw = Math.max(2, tw), ph = Math.max(2, Math.round((tBot - tTop) * 0.4));
    R(sx - Math.floor(pw / 2), tTop + resp + 1, pw, ph, AZUL[1]);
    if (u > 28) c.px(sx - Math.floor(pw / 2) + 1, tTop + resp + 2, CIAN_CLARO);
  }
  // casco
  const mira = e.mira || 0;
  c.elipse(sx, yC, hr, hr, null, 1, (x, y, uu, vv) => {
    let l = 0.5 + uu * 0.4 - vv * 0.2;
    if (uu * uu + vv * vv > 0.72) l -= 0.3;
    let col = rampa(CASCO, l, x, y);
    if (!atras) { if (Math.abs(vv + 0.05) < 0.42 && Math.abs(uu - mira * 0.2) < 0.72) col = uu - mira * 0.2 < -0.3 && vv < -0.1 ? hex('#6fd8ff') : hex('#12233c'); }
    else if (vv > 0.55) col = AZUL[0];
    else if (hr > 4 && Math.abs(uu - mira * 0.5) < 0.16 && vv < 0.5) col = CASCO[0]; // costura trasera
    return col;
  });
  if (atras && mira && hr > 3) { const k = mira > 0 ? 1 : -1; c.rect(Math.round(sx + k * hr * 0.75) - (k < 0 ? 1 : 0), Math.round(yC - hr * 0.35), 1, Math.max(2, Math.round(hr * 0.8)), hex('#12233c')); }
}

// ---------------------------------------------------------------- NAVE ORBITAL DE TRANSPORTE
const interp = (pts, u) => { for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + ((b[1] - a[1]) * (u - a[0])) / (b[0] - a[0]); } return pts[pts.length - 1][1]; };
const NV_TOP = [[0, -6], [0.07, -8], [0.3, -8], [0.38, -11], [0.7, -11], [0.86, -7], [1, -1]];
const NV_BOT = [[0, 5], [0.08, 7], [0.27, 7], [0.32, 4], [0.62, 4], [0.67, 7], [0.84, 5], [1, 1]];
/** Nave compacta de metal gris con luces azules y motores luminosos. (x,y) = centro. */
export function nave(c, x, y, t) {
  const L = 66, x0 = Math.round(x - L / 2);
  y = Math.round(y);
  // estela y motores
  const fr = Math.floor(t * 30);
  for (const oy of [-3, 3]) {
    const largo = 12 + hash2(fr, oy, 5) * 8;
    for (let i = 0; i < largo; i++) { const a = 1 - i / largo; if (bayer(x0 - 4 - i, y + oy + fr) < a) { c.px(x0 - 4 - i, y + oy, i < 3 ? [255, 255, 255] : i < 8 ? CIAN_CLARO : CIAN); if (i < 6) c.px(x0 - 4 - i, y + oy + 1, CIAN); } }
    c.rect(x0 - 3, y + oy - 1, 4, 3, METAL[0]); c.rect(x0 - 4, y + oy, 1, 2, [255, 255, 255]);
  }
  c.halo(x0 - 6, y, 15, CIAN, 0.8);
  for (let i = 0; i < L; i++) {
    const u = i / (L - 1), a = Math.round(interp(NV_TOP, u)), b = Math.round(interp(NV_BOT, u));
    for (let j = a; j <= b; j++) {
      const v = (j - a) / Math.max(1, b - a), px = x0 + i, py = y + j;
      let l = 0.92 - v * 0.75 + (hash2(i >> 2, j >> 2, 61) - 0.5) * 0.12 - u * 0.08;
      let col = rampa(METAL, l, px, py);
      if (j === a || j === b || i === 0 || i === L - 1) col = METAL[0];
      if (i === 13 || i === 25 || i === 44) col = mix(col, METAL[0], 0.5);
      if (u > 0.72 && u < 0.9 && j >= a + 2 && j <= a + 5 && j < b - 1) col = j === a + 2 && u < 0.8 ? hex('#8fdcff') : hex('#16345c'); // cabina
      if (j === 0 && u > 0.2 && u < 0.66) col = (i + Math.floor(t * 8)) % 4 < 2 ? CIAN_CLARO : AZUL[1]; // luces azules laterales
      if (j === 1 && u > 0.2 && u < 0.66) col = AZUL[0];
      c.px(px, py, col);
    }
  }
  // antena
  c.linea(x0 + 20, y - 9, x0 + 20, y - 15, METAL[2]);
  c.px(x0 + 20, y - 16, Math.floor(t * 2) % 2 ? CIAN_CLARO : AZUL[1]);
  c.halo(x0 + 34, y + 0.5, 14, CIAN, 0.28);
}
/** Posición de anclaje de la cápsula bajo la nave (centro x, base y) */
export const anclaNave = (x, y) => ({ x: Math.round(x - 33 + 31), y: Math.round(y) + 17 });

// ---------------------------------------------------------------- HOLOGRAMA DE LA PRIMERA BASE
const ARISTAS = (() => {
  const E = [];
  const seg = (a, b) => E.push([a, b]);
  const oct = (r, y, n = 8, cx = 0, cz = 0) => { for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2; seg([cx + Math.cos(a0) * r, y, cz + Math.sin(a0) * r], [cx + Math.cos(a1) * r, y, cz + Math.sin(a1) * r]); } };
  const caja = (x, y, z, w, h, d) => {
    const p = (i, j, k) => [x + i * w, y + j * h, z + k * d];
    for (const [a, b] of [[[0, 0, 0], [1, 0, 0]], [[1, 0, 0], [1, 0, 1]], [[1, 0, 1], [0, 0, 1]], [[0, 0, 1], [0, 0, 0]], [[0, 0, 0], [0, 1, 0]], [[1, 0, 0], [1, 1, 0]], [[1, 0, 1], [1, 1, 1]], [[0, 0, 1], [0, 1, 1]], [[0, 1, 0], [1, 1, 0]], [[1, 1, 0], [1, 1, 1]], [[1, 1, 1], [0, 1, 1]], [[0, 1, 1], [0, 1, 0]]]) seg(p(...a), p(...b));
  };
  oct(15, 0, 10); // perímetro
  oct(7, 0, 10); // base de la cúpula
  for (let m = 0; m < 4; m++) { // meridianos de la cúpula
    const a = (m / 4) * Math.PI;
    for (let i = 0; i < 6; i++) { const b0 = (i / 6) * Math.PI, b1 = ((i + 1) / 6) * Math.PI; seg([Math.cos(a) * Math.cos(b0) * 7, Math.sin(b0) * 7, Math.sin(a) * Math.cos(b0) * 7], [Math.cos(a) * Math.cos(b1) * 7, Math.sin(b1) * 7, Math.sin(a) * Math.cos(b1) * 7]); }
  }
  oct(Math.sqrt(49 - 9), 3, 10); oct(Math.sqrt(49 - 30), 5.5, 8);
  seg([0, 7, 0], [0, 13, 0]); seg([-1.5, 11, 0], [1.5, 11, 0]); seg([-1, 12, 0], [1, 12, 0]); // antena
  caja(-14, 0, -3, 5.5, 3.4, 5); caja(8.5, 0, -1, 5.5, 3.4, 5); // módulos laterales
  seg([-8.5, 1.2, 0], [-7, 1.2, 0]); seg([7, 1.2, 1], [8.5, 1.2, 1]);
  caja(6, 0, 7, 1.8, 11, 1.8); seg([6.9, 11, 7.9], [9.5, 13, 7.9]); seg([6.9, 11, 7.9], [4.6, 13, 7.9]); seg([4.6, 13, 7.9], [9.5, 13, 7.9]); // torre de comunicaciones
  for (const [a, b] of [[[-9, 0, -12], [-3, 0, -12]], [[-3, 0, -12], [-3, 0, -7]], [[-3, 0, -7], [-9, 0, -7]], [[-9, 0, -7], [-9, 0, -12]], [[-9, 0, -12], [-3, 0, -7]], [[-3, 0, -12], [-9, 0, -7]]]) seg(a, b); // plataforma
  return E;
})();
/** Holograma azul del diseño de la primera base. k = progreso de construcción 0..1, a = opacidad. */
export function holoBase(c, cam, t, k, a = 1) {
  if (a <= 0) return;
  const N = ARISTAS.length, parp = 0.82 + 0.18 * (hash2(Math.floor(t * 12), 3, 9) > 0.5 ? 1 : 0);
  const P = (v) => proy(cam, BASE.x + v[0], v[1], BASE.z + v[2]);
  // rejilla del suelo
  const ctr = P([0, 0, 0]);
  if (ctr) for (let i = 0; i < 70; i++) { const an = hash2(i, 1, 20) * 6.283, rr = Math.sqrt(hash2(i, 2, 20)) * 15; const q = P([Math.cos(an) * rr, 0, Math.sin(an) * rr]); if (q && hash2(i, Math.floor(t * 4), 21) > 0.4) c.luz(Math.round(q.sx), Math.round(q.sy), CIAN, 0.3 * a * clamp(k * 4)); }
  for (let i = 0; i < N; i++) {
    const ki = (i / N) * 0.9, loc = clamp((k - ki) / 0.06);
    const p0 = P(ARISTAS[i][0]), p1 = P(ARISTAS[i][1]);
    if (!p0 || !p1) continue;
    // pieza digital que vuela hasta su sitio antes de que aparezca la arista
    const pre = clamp((k - (ki - 0.09)) / 0.09);
    if (pre > 0 && loc <= 0) {
      const mx = (p0.sx + p1.sx) / 2, my = (p0.sy + p1.sy) / 2, e = 1 - pre;
      const ox = (hash2(i, 5, 30) - 0.5) * 120 * e * e, oy = -(30 + hash2(i, 6, 30) * 70) * e * e;
      c.rectLuz(Math.round(mx + ox) - 1, Math.round(my + oy) - 1, 2, 2, CIAN_CLARO, a * (0.4 + 0.6 * pre));
      c.px(Math.round(mx + ox), Math.round(my + oy) - 1, [255, 255, 255]);
    }
    if (loc <= 0) continue;
    const x1 = p0.sx + (p1.sx - p0.sx) * loc, y1 = p0.sy + (p1.sy - p0.sy) * loc;
    c.linea(p0.sx, p0.sy, x1, y1, loc < 1 ? CIAN_CLARO : CIAN, a * parp * (loc < 1 ? 0.95 : 0.6), true);
    if (loc >= 1) {
      // la energía azul circula por las líneas
      const u = (t * 0.8 + hash2(i, 7, 30)) % 1;
      const ex = Math.round(p0.sx + (p1.sx - p0.sx) * u), ey = Math.round(p0.sy + (p1.sy - p0.sy) * u);
      c.luz(ex, ey, [255, 255, 255], 0.9 * a);
      c.luz(Math.round(p0.sx), Math.round(p0.sy), CIAN_CLARO, 0.5 * a);
    }
  }
  if (ctr && k > 0.3) c.halo(ctr.sx, ctr.sy - 6 * ctr.s, 14 * ctr.s, CIAN, 0.22 * a * clamp((k - 0.3) * 2));
}

// ---------------------------------------------------------------- VÓRTEX
const VX = [hex('#06060b'), hex('#0e0e16'), hex('#191822'), hex('#272532'), hex('#383444')];
/** Planeta artificial VÓRTEX: superficie oscura, estructuras tecnológicas y luces rojas. Sin habitantes. */
export function vortex(c, cx, cy, R, t) {
  c.halo(cx + R * 0.15, cy - R * 0.1, R * 1.9, [120, 14, 22], 0.5);
  const rot = t * 0.045, cr = Math.cos(rot), sr = Math.sin(rot), ci = Math.cos(0.22), si = Math.sin(0.22);
  const LR = [0.62, -0.3, -0.72];
  // anillo orbital parcial (mitad trasera primero)
  const anillo = (frente) => {
    const RA = R * 1.36, inc = 1.22, giro = -0.32, cg = Math.cos(giro), sg = Math.sin(giro), n = Math.ceil(RA * 9);
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2 + rot * 0.5;
      const thr = ((th % 6.283) + 6.283) % 6.283;
      if (thr > 4.3 && thr < 5.7) continue; // el anillo está inacabado: solo rodea parte del planeta
      const z = Math.sin(th) * Math.sin(inc);
      if ((z > 0) !== frente) continue;
      const segm = Math.floor(thr * 14);
      if (segm % 5 === 4) continue;
      for (let g = 0; g < 3; g++) {
        const rr = RA + g - 1;
        const x = Math.cos(th) * rr, y = Math.sin(th) * Math.cos(inc) * rr;
        const px = Math.round(cx + x * cg - y * sg), py = Math.round(cy + x * sg + y * cg);
        if (!frente && Math.hypot(px - cx, py - cy) < R) continue;
        c.px(px, py, g === 0 ? VX[4] : g === 1 ? VX[3] : VX[1]);
        if (g === 1 && (Math.floor(thr * 40 - t * 5) % 9 + 9) % 9 === 0) { c.px(px, py, ROJO); c.luz(px, py - 1, ROJO, 0.35); }
      }
      // puntales hacia la superficie
      if (frente && segm % 5 === 1 && Math.floor(thr * 70) % 5 === 0) {
        const x = Math.cos(th), y = Math.sin(th) * Math.cos(inc);
        for (let q = R * 1.02; q < RA - 1; q += 1) { const px = Math.round(cx + (x * cg - y * sg) * q), py = Math.round(cy + (x * sg + y * cg) * q); if (Math.hypot(px - cx, py - cy) > R) c.px(px, py, VX[2]); }
      }
    }
  };
  anillo(false);
  // agujas en el limbo
  for (let i = 0; i < 16; i++) {
    const an = -1.1 + i * 0.13 + hash2(i, 1, 70) * 0.05, largo = R * (0.05 + 0.14 * hash2(i, 2, 70));
    for (let q = R - 1; q < R + largo; q++) { const px = Math.round(cx + Math.cos(an) * q), py = Math.round(cy + Math.sin(an) * q); c.px(px, py, VX[2]); if (hash2(i, 3, 70) > 0.5) c.px(px + 1, py, VX[1]); }
    const tx = Math.round(cx + Math.cos(an) * (R + largo)), ty = Math.round(cy + Math.sin(an) * (R + largo));
    if (hash2(i, Math.floor(t * 1.5 + i * 0.3), 71) > 0.35) { c.px(tx, ty, ROJO); c.halo(tx + 0.5, ty + 0.5, 3, ROJO, 0.7); }
  }
  const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(c.w - 1, Math.ceil(cx + R)), y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(c.h - 1, Math.ceil(cy + R));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = (x + 0.5 - cx) / R, dy = (y + 0.5 - cy) / R, d2 = dx * dx + dy * dy;
    if (d2 > 1) continue;
    const nz = Math.sqrt(1 - d2);
    const py = -dy * ci - nz * si, pz = -dy * si + nz * ci;
    const wx = dx * cr + pz * sr, wz = -dx * sr + pz * cr, wy = py;
    const lon = Math.atan2(wx, wz), lat = Math.asin(clamp(wy, -1, 1));
    const fu = (lon / 6.283 + 0.5) * 56, fv = (lat / 3.1416 + 0.5) * 28;
    const iu = Math.floor(fu), iv = Math.floor(fv);
    const h = hash2(iu >> (hash2(iu >> 2, iv >> 1, 81) > 0.6 ? 1 : 0), iv, 80);
    let tono = 0.22 + h * 0.5 + nz * 0.25;
    if (fu - iu < 0.14 || fv - iv < 0.16) tono -= 0.3; // juntas entre placas
    const masas = fbm3(wx * 2.2, wy * 2.2, wz * 2.2, 3, 85);
    if (masas > 0.56) tono += 0.16;
    let col = rampa(VX, tono, x, y);
    // contraluz rojizo en el limbo
    const lam = clamp(dx * LR[0] - dy * LR[1] + nz * LR[2] + 0.55);
    if (lam > 0.5) { const q = Math.floor((lam - 0.5) * 2 * 4 + bayer(x, y)) / 4; col = mix(col, [150, 40, 46], q * 0.55); }
    // trincheras con luces que las recorren
    const banda = Math.abs(fv - Math.round(fv));
    if (iv % 4 === 2 && banda > 0.36) {
      col = VX[0];
      const dir = (iv >> 2) % 2 ? 1 : -1, pos = Math.floor((lon / 6.283 + 0.5) * 220 + dir * t * (5 + (iv % 5)));
      if (((pos % 13) + 13) % 13 < 2) col = pos % 26 < 2 ? [255, 150, 110] : ROJO;
    }
    // instalaciones: grupos de luces rojas
    if (masas > 0.6) { const q = hash2(Math.floor(fu * 3), Math.floor(fv * 3), 86); if (q > 0.86 && hash2(Math.floor(fu * 3) + Math.floor(t * 1.3 + q * 9), Math.floor(fv * 3), 87) > 0.25) col = q > 0.96 ? [255, 190, 130] : ROJO; }
    c.px(x, y, col);
  }
  anillo(true);
  // señales luminosas que parten de las estructuras hacia el espacio
  for (let i = 0; i < 7; i++) {
    const an = -0.9 + i * 0.17 + 3.2, T = 3.2 + hash2(i, 4, 90) * 1.5, u = ((t + hash2(i, 5, 90) * T) % T) / T;
    const o = R * (1.05 + hash2(i, 6, 90) * 0.3), dist = o + u * 150;
    const dxs = Math.cos(an) * 0.9 - 0.2, dys = Math.sin(an) * 0.6 + 0.75, nrm = Math.hypot(dxs, dys);
    const bx = cx + Math.cos(an) * o, by = cy + Math.sin(an) * o;
    for (let q = 0; q < 9; q++) {
      const dd = u * 150 - q * 1.6;
      if (dd < 0) break;
      const px = Math.round(bx + (dxs / nrm) * dd), py = Math.round(by + (dys / nrm) * dd);
      if (q === 0) { c.px(px, py, [255, 210, 190]); c.halo(px + 0.5, py + 0.5, 4, ROJO, 0.8 * (1 - u)); }
      else if (bayer(px, py) < 1 - q / 9) c.pxa(px, py, ROJO, (1 - u * 0.7));
    }
    void dist;
  }
}

// ---------------------------------------------------------------- SILUETA HOLOGRÁFICA (fundadores sin identidad)
const dentroSilueta = (u, v) => {
  const au = Math.abs(u);
  if (v < 0.135) { const dv = (v - 0.068) / 0.068, du = au / 0.058; return du * du + dv * dv < 1; }
  if (v < 0.165) return au < 0.028;
  if (v < 0.2) return au < 0.06 + ((v - 0.165) / 0.035) * 0.105;
  if (v < 0.5) return au < 0.125 - (v - 0.2) * 0.07 || (au > 0.135 && au < 0.185 && v < 0.54);
  if (v < 0.54) return au < 0.115 || (au > 0.135 && au < 0.185);
  return au > 0.012 + (v - 0.54) * 0.03 && au < 0.115 - (v - 0.54) * 0.05;
};
export function silueta(c, cx, base, h, t, a, sem, col = CIAN) {
  if (a <= 0) return;
  const hh = Math.round(h), hw = Math.ceil(h * 0.2);
  const salto = hash2(Math.floor(t * 9), sem, 110) > 0.93 ? 1 : 0; // fallo de señal ocasional
  for (let j = 0; j < hh; j++) {
    const v = (j + 0.5) / hh, y = base - hh + j;
    const ox = salto && hash2(j >> 2, Math.floor(t * 9), 111) > 0.6 ? 1 : 0;
    for (let i = -hw; i <= hw; i++) {
      const u = (i + 0.5) / h;
      if (!dentroSilueta(u, v)) continue;
      const borde = !dentroSilueta(u - 1 / h, v) || !dentroSilueta(u + 1 / h, v) || !dentroSilueta(u, v - 1 / h) || !dentroSilueta(u, v + 1 / h);
      const barrido = ((y + Math.floor(t * 14)) & 3) === 0 ? 1.25 : (y & 1) ? 0.55 : 0.8;
      c.luz(cx + i + ox, y, borde ? CIAN_CLARO : col, a * (borde ? 0.85 : 0.34 * barrido));
    }
  }
}

// ---------------------------------------------------------------- INTERFAZ HOLOGRÁFICA
/**
 * Panel de interfaz centrado en cx. lineas: [{txt, col?, esc?}] ; k = segundos desde que aparece
 * (los textos se escriben a `cps` caracteres por segundo); a = opacidad; tema = color base.
 */
export function panel(c, cx, y, lineas, k, a = 1, tema = CIAN, op = {}) {
  if (a <= 0 || k < 0) return;
  const cps = op.cps || 34, pad = 6;
  let wMax = 0, hTot = 0;
  for (const l of lineas) { wMax = Math.max(wMax, anchoTexto(l.txt, l.esc || 1)); hTot += (l.esc || 1) * 7 + ((l.esc || 1) - 1) * 3 + (l.sep ?? 5); }
  const w = Math.max(op.w || 0, wMax + pad * 2), h = hTot + pad * 2 - 1;
  const abre = clamp(k / 0.18), hv = Math.max(2, Math.round(h * abre));
  const x = Math.round(cx - w / 2), yv = Math.round(y + (h - hv) / 2);
  const fondo = mix([4, 10, 20], tema, 0.06);
  for (let j = 0; j < hv; j++) for (let i = 0; i < w; i++) c.pxa(x + i, yv + j, fondo, a * ((yv + j) & 1 ? 0.72 : 0.62));
  // esquinas tipo corchete y línea superior
  const L = 5;
  for (const [ex, ey, dx, dy] of [[x, yv, 1, 1], [x + w - 1, yv, -1, 1], [x, yv + hv - 1, 1, -1], [x + w - 1, yv + hv - 1, -1, -1]]) { for (let q = 0; q < L; q++) { c.pxa(ex + dx * q, ey, tema, a); c.pxa(ex, ey + dy * q, tema, a); } }
  c.rect(x + L + 2, yv, w - 2 * L - 4, 1, tema, a * 0.35);
  c.rect(x + L + 2, yv + hv - 1, w - 2 * L - 4, 1, tema, a * 0.35);
  if (abre < 1) return;
  let chars = Math.floor((k - 0.18) * cps), ty = y + pad + 3;
  for (const l of lineas) {
    const esc = l.esc || 1, n = [...l.txt].length;
    ty += (esc - 1) * 3;
    if (chars > 0) {
      const col = l.col || mix(tema, [255, 255, 255], 0.55);
      c.texto(l.txt, cx, ty, col, { esc, alin: 'c', a, n: chars, sombra: [0, 8, 16] });
      if (chars < n && Math.floor(k * 8) % 2 === 0) { const xx = Math.round(cx - anchoTexto(l.txt, esc) / 2) + chars * 6 * esc; c.rect(xx, ty, 4 * esc, 7 * esc, tema, a); }
    }
    chars -= n + 4;
    ty += esc * 7 + (l.sep ?? 5);
  }
}

/** Subtítulo de la narración de NEXUS con su núcleo en miniatura. k = segundos desde que empieza la frase. */
export function subtitulo(c, lineas, k, t, a = 1, tinte = null) {
  if (a <= 0) return;
  const y = lineas.length > 1 ? 293 : 299, h = lineas.length > 1 ? 31 : 19, x = 8, w = W - 16;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) c.pxa(x + i, y + j, [3, 8, 16], a * (((y + j) & 1) ? 0.74 : 0.66));
  const tema = tinte || CIAN;
  c.rect(x, y, 1, h, tema, a); c.rect(x + w - 1, y, 1, h, tema, a * 0.4);
  nexus(c, x + 13, y + h / 2, 5, t, 1, tinte);
  let chars = Math.floor(k * 60);
  lineas.forEach((s, i) => {
    if (chars > 0) c.texto(s, x + 28, y + 9 + i * 12, [244, 250, 255], { a, n: chars, sombra: [0, 0, 0] });
    chars -= [...s].length;
  });
}
