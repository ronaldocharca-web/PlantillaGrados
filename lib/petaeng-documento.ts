import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { construirDatosPetaeng, configuracionPetaeng, type ModalidadPetaeng } from "@/lib/petaeng-data";

export function generarWordPetaeng(entrada: unknown, modalidad: ModalidadPetaeng) {
  const datos = construirDatosPetaeng(entrada, modalidad);
  const ruta = path.join(process.cwd(), "templates", configuracionPetaeng[modalidad].plantilla);
  const documento = new Docxtemplater(new PizZip(fs.readFileSync(ruta)), {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
    nullGetter: () => "",
  });
  documento.render(datos);
  return {
    archivo: documento.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer,
    ci: datos.ci,
  };
}
