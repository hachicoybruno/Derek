// Superficie de Planeta Cero: un único mundo 2.5D (plano del suelo en perspectiva + objetos
// proyectados) que comparten todas las tomas de superficie para mantener la misma geografía:
// llanura, río, bosques, colinas, cordillera nevada al fondo y cielo de amanecer.
import { W, H, clamp, hex, mix, bayer, rampa, fbm2, ruido2, hash2 } from './nucleo.mjs';

/** Eje del río (coordenada x del centro para cada z). */
export const RIO = (z) => 30 * Math.sin(z * 0.012) + 14 * Math.sin(z * 0.031 + 1.3);
const semiancho = (z) => 5.5 + 1.5 * Math.sin(z * 0.02);
/** Lugar del aterrizaje (claro junto al río) y emplazamiento de la futura base. */
export const ZL = 600;
export const XL = RIO(ZL) + 36;
export const BASE = { x: XL + 5.5, z: ZL + 47 };
export const AZ_SOL = 0.1; // acimut de la estrella al amanecer

const CIELO = [hex('#2c5aa6'), hex('#4a82cc'), hex('#74a9e2'), hex('#a5cdf0'), hex('#d9e3e6'), hex('#f7d9a6'), hex('#ffc184')];
const BRUMA = hex('#b4cfdc');
const BRUMA_SUELO = hex('#8fb9a4');
const PASTO = [hex('#27602f'), hex('#35793a'), hex('#4b9440'), hex('#66ab49'), hex('#8cc255')];
const AGUA = [hex('#1d5a9a'), hex('#2a78bd'), hex('#4f9ad6'), hex('#8cc4ea')];
const ARENA = hex('#c8b47e');
const HOJA = [hex('#123a24'), hex('#1c552c'), hex('#2c7436'), hex('#49953f'), hex('#86bd52'), hex('#c3d873')];
const PINO = [hex('#0f3326'), hex('#18493a'), hex('#256650'), hex('#3c8a62'), hex('#8fc07a')];
const TRONCO = [hex('#3d2a1c'), hex('#6a4a2e')];
const MONTE = [hex('#566a96'), hex('#6f83ac'), hex('#93a5c6')];
const NIEVE = [hex('#bccbe4'), hex('#eef3f9')];
const COLINA = [hex('#3c6a5c'), hex('#4c8266'), hex('#62996c')];

const fbm1 = (a, s) => fbm2(a, 0.37, 4, s);
const cresta = (a, s) => { const n = ruido2(a, 0.5, s); return 1 - Math.abs(2 * n - 1); };
const alturaMonte = (a) => 10 + 34 * Math.pow(cresta(a * 3.1 + 10, 800), 1.4) + 17 * cresta(a * 7.3 + 3, 801) + 7 * cresta(a * 19 + 1, 802) + 3 * fbm1(a * 60, 803);
const alturaColina = (a) => 5 + 13 * fbm1(a * 5.5 + 2, 810);

/** Altura (px, f=200) de la cordillera en el acimut del sol: sirve para animar el amanecer. */
export const crestaSol = () => alturaMonte(AZ_SOL);

/** Proyecta un punto del mundo a pantalla. Devuelve null si queda detrás de la cámara. */
export function proy(cam, wx, wy, wz) {
  const dx = wx - cam.x, dz = wz - cam.z, sn = Math.sin(cam.yaw), cs = Math.cos(cam.yaw);
  const d = dx * sn + dz * cs;
  if (d < 0.4) return null;
  const s = cam.f / d;
  return { sx: W / 2 + (dx * cs - dz * sn) * s, sy: cam.hor + (cam.h - wy) * s, s, d };
}
const niebla = (d) => clamp((d - 110) / 520);

