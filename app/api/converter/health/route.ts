import { obtenerUrlsConversor } from "@/lib/converter";

export async function GET() {
  try {
    const { salud: healthUrl } = obtenerUrlsConversor();
    const respuesta = await fetch(healthUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(90_000),
    });

    const contenido = await respuesta.json().catch(() => null);

    if (!respuesta.ok || contenido?.ok !== true) {
      return Response.json(
        { error: respuesta.status === 404
          ? "No se encontró la ruta del conversor PDF. Revise la dirección configurada del servicio."
          : "El conversor todavía no confirmó que está disponible. Intente nuevamente en unos instantes." },
        { status: 502 },
      );
    }

    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const causa = error instanceof Error ? (error.cause as { code?: string } | undefined)?.code : undefined;
    const mensaje = causa === "ENOTFOUND" || causa === "EAI_AGAIN"
      ? "No se pudo encontrar la dirección del conversor PDF. Revise la dirección configurada y la conexión a Internet."
      : causa === "ECONNREFUSED"
        ? "El conversor PDF está apagado o no acepta conexiones. En este equipo, inicie el sistema con npm run dev."
        : error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
          ? "El conversor PDF tardó demasiado en responder. Espere unos instantes y vuelva a activar el generador."
          : error instanceof Error && error.message.includes("CONVERTER_SERVICE_URL")
            ? error.message
            : "No se pudo conectar con el conversor PDF. Compruebe que el servicio esté encendido e intente nuevamente.";
    return Response.json({ error: mensaje }, { status: 502 });
  }
}
