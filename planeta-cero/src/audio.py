#!/usr/bin/env python3
"""Música ambiental y efectos de sonido de PLANETA CERO · Episodio 01, sintetizados desde cero
(sin muestras ni material de terceros). Genera un WAV estéreo de 94 s SIN la voz de NEXUS:
la locución se añade en la edición y debe quedar siempre por encima de esta mezcla.

Uso: python3 src/audio.py salida/musica_y_efectos.wav
"""
import sys, wave
import numpy as np
from scipy.signal import fftconvolve

SR = 44100
DUR = 94.0
N = int(SR * DUR)
rng = np.random.default_rng(20260101)
seco = np.zeros((N, 2))   # señal sin reverberación
env_ = np.zeros((N, 2))   # envío a la reverberación

NOTA = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
def hz(n):
    nombre, octava = n[:-1], int(n[-1])
    return 440.0 * 2 ** ((NOTA[nombre] - 9) / 12 + octava - 4)

def poner(sig, t0, vol=1.0, pan=0.0, rev=0.3):
    """Mezcla una señal mono en t0 (s). pan -1..1, rev = envío a reverberación."""
    i0 = int(t0 * SR)
    if i0 >= N: return
    if i0 < 0: sig = sig[-i0:]; i0 = 0
    sig = sig[: N - i0] * vol
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    seco[i0:i0 + len(sig), 0] += sig * l; seco[i0:i0 + len(sig), 1] += sig * r
    env_[i0:i0 + len(sig), 0] += sig * l * rev; env_[i0:i0 + len(sig), 1] += sig * r * rev

def tt(d): return np.arange(int(d * SR)) / SR
def adsr(d, a=0.01, r=0.1):
    n = int(d * SR); e = np.ones(n)
    na, nr = min(n, max(1, int(a * SR))), min(n, max(1, int(r * SR)))
    e[:na] = np.linspace(0, 1, na) ** 1.5; e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e
def ruido(d, f0, f1, suave=0.25):
    """Ruido de banda limitada (filtro en frecuencia con flancos suaves)."""
    n = int(d * SR); x = rng.standard_normal(n)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    g = 1 / (1 + (f0 / np.maximum(f, 1)) ** (2 / suave)) / (1 + (f / f1) ** (2 / suave))
    y = np.fft.irfft(X * g, n)
    return y / (np.abs(y).max() + 1e-9)
def colchon(notas, d, a=2.0, r=2.5, brillo=1.6, trem=0.13):
    """Pad cálido aditivo con ligera desafinación; devuelve (izq, der)."""
    t = tt(d); L = np.zeros(len(t)); R = np.zeros(len(t))
    for k, n in enumerate(notas):
        f = hz(n) if isinstance(n, str) else n
        for h in range(1, 7):
            amp = 1 / h ** brillo
            for det, dst in ((-0.0017, L), (0.0019, R)):
                ph = rng.uniform(0, 6.283)
                lfo = 1 + trem * np.sin(2 * np.pi * (0.11 + 0.05 * k + 0.02 * h) * t + ph)
                dst += amp * lfo * np.sin(2 * np.pi * f * h * (1 + det) * t + ph)
    e = adsr(d, a, r)
    m = max(np.abs(L).max(), np.abs(R).max())
    return L * e / m, R * e / m
def poner_st(par, t0, vol=1.0, rev=0.4):
    i0 = int(t0 * SR); n = min(len(par[0]), N - i0)
    if n <= 0: return
    seco[i0:i0 + n, 0] += par[0][:n] * vol; seco[i0:i0 + n, 1] += par[1][:n] * vol
    env_[i0:i0 + n, 0] += par[0][:n] * vol * rev; env_[i0:i0 + n, 1] += par[1][:n] * vol * rev
def campana(f, d=2.2, brillo=0.35):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + brillo * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 4) + 0.15 * np.sin(2 * np.pi * f * 3.0 * t) * np.exp(-t * 7)) * np.exp(-t * 2.6) * adsr(d, 0.004, 0.2)
def pulsada(f, d=0.5):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 9)) * np.exp(-t * 7) * adsr(d, 0.003, 0.05)
def pitido(f, d=0.09):
    t = tt(d); return np.sin(2 * np.pi * f * t) * adsr(d, 0.004, 0.04)