function cielo(c, cam, t, sol) {
  const hor = Math.min(H, Math.round(cam.hor));
  const sxSol = W / 2 + (AZ_SOL - cam.yaw) * cam.f, sySol = cam.hor - sol;
  for (let y = 0; y < hor; y++) {
    const v = Math.pow(clamp((y - (cam.hor - 250)) / 250), 1.25);
    for (let x = 0; x < W; x++) {
      let col = rampa(CIELO, v, x, y);
      // nubes pequeñas que derivan despacio
      const yy = cam.hor - y;
      if (yy > 14) {
        const n = fbm2((x + cam.yaw * cam.f * 0.9 + t * 1.6) * 0.022, yy * (0.05 + 14 / (yy + 60)) + 3, 4, 400);
        if (n > 0.655) {
          const bajo = fbm2((x + cam.yaw * cam.f * 0.9 + t * 1.6) * 0.022, (yy - 2.5) * (0.05 + 14 / (yy + 57.5)) + 3, 4, 400) <= 0.655;
          col = bajo ? hex('#f3c3a8') : n > 0.71 ? hex('#fdfdfb') : hex('#e8edf5');
        }
      }
      c.px(x, y, col);
    }
  }
  if (sol > -14) {
    const f = clamp((sol + 14) / 20);
    c.halo(sxSol, sySol, 70, [255, 170, 80], 0.5 * f);
    c.halo(sxSol, sySol, 30, [255, 200, 110], 0.9 * f);
    c.disco(sxSol, sySol, 9.5, hex('#ffc869'));
    c.disco(sxSol, sySol, 8, hex('#ffe9a8'));
    c.disco(sxSol, sySol, 5.5, hex('#fffbe6'));
  }
}

function relieve(c, cam, sol) {
  const hor = Math.round(cam.hor), k = cam.f / 200;
  const sxSol = W / 2 + (AZ_SOL - cam.yaw) * cam.f;
  for (let x = 0; x < W; x++) {
    const a = cam.yaw + (x - W / 2) / cam.f;
    const hm = alturaMonte(a) * k;
    const nl = (31 + 8 * fbm1(a * 9, 820)) * k;
    const lado = x < sxSol ? 1 : -1;
    for (let j = 0; j < hm; j++) {
      const y = hor - 1 - j;
      if (y < 0 || y >= H) continue;
      // facetas inclinadas: la pendiente se evalúa desplazada según la profundidad bajo la cresta
      const a2 = a + (hm - j) * 0.0026 * lado;
      const p2 = (alturaMonte(a2 + 0.012) - alturaMonte(a2 - 0.012)) * lado;
      const tex = fbm2(a * 26 + j * 0.11, j * 0.16, 2, 830);
      let col;
      if (j > nl + (bayer(x, y) - 0.5) * 5) col = p2 > -0.4 || tex > 0.62 ? NIEVE[1] : NIEVE[0];
      else col = rampa(MONTE, (p2 > 0 ? 0.62 : 0.08) + tex * 0.45, x, y);
      if (j < 14 * k) { const q = Math.floor((1 - j / (14 * k)) * 4 + bayer(x, y)) / 4; if (q > 0) col = mix(col, BRUMA, q * 0.6); }
      if (hm - j < 1.2 && sol > -6 && Math.abs(x - sxSol) < 70) col = mix(col, [255, 226, 170], 0.7 * (1 - Math.abs(x - sxSol) / 70));
      c.px(x, y, col);
    }
    // bruma en la base de la cordillera
    const hc = alturaColina(a) * k;
    for (let j = 0; j < hc; j++) {
      const y = hor - 1 - j;
      if (y < 0 || y >= H) continue;
      const tex = fbm2(a * 70 + 5, j * 0.5, 2, 840);
      c.px(x, y, rampa(COLINA, tex * 0.9 + (hc - j < 2 ? 0.35 : 0), x, y));
    }
  }
}

