// PLANETA CERO: geografía procedimental fija (seis continentes), render esférico con
// iluminación de la estrella desde la izquierda, nubes, atmósfera, luna, estrellas y mapa digital.
// REGLA DE CONTINUIDAD: la función `superficie` es la única fuente de la geografía. No cambiar semillas.
import { clamp, hex, mix, bayer, fbm3, ruido3, hash2 } from './nucleo.mjs';

const RAD = Math.PI / 180;
// [longitud, latitud, radio angular] de las seis regiones continentales
export const CONTINENTES = [
  [0, 15, 0.63], // 1: continente del aterrizaje
  [70, -25, 0.46],
  [140, 35, 0.55],
  [-160, -15, 0.52], // 4: continente volcánico
  [-95, 40, 0.53],
  [-60, -45, 0.39],
].map(([lon, lat, r]) => {
  const la = lat * RAD, lo = lon * RAD;
  return { v: [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)], r };
});
const dirDe = (lon, lat) => [Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD)];
const VOLCAN = dirDe(-152, -20);
/** Punto de aterrizaje (lon, lat en grados) sobre el continente 1 */
export const ATERRIZAJE = { lon: 4, lat: 12 };

const C = {
  mar0: hex('#0a2552'), mar1: hex('#0f3a78'), mar2: hex('#1a5a9e'), mar3: hex('#2f86c0'),
  bosque0: hex('#1c5230'), bosque1: hex('#2a713a'), llano0: hex('#4f9a44'), llano1: hex('#7fb552'),
  taiga: hex('#2b5a48'), tundra: hex('#7d8f72'),
  desierto0: hex('#c39a52'), desierto1: hex('#dcbf7c'),
  roca0: hex('#57524c'), roca1: hex('#7a746a'), nieve: hex('#e9f0f4'), hielo: hex('#d3e3ee'),
  volcan: hex('#2b2326'), volcan1: hex('#43302c'), lava: hex('#e2521f'),
};
export const T = { MAR: 0, VERDE: 1, MONTE: 2, NIEVE: 3, DESIERTO: 4, VOLCAN: 5 };
/** tipo de la última consulta a `superficie` */
export let ultimoTipo = 0;

/** Color de la superficie en el punto (x,y,z) de la esfera unidad. */
export function superficie(x, y, z, oct = 5) {
  const n = fbm3(x * 2.1 + 11.3, y * 2.1 + 4.7, z * 2.1 + 8.1, oct, 7) - 0.5;
  let s = -9;
  for (let i = 0; i < 6; i++) {
    const c = CONTINENTES[i];
    const v = c.r - Math.acos(clamp(x * c.v[0] + y * c.v[1] + z * c.v[2], -1, 1));
    if (v > s) s = v;
  }
  s += n * 0.62;
  const alat = Math.abs(Math.asin(clamp(y, -1, 1)));
  const polar = alat > 1.3 + (fbm3(x * 4 + 2, y * 4, z * 4 + 5, 3, 31) - 0.5) * 0.3;
  if (s <= 0) {
    if (polar) { ultimoTipo = T.NIEVE; return C.hielo; }
    ultimoTipo = T.MAR;
    return s > -0.03 ? C.mar3 : s > -0.1 ? C.mar2 : s > -0.24 ? C.mar1 : C.mar0;
  }
  if (polar) { ultimoTipo = T.NIEVE; return C.nieve; }
  // región volcánica
  const dv = Math.acos(clamp(x * VOLCAN[0] + y * VOLCAN[1] + z * VOLCAN[2], -1, 1));
  if (dv < 0.37 + n * 0.3 && s > 0.02) {
    ultimoTipo = T.VOLCAN;
    const l = fbm3(x * 26, y * 26, z * 26, 2, 63);
    return l > 0.68 ? C.lava : l > 0.5 ? C.volcan1 : C.volcan;
  }
  // cordilleras (ruido en cresta) agrupadas por una máscara de baja frecuencia
  const m = fbm3(x * 7 + 3.1, y * 7 + 9.2, z * 7 + 1.7, Math.min(oct, 4), 53);
  const cresta = 1 - Math.abs(m - 0.5) * 2;
  const masc = fbm3(x * 2.4 + 6, y * 2.4 + 1, z * 2.4 + 3, 2, 59);
  const alt = cresta * 0.7 + masc * 0.55 + clamp(s, 0, 0.3) * 0.4;
  if (alt > 1.02 && s > 0.03) {
    if (alt > 1.085 || alat > 0.95) { ultimoTipo = T.NIEVE; return C.nieve; }
    ultimoTipo = T.MONTE; return alt > 1.045 ? C.roca1 : C.roca0;
  }
  // desiertos en la franja subtropical
  if (alat > 0.16 && alat < 0.56 && s > 0.04) {
    const d = fbm3(x * 2.6 + 20, y * 2.6 + 30, z * 2.6 + 40, 3, 77);
    if (d > 0.5) { ultimoTipo = T.DESIERTO; return d > 0.57 ? C.desierto1 : C.desierto0; }
  }
  ultimoTipo = T.VERDE;
  const f = fbm3(x * 5.5 + 1, y * 5.5 + 2, z * 5.5 + 3, Math.min(oct, 4), 91);
  if (alat > 0.98) return f > 0.5 ? C.taiga : C.tundra;
  if (s < 0.025) return C.llano1;
  return f > 0.56 ? C.bosque0 : f > 0.47 ? C.bosque1 : f > 0.38 ? C.llano0 : C.llano1;
}