def barrido_tono(f0, f1, d):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * adsr(d, 0.02, d * 0.4)
def golpe(f0=70, f1=38, d=0.5):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * adsr(d, 0.002, 0.1)
def tecleo(t0, t1, vol=0.035, cps=22):
    """Clics muy suaves mientras la interfaz escribe texto."""
    k = 0; t = t0
    while t < t1:
        poner(pitido(2600 + 500 * ((k * 7) % 5), 0.018), t, vol, pan=0.2 * ((k % 3) - 1), rev=0.1)
        t += 1 / cps * (1 + 0.3 * rng.uniform(-1, 1)); k += 1
def confirmacion(t0, f1=880, f2=1318, vol=0.11):
    poner(pitido(f1, 0.08), t0, vol, rev=0.5); poner(pitido(f2, 0.14), t0 + 0.085, vol, rev=0.5)

# ------------------------------------------------------------------ MÚSICA
# 00:00–00:21 · misterio y descubrimiento (re menor, bordón y campanas lejanas)
poner_st(colchon(['D2', 'A2'], 22.5, a=5, r=3, brillo=2.0), 0.6, 0.20, rev=0.5)
poner_st(colchon(['D3', 'F3', 'A3', 'E4'], 14.5, a=3.5, r=3.5, brillo=1.8), 7.4, 0.15, rev=0.6)
for t0, n in [(4.4, 'A5'), (9.2, 'D5'), (11.6, 'F5'), (13.9, 'E5'), (16.2, 'A5'), (18.3, 'D6'), (19.9, 'C6')]:
    poner(campana(hz(n), 3.2), t0, 0.075, pan=rng.uniform(-0.5, 0.5), rev=0.9)
    poner(campana(hz(n), 2.0), t0 + 0.42, 0.028, pan=rng.uniform(-0.7, 0.7), rev=0.9)
# 00:21–00:49 · exploración y esperanza (fa mayor, arpegio suave)
acordes_b = [(['F2', 'C3', 'A3', 'C4', 'F4'], ['F4', 'A4', 'C5', 'F5']), (['C3', 'G3', 'E4', 'G4'], ['E4', 'G4', 'C5', 'E5']),
             (['D3', 'A3', 'F4', 'A4'], ['D4', 'F4', 'A4', 'D5']), (['A#2', 'F3', 'D4', 'F4'], ['D4', 'F4', 'A#4', 'D5'])]
for i, (ac, arp) in enumerate(acordes_b):
    t0 = 21 + i * 7
    poner_st(colchon(ac, 8.6, a=1.8, r=2.4, brillo=1.5), t0 - 0.8, 0.19, rev=0.5)
    patron = [0, 1, 2, 3, 2, 1]
    for k in range(int(7 / 0.4375)):
        vol = 0.055 * (0.75 + 0.25 * (k % 4 == 0)) * (1 if (i, k) != (0, 0) else 0.6)
        poner(pulsada(hz(arp[patron[k % 6]]), 0.9), t0 + k * 0.4375, vol, pan=0.5 * np.sin(k * 0.9), rev=0.8)
for t0, n, d in [(22.0, 'A5', 3), (24.6, 'C6', 3), (28.2, 'G5', 3), (31.5, 'E5', 3), (35.2, 'F5', 3), (38.6, 'A5', 3), (42.2, 'F5', 3), (45.6, 'D5', 3.4)]:
    poner(campana(hz(n), d, 0.2), t0, 0.06, pan=rng.uniform(-0.3, 0.3), rev=1.0)
# 00:49–01:14 · curiosidad y construcción (pulso secuenciado)
acordes_c = [(['D3', 'A3', 'F4'], ['D4', 'A4', 'F4', 'A4']), (['A#2', 'F3', 'D4'], ['A#3', 'F4', 'D4', 'F4']),
             (['F2', 'C3', 'A3', 'F4'], ['F4', 'C5', 'A4', 'C5']), (['C3', 'G3', 'E4'], ['E4', 'G4', 'C5', 'G4'])]
for i, (ac, sec) in enumerate(acordes_c):
    t0 = 49 + i * 6.25
    poner_st(colchon(ac, 7.6, a=1.4, r=2.0, brillo=1.5), t0 - 0.6, 0.15, rev=0.5)
    paso = 6.25 / 20
    for k in range(20):
        f = hz(sec[k % 4]) * (2 if k % 8 == 7 else 1)
        poner(pulsada(f, 0.28), t0 + k * paso, 0.05 * (1.0 if k % 4 == 0 else 0.7), pan=0.6 * (1 if k % 2 else -1), rev=0.55)
        if k % 5 == 0: poner(ruido(0.03, 5000, 11000) * adsr(0.03, 0.001, 0.02), t0 + k * paso, 0.03, rev=0.2)
        if k % 10 == 0: poner(golpe(90, 50, 0.25), t0 + k * paso, 0.09, rev=0.15)
