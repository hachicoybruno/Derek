// Produce el MP4 final: renderiza los fotogramas en paralelo y los codifica con ffmpeg (H.264 + AAC).
//   node src/producir.mjs salida/planeta-cero-ep01.mp4 [--audio salida/musica_y_efectos.wav] [--sin-textos] [--sin-subtitulos]
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DURACION } from './guion.mjs';
import { W, H, FPS } from './nucleo.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const salida = process.argv[2];
if (!salida) { console.error('uso: node src/producir.mjs salida.mp4 [--audio x.wav] [--sin-textos] [--sin-subtitulos]'); process.exit(1); }
const iA = process.argv.indexOf('--audio');
const audio = iA > 0 ? process.argv[iA + 1] : null;
const extra = process.argv.filter((a) => a === '--sin-textos' || a === '--sin-subtitulos');
const nProc = Math.max(1, Math.min(8, os.cpus().length));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'planeta-cero-'));
const total = Math.round(DURACION * FPS);
const partes = [];
console.log(`Renderizando ${total} fotogramas (${W}x${H}) en ${nProc} procesos…`);
await Promise.all(Array.from({ length: nProc }, (_, k) => new Promise((ok, mal) => {
  const f0 = Math.floor((total * k) / nProc), f1 = Math.floor((total * (k + 1)) / nProc);
  const archivo = path.join(tmp, `parte${k}.raw`);
  partes[k] = archivo;
  const fd = fs.openSync(archivo, 'w');
  const p = spawn('node', [path.join(aqui, 'render.mjs'), '--ini', String(f0 / FPS), '--fin', String(f1 / FPS), ...extra], { stdio: ['ignore', fd, 'inherit'] });
  p.on('exit', (c) => { fs.closeSync(fd); c === 0 ? ok() : mal(new Error('render falló: parte ' + k)); });
})));
const bytes = partes.reduce((a, f) => a + fs.statSync(f).size, 0);
if (bytes !== total * W * H * 3) throw new Error(`fotogramas incompletos: ${bytes} bytes`);
console.log('Codificando…');
const args = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-'];
if (audio) args.push('-i', audio);
args.push('-vf', `scale=${W * 5}:${H * 5}:flags=neighbor:out_color_matrix=bt709,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-r', String(FPS));
if (audio) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
args.push('-movflags', '+faststart', salida);
const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
for (const f of partes) await new Promise((ok, mal) => { const r = fs.createReadStream(f); r.on('end', ok); r.on('error', mal); r.pipe(ff.stdin, { end: false }); });
ff.stdin.end();
await new Promise((ok, mal) => ff.on('exit', (c) => (c === 0 ? ok() : mal(new Error('ffmpeg falló')))));
fs.rmSync(tmp, { recursive: true, force: true });
const info = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_name,width,height,r_frame_rate', '-of', 'default=nw=1', salida]);
console.log(String(info.stdout));