/** ¿Hay árbol en la celda (i,j)? Devuelve {x,z,h,tipo,sem} o null. */
const CELDA = 13;
function arbolEn(i, j) {
  const r = hash2(i, j, 900);
  const x = (i + 0.2 + 0.6 * hash2(i, j, 901)) * CELDA, z = (j + 0.2 + 0.6 * hash2(i, j, 902)) * CELDA;
  const dens = fbm2(x * 0.011, z * 0.011, 2, 700);
  let p = clamp((dens - 0.45) * 6) * 0.9 + 0.035;
  const dl = Math.hypot(x - XL, z - (ZL + 20));
  p *= clamp((dl - 78) / 130);
  if (r > p) return null;
  if (Math.abs(x - RIO(z)) < semiancho(z) + 5) return null;
  return { x, z, h: 9 + 8 * hash2(i, j, 903), tipo: hash2(i, j, 904) < 0.3 ? 1 : 0, sem: hash2(i, j, 905) };
}

export function arbol(c, sx, sy, s, a, t, fg) {
  const Hp = a.h * s;
  if (sx < -Hp || sx > W + Hp || sy < -2 || sy - Hp > H) return;
  const pal = a.tipo ? PINO : HOJA;
  const nb = Math.floor(fg * 4 + 0.5) / 4;
  const tono = (col) => (nb > 0 ? mix(col, BRUMA, nb * 0.85) : col);
  if (Hp < 3) { c.px(sx, sy - 1, tono(pal[1])); if (Hp > 1.8) c.px(sx, sy - 2, tono(pal[2])); return; }
  if (Hp < 8) {
    const w = Math.max(2, Math.round(Hp * 0.5)), hh = Math.round(Hp);
    for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) {
      if ((j === 0 || j >= hh - 2) && (i === 0 || i === w - 1)) continue;
      if (j >= hh - 1 && w > 2 && i !== (w >> 1)) continue;
      c.px(sx - (w >> 1) + i, sy - hh + j, tono(pal[i >= w / 2 && j < hh * 0.5 ? 3 : j < hh * 0.6 ? 2 : 1]));
    }
    return;
  }
  // sombra en el suelo
  c.elipse(sx - Hp * 0.12, sy, Hp * 0.3, Math.max(1, Hp * 0.045), [12, 40, 24], 0.4 * (1 - nb));
  const vaiven = Math.sin(t * 1.15 + a.sem * 6.28) * Hp * 0.02;
  if (a.tipo) {
    // conífera: tres pisos triangulares
    const tw = Math.max(1, Math.round(Hp * 0.05));
    c.rect(sx - tw / 2, sy - Hp * 0.18, tw, Hp * 0.18, tono(TRONCO[0]));
    const top = sy - Hp, alto = Hp * 0.86;
    for (let j = 0; j < alto; j++) {
      const v = j / alto, piso = Math.min(2, Math.floor(v * 3)), fr = v * 3 - piso;
      const hw = Hp * (0.07 + 0.075 * piso + 0.13 * fr);
      const ox = Math.round(vaiven * (1 - v));
      for (let i = -Math.ceil(hw); i <= Math.ceil(hw); i++) {
        if (Math.abs(i) > hw) continue;
        const x = Math.round(sx) + i + ox, y = Math.round(top + j);
        const u = i / (hw + 0.5);
        let l = 0.42 + u * 0.38 - fr * 0.22 + (hash2(x - ox, y, 31) - 0.5) * 0.3;
        if (Math.abs(i) > hw - 1) l -= 0.25;
        c.px(x, y, tono(rampa(pal, l, x, y)));
      }
    }
    return;
  }
  const tw = Math.max(1, Math.round(Hp * 0.07));
  for (let j = 0; j < Hp * 0.42; j++) for (let i = 0; i < tw; i++) c.px(Math.round(sx - tw / 2) + i, Math.round(sy) - 1 - j, tono(TRONCO[i >= tw - Math.max(1, tw >> 1) ? 1 : 0]));
  // copa: unión de varios lóbulos
  const nL = 5, lob = [];
  for (let k = 0; k < nL; k++) {
    const ox = (hash2(k, 1, a.sem * 9973) - 0.5) * Hp * 0.42, oy = (hash2(k, 2, a.sem * 9973) - 0.5) * Hp * 0.34;
    const by = sy - Hp * 0.66 + oy;
    lob.push([sx + ox + vaiven * (0.6 + (sy - by) / Hp), by, Hp * (0.17 + 0.1 * hash2(k, 3, a.sem * 9973))]);
  }
  lob.push([sx + vaiven, sy - Hp * 0.66, Hp * 0.27]);
  const x0 = Math.floor(sx - Hp * 0.55), x1 = Math.ceil(sx + Hp * 0.55), y0 = Math.floor(sy - Hp * 1.05), y1 = Math.ceil(sy - Hp * 0.3);
  const fase = Math.floor(t * 2.5 + a.sem * 7);
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
    let best = -1, bu = 0, bv = 0;
    for (const [lx, ly, lr] of lob) {
      const u = (x + 0.5 - lx) / lr, v = (y + 0.5 - ly) / lr;
      const f = 1 - (u * u + v * v);
      if (f > best) { best = f; bu = u; bv = v; }
    }
    if (best <= 0) continue;
    let l = 0.46 + bu * 0.26 - bv * 0.36 + (hash2(x, y, 41 + (hash2(x >> 1, y >> 1, 43) > 0.8 ? fase : 0)) - 0.5) * 0.34;
    if (best < 0.16) l = Math.min(l, 0.18);
    c.px(x, y, tono(rampa(pal, l, x, y)));
  }
}

