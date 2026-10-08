import PizZip from "pizzip";
import type { ReporteSorteo, ResultadoSorteo } from "@/lib/sorteo-data";

function escapar(valor: string | number) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function texto(valor: string | number, opciones: { negrita?: boolean; tamano?: number; color?: string } = {}) {
  const propiedades = [
    opciones.negrita ? "<w:b/>" : "",
    opciones.tamano ? `<w:sz w:val="${opciones.tamano}"/><w:szCs w:val="${opciones.tamano}"/>` : "",
    opciones.color ? `<w:color w:val="${opciones.color}"/>` : "",
  ].join("");
  return `<w:r><w:rPr>${propiedades}</w:rPr><w:t xml:space="preserve">${escapar(valor)}</w:t></w:r>`;
}

function parrafo(contenido: string, opciones: { centro?: boolean; espacioDespues?: number; estilo?: string } = {}) {
  const alineacion = opciones.centro ? '<w:jc w:val="center"/>' : "";
  const espaciado = `<w:spacing w:after="${opciones.espacioDespues ?? 100}"/>`;
  const estilo = opciones.estilo ? `<w:pStyle w:val="${opciones.estilo}"/>` : "";
  return `<w:p><w:pPr>${estilo}${alineacion}${espaciado}</w:pPr>${contenido}</w:p>`;
}

function celda(contenido: string | number, ancho: number, encabezado = false, centrar = false) {
  const margenVertical = encabezado ? 100 : 130;
  const margenes = `<w:tcMar><w:top w:w="${margenVertical}" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="${margenVertical}" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar>`;
  return `<w:tc><w:tcPr><w:tcW w:w="${ancho}" w:type="dxa"/>${encabezado ? '<w:shd w:fill="DCE6F1"/>' : ""}${margenes}<w:vAlign w:val="center"/></w:tcPr>${parrafo(texto(contenido, { negrita: encabezado, tamano: 19 }), { centro: centrar, espacioDespues: 0 })}</w:tc>`;
}

function tabla(resultados: ResultadoSorteo[]) {
  const filas = resultados.map((resultado) => `<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="440" w:hRule="atLeast"/></w:trPr>${celda(resultado.area, 2400)}${celda(resultado.docente, 5000)}${celda(resultado.numero, 1000, false, true)}</w:tr>`).join("");
  return `<w:tbl>
    <w:tblPr><w:tblW w:w="8400" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="64748B"/><w:left w:val="single" w:sz="6" w:color="64748B"/><w:bottom w:val="single" w:sz="6" w:color="64748B"/><w:right w:val="single" w:sz="6" w:color="64748B"/><w:insideH w:val="single" w:sz="4" w:color="CBD5E1"/><w:insideV w:val="single" w:sz="4" w:color="CBD5E1"/></w:tblBorders></w:tblPr>
    <w:tblGrid><w:gridCol w:w="2400"/><w:gridCol w:w="5000"/><w:gridCol w:w="1000"/></w:tblGrid>
    <w:tr><w:trPr><w:tblHeader/><w:trHeight w:val="400" w:hRule="atLeast"/></w:trPr>${celda("Área", 2400, true)}${celda("Docente", 5000, true)}${celda("Número", 1000, true, true)}</w:tr>${filas}
  </w:tbl>`;
}

export function crearDocxSorteo(datos: ReporteSorteo) {
  const resultados = datos.ordenarResultados
    ? [...datos.resultados].sort((a, b) =>
      a.area.localeCompare(b.area, "es") || a.numero - b.numero || a.docente.localeCompare(b.docente, "es"),
    )
    : [...datos.resultados];
  const fecha = new Intl.DateTimeFormat("es-BO", {
    dateStyle: "long", timeStyle: "short", timeZone: "America/La_Paz",
  }).format(new Date());
  const areas = new Set(resultados.map(({ area }) => area)).size;
  const textoAreas = `${areas} ${areas === 1 ? "área" : "áreas"}`;
  const textoAsignaciones = `${resultados.length} ${resultados.length === 1 ? "asignación" : "asignaciones"}`;
  const intervalos = [...new Map(resultados.map((resultado) => [
    resultado.area,
    `${resultado.area}: ${resultado.intervaloInicio} - ${resultado.intervaloFin}`,
  ])).values()].join("; ");
  const cuerpo = [
    parrafo(texto("UNIVERSIDAD MAYOR DE SAN ANDRÉS", { negrita: true, tamano: 24, color: "0F172A" }), { centro: true, espacioDespues: 40 }),
    parrafo(texto("CARRERA DE TURISMO", { negrita: true, tamano: 22, color: "334155" }), { centro: true, espacioDespues: 220 }),
    parrafo(texto("RESULTADOS DEL SORTEO DE DOCENTES", { negrita: true, tamano: 32, color: "1D4ED8" }), { centro: true, espacioDespues: 220 }),
    parrafo(texto(`Fecha de generación: ${fecha}`, { tamano: 19 }), { espacioDespues: 60 }),
    parrafo(texto(`Intervalos por área: ${intervalos}`, { tamano: 19 }), { espacioDespues: 60 }),
    parrafo(texto(`Límite de participación: ${datos.maximoAreas} ${datos.maximoAreas === 1 ? "área" : "áreas"} por docente`, { tamano: 19 }), { espacioDespues: 60 }),
    parrafo(texto(`Presentación: ${datos.ordenarResultados ? "ordenada por número" : "orden original del sorteo"}`, { tamano: 19 }), { espacioDespues: 60 }),
    parrafo(texto(`Resumen: ${textoAsignaciones} en ${textoAreas}`, { tamano: 19 }), { espacioDespues: 220 }),
    tabla(resultados),
    parrafo(texto("Documento generado por el Sistema de Actas - Carrera de Turismo.", { tamano: 16, color: "64748B" }), { centro: true, espacioDespues: 0 }),
  ].join("");

  const documento = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${cuerpo}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="900" w:right="900" w:bottom="900" w:left="900" w:header="450" w:footer="450"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>`;

  const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="es-BO"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>`;
  const tipos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
  const relaciones = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
  const relacionesDocumento = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const fechaIso = new Date().toISOString();
  const propiedades = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Resultados del sorteo de docentes</dc:title><dc:creator>Sistema de Actas</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${fechaIso}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${fechaIso}</dcterms:modified></cp:coreProperties>`;
  const aplicacion = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Sistema de Actas</Application></Properties>`;

  const zip = new PizZip();
  zip.file("[Content_Types].xml", tipos);
  zip.folder("_rels")?.file(".rels", relaciones);
  zip.folder("word")?.file("document.xml", documento).file("styles.xml", estilos).folder("_rels")?.file("document.xml.rels", relacionesDocumento);
  zip.folder("docProps")?.file("core.xml", propiedades).file("app.xml", aplicacion);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
