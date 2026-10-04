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
      "proyecto-grado.docx"
    );

    const contenido = fs.readFileSync(rutaPlantilla);

    const zip = new PizZip(contenido);

    const documento = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: "{{",
        end: "}}",
      },
    });

    documento.render(construirDatosActa(datos));

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
          'attachment; filename="acta-proyecto-grado.docx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generando documento:", error);

    const mensaje =
      error instanceof Error
        ? error.message
        : "Error desconocido";

    return NextResponse.json(
      {
        error: mensaje,
      },
      {
        status: 500,
      }
    );
  }
}