# 01:14–01:25 · tensión y peligro (segunda menor, tritono, latido grave)
poner_st(colchon(['D2', 'D#2'], 12.8, a=2.2, r=1.2, brillo=1.7, trem=0.25), 73.2, 0.26, rev=0.5)
poner_st(colchon(['G#3', 'D4'], 9.5, a=4.5, r=0.9, brillo=1.5, trem=0.3), 76.0, 0.12, rev=0.7)
poner_st(colchon(['D#5', 'E5'], 6.4, a=4.8, r=0.5, brillo=2.4, trem=0.35), 79.0, 0.045, rev=0.9)
for k in range(8):
    t0 = 74.6 + k * 1.3
    poner(golpe(58, 36, 0.45), t0, 0.26 + 0.015 * k, rev=0.25); poner(golpe(54, 34, 0.4), t0 + 0.27, 0.17 + 0.012 * k, rev=0.25)
sub = ruido(7.6, 80, 900) * np.linspace(0, 1, int(7.6 * SR)) ** 2.4
poner(sub, 77.4, 0.10, rev=0.4)
# 01:25–01:34 · suspenso (acorde sin resolver y nota final)
poner_st(colchon(['D2', 'A2'], 8.4, a=0.6, r=3.0, brillo=2.0), 85.0, 0.14, rev=0.5)
poner_st(colchon(['D4', 'E4', 'A4'], 8.0, a=2.4, r=2.6, brillo=1.9), 85.2, 0.11, rev=0.7)
for t0, n in [(86.0, 'A5'), (88.3, 'E5'), (90.4, 'D5')]:
    poner(campana(hz(n), 3.0, 0.2), t0, 0.06, pan=rng.uniform(-0.4, 0.4), rev=1.0)
# nota de suspenso sobre «CONTINUARÁ...»
poner(golpe(62, 30, 1.4), 92.9, 0.5, rev=0.6)
poner(ruido(1.2, 40, 400) * np.exp(-tt(1.2) * 3), 92.9, 0.2, rev=0.6)
poner_st(colchon(['D2', 'D#5', 'A5'], 1.9, a=0.05, r=1.2, brillo=2.2, trem=0.3), 92.9, 0.13, rev=0.9)

# ------------------------------------------------------------------ EFECTOS
# Escena 1 · zumbido de la estación, tres pulsos digitales, activación
zum = sum(a * np.sin(2 * np.pi * f * tt(8.4) + ph) for f, a, ph in [(50, 1, 0), (100, 0.5, 1), (150, 0.22, 2), (200, 0.1, 3)])
zum = zum / np.abs(zum).max() * (1 + 0.08 * np.sin(2 * np.pi * 0.7 * tt(8.4))) * adsr(8.4, 1.0, 0.9)
poner(zum, 0.15, 0.085, rev=0.2)
poner(ruido(8.4, 300, 2500) * adsr(8.4, 1.5, 1.0), 0.15, 0.012, rev=0.2)
for t0 in (1.0, 1.8, 2.6):
    poner(pitido(1320, 0.13), t0, 0.10, rev=0.8); poner(pitido(1320, 0.1), t0 + 0.21, 0.03, pan=0.5, rev=0.8)
poner(barrido_tono(180, 1300, 0.45), 3.85, 0.06, rev=0.5)
tecleo(4.1, 6.0)
for k, n in enumerate(['D5', 'A5', 'D6', 'F#6']):
    poner(campana(hz(n), 1.8, 0.5), 6.05 + k * 0.085, 0.11, pan=-0.3 + 0.2 * k, rev=0.9)
tecleo(6.1, 6.85)
poner(ruido(1.1, 300, 5000) * np.linspace(0, 1, int(1.1 * SR)) ** 2 * adsr(1.1, 0.05, 0.12), 6.95, 0.10, rev=0.5)
# Escena 2 · indicadores, entrada en la atmósfera
for t0 in (9.0, 10.6, 12.2):
    confirmacion(t0 + 0.2); tecleo(t0 + 0.2, t0 + 0.8)
