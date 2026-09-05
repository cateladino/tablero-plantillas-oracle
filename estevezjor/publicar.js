/**
 * Intermediario para publicar el tablero.
 *
 * El tablero corre en el navegador de cualquier persona del equipo y no puede
 * llevar dentro la credencial de GitHub: sería pública. Este servicio la guarda
 * del lado del servidor y solo la usa cuando quien publica escribe la contraseña
 * del equipo.
 *
 * Secretos que necesita (se cargan con `wrangler secret put`, nunca en el código):
 *   CLAVE_EQUIPO — la contraseña que se reparte al equipo.
 *   GH_TOKEN     — token de GitHub con permiso de escritura solo en este repositorio.
 */

const REPO = {
  duenio: "cateladino",
  repo:   "tablero-plantillas-oracle",
  rama:   "main",
  ruta:   "datos/Control_Plantillas_NetSuite_V1.xlsx",
};

// El tablero publicado y, para pruebas, el archivo abierto en local (origen "null").
const ORIGENES = ["https://cateladino.github.io", "null"];

const LIMITE_BYTES = 8 * 1024 * 1024;

function respuesta(cuerpo, estado, cabeceras) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...cabeceras, "Content-Type": "application/json; charset=utf-8" },
  });
}

/** Comparación en tiempo constante, para no filtrar la contraseña carácter a carácter. */
function claveCorrecta(recibida, esperada) {
  if (typeof recibida !== "string" || typeof esperada !== "string") return false;
  if (recibida.length !== esperada.length) return false;
  let diferencia = 0;
  for (let i = 0; i < recibida.length; i++) {
    diferencia |= recibida.charCodeAt(i) ^ esperada.charCodeAt(i);
  }
  return diferencia === 0;
}

export default {
  async fetch(request, env) {
    const origen = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ORIGENES.includes(origen) ? origen : ORIGENES[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") {
      return respuesta({ error: "Este servicio solo recibe publicaciones del tablero." }, 405, cors);
    }
    if (!env.CLAVE_EQUIPO || !env.GH_TOKEN) {
      return respuesta({ error: "El servicio aún no tiene configurada la contraseña o el token." }, 500, cors);
    }

    let datos;
    try {
      datos = await request.json();
    } catch {
      return respuesta({ error: "No se entendió la solicitud." }, 400, cors);
    }

    if (!claveCorrecta(datos.clave, env.CLAVE_EQUIPO)) {
      return respuesta({ error: "La contraseña del equipo no es correcta." }, 401, cors);
    }
    if (typeof datos.contenido !== "string" || !datos.contenido) {
      return respuesta({ error: "No llegó el archivo." }, 400, cors);
    }
    if (datos.contenido.length * 0.75 > LIMITE_BYTES) {
      return respuesta({ error: "El archivo pesa más de 8 MB." }, 413, cors);
    }

    const api = `https://api.github.com/repos/${REPO.duenio}/${REPO.repo}/contents/${REPO.ruta}`;
    const cabGH = {
      Authorization: `Bearer ${env.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "tablero-plantillas-oracle",
    };

    // Para reemplazar un archivo, GitHub pide el identificador de la versión anterior.
    let sha;
    const previo = await fetch(`${api}?ref=${REPO.rama}`, { headers: cabGH });
    if (previo.ok) {
      sha = (await previo.json()).sha;
    } else if (previo.status === 401) {
      return respuesta({ error: "El token de GitHub caducó. Avisa a la PMO para generar uno nuevo." }, 502, cors);
    } else if (previo.status !== 404) {
      return respuesta({ error: `GitHub respondió con un error (${previo.status}).` }, 502, cors);
    }

    const fecha = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
    const envio = await fetch(api, {
      method: "PUT",
      headers: { ...cabGH, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Corte publicado desde el tablero · ${fecha}`,
        content: datos.contenido,
        branch: REPO.rama,
        sha,
      }),
    });

    if (!envio.ok) {
      const detalle = await envio.json().catch(() => ({}));
      return respuesta({ error: detalle.message || "GitHub rechazó la subida del archivo." }, 502, cors);
    }

    return respuesta({ ok: true }, 200, cors);
  },
};
