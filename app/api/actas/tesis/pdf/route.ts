import { NextRequest, NextResponse } from "next/server";
import { obtenerUrlsConversor } from "@/lib/converter";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { construirDatosActa } from "@/lib/acta-data";
import { estadoErrorActa, SIGLAS_MODALIDAD } from "@/lib/ci";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const datos = await request.json();
    const rutaPlantilla = path.join(
      process.cwd(),
      "templates",
      "tesis_word_actualizada.docx"
    );
    const contenido = fs.readFileSync(rutaPlantilla);
    const zip = new PizZip(contenido);
    const documento = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });

    documento.render(construirDatosActa(datos, SIGLAS_MODALIDAD.tesis));

    const docx = documento.getZip().generate({
      type: "uint8array",
      compression: "DEFLATE",
    });
    const { conversion: converterUrl } = obtenerUrlsConversor();
    const respuestaPdf = await fetch(converterUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      body: Buffer.from(docx),
    });

    if (!respuestaPdf.ok) {
      const detalle = await respuestaPdf.text();
      throw new Error(`El servidor de conversión respondió ${respuestaPdf.status}: ${detalle}`);
    }

    return new NextResponse(await respuestaPdf.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="acta-tesis.pdf"',
      },
    });
  } catch (error) {
    console.error("Error generando PDF de tesis:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: estadoErrorActa(error) }
    );
  }
}
