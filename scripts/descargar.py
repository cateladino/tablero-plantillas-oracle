# -*- coding: utf-8 -*-
"""Baja el Excel de control desde Google Drive.

El identificador del archivo vive en datos/origen.json, no aquí, para poder
cambiar de archivo sin tocar el código. El archivo tiene que estar compartido
como «Cualquier persona con el enlace» para que el servidor pueda leerlo.

Si la descarga falla, el script termina con error y no escribe nada: el sitio
se queda con el último corte bueno en lugar de publicar basura.
"""
import io, json, os, sys, urllib.request

RAIZ    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN  = os.path.join(RAIZ, "datos", "origen.json")
DESTINO = os.path.join(RAIZ, "datos", "Control_Plantillas_NetSuite_V1.xlsx")

# Un .xlsx es un zip: siempre empieza con estos dos bytes.
FIRMA_XLSX = b"PK"


def identificador():
    if not os.path.exists(ORIGEN):
        sys.exit("Falta datos/origen.json con el identificador del archivo de Drive.")
    with open(ORIGEN, encoding="utf-8") as f:
        cfg = json.load(f)
    ident = str(cfg.get("drive_file_id", "")).strip()
    if not ident or ident == "PENDIENTE":
        sys.exit("datos/origen.json todavía no tiene el identificador del archivo de Drive.")
    return ident, cfg.get("nombre", "Control_Plantillas_NetSuite")


def por_gdown(ident):
    """Archivos subidos a Drive (.xlsx). gdown resuelve la pantalla de confirmación."""
    try:
        import gdown
    except ImportError:
        return None
    destino = DESTINO + ".tmp"
    try:
        gdown.download(id=ident, output=destino, quiet=True, fuzzy=True)
    except Exception as e:
        print("gdown no pudo descargarlo: %s" % e)
        return None
    return destino if os.path.exists(destino) else None


def por_exportacion(ident):
    """Hojas de cálculo nativas de Google: se exportan a xlsx."""
    url = "https://docs.google.com/spreadsheets/d/%s/export?format=xlsx" % ident
    destino = DESTINO + ".tmp"
    try:
        peticion = urllib.request.Request(url, headers={"User-Agent": "tablero-plantillas"})
        with urllib.request.urlopen(peticion, timeout=60) as r, open(destino, "wb") as f:
            f.write(r.read())
    except Exception as e:
        print("La exportación como hoja de cálculo falló: %s" % e)
        return None
    return destino


def es_excel(ruta):
    if not ruta or not os.path.exists(ruta) or os.path.getsize(ruta) < 1024:
        return False
    with open(ruta, "rb") as f:
        return f.read(2) == FIRMA_XLSX


def main():
    ident, nombre = identificador()
    print("Archivo de Drive: %s (%s)" % (nombre, ident))

    for intento in (por_gdown, por_exportacion):
        ruta = intento(ident)
        if es_excel(ruta):
            os.replace(ruta, DESTINO)
            print("Descargado: %s · %d KB" % (os.path.basename(DESTINO),
                                              os.path.getsize(DESTINO) // 1024))
            return
        if ruta and os.path.exists(ruta):
            os.remove(ruta)

    sys.exit("No fue posible descargar el Excel. Revisa que el archivo siga compartido "
             "como «Cualquier persona con el enlace» y que el identificador de "
             "datos/origen.json sea el correcto.")


if __name__ == "__main__":
    main()
