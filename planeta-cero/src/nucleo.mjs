// Núcleo gráfico de PLANETA CERO: lienzo de baja resolución, color, tramado,
// ruido determinista, primitivas alineadas a píxel y tipografía bitmap 5x7.
// Todo es determinista: cualquier fotograma se puede renderizar en cualquier orden.

export const W = 216; // resolución lógica (x5 = 1080)
export const H = 384; // (x5 = 1920)
export const FPS = 30;

// ---------- utilidades numéricas ----------
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = (t) => { t = clamp(t); return 1 - (1 - t) * (1 - t) * (1 - t); };
export const easeIn = (t) => { t = clamp(t); return t * t * t; };
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
/** progreso 0..1 de t dentro de [a,b] */
export const prog = (t, a, b) => clamp((t - a) / (b - a));
/** 1 dentro de [a,b] con rampas de entrada/salida de duración f */
export const ventana = (t, a, b, f = 0.3) => Math.min(prog(t, a, a + f), 1 - prog(t, b - f, b));

// ---------- color ----------
export const hex = (s) => {
  const n = parseInt(s.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// ---------- tramado ordenado (Bayer 4x4) ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => (BAYER[(x & 3) + ((y & 3) << 2)] + 0.5) / 16;
/** Elige un color de una rampa según v (0..1) con tramado estable. */
export const rampa = (cols, v, x, y) => {
  const n = cols.length - 1;
  const f = clamp(v) * n;
  let i = Math.floor(f);
  if (i >= n) return cols[n];
  if (f - i > bayer(x, y)) i++;
  return cols[i];
};

// ---------- ruido determinista ----------
export const hash2 = (x, y, s = 0) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 2147483647 - 60);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
export const hash3 = (x, y, z, s = 0) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1440662683) ^ Math.imul(s | 0, 2147483587);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const fade = (t) => t * t * (3 - 2 * t);
export const ruido2 = (x, y, s = 0) => {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = fade(x - ix), fy = fade(y - iy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};
export const ruido3 = (x, y, z, s = 0) => {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);
  const l = (a, b, t) => a + (b - a) * t;
  const x00 = l(hash3(ix, iy, iz, s), hash3(ix + 1, iy, iz, s), fx);
  const x10 = l(hash3(ix, iy + 1, iz, s), hash3(ix + 1, iy + 1, iz, s), fx);
  const x01 = l(hash3(ix, iy, iz + 1, s), hash3(ix + 1, iy, iz + 1, s), fx);
  const x11 = l(hash3(ix, iy + 1, iz + 1, s), hash3(ix + 1, iy + 1, iz + 1, s), fx);
  return l(l(x00, x10, fy), l(x01, x11, fy), fz);
};
export const fbm2 = (x, y, oct = 4, s = 0) => {
  let v = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { v += a * ruido2(x, y, s + i * 17); n += a; x *= 2.03; y *= 2.03; a *= 0.5; }
  return v / n;
};
export const fbm3 = (x, y, z, oct = 4, s = 0) => {
  let v = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { v += a * ruido3(x, y, z, s + i * 17); n += a; x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5; }
  return v / n;
};
/** generador pseudoaleatorio con semilla */
export const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// ---------- tipografía 5x7 ----------
// Columnas (bit 0 = fila superior) de la fuente clásica 5x7, ASCII 32..126.
const ASCII57 =
  '0000000000' + '00005F0000' + '0007000700' + '147F147F14' + '242A7F2A12' + '2313086462' + '3649552250' + '0005030000' +
  '001C224100' + '0041221C00' + '14083E0814' + '08083E0808' + '0050300000' + '0808080808' + '0060600000' + '2010080402' +
  '3E5149453E' + '00427F4000' + '4261514946' + '2141454B31' + '1814127F10' + '2745454539' + '3C4A494930' + '0171090503' +
  '3649494936' + '064949291E' + '0036360000' + '0056360000' + '0814224100' + '1414141414' + '0041221408' + '0201510906' +
  '324979413E' + '7E1111117E' + '7F49494936' + '3E41414122' + '7F4141221C' + '7F49494941' + '7F09090901' + '3E4149497A' +
  '7F0808087F' + '00417F4100' + '2040413F01' + '7F08142241' + '7F40404040' + '7F020C027F' + '7F0408107F' + '3E4141413E' +
  '7F09090906' + '3E4151215E' + '7F09192946' + '4649494931' + '01017F0101' + '3F4040403F' + '1F2040201F' + '3F4038403F' +
  '6314081463' + '0708700807' + '6151494543' + '007F414100' + '0204081020' + '0041417F00' + '0402010204' + '4040404040' +
  '0001020400' + '2054545478' + '7F48444438' + '3844444420' + '384444487F' + '3854545418' + '087E090102' + '0C5252523E' +
  '7F08040478' + '00447D4000' + '2040443D00' + '7F10284400' + '00417F4000' + '7C04180478' + '7C08040478' + '3844444438' +
  '7C14141408' + '081414187C' + '7C08040408' + '4854545420' + '043F444020' + '3C4040207C' + '1C2040201C' + '3C4030403C' +
  '4428102844' + '0C5050503C' + '4464544C44' + '0008364100' + '00007F0000' + '0041360800' + '0804081008';

