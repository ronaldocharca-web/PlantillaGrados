import { obtenerUrlsConversor } from "@/lib/converter";

// Carga la página del servicio en la ventanita, incluida su pantalla de arranque.
// La disponibilidad se comprueba por separado mediante /api/converter/health.
export async function GET() {
  try {
    const { salud } = obtenerUrlsConversor();
    // El servicio local responde JSON. Mostrar un estado legible en su ventana;
    // en Render se abre la página real del servicio, incluida su carga inicial.
    if (["localhost", "127.0.0.1", "[::1]"].includes(salud.hostname)) {
      let disponible = false;
      try {
        const respuesta = await fetch(salud, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
        disponible = respuesta.ok && (await respuesta.json()).ok === true;
      } catch { /* El estado visible permite volver a comprobar el servicio. */ }
      return new Response(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conversor PDF</title>
        <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111827;color:#f1f5f9;font:15px system-ui;text-align:center}main{padding:24px}h1{font-size:22px;margin:12px 0}p{color:#cbd5e1;line-height:1.5;margin:0}.estado{color:${disponible ? "#86efac" : "#fcd34d"};font-size:32px}</style>
        <main><div class="estado">${disponible ? "✓" : "…"}</div><h1>${disponible ? "Conversor PDF activo" : "Esperando al conversor PDF"}</h1><p>${disponible ? "El servicio está listo para generar tus documentos." : "Inicia el conversor y vuelve a comprobar su disponibilidad."}</p></main></html>`, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }
    const pagina = new URL(salud);
    pagina.pathname = pagina.pathname.replace(/\/health$/, "/");
    pagina.username = "";
    pagina.password = "";
    pagina.search = "";
    pagina.hash = "";
    return new Response(null, {
      status: 307,
      headers: { Location: pagina.href, "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("No se pudo abrir la página del conversor. Revise la dirección configurada del servicio.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}
