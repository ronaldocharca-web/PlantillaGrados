import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { ErrorValidacionActa } from "@/lib/ci";
import { construirDatosMaestria, validarMaestria, type FormularioMaestria } from "@/lib/maestria-data";

export function generarWordMaestria(entrada: unknown) {
  const errores = validarMaestria(entrada);
  if (Object.keys(errores).length) throw new ErrorValidacionActa(Object.values(errores).join("\n"));
  const formulario = entrada as FormularioMaestria;
  const zip = new PizZip(fs.readFileSync(path.join(process.cwd(), "templates", "acta-defensa-maestria.docx")));
  const documento = new Docxtemplater(zip, {
    paragraphLoop: true, linebreaks: true, delimiters: { start: "{{", end: "}}" },
    nullGetter: () => "",
  });
  documento.render(construirDatosMaestria(formulario));
  const salida = documento.getZip();
  // Docxtemplater no siempre procesa encabezados heredados de Word. Se fija
  // explícitamente el mismo marcador en cada encabezado para que la primera
  // y segunda hoja muestren el número ingresado, sin numeración PAGE automática.
  const numero = String(formulario.pagina).replace(/[&<>"']/g, caracter => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[caracter]!));
  for (const nombre of Object.keys(salida.files).filter(archivo => /^word\/header\d+\.xml$/.test(archivo))) {
    let encabezado = salida.file(nombre)!.asText();
    if (encabezado.includes("{{pagina}}")) encabezado = encabezado.replaceAll("{{pagina}}", numero);
    encabezado = encabezado.replace(/<w:fldSimple\b[^>]*(?:\/>|>[\s\S]*?<\/w:fldSimple>)/g,
      `<w:r><w:t xml:space="preserve">${numero}</w:t></w:r>`);
    salida.file(nombre, encabezado);
  }
  return { archivo: salida.generate({ type: "nodebuffer", compression: "DEFLATE" }), ci: formulario.ci };
}