poner(pitido(660, 0.1), 17.2, 0.11, rev=0.5); poner(pitido(440, 0.2), 17.3, 0.11, rev=0.5)
viento_e = ruido(4.6, 150, 2600) * np.concatenate([np.linspace(0, 1, int(3.9 * SR)) ** 2.2, np.linspace(1, 0, int(4.6 * SR) - int(3.9 * SR))])
poner(viento_e, 17.3, 0.17, rev=0.3)
# Escena 3–5 y 8 · viento suave en la llanura y río
def ambiente(t0, t1, vol=1.0):
    d = t1 - t0; t = tt(d)
    v = ruido(d, 180, 1400) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t + 1) * np.sin(2 * np.pi * 0.07 * t)) * adsr(d, 1.2, 1.0)
    poner(v, t0, 0.045 * vol, pan=-0.2, rev=0.2)
    a = ruido(d, 1500, 6000) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.31 * t)) * adsr(d, 1.5, 1.0)
    poner(a, t0, 0.014 * vol, pan=-0.5, rev=0.1)
ambiente(21.0, 33.2); ambiente(38.2, 61.0, 0.9); ambiente(85.0, 93.0, 0.8)
tecleo(28.6, 30.6)
poner(barrido_tono(300, 2400, 0.7), 32.25, 0.05, rev=0.7)
poner(ruido(0.8, 2000, 9000) * adsr(0.8, 0.3, 0.3), 32.3, 0.03, rev=0.6)
confirmacion(33.2, 1318, 1760, 0.06)
# Escena 4 · nave, liberación de la cápsula, descenso, puerta, pasos
poner(ruido(0.5, 200, 4000) * adsr(0.5, 0.02, 0.4), 34.2, 0.07, rev=0.4)
motor = (ruido(4.2, 40, 240) * 0.8 + 0.5 * np.sin(2 * np.pi * 55 * tt(4.2))) * adsr(4.2, 0.4, 0.5)
poner(motor, 34.2, 0.085, pan=-0.2, rev=0.2)
poner(golpe(120, 60, 0.2), 35.35, 0.22, rev=0.4)
poner(ruido(0.5, 1500, 9000) * np.exp(-tt(0.5) * 9), 35.36, 0.07, rev=0.4)
d_desc = 2.85; td = tt(d_desc)
rugido = ruido(d_desc, 70, 1500) * (0.35 + 0.65 * (td / d_desc) ** 1.3) * adsr(d_desc, 0.25, 0.2)
poner(rugido, 38.2, 0.19, rev=0.3)
poner(golpe(72, 36, 0.6), 40.95, 0.55, rev=0.35)
poner(ruido(1.3, 300, 3500) * np.exp(-tt(1.3) * 3.2), 40.97, 0.10, rev=0.3)
siseo = ruido(1.5, 2200, 9500) * adsr(1.5, 0.08, 0.9)
poner(siseo, 41.9, 0.07, rev=0.4)
poner(barrido_tono(260, 420, 1.3), 41.95, 0.03, rev=0.4)
poner(golpe(160, 90, 0.15), 43.32, 0.12, rev=0.4)
for k, t0 in enumerate((43.75, 44.1, 44.45, 44.8)):
    poner(golpe(110, 60, 0.12), t0, 0.07, pan=0.1 * (-1) ** k, rev=0.2); poner(ruido(0.08, 500, 3000) * np.exp(-tt(0.08) * 40), t0, 0.04, rev=0.2)
confirmacion(45.25, 784, 1175); tecleo(45.25, 46.3)
for k, n in enumerate(['A5', 'D6', 'F#6']):
    poner(campana(hz(n), 1.6, 0.4), 46.45 + k * 0.07, 0.10, rev=0.9)
# Escena 5 · holograma, piezas que encajan, sistema de recursos
td = tt(12.4)
holo = (np.sin(2 * np.pi * 220 * td) + 0.6 * np.sin(2 * np.pi * 330.7 * td) + 0.3 * np.sin(2 * np.pi * 441 * td)) * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * td)) * adsr(12.4, 1.2, 0.8)
poner(holo / 2, 48.3, 0.022, pan=0.2, rev=0.6)
t0 = 49.25
while t0 < 55.7:
    poner(pitido(1500 + 900 * rng.uniform(), 0.03), t0, 0.03, pan=rng.uniform(-0.6, 0.6), rev=0.6)
    t0 += rng.uniform(0.07, 0.2)
confirmacion(49.6, 988, 1318, 0.07); tecleo(49.7, 50.5)
for k, n in enumerate(['D5', 'A5', 'E6']):
    poner(campana(hz(n), 1.6, 0.4), 52.05 + k * 0.08, 0.09, rev=0.9)