function suelo(c, cam, t) {
  const hor = Math.round(cam.hor), sn = Math.sin(cam.yaw), cs = Math.cos(cam.yaw);
  for (let y = Math.max(0, hor); y < H; y++) {
    const d = (cam.h * cam.f) / (y - cam.hor + 0.5);
    const fg = niebla(d), cerca = clamp(1 - d / 80);
    for (let x = 0; x < W; x++) {
      const l = ((x + 0.5 - W / 2) * d) / cam.f;
      const wx = cam.x + l * cs + d * sn, wz = cam.z - l * sn + d * cs;
      const dr = Math.abs(wx - RIO(wz)), hw = semiancho(wz);
      let col;
      if (dr < hw) {
        const borde = dr / hw;
        const flujo = ruido2(wx * 0.55, (wz + t * 7) * 0.13, 500);
        const onda = ruido2(wx * 0.16 + 4, (wz + t * 3.5) * 0.05, 501);
        let v = 0.2 + onda * 0.5 + fg * 0.35 - (borde > 0.8 ? 0.2 : 0);
        col = flujo > 0.74 - cerca * 0.04 ? AGUA[3] : rampa(AGUA, v, x, y);
        if (flujo > 0.86) col = [240, 250, 255];
      } else if (dr < hw + 1.2 + cerca) {
        col = bayer(x, y) < 0.7 ? ARENA : PASTO[2];
      } else {
        let v = fbm2(wx * 0.033, wz * 0.033, 3, 600) * 1.15 - 0.12;
        if (cerca > 0) v += (ruido2(wx * 0.75, wz * 0.75, 601) - 0.5) * 0.38 * cerca;
        const dens = fbm2(wx * 0.011, wz * 0.011, 2, 700);
        if (dens > 0.5) v -= (dens - 0.5) * 1.4;
        const dl = Math.hypot(wx - XL, wz - (ZL + 20));
        if (dl < 60) v += 0.16 * clamp((60 - dl) / 30);
        if (dr < hw + 6) v -= 0.12;
        if (cerca > 0.6) v += (ruido2(wx * 4.1, wz * 2.3, 602) - 0.5) * 0.5 * (cerca - 0.6) * 2.5;
        col = rampa(PASTO, v, x, y);
        if (cerca > 0.1) {
          // flores: un solo píxel por celda, sea cual sea la distancia
          const qx = wx * 1.6, qz = wz * 1.6, ix = Math.floor(qx), iz = Math.floor(qz);
          const fl = hash2(ix, iz, 610);
          if (fl > 0.985 && Math.abs(qx - ix - 0.5) < (d / cam.f) * 0.9 && Math.abs(qz - iz - 0.5) < ((d * d) / (cam.h * cam.f)) * 0.9)
            col = fl > 0.994 ? [250, 236, 170] : [236, 244, 250];
        }
      }
      if (fg > 0) { const q = Math.floor(fg * 5 + bayer(x, y)) / 5; if (q > 0) col = mix(col, BRUMA_SUELO, q * 0.8); }
      c.px(x, y, col);
    }
  }
}

