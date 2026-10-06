import { NextRequest, NextResponse } from "next/server";
import { generarWordMaestria } from "@/lib/maestria-documento";
import { obtenerUrlsConversor } from "@/lib/converter";
import { estadoErrorActa, nombreArchivoActa, SIGLAS_MODALIDAD } from "@/lib/ci";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { archivo, ci } = generarWordMaestria(await request.json());
    const { conversion } = obtenerUrlsConversor();
    const respuesta = await fetch(conversion, {
      method: "POST",
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
      body: new Uint8Array(archivo), signal: AbortSignal.timeout(120_000),
    });
    if (!respuesta.ok) throw new Error(`El conversor PDF respondió ${respuesta.status}. Active el generador y vuelva a intentarlo.`);
    const pdf = await respuesta.arrayBuffer();
    if (Buffer.from(pdf).subarray(0, 5).toString() !== "%PDF-") throw new Error("El conversor no devolvió un PDF válido.");
    const nombre = encodeURIComponent(nombreArchivoActa(ci, SIGLAS_MODALIDAD.maestria, "pdf"));
    return new NextResponse(pdf, { headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `inline; filename*=UTF-8''${nombre}`, "Cache-Control": "no-store",
    } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo generar el PDF." }, { status: estadoErrorActa(error) });
  }
}