tecleo(52.2, 53.6)
poner(barrido_tono(1800, 260, 0.6), 60.35, 0.05, rev=0.6)
poner(ruido(0.65, 1500, 9000) * adsr(0.65, 0.2, 0.3), 60.4, 0.04, rev=0.5)
# Escena 6 · zumbido de la estación, diez plataformas que se encienden
zum6 = sum(a * np.sin(2 * np.pi * f * tt(12.8) + ph) for f, a, ph in [(50, 1, 0), (100, 0.5, 1), (150, 0.22, 2)])
poner(zum6 / np.abs(zum6).max() * adsr(12.8, 0.8, 0.5), 61.0, 0.05, rev=0.2)
escala = ['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'G5', 'A5', 'D6']
for i in range(10):
    t0 = 61.7 + i * 0.45
    poner(campana(hz(escala[i]), 1.4, 0.3), t0, 0.075, pan=-0.8 + i * 0.178, rev=0.9)
    poner(golpe(140, 70, 0.1), t0, 0.06, pan=-0.8 + i * 0.178, rev=0.3)
tecleo(66.6, 69.2)
# transición: las luces parpadean y suena una alerta en otro monitor
for t0 in (73.25, 73.4, 73.52, 73.7, 73.8, 73.92):
    poner(ruido(0.06, 1000, 8000) * adsr(0.06, 0.002, 0.03), t0, 0.07, pan=rng.uniform(-0.7, 0.7), rev=0.3)
# Escena 7 · alerta electrónica grave y discreta
def alerta(t0, vol):
    for f, dt in ((311.1, 0.0), (233.1, 0.32)):
        t = tt(0.3); s = np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + np.sin(2 * np.pi * f * t)
        poner(s * adsr(0.3, 0.02, 0.1), t0 + dt, vol, rev=0.6)
for k in range(4): alerta(73.3 + k * 1.15, 0.035 if k else 0.028)
poner(ruido(0.9, 100, 3000) * np.linspace(0, 1, int(0.9 * SR)) ** 3, 76.5, 0.13, rev=0.4)
poner(golpe(60, 28, 1.6), 77.4, 0.6, rev=0.6)
poner(ruido(1.5, 30, 300) * np.exp(-tt(1.5) * 2.5), 77.4, 0.22, rev=0.6)
for t0, f in ((79.3, 196), (81.4, 185), (83.3, 174.6)):
    t = tt(1.6)
    s = np.sin(2 * np.pi * f * t + 3.2 * np.exp(-t * 2.2) * np.sin(2 * np.pi * f * 2.71 * t)) * np.exp(-t * 2.0) * adsr(1.6, 0.01, 0.3)
    poner(s, t0, 0.055, pan=rng.uniform(-0.6, 0.6), rev=1.0)
tecleo(78.95, 82.1, 0.03)
for k in range(3): alerta(79.2 + k * 1.9, 0.02)
# Escena 8 · amanecer y texto final
tecleo(88.0, 90.6, 0.028)
tecleo(92.95, 93.5, 0.03)

# ------------------------------------------------------------------ REVERBERACIÓN Y MÁSTER
n_ir = int(3.2 * SR); t_ir = np.arange(n_ir) / SR
salida = seco.copy()
for ch in (0, 1):
    ir = rng.standard_normal(n_ir) * np.exp(-t_ir * 2.1)
    IR = np.fft.rfft(ir); f = np.fft.rfftfreq(n_ir, 1 / SR)
    ir = np.fft.irfft(IR / (1 + (f / 4200) ** 2) / (1 + (140 / np.maximum(f, 1)) ** 2), n_ir)
    ir /= np.sqrt((ir ** 2).sum())
    salida[:, ch] += fftconvolve(env_[:, ch], ir)[:N] * 0.9
# fundidos de entrada/salida, limitador suave y normalización a -3 dBFS
fi = int(0.25 * SR); fo = int(0.5 * SR)
salida[:fi] *= np.linspace(0, 1, fi)[:, None]; salida[-fo:] *= np.linspace(1, 0, fo)[:, None]
salida = np.tanh(salida * 1.6) / 1.6
salida *= 10 ** (-3 / 20) / np.abs(salida).max()
pcm = (salida * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
rms = lambda a, b: 20 * np.log10(np.sqrt((salida[int(a * SR):int(b * SR)] ** 2).mean()) + 1e-9)
print('RMS por escena (dBFS):', ' '.join(f'{rms(a, b):.1f}' for a, b in [(0, 8), (8, 21), (21, 33), (33, 49), (49, 61), (61, 74), (74, 85), (85, 94)]))
