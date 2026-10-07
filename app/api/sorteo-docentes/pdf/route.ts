import { NextRequest, NextResponse } from "next/server";
import { obtenerUrlsConversor } from "@/lib/converter";
import { crearDocxSorteo } from "@/lib/sorteo-documento";
import { validarReporteSorteo } from "@/lib/sorteo-data";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const datos = validarReporteSorteo(await request.json());
    const docx = crearDocxSorteo(datos);
    const { conversion } = obtenerUrlsConversor();
    const respuesta = await fetch(conversion, {
      method: "POST",
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
      body: new Blob([new Uint8Array(docx)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    });
    if (!respuesta.ok) throw new Error(`El conversor respondió ${respuesta.status}: ${await respuesta.text()}`);
    return new NextResponse(await respuesta.arrayBuffer(), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resultados-sorteo-docentes.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generando reporte del sorteo:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo generar el PDF." }, { status: 400 });
  }
}
