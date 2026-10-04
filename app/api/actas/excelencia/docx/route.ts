import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { construirDatosExcelencia } from "@/lib/excelencia-data";
import { obtenerPlantillaExcelencia } from "@/lib/excelencia-template";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const datos = construirDatosExcelencia(await request.json());
    const plantilla = fs.readFileSync(path.join(
      process.cwd(),
      "templates",
      obtenerPlantillaExcelencia(datos)
    ));
    const documento = new Docxtemplater(new PizZip(plantilla), {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });

    documento.render(datos);
    const archivo = documento.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });
    return new NextResponse(new Uint8Array(archivo), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition":
          'attachment; filename="acta-excelencia-generada.docx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generando acta de excelencia:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