// dirección de la estrella: ilumina desde la izquierda (borde izquierdo del planeta)
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
export const LUZ = norm([-0.78, 0.22, 0.58]);
const MEDIO = norm([LUZ[0], LUZ[1], LUZ[2] + 1]);
const NIVELES = [0.07, 0.3, 0.58, 0.82, 1];
const ATM = hex('#6db8ff');
const NUBE = hex('#f3f7fb');
const NOCHE = [3, 6, 16];

/**
 * Dibuja Planeta Cero. rot = longitud (rad) que mira a cámara. t = segundos (nubes y reflejos).
 * op: {incl: inclinación del eje, lat0: latitud centrada (rad), nubes, atm}
 */
export function dibujarPlaneta(c, cx, cy, R, rot, t, op = {}) {
  const incl = op.incl ?? 0.3, lat0 = op.lat0 ?? 0;
  const ct = Math.cos(incl), st = Math.sin(incl), cr = Math.cos(rot), sr = Math.sin(rot);
  const cl0 = Math.cos(lat0), sl0 = Math.sin(lat0);
  const oct = R < 40 ? 3 : R < 110 ? 4 : R < 300 ? 5 : 6;
  const deriva = t * 0.012, cd = Math.cos(deriva), sd = Math.sin(deriva);
  const RH = R * 1.07 + 2;
  const x0 = Math.max(0, Math.floor(cx - RH)), x1 = Math.min(c.w - 1, Math.ceil(cx + RH));
  const y0 = Math.max(0, Math.floor(cy - RH)), y1 = Math.min(c.h - 1, Math.ceil(cy + RH));
  const nubes = op.nubes !== false;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = (x + 0.5 - cx) / R, dy = (y + 0.5 - cy) / R;
    const d2 = dx * dx + dy * dy;
    if (d2 > 1) {
      // halo atmosférico
      const d = Math.sqrt(d2);
      const ancho = Math.min(0.07, 5 / R + 0.02);
      if (d < 1 + ancho) {
        const k = 1 - (d - 1) / ancho;
        const lit = clamp((dx * LUZ[0] - dy * LUZ[1]) / d * 0.9 + 0.5);
        const a = Math.floor(k * k * lit * 3 + bayer(x, y)) / 3;
        if (a > 0) c.pxa(x, y, ATM, a * 0.75);
      }
      continue;
    }
    const nz = Math.sqrt(1 - d2);
    const lam = dx * LUZ[0] - dy * LUZ[1] + nz * LUZ[2];
    // espacio de vista -> inclinación del eje -> latitud centrada -> rotación
    let px = dx * ct + dy * st, py = dx * st - dy * ct, pz = nz;
    const py2 = py * cl0 + pz * sl0, pz2 = -py * sl0 + pz * cl0;
    py = py2; pz = pz2;
    const wx = px * cr + pz * sr, wz = -px * sr + pz * cr, wy = py;
    let col = superficie(wx, wy, wz, oct);
    const mar = ultimoTipo === T.MAR;
    // nubes: capa que deriva lentamente respecto al terreno
    let nube = 0;
    if (nubes) {
      const ux = wx * cd + wz * sd, uz = -wx * sd + wz * cd;
      const w = fbm3(ux * 1.6 + 9, wy * 1.6, uz * 1.6 + 4, 2, 211) - 0.5;
      const cv = fbm3(ux * 3.1 + w * 1.8, wy * 5.2 + w * 1.2 + t * 0.006, uz * 3.1 - w * 1.8, Math.min(oct, 5), 201);
      nube = cv > 0.63 ? 1 : cv > 0.6 ? (bayer(x, y) < 0.5 ? 1 : 0) : 0;
    }
    // bandas de luz con tramado
    const f = clamp(lam * 1.1 + 0.1) * 4;
    let i = Math.floor(f);
    if (i < 4 && f - i > bayer(x, y)) i++;
    const lev = NIVELES[i];
    if (nube) col = cv2(NUBE, lev);
    else {
      col = [NOCHE[0] + col[0] * lev, NOCHE[1] + col[1] * lev, NOCHE[2] + col[2] * lev];
      if (mar && lam > 0.2) {
        const sp = Math.pow(clamp(dx * MEDIO[0] - dy * MEDIO[1] + nz * MEDIO[2]), 46);
        if (sp > 0.06) {
          const g = ruido3(wx * 34 + t * 0.9, wy * 34 - t * 0.7, wz * 34, 5);
          if (sp * 1.5 > g) col = mix(col, [215, 236, 255], 0.8);
        }
      }
    }
    // limbo atmosférico
    if (op.atm !== false) {
      const rim = 1 - nz;
      if (rim > 0.5) {
        const a = Math.floor(((rim - 0.5) / 0.5) * clamp(lam + 0.35) * 3 + bayer(x, y)) / 3;
        if (a > 0) col = mix(col, ATM, a * 0.55);
      }
    }
    c.px(x, y, col);
  }
}
const cv2 = (col, lev) => [NOCHE[0] + col[0] * lev * 0.97, NOCHE[1] + col[1] * lev * 0.98, NOCHE[2] + 12 + col[2] * lev * 0.95];

