const converterUrl =
  process.env.CONVERTER_SERVICE_URL ?? "http://127.0.0.1:8000/convert";

export async function GET() {
  try {
    const healthUrl = new URL("/health", converterUrl);
    const respuesta = await fetch(healthUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(90_000),
    });

    const contenido = await respuesta.text();

    if (!respuesta.ok) {
      return Response.json(
        { error: `El conversor respondió ${respuesta.status}.`, detalle: contenido },
        { status: 502 },
      );
    }

    return new Response(contenido, {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo conectar con el conversor.";
    return Response.json({ error: mensaje }, { status: 502 });
  }
}
