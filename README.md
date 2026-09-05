# Tablero de plantillas · Oracle NetSuite · Grupo Estevez

Seguimiento del llenado, revisión y carga de las plantillas de migración a Oracle NetSuite.

**Sitio publicado:** https://cateladino.github.io/tablero-plantillas-oracle/

## Cómo actualizar el tablero

1. Entra a la carpeta [`datos/`](datos) de este repositorio.
2. **Add file → Upload files** y arrastra el Excel de control actualizado.
3. **Commit changes.**

Eso es todo. En cuanto se sube el archivo, el sitio se regenera solo y en aproximadamente
un minuto la liga muestra el corte nuevo. El avance de cada corte se va acumulando en
`datos/historico.json`, que es lo que alimenta el panel «Avance entre cortes».

Si el Excel se sube con otro nombre, no importa: se usa el archivo `.xlsx` más reciente
de la carpeta `datos/`.

## Qué hay en cada carpeta

| Carpeta | Qué contiene |
|---|---|
| `datos/` | El Excel de control y el histórico de cortes. Es lo único que hay que tocar. |
| `plantilla/` | El tablero sin datos. Aquí vive el diseño, no la información. |
| `scripts/` | `generar.py`, que lee el Excel y construye `index.html`. |
| `index.html` | El tablero publicado. Se genera solo: no se edita a mano. |

## Etapas que se siguen

E1 Llenado · E2 Revisión · E3 Carga en el repositorio de Oracle.

Sandbox y Productivo se incorporarán cuando el proyecto llegue a esas etapas. Para agregar
una etapa se declara en `ETAPAS_CFG`, al inicio del script de `plantilla/tablero.html`, y se
crean en el Excel las columnas correspondientes (`E4 Sandbox`, `E4 F. Compromiso`,
`E4 F. Real`). Los indicadores, la matriz, las gráficas y la exportación se ajustan solos.

## Vistas

- **Resumen ejecutivo:** para dirección. Cuántas plantillas están entregadas a Oracle,
  el avance por frente y las decisiones que requieren su intervención.
- **Detalle:** operativo. Filtros por módulo, etapa, área y Key User, con la tabla completa.

El tablero es autocontenido: no depende de servidor ni de base de datos para mostrarse.