const LUNA = [hex('#0c0e16'), hex('#4a4d57'), hex('#8b8f99'), hex('#b9bdc6'), hex('#d8dbe1')];
/** Luna pequeña gris claro, iluminada por la misma estrella. */
export function dibujarLuna(c, cx, cy, r, rot = 0.6) {
  const cr = Math.cos(rot), sr = Math.sin(rot);
  c.disco(cx, cy, r, null, 1, (x, y, u, v) => {
    const nz = Math.sqrt(Math.max(0, 1 - u * u - v * v));
    const lam = u * LUZ[0] - v * LUZ[1] + nz * LUZ[2];
    const wx = u * cr + nz * sr, wz = -u * sr + nz * cr;
    const m = fbm3(wx * 2.6 + 5, v * 2.6, wz * 2.6, 3, 301);
    const cr2 = fbm3(wx * 7, v * 7 + 3, wz * 7, 2, 307);
    let val = clamp(lam * 1.15 + 0.08);
    if (m > 0.55) val *= 0.72;
    if (cr2 > 0.66) val *= 0.8;
    const f = val * 4;
    let i = Math.floor(f);
    if (i < 4 && f - i > bayer(x, y)) i++;
    return LUNA[i];
  });
}

/** Campo de estrellas con paralaje. brillo 0..1, tinte opcional. */
export function estrellas(c, t, ox = 0, oy = 0, brillo = 1, semilla = 1, tinte = null) {
  const AW = c.w + 80, AH = c.h + 80;
  for (let i = 0; i < 190; i++) {
    const prof = 0.25 + hash2(i, 3, semilla) * 0.75;
    let x = hash2(i, 1, semilla) * AW - ox * prof, y = hash2(i, 2, semilla) * AH - oy * prof;
    x = ((x % AW) + AW) % AW - 40; y = ((y % AH) + AH) % AH - 40;
    const m = hash2(i, 4, semilla);
    const cls = m > 0.93 ? 3 : m > 0.7 ? 2 : 1;
    // parpadeo escalonado
    const tw = hash2(i, Math.floor(t * 3 + hash2(i, 5, semilla) * 10), semilla + 9) > 0.88 ? 0.55 : 1;
    const k = hash2(i, 6, semilla);
    let col = k > 0.8 ? [255, 214, 170] : k > 0.6 ? [170, 200, 255] : [230, 236, 255];
    if (tinte) col = mix(col, tinte, 0.6);
    const a = brillo * tw * (cls === 1 ? 0.38 * prof + 0.12 : cls === 2 ? 0.75 : 1);
    c.pxa(x, y, col, a);
    if (cls === 3) { c.pxa(x - 1, y, col, a * 0.45); c.pxa(x + 1, y, col, a * 0.45); c.pxa(x, y - 1, col, a * 0.45); c.pxa(x, y + 1, col, a * 0.45); }
  }
}

