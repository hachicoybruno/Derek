/**
 * Compresión de fotos en el navegador antes de subirlas (sin librerías).
 * Reduce fotos de 4–8 MB del celular a ~200–400 KB.
 */
export async function comprimirImagen(archivo: File, ladoMaximo: number, calidad = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  try {
    const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo comprimir"))), "image/jpeg", calidad),
    );
  } finally {
    bitmap.close();
  }
}

export function idAleatorio() {
  return crypto.randomUUID();
}
