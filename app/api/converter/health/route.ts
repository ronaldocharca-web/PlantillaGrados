const converterUrl =
  process.env.CONVERTER_SERVICE_URL || "http://127.0.0.1:8000/convert";

export async function GET() {
  try {
    const healthUrl = new URL("/health", converterUrl);
    const respuesta = await fetch(healthUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(90_000),
    });

    const contenido = await respuesta.json().catch(() => null);

    if (!respuesta.ok || contenido?.ok !== true) {
      return Response.json(
        { error: "El conversor todavía no confirmó que está disponible." },
        { status: 502 },
      );
    }

    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo conectar con el conversor.";
    return Response.json({ error: mensaje }, { status: 502 });
  }
}