// ---------- mapa digital (proyección equirrectangular) ----------
const cacheMapa = new Map();
function rejillaMapa(w, h) {
  const k = w + 'x' + h;
  if (cacheMapa.has(k)) return cacheMapa.get(k);
  const g = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const lon = ((x + 0.5) / w - 0.5) * 2 * Math.PI, lat = (0.5 - (y + 0.5) / h) * Math.PI;
    superficie(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon), 4);
    g[y * w + x] = ultimoTipo;
  }
  cacheMapa.set(k, g);
  return g;
}
/** Mapa holográfico del planeta. rev 0..1 = barrido de aparición. */
export function mapaPlaneta(c, x0, y0, w, h, t, a = 1, rev = 1, col = [70, 225, 255]) {
  const g = rejillaMapa(w, h);
  const lim = Math.floor(rev * h);
  for (let y = 0; y < lim; y++) for (let x = 0; x < w; x++) {
    const tp = g[y * w + x];
    const tierra = tp !== T.MAR;
    const izq = g[y * w + Math.max(0, x - 1)] !== T.MAR, arr = g[Math.max(0, y - 1) * w + x] !== T.MAR;
    const der = g[y * w + Math.min(w - 1, x + 1)] !== T.MAR, aba = g[Math.min(h - 1, y + 1) * w + x] !== T.MAR;
    let v = 0;
    if (tierra) {
      v = (izq && arr && der && aba) ? ((y & 1) ? 0.3 : 0.18) : 0.95; // costa brillante, interior con líneas de barrido
      if (tp === T.MONTE || tp === T.NIEVE) v = Math.max(v, (x + y) & 1 ? 0.55 : 0.3);
    } else if ((x % 18 === 0 || y % 15 === 0) && ((x + y) & 1)) v = 0.14;
    if (y >= lim - 2) v = Math.max(v, 0.6);
    if (v > 0) c.luz(x0 + x, y0 + y, col, v * a);
  }
  // marcador del punto de aterrizaje
  if (rev >= 1) {
    const mx = x0 + Math.round((ATERRIZAJE.lon / 360 + 0.5) * w), my = y0 + Math.round((0.5 - ATERRIZAJE.lat / 180) * h);
    const r = 2 + Math.floor((t * 3) % 3) * 2;
    for (let k = -r; k <= r; k++) { c.luz(mx + k, my - r, [255, 255, 255], 0.6 * a); c.luz(mx + k, my + r, [255, 255, 255], 0.6 * a); c.luz(mx - r, my + k, [255, 255, 255], 0.6 * a); c.luz(mx + r, my + k, [255, 255, 255], 0.6 * a); }
    c.px(mx, my, [255, 255, 255]);
  }
}

/** Fracciones de superficie por tipo (muestreo uniforme sobre la esfera) para verificar el diseño. */
export function medirBiomas(n = 60000) {
  const cnt = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), ph = i * 2.399963229728653;
    superficie(Math.cos(ph) * r, y, Math.sin(ph) * r, 5);
    cnt[ultimoTipo]++;
  }
  return cnt.map((v) => +(100 * v / n).toFixed(1));
}
