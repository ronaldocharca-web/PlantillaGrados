import { randomUUID } from "node:crypto";
import { cargarPresidentes, persistirPresidentes } from "@/lib/presidentes-server";
import { ErrorPresidentes, modificarPresidentes } from "@/lib/presidentes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function responderError(error: unknown) {
  if (error instanceof ErrorPresidentes) return Response.json({ error: error.message }, { status: error.status });
  console.error("Error en la gestión de presidentes:", error);
  return Response.json({ error: "No se pudo completar la operación. Intente nuevamente." }, { status: 500 });
}

export async function GET() {
  try {
    const { presidentes, presidente } = await cargarPresidentes();
    return Response.json({ presidentes, presidente }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return responderError(error); }
}

async function guardar(request: Request, accion: "agregar" | "editar") {
  try {
    const cuerpo = await request.json().catch(() => null);
    if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)) {
      throw new ErrorPresidentes("Los datos enviados no son válidos.");
    }
    const estado = await cargarPresidentes();
    const presidentes = modificarPresidentes(estado.presidentes, accion, cuerpo, randomUUID());
    await persistirPresidentes(estado, presidentes);
    return Response.json({ presidentes }, { status: accion === "agregar" ? 201 : 200 });
  } catch (error) { return responderError(error); }
}

export async function POST(request: Request) { return guardar(request, "agregar"); }
export async function PATCH(request: Request) { return guardar(request, "editar"); }
