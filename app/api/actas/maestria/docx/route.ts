import { NextRequest, NextResponse } from "next/server";
import { generarWordMaestria } from "@/lib/maestria-documento";
import { estadoErrorActa, nombreArchivoActa, SIGLAS_MODALIDAD } from "@/lib/ci";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { archivo, ci } = generarWordMaestria(await request.json());
    const nombre = encodeURIComponent(nombreArchivoActa(ci, SIGLAS_MODALIDAD.maestria, "docx"));
    return new NextResponse(new Uint8Array(archivo), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${nombre}`,
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo generar el Word." }, { status: estadoErrorActa(error) });
  }
}
