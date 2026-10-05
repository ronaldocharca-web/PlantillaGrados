import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { construirDatosTrabajoDirigido } from "@/lib/trab-dirigido-data";
import { obtenerPlantillaTrabajoDirigido } from "@/lib/trab-dirigido-template";
import { estadoErrorActa } from "@/lib/ci";

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
    const docx = documento.getZip().generate({
      type: "uint8array",
      compression: "DEFLATE",
    });
    const converterUrl =
      process.env.CONVERTER_SERVICE_URL || "http://127.0.0.1:8000/convert";
    const respuesta = await fetch(converterUrl, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      body: Buffer.from(docx),
    });

    if (!respuesta.ok) {
      throw new Error(
        `El servidor de conversión respondió ${respuesta.status}: ${await respuesta.text()}`
      );
    }

    return new NextResponse(await respuesta.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'inline; filename="acta-trabajo-dirigido.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generando PDF de trabajo dirigido:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: estadoErrorActa(error) }
    );
  }
}