// Cada glifo: 5 columnas de 12 bits (filas -3..8). Las 3 filas superiores son para tildes de mayúsculas.
const GLIFOS = new Map();
for (let i = 0; i < 95; i++) {
  const cols = [];
  for (let k = 0; k < 5; k++) cols.push(parseInt(ASCII57.substr(i * 10 + k * 2, 2), 16) << 3);
  GLIFOS.set(String.fromCharCode(32 + i), cols);
}
const base = (ch) => GLIFOS.get(ch).slice();
const conPix = (cols, pts) => { for (const [x, fila] of pts) cols[x] |= 1 << (fila + 3); return cols; };
const AGUDA_MAY = [[3, -3], [2, -2]];
const AGUDA_MIN = [[3, -1], [2, 0]];
const TILDE_MAY = [[1, -3], [2, -3], [4, -3], [0, -2], [3, -2]];
const TILDE_MIN = [[1, -1], [2, -1], [4, -1], [0, 0], [3, 0]];
for (const [a, b] of [['Á', 'A'], ['É', 'E'], ['Í', 'I'], ['Ó', 'O'], ['Ú', 'U']]) GLIFOS.set(a, conPix(base(b), AGUDA_MAY));
for (const [a, b] of [['á', 'a'], ['é', 'e'], ['ó', 'o'], ['ú', 'u']]) GLIFOS.set(a, conPix(base(b), AGUDA_MIN));
GLIFOS.set('í', conPix([0, 0x44 << 3, 0x7c << 3, 0x40 << 3, 0], AGUDA_MIN));
GLIFOS.set('Ñ', conPix(base('N'), TILDE_MAY));
GLIFOS.set('ñ', conPix(base('n'), TILDE_MIN));
// minúsculas con descendente real (filas 7 y 8)
const filas = (...cols) => cols.map((rs) => rs.reduce((m, r) => m | (1 << (r + 3)), 0));
GLIFOS.set('p', filas([2, 3, 4, 5, 6, 7, 8], [2, 6], [2, 6], [2, 6], [3, 4, 5]));
GLIFOS.set('q', filas([3, 4, 5], [2, 6], [2, 6], [2, 6], [2, 3, 4, 5, 6, 7, 8]));
GLIFOS.set('g', filas([3, 4, 5], [2, 6, 8], [2, 6, 8], [2, 6, 8], [2, 3, 4, 5, 6, 7]));
GLIFOS.set('y', filas([2, 3, 4, 5], [6, 8], [6, 8], [6, 8], [2, 3, 4, 5, 6, 7]));
GLIFOS.set('¡', [0, 0, 0x7d << 3, 0, 0]);
GLIFOS.set('¿', [0x20 << 3, 0x40 << 3, 0x45 << 3, 0x48 << 3, 0x30 << 3]);
GLIFOS.set('→', [0x08 << 3, 0x08 << 3, 0x2a << 3, 0x1c << 3, 0x08 << 3]);
GLIFOS.set('⚡', [0x08 << 3, 0x6c << 3, 0x3e << 3, 0x1b << 3, 0x08 << 3]);
GLIFOS.set('♥', [0x0e << 3, 0x1f << 3, 0x3e << 3, 0x1f << 3, 0x0e << 3]);
GLIFOS.set('°', [0x06 << 3, 0x09 << 3, 0x09 << 3, 0x06 << 3, 0]);
GLIFOS.set('█', [0x7f << 3, 0x7f << 3, 0x7f << 3, 0x7f << 3, 0x7f << 3]);

