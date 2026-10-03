import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { construirDatosTrabajoDirigido } from "@/lib/trab-dirigido-data";
import { obtenerPlantillaTrabajoDirigido } from "@/lib/trab-dirigido-template";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const datos = construirDatosTrabajoDirigido(await request.json());
    const plantilla = fs.readFileSync(path.join(
      process.cwd(),
      "templates",
      obtenerPlantillaTrabajoDirigido(datos)
    ));
    const documento = new Docxtemplater(new PizZip(plantilla), {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });

    documento.render(datos);
    const archivo = documento.getZip().generate({
      type: "uint8array",
      compression: "DEFLATE",
    });
    const buffer = archivo.buffer.slice(
      archivo.byteOffset,
      archivo.byteOffset + archivo.byteLength
    ) as ArrayBuffer;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition":
          'attachment; filename="acta-trabajo-dirigido-generada.docx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generando acta de trabajo dirigido:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