/**
 * Dibuja el mundo desde la cámara cam = {x, z, h, yaw, hor, f}.
 * op.sol: altura del sol sobre el horizonte en píxeles (negativo = oculto tras la cordillera).
 * op.objetos: [{x, z, dib(c, sx, sy, s, d)}] se ordenan por profundidad junto con los árboles.
 */
export function dibujarMundo(c, cam, t, op = {}) {
  const sol = op.sol ?? -10;
  cielo(c, cam, t, sol);
  relieve(c, cam, sol);
  suelo(c, cam, t);
  const lista = [];
  const sn = Math.sin(cam.yaw), cs = Math.cos(cam.yaw);
  const DMAX = 560;
  // celdas que cubren el tronco de visión
  const ext = DMAX * (0.6 + Math.abs(sn));
  const i0 = Math.floor((cam.x - ext) / CELDA), i1 = Math.ceil((cam.x + ext) / CELDA);
  const atras = cs < 0.5; // cámaras que no miran hacia +z: se recorre todo el entorno
  const j0 = Math.floor((cam.z - (atras ? DMAX : 20)) / CELDA), j1 = Math.ceil((cam.z + DMAX) / CELDA);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const a = arbolEn(i, j);
    if (!a) continue;
    const p = proy(cam, a.x, 0, a.z);
    if (!p || p.d > DMAX || p.d < 1.5) continue;
    if (p.sx < -a.h * p.s || p.sx > W + a.h * p.s) continue;
    lista.push({ d: p.d, f: () => arbol(c, Math.round(p.sx), Math.round(p.sy), p.s, a, t, niebla(p.d)) });
  }
  // matas de pasto cercanas que se mecen con el viento
  if (cam.h < 12) {
    const M = 1.4, DM = 30;
    const a0 = Math.floor((cam.x - DM) / M), a1 = Math.ceil((cam.x + DM) / M), b0 = Math.floor((cam.z - 2) / M), b1 = Math.ceil((cam.z + DM) / M);
    for (let j = b0; j <= b1; j++) for (let i = a0; i <= a1; i++) {
      if (hash2(i, j, 950) > 0.5) continue;
      const mx = (i + hash2(i, j, 951)) * M, mz = (j + hash2(i, j, 952)) * M;
      if (Math.abs(mx - RIO(mz)) < semiancho(mz) + 1.5) continue;
      const p = proy(cam, mx, 0, mz);
      if (!p || p.d > DM || p.d < 1 || p.sx < -4 || p.sx > W + 4) continue;
      const sem = hash2(i, j, 953);
      lista.push({ d: p.d, f: () => {
        const hp = Math.max(1, Math.round((0.22 + sem * 0.3) * p.s)), x = Math.round(p.sx), y = Math.round(p.sy);
        const inc = Math.round(Math.sin(t * 2.2 + sem * 12 + mx * 0.3) * Math.min(2, hp * 0.3));
        for (let k = 0; k < hp; k++) {
          const ox = Math.round((inc * k) / hp);
          c.px(x + ox, y - k, PASTO[k > hp * 0.6 ? 4 : 3]);
          if (hp > 3 && k < hp - 1) c.px(x - 1 + ox, y - k, PASTO[1]);
          if (hp > 5 && k < hp * 0.6) c.px(x + 2 - ox, y - k, PASTO[2]);
        }
      } });
    }
  }
  for (const o of op.objetos || []) {
    const p = proy(cam, o.x, o.y || 0, o.z);
    if (!p) continue;
    lista.push({ d: p.d + (o.sesgo || 0), f: () => o.dib(c, Math.round(p.sx), Math.round(p.sy), p.s, p.d) });
  }
  lista.sort((a, b) => b.d - a.d);
  for (const o of lista) o.f();
}