export const anchoTexto = (s, esc = 1) => [...s].length * 6 * esc - esc;

// ---------- lienzo ----------
export class Lienzo {
  constructor(w = W, h = H) {
    this.w = w; this.h = h;
    this.d = new Uint8ClampedArray(w * h * 3);
  }
  limpiar(c = [0, 0, 0]) {
    const d = this.d;
    for (let i = 0; i < d.length; i += 3) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; }
  }
  px(x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3, d = this.d;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
  }
  /** mezcla alfa */
  pxa(x, y, c, a) {
    x |= 0; y |= 0;
    if (a <= 0 || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    if (a >= 1) return this.px(x, y, c);
    const i = (y * this.w + x) * 3, d = this.d;
    d[i] += (c[0] - d[i]) * a; d[i + 1] += (c[1] - d[i + 1]) * a; d[i + 2] += (c[2] - d[i + 2]) * a;
  }
  /** mezcla aditiva (luces, hologramas) */
  luz(x, y, c, a = 1) {
    x |= 0; y |= 0;
    if (a <= 0 || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3, d = this.d;
    d[i] += c[0] * a; d[i + 1] += c[1] * a; d[i + 2] += c[2] * a;
  }
  leer(x, y) {
    x = clamp(x | 0, 0, this.w - 1); y = clamp(y | 0, 0, this.h - 1);
    const i = (y * this.w + x) * 3, d = this.d;
    return [d[i], d[i + 1], d[i + 2]];
  }
  rect(x, y, w, h, c, a = 1) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(this.w, x + w), y1 = Math.min(this.h, y + h);
    for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) this.pxa(i, j, c, a);
  }
  rectLuz(x, y, w, h, c, a = 1) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(this.w, x + w), y1 = Math.min(this.h, y + h);
    for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) this.luz(i, j, c, a);
  }
  marco(x, y, w, h, c, a = 1) {
    this.rect(x, y, w, 1, c, a); this.rect(x, y + h - 1, w, 1, c, a);
    this.rect(x, y + 1, 1, h - 2, c, a); this.rect(x + w - 1, y + 1, 1, h - 2, c, a);
  }
  linea(x0, y0, x1, y1, c, a = 1, aditiva = false) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy, n = 0;
    while (n++ < 2000) {
      if (aditiva) this.luz(x0, y0, c, a); else this.pxa(x0, y0, c, a);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }
  /** elipse rellena; fn opcional (x,y,u,v)->color|null para sombrear */
  elipse(cx, cy, rx, ry, c, a = 1, fn = null) {
    const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
      if (u * u + v * v > 1) continue;
      const col = fn ? fn(x, y, u, v) : c;
      if (col) this.pxa(x, y, col, a);
    }
  }
  disco(cx, cy, r, c, a = 1, fn = null) { this.elipse(cx, cy, r, r, c, a, fn); }
  /** resplandor aditivo radial tramado */
  halo(cx, cy, r, c, fuerza = 1) {
    const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r), y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy) / r;
      if (d >= 1) continue;
      const v = (1 - d) * (1 - d) * fuerza;
      // cuantiza en 4 niveles con tramado para conservar el aspecto de píxel
      const q = Math.floor(v * 4 + bayer(x, y)) / 4;
      if (q > 0) this.luz(x, y, c, q);
    }
  }
  /** texto bitmap. op: {esc, alin: 'i'|'c'|'d', a, borde: color|null, sombra: color|null, n: máx. caracteres} */
  texto(s, x, y, c, op = {}) {
    const esc = op.esc || 1, a = op.a ?? 1;
    let chars = [...s];
    const ancho = chars.length * 6 * esc - esc;
    if (op.n !== undefined) chars = chars.slice(0, Math.max(0, op.n));
    x = Math.round(op.alin === 'c' ? x - ancho / 2 : op.alin === 'd' ? x - ancho : x);
    y = Math.round(y);
    const pasada = (ox, oy, col, al) => {
      let cx = x + ox;
      for (const ch of chars) {
        const g = GLIFOS.get(ch) || GLIFOS.get('?');
        for (let k = 0; k < 5; k++) {
          const bits = g[k];
          if (!bits) continue;
          for (let f = 0; f < 12; f++) if (bits & (1 << f)) {
            if (esc === 1) this.pxa(cx + k, y + oy + f - 3, col, al);
            else this.rect(cx + k * esc, y + oy + (f - 3) * esc, esc, esc, col, al);
          }
        }
        cx += 6 * esc;
      }
    };
    if (op.borde) for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if (ox || oy) pasada(ox * esc, oy * esc, op.borde, a);
    if (op.sombra) pasada(esc, esc, op.sombra, a);
    pasada(0, 0, c, a);
    return ancho;
  }
  /** copia otro lienzo ampliado s veces alrededor del pivote (px,py) de origen, que cae en (dx,dy) del destino */
  zoom(src, px, py, s, dx = this.w / 2, dy = this.h / 2, a = 1) {
    const sd = src.d, d = this.d;
    for (let y = 0; y < this.h; y++) {
      const sy = Math.floor(py + (y + 0.5 - dy) / s);
      for (let x = 0; x < this.w; x++) {
        const sx = Math.floor(px + (x + 0.5 - dx) / s);
        const i = (y * this.w + x) * 3;
        let r = 0, g = 0, b = 0;
        if (sx >= 0 && sy >= 0 && sx < src.w && sy < src.h) { const j = (sy * src.w + sx) * 3; r = sd[j]; g = sd[j + 1]; b = sd[j + 2]; }
        if (a >= 1) { d[i] = r; d[i + 1] = g; d[i + 2] = b; }
        else { d[i] += (r - d[i]) * a; d[i + 1] += (g - d[i + 1]) * a; d[i + 2] += (b - d[i + 2]) * a; }
      }
    }
  }
  /** funde todo el lienzo hacia un color */
  velo(c, a) {
    if (a <= 0) return;
    const d = this.d;
    for (let i = 0; i < d.length; i += 3) { d[i] += (c[0] - d[i]) * a; d[i + 1] += (c[1] - d[i + 1]) * a; d[i + 2] += (c[2] - d[i + 2]) * a; }
  }
  /** multiplica el color (tinte de iluminación ambiental) */
  tinte(c, a = 1) {
    const d = this.d;
    for (let i = 0; i < d.length; i += 3) {
      d[i] += (d[i] * c[0] / 255 - d[i]) * a; d[i + 1] += (d[i + 1] * c[1] / 255 - d[i + 1]) * a; d[i + 2] += (d[i + 2] * c[2] / 255 - d[i + 2]) * a;
    }
  }
  copiar(src) { this.d.set(src.d); }
}
