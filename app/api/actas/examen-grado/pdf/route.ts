import { NextRequest, NextResponse } from "next/server";
import { obtenerUrlsConversor } from "@/lib/converter";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { construirDatosExamen } from "@/lib/examen-grado-data";
import { estadoErrorActa } from "@/lib/ci";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const datos = construirDatosExamen(await request.json());
    const contenido = fs.readFileSync(path.join(process.cwd(), "templates", "examen-grado.docx"));
    const documento = new Docxtemplater(new PizZip(contenido), { paragraphLoop: true, linebreaks: true, delimiters: { start: "{{", end: "}}" } });
    documento.render(datos);
    const docx = documento.getZip().generate({ type: "uint8array", compression: "DEFLATE" });
    const { conversion: converterUrl } = obtenerUrlsConversor();
    const respuesta = await fetch(converterUrl, { method: "POST", headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }, body: Buffer.from(docx) });
    if (!respuesta.ok) throw new Error(`El servidor de conversión respondió ${respuesta.status}: ${await respuesta.text()}`);
    return new NextResponse(await respuesta.arrayBuffer(), { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="acta-examen-grado.pdf"', "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error generando PDF de examen de grado:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: estadoErrorActa(error) });
  }
}
