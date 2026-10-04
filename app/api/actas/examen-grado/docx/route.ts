import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { construirDatosExamen } from "@/lib/examen-grado-data";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const datos = construirDatosExamen(await request.json());
    const contenido = fs.readFileSync(path.join(process.cwd(), "templates", "examen-grado.docx"));
    const documento = new Docxtemplater(new PizZip(contenido), { paragraphLoop: true, linebreaks: true, delimiters: { start: "{{", end: "}}" } });
    documento.render(datos);
    const archivo = documento.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
    return new NextResponse(new Uint8Array(archivo), { status: 200, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": 'attachment; filename="acta-examen-grado-generada.docx"', "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error generando examen de grado:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 });
  }
}
