/**
 * Puente de lectura del Excel de control.
 *
 * El navegador no puede bajar un archivo de Google Drive por su cuenta: Drive no
 * autoriza peticiones desde otro sitio. Este servicio lo baja del lado del servidor
 * y lo entrega al tablero con los permisos que el navegador sí acepta, para que la
 * página muestre lo que diga el Excel en el momento en que alguien la abre.
 *
 * No guarda secretos ni recibe datos: solo lee un archivo que ya está compartido
 * como «cualquier persona con el enlace».
 */

const ARCHIVO = "1SSqSampD4D2hfxbH3VrLgBVjMi5jvZ7b";

// Dos caminos para el mismo archivo. Si Drive cambia uno, queda el otro.
const FUENTES = [
  `https://drive.usercontent.google.com/download?id=${ARCHIVO}&export=download`,
  `https://docs.google.com/spreadsheets/d/${ARCHIVO}/export?format=xlsx`,
];

const ORIGENES = ["https://cateladino.github.io", "null"];

// Un .xlsx es un zip: si lo que llega no empieza con "PK", Drive devolvió otra cosa
// (una pantalla de error o de inicio de sesión) y no sirve.
function esExcel(buffer) {
  const dos = new Uint8Array(buffer.slice(0, 2));
  return dos[0] === 0x50 && dos[1] === 0x4b;
}

export default {
  async fetch(request) {
    const origen = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ORIGENES.includes(origen) ? origen : ORIGENES[0],
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Este servicio solo entrega el Excel de control." }),
        { status: 405, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
    }

    for (const url of FUENTES) {
      let respuesta;
      try {
        respuesta = await fetch(url, {
          redirect: "follow",
          headers: { "User-Agent": "tablero-plantillas-oracle" },
          // Una copia de 30 segundos: varias personas abriendo el tablero a la vez
          // no se convierten en varias descargas a Drive.
          cf: { cacheTtl: 30, cacheEverything: true },
        });
      } catch {
        continue;
      }
      if (!respuesta.ok) continue;

      const cuerpo = await respuesta.arrayBuffer();
      if (!esExcel(cuerpo)) continue;

      return new Response(cuerpo, {
        status: 200,
        headers: {
          ...cors,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Cache-Control": "public, max-age=30",
        },
      });
    }

    return new Response(JSON.stringify({
      error: "No se pudo leer el Excel en Drive. Revisa que siga compartido como " +
             "«cualquier persona con el enlace».",
    }), { status: 502, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
  },
};
