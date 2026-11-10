// Línea de tiempo del episodio 01. Los tiempos de escena 1–7 son los del guion; la escena 8 se
// alarga hasta 01:34 para que el texto final y el «CONTINUARÁ...» se puedan leer.
// Los tiempos de la narración son una guía de montaje: al grabar la locución definitiva de NEXUS,
// ajustar `ini`/`fin` de cada frase a la voz real (los subtítulos se recalculan solos).
export const DURACION = 94;
export const ESCENAS = [
  { n: 1, titulo: 'Una señal en la oscuridad', ini: 0, fin: 8 },
  { n: 2, titulo: 'El planeta desconocido', ini: 8, fin: 21 },
  { n: 3, titulo: 'Un mundo vacío', ini: 21, fin: 33 },
  { n: 4, titulo: 'Los primeros habitantes', ini: 33, fin: 49 },
  { n: 5, titulo: 'Los recursos', ini: 49, fin: 61 },
  { n: 6, titulo: 'Los diez fundadores', ini: 61, fin: 74 },
  { n: 7, titulo: 'Algo se aproxima', ini: 74, fin: 85 },
  { n: 8, titulo: 'El comienzo', ini: 85, fin: 94 },
];

// Narración de NEXUS (texto exacto del guion). `partes` = cortes del subtítulo (máx. 2 líneas de 28 caracteres).
export const NARRACION = [
  { esc: 1, ini: 2.6, fin: 7.3, texto: 'Después de miles de años buscando... finalmente encontramos uno.',
    partes: [['Después de miles de años', 'buscando...'], ['finalmente encontramos uno.']] },
  { esc: 2, ini: 8.8, fin: 14.7, texto: 'Tiene agua, una atmósfera estable y recursos suficientes para crear una civilización.',
    partes: [['Tiene agua, una atmósfera', 'estable'], ['y recursos suficientes para', 'crear una civilización.']] },
  { esc: 2, ini: 15.6, fin: 19.8, texto: 'Pero hay un problema. No vive absolutamente nadie aquí.',
    partes: [['Pero hay un problema.'], ['No vive absolutamente nadie', 'aquí.']] },
  { esc: 3, ini: 22.0, fin: 24.2, texto: 'Lo hemos llamado Planeta Cero.',
    partes: [['Lo hemos llamado', 'Planeta Cero.']] },
  { esc: 3, ini: 25.0, fin: 30.5, texto: 'Mi misión es construir una civilización aquí. Pero no puedo hacerlo solo.',
    partes: [['Mi misión es construir una', 'civilización aquí.'], ['Pero no puedo hacerlo solo.']] },
  { esc: 4, ini: 33.8, fin: 36.2, texto: 'Así que voy a necesitar su ayuda.',
    partes: [['Así que voy a necesitar', 'su ayuda.']] },
  { esc: 4, ini: 37.0, fin: 43.6, texto: 'Desde ahora, cada persona que siga esta cuenta se convertirá en un nuevo habitante del planeta.',
    partes: [['Desde ahora, cada persona', 'que siga esta cuenta'], ['se convertirá en un nuevo', 'habitante del planeta.']] },
  { esc: 5, ini: 49.4, fin: 51.7, texto: 'También vamos a necesitar recursos.',
    partes: [['También vamos a necesitar', 'recursos.']] },
  { esc: 5, ini: 52.1, fin: 55.1, texto: 'Cada like generará diez unidades de energía.',
    partes: [['Cada like generará diez', 'unidades de energía.']] },
  { esc: 5, ini: 55.4, fin: 60.6, texto: 'Con ellas podremos construir ciudades, desarrollar tecnología y explorar este mundo.',
    partes: [['Con ellas podremos construir', 'ciudades,'], ['desarrollar tecnología', 'y explorar este mundo.']] },
  { esc: 6, ini: 61.4, fin: 66.3, texto: 'Pero antes de empezar, necesitamos elegir a nuestros primeros personajes.',
    partes: [['Pero antes de empezar,', 'necesitamos elegir'], ['a nuestros primeros', 'personajes.']] },
  { esc: 6, ini: 66.8, fin: 70.2, texto: 'Los diez comentarios con más likes podrán crearlos.',
    partes: [['Los diez comentarios con más', 'likes podrán crearlos.']] },
  { esc: 6, ini: 70.5, fin: 73.7, texto: 'Ustedes decidirán sus nombres, profesiones y personalidades.',
    partes: [['Ustedes decidirán', 'sus nombres, profesiones'], ['y personalidades.']] },
  { esc: 7, ini: 74.5, fin: 77.2, texto: 'Hay algo que todavía no les he contado.',
    partes: [['Hay algo que todavía', 'no les he contado.']] },
  { esc: 7, ini: 78.2, fin: 80.3, texto: 'Detectamos otra civilización.',
    partes: [['Detectamos otra', 'civilización.']] },
  { esc: 7, ini: 80.6, fin: 84.7, texto: 'Se dirige hacia nosotros... y parece que viene a conquistarnos.',
    partes: [['Se dirige hacia nosotros...'], ['y parece que viene', 'a conquistarnos.']] },
  { esc: 8, ini: 85.5, fin: 87.1, texto: 'Tenemos poco tiempo.',
    partes: [['Tenemos poco tiempo.']] },
  { esc: 8, ini: 87.6, fin: 90.7, texto: 'Y este planeta... ahora también es suyo.',
    partes: [['Y este planeta...'], ['ahora también es suyo.']] },
];

/** Subtítulos con tiempos: cada parte dura en proporción a sus caracteres dentro de la frase. */
export const SUBTITULOS = NARRACION.flatMap((n) => {
  const pesos = n.partes.map((p) => p.join(' ').length + 6);
  const tot = pesos.reduce((a, b) => a + b, 0);
  let t = n.ini;
  return n.partes.map((p, i) => {
    const d = ((n.fin - n.ini) * pesos[i]) / tot;
    const o = { ini: t, fin: t + d, lineas: p, cola: i === n.partes.length - 1 ? 0.45 : 0 };
    t += d;
    return o;
  });
});

/** ¿Habla NEXUS en el instante t? (0..1) */
export const hablando = (t) => (NARRACION.some((n) => t >= n.ini && t <= n.fin) ? 1 : 0);
