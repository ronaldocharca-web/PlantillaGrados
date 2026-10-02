import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { construirDatosActa } from "@/lib/acta-data";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const datos = await request.json();
    const rutaPlantilla = path.join(
      process.cwd(),
      "templates",
      "tesis_word.docx"
    );
    const contenido = fs.readFileSync(rutaPlantilla);
    const zip = new PizZip(contenido);
    const documento = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });

    documento.render(construirDatosActa(datos));

    const archivo = documento.getZip().generate({
      type: "uint8array",
      compression: "DEFLATE",
    });
    const arrayBuffer = archivo.buffer.slice(
      archivo.byteOffset,
      archivo.byteOffset + archivo.byteLength
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition":
          'attachment; filename="acta-tesis-generada.docx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generando acta de tesis:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
