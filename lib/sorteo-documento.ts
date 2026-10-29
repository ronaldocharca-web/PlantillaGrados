import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { ReporteSorteo } from "@/lib/sorteo-data";

export function crearDocxSorteo(datos: ReporteSorteo) {
  const resultados = datos.ordenarResultados
    ? [...datos.resultados].sort((a, b) =>
      a.area.localeCompare(b.area, "es") || a.numero - b.numero || a.docente.localeCompare(b.docente, "es"),
    )
    : [...datos.resultados];
  const fecha = new Intl.DateTimeFormat("es-BO", {
    dateStyle: "long", timeStyle: "short", timeZone: "America/La_Paz",
  }).format(new Date());
  const intervalos = [...new Map(resultados.map((resultado) => [
    resultado.area,
    `${resultado.area}: ${resultado.intervaloInicio} - ${resultado.intervaloFin}`,
  ])).values()].join("; ");
  const plantilla = fs.readFileSync(path.join(process.cwd(), "templates", "sorteo-docentes-plantilla.docx"));
  const documento = new Docxtemplater(new PizZip(plantilla), {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
    nullGetter: () => "",
  });
  documento.render({
    fecha,
    intervalos,
    limite: `${datos.maximoAreas} ${datos.maximoAreas === 1 ? "área" : "áreas"} por docente`,
    presentacion: datos.ordenarResultados ? "ordenada por número" : "orden original del sorteo",
    resultados,
  });
  return documento.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
